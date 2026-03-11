import * as FileSystem from 'expo-file-system/legacy';
import { API_URL, CONVERSION_TIMEOUT_MS } from '../constants/config';

export interface ConversionResult {
  docxPath: string;
  docxName: string;
  fileSize: number;
}

/** Creates an AbortController that auto-aborts after `ms` milliseconds. */
function abortAfter(ms: number): { controller: AbortController; clear: () => void } {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(new Error('Request timed out')), ms);
  return { controller, clear: () => clearTimeout(id) };
}

/** Convert a Uint8Array to base64 in 8 KB chunks (avoids stack overflow on large files). */
function uint8ToBase64(bytes: Uint8Array): string {
  const CHUNK = 8192;
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + CHUNK));
  }
  return btoa(binary);
}

export async function checkHealth(): Promise<boolean> {
  const { controller, clear } = abortAfter(5000);
  try {
    const response = await fetch(`${API_URL}/health`, { signal: controller.signal });
    return response.ok;
  } catch {
    return false;
  } finally {
    clear();
  }
}

export async function convertPdfToDocxFetch(
  pdfUri: string,
  fileName: string,
  cancelSignal?: AbortSignal,
): Promise<ConversionResult> {
  const docxName = fileName.replace(/\.pdf$/i, '.docx');
  const outputPath = `${FileSystem.documentDirectory}${docxName}`;

  // React Native's FormData natively supports file references via { uri, type, name }.
  // It reads the file from the local filesystem and builds the multipart body internally,
  // which is far more reliable than manual binary construction.
  const formData = new FormData();
  formData.append('file', {
    uri: pdfUri,
    type: 'application/pdf',
    name: fileName,
  } as unknown as Blob);

  const { controller: timeoutController, clear } = abortAfter(CONVERSION_TIMEOUT_MS);
  const onCancel = () => timeoutController.abort(new Error('Cancelled'));
  cancelSignal?.addEventListener('abort', onCancel);

  try {
    const response = await fetch(`${API_URL}/convert`, {
      method: 'POST',
      body: formData,
      // Do NOT set Content-Type manually — React Native must generate the boundary itself
      headers: { Accept: 'application/octet-stream' },
      signal: timeoutController.signal,
    });

    if (!response.ok) {
      let errorMessage = 'Conversion failed';
      try {
        const json = await response.json();
        errorMessage = json.detail || errorMessage;
      } catch {}
      if (response.status === 413) errorMessage = 'File too large (max 20MB)';
      if (response.status === 503) errorMessage = 'Server unavailable';
      throw new Error(errorMessage);
    }

    // Get binary response and write to device filesystem as base64
    const arrayBuffer = await response.arrayBuffer();
    const base64Out = uint8ToBase64(new Uint8Array(arrayBuffer));

    await FileSystem.writeAsStringAsync(outputPath, base64Out, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const info = await FileSystem.getInfoAsync(outputPath);
    const fileSize = info.exists ? (info as any).size ?? 0 : 0;

    return { docxPath: outputPath, docxName, fileSize };
  } finally {
    clear();
    cancelSignal?.removeEventListener('abort', onCancel);
  }
}

import { useReducer, useRef, useCallback } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import { MAX_FILE_SIZE_BYTES } from '../constants/config';
import { convertPdfToDocxFetch } from '../services/api';
import { saveToHistory } from '../services/storage';

export type ConversionStep = 'uploading' | 'converting' | 'preparing';

export type ConversionState =
  | { phase: 'idle' }
  | { phase: 'file_selected'; file: SelectedFile }
  | { phase: 'converting'; file: SelectedFile; step: ConversionStep; uploadProgress: number }
  | { phase: 'success'; file: SelectedFile; docxPath: string; docxName: string; docxSize: number }
  | { phase: 'error'; file: SelectedFile | null; message: string };

export interface SelectedFile {
  uri: string;
  name: string;
  size: number;
  mimeType: string;
}

type Action =
  | { type: 'SELECT_FILE'; file: SelectedFile }
  | { type: 'REMOVE_FILE' }
  | { type: 'START_CONVERTING' }
  | { type: 'SET_STEP'; step: ConversionStep }
  | { type: 'SET_UPLOAD_PROGRESS'; progress: number }
  | { type: 'CONVERSION_SUCCESS'; docxPath: string; docxName: string; docxSize: number }
  | { type: 'CONVERSION_ERROR'; message: string }
  | { type: 'RESET' };

function reducer(state: ConversionState, action: Action): ConversionState {
  switch (action.type) {
    case 'SELECT_FILE':
      return { phase: 'file_selected', file: action.file };

    case 'REMOVE_FILE':
      return { phase: 'idle' };

    case 'START_CONVERTING':
      if (state.phase !== 'file_selected') return state;
      return {
        phase: 'converting',
        file: state.file,
        step: 'uploading',
        uploadProgress: 0,
      };

    case 'SET_STEP':
      if (state.phase !== 'converting') return state;
      return { ...state, step: action.step };

    case 'SET_UPLOAD_PROGRESS':
      if (state.phase !== 'converting') return state;
      return { ...state, uploadProgress: action.progress };

    case 'CONVERSION_SUCCESS':
      if (state.phase !== 'converting') return state;
      return {
        phase: 'success',
        file: state.file,
        docxPath: action.docxPath,
        docxName: action.docxName,
        docxSize: action.docxSize,
      };

    case 'CONVERSION_ERROR':
      return {
        phase: 'error',
        file: state.phase !== 'idle' ? (state as any).file ?? null : null,
        message: action.message,
      };

    case 'RESET':
      return { phase: 'idle' };

    default:
      return state;
  }
}

export function useConversion() {
  const [state, dispatch] = useReducer(reducer, { phase: 'idle' });
  const abortControllerRef = useRef<AbortController | null>(null);

  const pickFile = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const asset = result.assets[0];
      if (!asset) return;

      if (asset.size && asset.size > MAX_FILE_SIZE_BYTES) {
        dispatch({
          type: 'CONVERSION_ERROR',
          message: `File too large. Maximum size is 20MB.`,
        });
        return;
      }

      const file: SelectedFile = {
        uri: asset.uri,
        name: asset.name,
        size: asset.size ?? 0,
        mimeType: asset.mimeType ?? 'application/pdf',
      };

      dispatch({ type: 'SELECT_FILE', file });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      // User cancelled or permission denied — silent
    }
  }, []);

  const removeFile = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    dispatch({ type: 'REMOVE_FILE' });
  }, []);

  const startConversion = useCallback(async () => {
    if (state.phase !== 'file_selected') return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const file = state.file;
    dispatch({ type: 'START_CONVERTING' });

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      // Step 1: Uploading
      dispatch({ type: 'SET_STEP', step: 'uploading' });

      // Step 2: Converting (simulated — actual conversion happens server-side)
      setTimeout(() => {
        dispatch({ type: 'SET_STEP', step: 'converting' });
      }, 800);

      const result = await convertPdfToDocxFetch(
        file.uri,
        file.name,
        abortController.signal,
      );

      // Step 3: Preparing download
      dispatch({ type: 'SET_STEP', step: 'preparing' });
      await new Promise((r) => setTimeout(r, 500));

      dispatch({
        type: 'CONVERSION_SUCCESS',
        docxPath: result.docxPath,
        docxName: result.docxName,
        docxSize: result.fileSize,
      });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Save to history
      await saveToHistory({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        originalName: file.name,
        docxName: result.docxName,
        docxPath: result.docxPath,
        fileSize: file.size,
        convertedAt: new Date().toISOString(),
        status: 'success',
      });
    } catch (err: any) {
      if (err?.name === 'AbortError') return;

      const message =
        err?.message === 'Network request failed'
          ? 'Server unavailable. Check your connection.'
          : err?.message || 'Conversion failed. Please try again.';

      dispatch({ type: 'CONVERSION_ERROR', message });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      // Save failed attempt to history
      await saveToHistory({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        originalName: file.name,
        docxName: file.name.replace(/\.pdf$/i, '.docx'),
        docxPath: null,
        fileSize: file.size,
        convertedAt: new Date().toISOString(),
        status: 'failed',
        errorMessage: message,
      });
    } finally {
      abortControllerRef.current = null;
    }
  }, [state]);

  const cancelConversion = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    abortControllerRef.current?.abort();
    dispatch({ type: 'RESET' });
  }, []);

  const reset = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    dispatch({ type: 'RESET' });
  }, []);

  const retry = useCallback(async () => {
    if (state.phase !== 'error' || !state.file) return;
    const file = state.file;
    dispatch({ type: 'SELECT_FILE', file });
  }, [state]);

  return {
    state,
    pickFile,
    removeFile,
    startConversion,
    cancelConversion,
    reset,
    retry,
  };
}

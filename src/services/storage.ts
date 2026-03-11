import AsyncStorage from '@react-native-async-storage/async-storage';
import { HISTORY_STORAGE_KEY, MAX_HISTORY_ITEMS } from '../constants/config';

export interface ConversionRecord {
  id: string;
  originalName: string;
  docxName: string;
  docxPath: string | null;
  fileSize: number;
  convertedAt: string;
  status: 'success' | 'failed';
  errorMessage?: string;
}

export async function loadHistory(): Promise<ConversionRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ConversionRecord[];
  } catch {
    return [];
  }
}

export async function saveToHistory(record: ConversionRecord): Promise<void> {
  const history = await loadHistory();
  const updated = [record, ...history].slice(0, MAX_HISTORY_ITEMS);
  await AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
}

export async function deleteFromHistory(id: string): Promise<ConversionRecord[]> {
  const history = await loadHistory();
  const updated = history.filter((r) => r.id !== id);
  await AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export async function clearHistory(): Promise<void> {
  await AsyncStorage.removeItem(HISTORY_STORAGE_KEY);
}

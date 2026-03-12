// Replace with your deployed backend URL
export const API_URL = 'https://pdftoword-production.up.railway.app';

export const MAX_FILE_SIZE_MB = 20;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const CONVERSION_TIMEOUT_MS = 120_000;

export const HISTORY_STORAGE_KEY = 'pdf_conversion_history';
export const MAX_HISTORY_ITEMS = 50;

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

/**
 * Upload a CSV file for preview parsing.
 * @param {File} file - The CSV file to upload
 * @returns {Promise<Object>} Parsed records and metadata
 */
export async function uploadCSV(file) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    body: formData,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Upload failed');
  }

  return data;
}

/**
 * Send records to backend for AI processing.
 * @param {Array} records - Raw CSV records to process
 * @param {string} [apiKey] - Optional custom LLM API key
 * @returns {Promise<Object>} Processed CRM records
 */
export async function processRecords(records, apiKey) {
  const res = await fetch(`${API_BASE}/process`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ records, apiKey }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Processing failed');
  }

  return data;
}

/**
 * Check backend health and LLM provider.
 * @param {string} [apiKey] - Optional custom LLM API key to detect provider
 * @returns {Promise<Object>}
 */
export async function checkHealth(apiKey) {
  const url = apiKey ? `${API_BASE}/health?apiKey=${encodeURIComponent(apiKey)}` : `${API_BASE}/health`;
  const res = await fetch(url);
  return res.json();
}

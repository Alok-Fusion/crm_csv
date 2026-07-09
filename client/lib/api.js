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
 * @returns {Promise<Object>} Processed CRM records
 */
export async function processRecords(records) {
  const res = await fetch(`${API_BASE}/process`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ records }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Processing failed');
  }

  return data;
}

/**
 * Check backend health and LLM provider.
 * @returns {Promise<Object>}
 */
export async function checkHealth() {
  const res = await fetch(`${API_BASE}/health`);
  return res.json();
}

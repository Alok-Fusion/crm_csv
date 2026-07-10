const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const API_BASE = rawApiUrl.trim().replace(/\/$/, '');

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
 * @param {string} fileName - Original name of the uploaded CSV
 * @returns {Promise<Object>} Processed CRM records
 */
export async function processRecords(records, fileName) {
  const res = await fetch(`${API_BASE}/process`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ records, fileName }),
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

/**
 * Fetch past import history logs.
 * @returns {Promise<Object>}
 */
export async function getHistory() {
  const res = await fetch(`${API_BASE}/history`);
  if (!res.ok) throw new Error('Failed to load import history');
  return res.json();
}

/**
 * Clear all past import history.
 * @returns {Promise<Object>}
 */
export async function clearHistory() {
  const res = await fetch(`${API_BASE}/history/clear`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to clear history');
  return res.json();
}

/**
 * Get server system settings.
 * @returns {Promise<Object>}
 */
export async function getSettings() {
  const res = await fetch(`${API_BASE}/settings`);
  if (!res.ok) throw new Error('Failed to load settings');
  return res.json();
}

/**
 * Save server system settings.
 * @param {Object} settings - Default settings to save
 * @returns {Promise<Object>}
 */
export async function saveSettings(settings) {
  const res = await fetch(`${API_BASE}/settings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });
  if (!res.ok) throw new Error('Failed to save settings');
  return res.json();
}

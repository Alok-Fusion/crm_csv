'use client';

import { useState, useEffect } from 'react';
import { getSettings, saveSettings } from '@/lib/api';

export default function SettingsView({ onClearHistory }) {
  const [model, setModel] = useState('gemini-2.0-flash');
  const [batchSize, setBatchSize] = useState(15);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await getSettings();
        if (res.settings) {
          setModel(res.settings.defaultModel || 'gemini-2.0-flash');
          setBatchSize(res.settings.batchSize || 15);
        }
      } catch (err) {
        console.error('Failed to load server settings:', err.message);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const res = await saveSettings({
        defaultModel: model,
        batchSize: parseInt(batchSize, 10),
      });
      if (res.success) {
        setSuccessMsg('System configurations updated successfully.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update system settings.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="step-content">
      <div className="dashboard-title-section">
        <h2 className="dashboard-title">System Settings</h2>
        <p className="dashboard-subtitle">Configure AI model defaults and database management</p>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">AI Processing Configuration</h3>
        </div>

        {successMsg && (
          <div className="status-pill success" style={{ display: 'block', padding: '8px 12px', marginBottom: '16px', borderRadius: 'var(--radius-sm)' }}>
            ✓ {successMsg}
          </div>
        )}

        {errorMsg && (
          <div className="status-pill error" style={{ display: 'block', padding: '8px 12px', marginBottom: '16px', borderRadius: 'var(--radius-sm)' }}>
            ⚠️ {errorMsg}
          </div>
        )}

        <form onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label" htmlFor="model-select">Default AI Extraction Model</label>
            <select
              id="model-select"
              className="form-control"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              disabled={loading}
            >
              <option value="gemini-2.0-flash">Google Gemini 2.0 Flash (Recommended)</option>
              <option value="gpt-4o-mini">OpenAI GPT-4o Mini</option>
              <option value="claude-sonnet-4-20250514">Anthropic Claude 3.5 Sonnet</option>
            </select>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Note: Ensure the matching API key is configured in the server's .env file.
            </span>
          </div>

          <div className="form-group" style={{ marginTop: '16px' }}>
            <label className="form-label" htmlFor="batch-select">AI Processing Batch Size</label>
            <select
              id="batch-select"
              className="form-control"
              value={batchSize}
              onChange={(e) => setBatchSize(e.target.value)}
              disabled={loading}
            >
              <option value={5}>5 records per batch</option>
              <option value={10}>10 records per batch</option>
              <option value={15}>15 records per batch (Default)</option>
              <option value={20}>20 records per batch</option>
            </select>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Control how many records are sent to the LLM at once to manage token rates.
            </span>
          </div>

          <div style={{ marginTop: '24px' }}>
            <button type="submit" className="btn btn-primary" disabled={loading} id="save-settings-btn">
              {loading ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </form>
      </div>

      <div className="card" style={{ border: '1px solid rgba(239, 68, 68, 0.2)' }}>
        <div className="card-header">
          <h3 className="card-title" style={{ color: 'var(--error)' }}>Danger Zone</h3>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          Deleting the database log will clear all past import statistics and logs. This action is irreversible.
        </p>
        <div>
          <button onClick={onClearHistory} className="btn btn-danger" id="danger-clear-db-btn">
            Reset System Database
          </button>
        </div>
      </div>
    </div>
  );
}

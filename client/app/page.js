'use client';

import { useState, useCallback, useEffect } from 'react';
import StepIndicator from '@/components/StepIndicator';
import FileUploader from '@/components/FileUploader';
import DataPreview from '@/components/DataPreview';
import ProcessingStatus from '@/components/ProcessingStatus';
import ResultsView from '@/components/ResultsView';
import { uploadCSV, processRecords, checkHealth } from '@/lib/api';

export default function Home() {
  // Wizard state
  const [currentStep, setCurrentStep] = useState(1);

  // Data state
  const [previewData, setPreviewData] = useState(null);
  const [results, setResults] = useState(null);
  const [provider, setProvider] = useState(null);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(null);

  // Settings state (custom API Key)
  const [showSettings, setShowSettings] = useState(false);
  const [localApiKey, setLocalApiKey] = useState('');
  const [detectedProvider, setDetectedProvider] = useState('none');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedKey = localStorage.getItem('groweasy_api_key') || '';
      setLocalApiKey(storedKey);
      updateDetectedProvider(storedKey);
    }
  }, []);

  const updateDetectedProvider = (key) => {
    if (!key) {
      setDetectedProvider('none');
      return;
    }
    const trimmed = key.trim();
    if (trimmed.startsWith('AIzaSy')) setDetectedProvider('gemini');
    else if (trimmed.startsWith('sk-ant')) setDetectedProvider('anthropic');
    else if (trimmed.startsWith('sk-')) setDetectedProvider('openai');
    else setDetectedProvider('unknown');
  };

  const handleApiKeyChange = (e) => {
    const val = e.target.value;
    setLocalApiKey(val);
    updateDetectedProvider(val);
    localStorage.setItem('groweasy_api_key', val);
  };

  const handleClearKey = () => {
    setLocalApiKey('');
    setDetectedProvider('none');
    localStorage.removeItem('groweasy_api_key');
  };

  // ─── Step 1: Upload ──────────────────────────────────────────────────

  const handleFileSelect = useCallback(async (file) => {
    setError(null);
    setLoading(true);

    try {
      const data = await uploadCSV(file);
      setPreviewData(data);
      setCurrentStep(2);
    } catch (err) {
      setError(err.message || 'Failed to upload file. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Step 3: Confirm → Process (REAL BATCHING & RETRY) ──────────────

  const handleConfirm = useCallback(async () => {
    if (!previewData?.records) return;

    setError(null);
    setCurrentStep(3);
    setLoading(true);
    setProgress(null);

    try {
      // Get the API key if configured on frontend
      const localKey = localStorage.getItem('groweasy_api_key') || '';

      // Check which provider is active
      const health = await checkHealth(localKey);
      setProvider(health.llmProvider);

      if (health.llmProvider === 'none') {
        throw new Error(
          'No LLM API key configured. Please set GEMINI_API_KEY, OPENAI_API_KEY, or ANTHROPIC_API_KEY on the server, or enter your API key by clicking the settings icon in the top right.'
        );
      }

      const totalRecords = previewData.records.length;
      const batchSize = 15; // Process in batches of 15
      const totalBatches = Math.ceil(totalRecords / batchSize);

      let allParsed = [];
      let allSkipped = [];
      let providerName = health.llmProvider;

      setProgress({
        processedBatches: 0,
        totalBatches,
        processedRecords: 0,
        totalRecords,
      });

      for (let i = 0; i < totalBatches; i++) {
        const batchRecords = previewData.records.slice(i * batchSize, (i + 1) * batchSize);
        let success = false;
        let lastErr = null;

        // Frontend retry mechanism (up to 3 times)
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            const res = await processRecords(batchRecords, localKey);
            allParsed = allParsed.concat(res.parsed || []);
            allSkipped = allSkipped.concat(res.skipped || []);
            providerName = res.provider || providerName;
            success = true;
            break; // Batch processed successfully
          } catch (err) {
            lastErr = err;
            console.warn(`[Batch ${i + 1} Attempt ${attempt} failed]: ${err.message}`);
            if (attempt < 3) {
              // Wait before retrying (exponentially longer)
              await new Promise((r) => setTimeout(r, 1000 * attempt));
            }
          }
        }

        if (!success) {
          throw new Error(
            `Failed to process batch ${i + 1} of ${totalBatches} after 3 attempts: ${lastErr?.message || 'Unknown error'}`
          );
        }

        setProgress({
          processedBatches: i + 1,
          totalBatches,
          processedRecords: Math.min((i + 1) * batchSize, totalRecords),
          totalRecords,
        });
      }

      setResults({
        provider: providerName,
        parsed: allParsed,
        skipped: allSkipped,
        totalImported: allParsed.length,
        totalSkipped: allSkipped.length,
        totalProcessed: allParsed.length + allSkipped.length,
      });

      setCurrentStep(4);
    } catch (err) {
      setError(err.message || 'Processing failed. Please try again.');
      setCurrentStep(2); // Go back to preview on error
    } finally {
      setLoading(false);
    }
  }, [previewData]);

  // ─── Reset ──────────────────────────────────────────────────────────

  const handleReset = useCallback(() => {
    setCurrentStep(1);
    setPreviewData(null);
    setResults(null);
    setProvider(null);
    setError(null);
    setProgress(null);
    setLoading(false);
  }, []);

  // ─── Render ─────────────────────────────────────────────────────────

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header" style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', right: 0, top: '24px' }}>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="btn btn-secondary"
            style={{ minWidth: 'auto', padding: '8px 12px', borderRadius: '50%' }}
            title="API Key Settings"
            id="settings-toggle-btn"
          >
            ⚙️ Settings
          </button>
        </div>
        <div className="app-logo">
          <div className="logo-icon">⚡</div>
          <h1 className="app-title">GrowEasy CRM Importer</h1>
        </div>
        <p className="app-subtitle">
          Upload any CSV — AI maps your data to CRM fields automatically
        </p>
      </header>

      {/* Settings Modal/Panel */}
      {showSettings && (
        <div className="glass-card" style={{ marginBottom: '24px', border: '1px solid var(--accent-teal)' }} id="settings-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>🔑 Custom API Key Settings</h3>
            <button onClick={() => setShowSettings(false)} className="file-remove-btn" style={{ fontSize: '1.1rem' }}>✕</button>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            You can provide your own API key to bypass server limits. The key is stored locally in your browser and sent directly to the Express backend.
          </p>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              type="password"
              placeholder="Paste your Gemini, OpenAI, or Anthropic API Key..."
              value={localApiKey}
              onChange={handleApiKeyChange}
              id="api-key-input"
              style={{
                flex: 1,
                minWidth: '280px',
                padding: '10px 14px',
                background: 'var(--bg-deep)',
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                fontSize: '0.875rem',
                outline: 'none',
              }}
            />
            {localApiKey && (
              <button className="btn btn-secondary" onClick={handleClearKey} style={{ minHeight: '38px', padding: '0 16px' }} id="clear-key-btn">
                Clear Key
              </button>
            )}
          </div>
          {localApiKey && (
            <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Detected Provider:</span>
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: '999px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  background:
                    detectedProvider === 'gemini'
                      ? 'rgba(45, 212, 191, 0.15)'
                      : detectedProvider === 'openai'
                      ? 'rgba(59, 130, 246, 0.15)'
                      : detectedProvider === 'anthropic'
                      ? 'rgba(139, 92, 246, 0.15)'
                      : 'rgba(255, 255, 255, 0.1)',
                  color:
                    detectedProvider === 'gemini'
                      ? 'var(--accent-teal)'
                      : detectedProvider === 'openai'
                      ? 'var(--accent-blue)'
                      : detectedProvider === 'anthropic'
                      ? 'var(--accent-violet)'
                      : 'var(--text-muted)',
                }}
              >
                {detectedProvider === 'gemini' && '🔮 Google Gemini'}
                {detectedProvider === 'openai' && '🤖 OpenAI GPT'}
                {detectedProvider === 'anthropic' && '🟣 Anthropic Claude'}
                {detectedProvider === 'unknown' && '❓ Unknown format'}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="error-banner" role="alert" id="error-banner">
          <span className="error-icon">⚠️</span>
          <span className="error-text">{error}</span>
        </div>
      )}

      {/* Main Content */}
      <div className="glass-card">
        {/* Step 1: Upload */}
        {currentStep === 1 && (
          <div className="step-content" key="step-1">
            <div className="section-header">
              <h2 className="section-title">📤 Upload Your CSV</h2>
              <p className="section-desc">
                Drag & drop or browse for any CSV file — Facebook Leads, Google Ads, HubSpot exports, or custom spreadsheets.
              </p>
            </div>
            <FileUploader onFileSelect={handleFileSelect} disabled={loading} />
            {loading && (
              <p style={{ textAlign: 'center', marginTop: '16px', color: 'var(--text-muted)' }}>
                Parsing your CSV...
              </p>
            )}
          </div>
        )}

        {/* Step 2: Preview */}
        {currentStep === 2 && previewData && (
          <div key="step-2">
            <DataPreview data={previewData} />
            <div className="confirm-box">
              <div className="confirm-icon">🤖</div>
              <h3 className="confirm-title">Ready to process with AI?</h3>
              <p className="confirm-desc">
                Our AI will intelligently map these {previewData.totalRows} records to GrowEasy CRM format.
                Records without an email or phone number will be automatically skipped.
              </p>
              <div className="btn-group">
                <button
                  className="btn btn-secondary"
                  onClick={handleReset}
                  id="back-btn"
                >
                  ← Upload Different File
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleConfirm}
                  disabled={loading}
                  id="confirm-import-btn"
                >
                  🚀 Confirm & Import
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Processing */}
        {currentStep === 3 && (
          <div key="step-3">
            <ProcessingStatus progress={progress} provider={provider} />
          </div>
        )}

        {/* Step 4: Results */}
        {currentStep === 4 && results && (
          <div key="step-4">
            <ResultsView results={results} />
            <div className="btn-group" style={{ marginTop: '16px' }}>
              <button
                className="btn btn-secondary"
                onClick={handleReset}
                id="new-import-btn"
              >
                📤 New Import
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="app-footer">
        <p>
          Built by{' '}
          <a href="https://github.com/Alok-Fusion" target="_blank" rel="noopener">
            Alok Kushwaha
          </a>{' '}
          &middot; GrowEasy Software Developer Assignment
        </p>
      </footer>
    </div>
  );
}

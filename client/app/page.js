'use client';

import { useState, useCallback } from 'react';
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

  // ─── Step 3: Confirm → Process ──────────────────────────────────────

  const handleConfirm = useCallback(async () => {
    if (!previewData?.records) return;

    setError(null);
    setCurrentStep(3);
    setLoading(true);
    setProgress(null);

    try {
      // Check which provider is active
      const health = await checkHealth();
      setProvider(health.llmProvider);

      if (health.llmProvider === 'none') {
        throw new Error(
          'No AI API key configured on the server. Please set GEMINI_API_KEY, OPENAI_API_KEY, or ANTHROPIC_API_KEY in server/.env'
        );
      }

      // Simulate progress updates (since we can't stream from a single POST)
      const totalRecords = previewData.records.length;
      const batchSize = 15;
      const totalBatches = Math.ceil(totalRecords / batchSize);

      // Start a fake progress timer
      let fakeBatch = 0;
      const progressTimer = setInterval(() => {
        fakeBatch = Math.min(fakeBatch + 1, totalBatches - 1);
        setProgress({
          processedBatches: fakeBatch,
          totalBatches,
          processedRecords: Math.min(fakeBatch * batchSize, totalRecords),
          totalRecords,
        });
      }, 2000);

      const data = await processRecords(previewData.records);

      clearInterval(progressTimer);

      // Final progress
      setProgress({
        processedBatches: totalBatches,
        totalBatches,
        processedRecords: totalRecords,
        totalRecords,
      });

      setResults(data);
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
      <header className="app-header">
        <div className="app-logo">
          <div className="logo-icon">⚡</div>
          <h1 className="app-title">GrowEasy CRM Importer</h1>
        </div>
        <p className="app-subtitle">
          Upload any CSV — AI maps your data to CRM fields automatically
        </p>
      </header>

      {/* Step Indicator */}
      <StepIndicator currentStep={currentStep} />

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

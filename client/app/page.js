'use client';

import { useState, useCallback, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import DashboardView from '@/components/DashboardView';
import HistoryView from '@/components/HistoryView';
import SettingsView from '@/components/SettingsView';
import AboutView from '@/components/AboutView';
import StepIndicator from '@/components/StepIndicator';
import FileUploader from '@/components/FileUploader';
import DataPreview from '@/components/DataPreview';
import ProcessingStatus from '@/components/ProcessingStatus';
import ResultsView from '@/components/ResultsView';
import { uploadCSV, processRecords, checkHealth, getHistory, clearHistory, getSettings } from '@/lib/api';

export default function Home() {
  // Navigation & Theme
  const [currentView, setCurrentView] = useState('dashboard');
  const [currentTheme, setCurrentTheme] = useState('dark');
  const [historyList, setHistoryList] = useState([]);

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

  // Load theme and history on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedTheme = localStorage.getItem('groweasy_theme') || 'dark';
      setCurrentTheme(storedTheme);
      document.documentElement.setAttribute('data-theme', storedTheme);
    }
    
    async function loadHistory() {
      try {
        const histData = await getHistory();
        setHistoryList(histData.history || []);
      } catch (err) {
        console.error('Failed to load history list:', err.message);
      }
    }
    loadHistory();
  }, []);

  const handleThemeChange = (theme) => {
    setCurrentTheme(theme);
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('groweasy_theme', theme);
  };

  const handleClearHistory = async () => {
    if (confirm('Are you sure you want to clear the entire import history? This will delete all saved analytical metrics.')) {
      try {
        await clearHistory();
        setHistoryList([]);
      } catch (err) {
        alert(err.message || 'Failed to clear history');
      }
    }
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
          'No AI API key configured on the server. Please set GEMINI_API_KEY, OPENAI_API_KEY, or ANTHROPIC_API_KEY in the server\'s .env file.'
        );
      }

      // Fetch dynamic batch size settings from the backend database
      const settingsData = await getSettings();
      const batchSize = settingsData.settings?.batchSize || 15;
      
      const totalRecords = previewData.records.length;
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
            const res = await processRecords(batchRecords, previewData.fileName);
            allParsed = allParsed.concat(res.parsed || []);
            allSkipped = allSkipped.concat(res.skipped || []);
            providerName = res.provider || providerName;
            success = true;
            break; // Batch processed successfully
          } catch (err) {
            lastErr = err;
            console.warn(`[Batch ${i + 1} Attempt ${attempt} failed]: ${err.message}`);
            if (attempt < 3) {
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

      // Update history list in state
      const histData = await getHistory();
      setHistoryList(histData.history || []);

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

  return (
    <div className="dashboard-layout">
      {/* Sidebar Navigation */}
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        currentTheme={currentTheme}
        onThemeChange={handleThemeChange}
      />

      {/* Main Content Area */}
      <main className="main-content">
        {error && (
          <div className="error-banner" role="alert" id="error-banner">
            <span className="error-icon">⚠️</span>
            <span className="error-text">{error}</span>
          </div>
        )}

        {/* Dashboard View */}
        {currentView === 'dashboard' && (
          <DashboardView history={historyList} onViewChange={setCurrentView} />
        )}

        {/* Importer View */}
        {currentView === 'importer' && (
          <div className="step-content">
            <div className="dashboard-title-section">
              <h2 className="dashboard-title">CSV Lead Importer</h2>
              <p className="dashboard-subtitle">Intelligently maps spreadsheets to GrowEasy CRM format</p>
            </div>

            <StepIndicator currentStep={currentStep} />

            <div className="card">
              {/* Step 1: Upload */}
              {currentStep === 1 && (
                <div>
                  <div className="section-header">
                    <h3 className="section-title">Upload CSV File</h3>
                    <p className="section-desc">Select any standard or non-standard campaign lead export spreadsheet.</p>
                  </div>
                  <FileUploader onFileSelect={handleFileSelect} disabled={loading} />
                  {loading && (
                    <p style={{ textAlign: 'center', marginTop: '16px', color: 'var(--text-muted)' }}>
                      Parsing data...
                    </p>
                  )}
                </div>
              )}

              {/* Step 2: Preview */}
              {currentStep === 2 && previewData && (
                <div>
                  <DataPreview data={previewData} />
                  <div className="confirm-box">
                    <h4 className="confirm-title" style={{ marginTop: '24px' }}>Confirm Import Job</h4>
                    <p className="confirm-desc">
                      Ready to map {previewData.totalRows} raw rows using AI. Leads with neither email nor mobile will be skipped automatically.
                    </p>
                    <div className="btn-group">
                      <button
                        className="btn btn-secondary"
                        onClick={handleReset}
                        id="back-btn"
                      >
                        Upload Different File
                      </button>
                      <button
                        className="btn btn-primary"
                        onClick={handleConfirm}
                        disabled={loading}
                        id="confirm-import-btn"
                      >
                        Process & Import
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Processing */}
              {currentStep === 3 && (
                <ProcessingStatus progress={progress} provider={provider} />
              )}

              {/* Step 4: Results */}
              {currentStep === 4 && results && (
                <div>
                  <ResultsView results={results} />
                  <div className="btn-group" style={{ marginTop: '16px' }}>
                    <button
                      className="btn btn-secondary"
                      onClick={handleReset}
                      id="new-import-btn"
                    >
                      New Import Job
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* History View */}
        {currentView === 'history' && (
          <HistoryView history={historyList} onClear={handleClearHistory} />
        )}

        {/* Settings View */}
        {currentView === 'settings' && (
          <SettingsView onClearHistory={handleClearHistory} />
        )}

        {/* About View */}
        {currentView === 'about' && (
          <AboutView />
        )}
      </main>
    </div>
  );
}

'use client';

import { useMemo, useState } from 'react';

const CRM_COLUMNS = [
  'created_at',
  'name',
  'email',
  'country_code',
  'mobile_without_country_code',
  'company',
  'city',
  'state',
  'country',
  'lead_owner',
  'crm_status',
  'crm_note',
  'data_source',
  'possession_time',
  'description',
];

export default function ResultsView({ results }) {
  const [activeTab, setActiveTab] = useState('parsed');
  const { parsed, skipped, totalImported, totalSkipped, totalProcessed, provider } = results;

  const displayData = activeTab === 'parsed' ? parsed : skipped;

  // Generate CSV download content
  const csvContent = useMemo(() => {
    if (!parsed || parsed.length === 0) return '';
    const header = CRM_COLUMNS.join(',');
    const rows = parsed.map((record) =>
      CRM_COLUMNS.map((col) => {
        const val = record[col] || '';
        // Escape commas, quotes, and newlines
        if (val.includes(',') || val.includes('"') || val.includes('\n')) {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      }).join(',')
    );
    return header + '\n' + rows.join('\n');
  }, [parsed]);

  const handleDownload = () => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'groweasy_crm_import.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="step-content">
      {/* Header */}
      <div className="results-header">
        <div className="results-icon">
          <svg style={{ width: 32, height: 32, fill: 'var(--success)' }} viewBox="0 0 24 24">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
          </svg>
        </div>
        <h2 className="results-title">Import Complete</h2>
        <p className="results-subtitle">
          Your CSV has been processed and mapped to GrowEasy CRM format
        </p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card success">
          <div className="stat-value">{totalImported}</div>
          <div className="stat-label">Imported</div>
        </div>
        <div className="stat-card warning">
          <div className="stat-value">{totalSkipped}</div>
          <div className="stat-label">Skipped</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{totalProcessed}</div>
          <div className="stat-label">Total Processed</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ fontSize: '1rem', paddingTop: '8px' }}>
            {provider === 'gemini'
              ? 'Gemini'
              : provider === 'openai'
              ? 'GPT'
              : provider === 'anthropic'
              ? 'Claude'
              : provider}
          </div>
          <div className="stat-label">AI Provider</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" role="tablist" id="results-tabs">
        <button
          className={`tab-btn ${activeTab === 'parsed' ? 'active' : ''}`}
          onClick={() => setActiveTab('parsed')}
          role="tab"
          aria-selected={activeTab === 'parsed'}
          id="tab-parsed"
        >
          Imported Records ({totalImported})
        </button>
        <button
          className={`tab-btn ${activeTab === 'skipped' ? 'active' : ''}`}
          onClick={() => setActiveTab('skipped')}
          role="tab"
          aria-selected={activeTab === 'skipped'}
          id="tab-skipped"
        >
          Skipped Records ({totalSkipped})
        </button>
      </div>

      {/* Table */}
      {displayData && displayData.length > 0 ? (
        <div className="table-container" id="results-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th className="row-number">#</th>
                {CRM_COLUMNS.map((col) => (
                  <th key={col}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayData.map((row, idx) => (
                <tr key={idx}>
                  <td className="row-number">{idx + 1}</td>
                  {CRM_COLUMNS.map((col) => (
                    <td key={col} title={row[col] || ''}>
                      {col === 'crm_status' && row[col] ? (
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: '999px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            background:
                              row[col] === 'SALE_DONE'
                                ? 'var(--success-bg)'
                                : row[col] === 'BAD_LEAD'
                                ? 'var(--error-bg)'
                                : row[col] === 'DID_NOT_CONNECT'
                                ? 'var(--warning-bg)'
                                : 'var(--info-bg)',
                            color:
                              row[col] === 'SALE_DONE'
                                ? 'var(--success)'
                                : row[col] === 'BAD_LEAD'
                                ? 'var(--error)'
                                : row[col] === 'DID_NOT_CONNECT'
                                ? 'var(--warning)'
                                : 'var(--info)',
                          }}
                        >
                          {row[col]}
                        </span>
                      ) : (
                        row[col] || '—'
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg style={{ width: 48, height: 48, fill: 'var(--text-muted)', margin: '0 auto', opacity: 0.5 }} viewBox="0 0 24 24">
              <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V8l8 5 8-5v10zm-8-7L4 6h16l-8 5z" />
            </svg>
          </div>
          <p className="empty-state-text">
            {activeTab === 'skipped'
              ? 'No records were skipped — all records imported successfully.'
              : 'No records to display.'}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="btn-group">
        {totalImported > 0 && (
          <button
            className="btn btn-primary"
            onClick={handleDownload}
            id="download-csv-btn"
          >
            Download CRM CSV
          </button>
        )}
      </div>
    </div>
  );
}

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

export default function HistoryView({ history, onClear }) {
  const [expandedId, setExpandedId] = useState(null);
  const [activeTab, setActiveTab] = useState('parsed');

  const toggleExpand = (id) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      setActiveTab('parsed');
    }
  };

  const formatDate = (isoStr) => {
    if (!isoStr) return '';
    const date = new Date(isoStr);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDownloadHistorical = (item) => {
    const records = item.parsed || [];
    if (records.length === 0) return;

    const header = CRM_COLUMNS.join(',');
    const rows = records.map((record) =>
      CRM_COLUMNS.map((col) => {
        const val = record[col] || '';
        if (val.includes(',') || val.includes('"') || val.includes('\n')) {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      }).join(',')
    );
    const csvContent = header + '\n' + rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `groweasy_${item.fileName || 'historical_import'}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="step-content">
      <div className="dashboard-title-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="dashboard-title">Import History</h2>
          <p className="dashboard-subtitle">History record of all previous importing actions</p>
        </div>
        {history.length > 0 && (
          <button onClick={onClear} className="btn btn-danger" id="clear-history-btn">
            Clear History
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="card" style={{ padding: '48px 24px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)' }}>No previous import logs saved in this system.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {history.map((item) => {
            const isExpanded = expandedId === item.id;
            const displayData = activeTab === 'parsed' ? item.parsed || [] : item.skipped || [];

            return (
              <div key={item.id} className="history-item">
                {/* Header */}
                <div className="history-item-header" onClick={() => toggleExpand(item.id)}>
                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {item.fileName}
                    </h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Imported on {formatDate(item.timestamp)} &middot; Provider:{' '}
                      <strong style={{ textTransform: 'capitalize' }}>{item.provider}</strong>
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span className="status-pill success">{item.totalImported} imported</span>
                    {item.totalSkipped > 0 && (
                      <span className="status-pill error">{item.totalSkipped} skipped</span>
                    )}
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {isExpanded ? '▲' : '▼'}
                    </span>
                  </div>
                </div>

                {/* Body Details */}
                {isExpanded && (
                  <div className="history-item-body">
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '16px',
                        flexWrap: 'wrap',
                        gap: '12px',
                      }}
                    >
                      {/* Tabs */}
                      <div className="tabs" style={{ margin: 0, padding: '2px', background: 'var(--bg-elevated)' }}>
                        <button
                          className={`tab-btn ${activeTab === 'parsed' ? 'active' : ''}`}
                          onClick={() => setActiveTab('parsed')}
                          style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                        >
                          Imported ({item.totalImported})
                        </button>
                        <button
                          className={`tab-btn ${activeTab === 'skipped' ? 'active' : ''}`}
                          onClick={() => setActiveTab('skipped')}
                          style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                        >
                          Skipped ({item.totalSkipped})
                        </button>
                      </div>

                      {/* Download Button */}
                      {item.totalImported > 0 && (
                        <button
                          onClick={() => handleDownloadHistorical(item)}
                          className="btn btn-secondary"
                          style={{ minHeight: '32px', padding: '0 12px', fontSize: '0.8rem' }}
                        >
                          Download CSV
                        </button>
                      )}
                    </div>

                    {/* Table View */}
                    {displayData.length > 0 ? (
                      <div className="table-container" style={{ maxHeight: '300px' }}>
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
                                      <span className={`status-pill ${
                                        row[col] === 'SALE_DONE'
                                          ? 'success'
                                          : row[col] === 'BAD_LEAD'
                                          ? 'error'
                                          : row[col] === 'DID_NOT_CONNECT'
                                          ? 'warning'
                                          : 'info'
                                      }`}>
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
                      <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px 0', fontSize: '0.85rem' }}>
                        No records to display.
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

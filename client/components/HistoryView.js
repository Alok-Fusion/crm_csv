'use client';

import { useState } from 'react';

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

  const circumference = 2 * Math.PI * 45;

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

            // Calculate file-specific distributions
            const parsedRecords = item.parsed || [];
            const totalProcessed = (item.totalImported || 0) + (item.totalSkipped || 0);
            const successRate = totalProcessed > 0 ? Math.round(((item.totalImported || 0) / totalProcessed) * 100) : 0;

            // Status distribution for this file
            const statusCounts = {
              GOOD_LEAD_FOLLOW_UP: 0,
              DID_NOT_CONNECT: 0,
              BAD_LEAD: 0,
              SALE_DONE: 0,
            };
            parsedRecords.forEach((rec) => {
              if (rec.crm_status && statusCounts[rec.crm_status] !== undefined) {
                statusCounts[rec.crm_status]++;
              }
            });
            const statusTotal = Object.values(statusCounts).reduce((a, b) => a + b, 0);
            const fileStatusDist = Object.entries(statusCounts).map(([status, val]) => ({
              name: status.replace(/_/g, ' '),
              value: val,
              percentage: statusTotal > 0 ? Math.round((val / statusTotal) * 100) : 0,
            }));

            // Source distribution for this file
            const sourceCounts = {
              leads_on_demand: 0,
              meridian_tower: 0,
              eden_park: 0,
              varah_swamy: 0,
              sarjapur_plots: 0,
            };
            parsedRecords.forEach((rec) => {
              if (rec.data_source && sourceCounts[rec.data_source] !== undefined) {
                sourceCounts[rec.data_source]++;
              }
            });
            const sourceTotal = Object.values(sourceCounts).reduce((a, b) => a + b, 0);
            const fileSourceDist = Object.entries(sourceCounts).map(([source, val]) => ({
              name: source.replace(/_/g, ' '),
              value: val,
              percentage: sourceTotal > 0 ? Math.round((val / sourceTotal) * 100) : 0,
            }));

            const strokeDashoffset = circumference - (successRate / 100) * circumference;

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
                    {/* File Dashboard Summary */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', marginBottom: '24px', borderBottom: '1px solid var(--border-light)', paddingBottom: '20px' }}>
                      {/* Left: Distributions */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                          <h5 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600 }}>Lead Status Distribution</h5>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {fileStatusDist.map((dist) => (
                              <div key={dist.name} className="bar-chart-row">
                                <span className="bar-chart-label" style={{ width: '120px', fontSize: '0.7rem' }}>{dist.name}</span>
                                <div className="bar-chart-track" style={{ height: '3px' }}>
                                  <div
                                    className={`bar-chart-fill ${dist.name === 'SALE DONE' ? 'success' : dist.name === 'BAD LEAD' ? 'error' : dist.name === 'DID NOT CONNECT' ? 'warning' : 'info'}`}
                                    style={{ width: `${dist.percentage}%` }}
                                  />
                                </div>
                                <span className="bar-chart-value" style={{ fontSize: '0.7rem' }}>{dist.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h5 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600 }}>Data Source Distribution</h5>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {fileSourceDist.map((dist) => (
                              <div key={dist.name} className="bar-chart-row">
                                <span className="bar-chart-label" style={{ width: '120px', fontSize: '0.7rem' }}>{dist.name}</span>
                                <div className="bar-chart-track" style={{ height: '3px' }}>
                                  <div
                                    className="bar-chart-fill"
                                    style={{ width: `${dist.percentage}%`, backgroundColor: 'var(--text-primary)' }}
                                  />
                                </div>
                                <span className="bar-chart-value" style={{ fontSize: '0.7rem' }}>{dist.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Right: Circular Gauge */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', padding: '16px', border: '1px solid var(--border-light)' }}>
                        <div style={{ position: 'relative', width: '80px', height: '80px', marginBottom: '12px' }}>
                          <svg width="80" height="80" viewBox="0 0 100 100">
                            <circle className="gauge-circle-bg" cx="50" cy="50" r="45" style={{ strokeWidth: 8 }} />
                            <circle
                              className="gauge-circle-fill"
                              cx="50"
                              cy="50"
                              r="45"
                              strokeDasharray={circumference}
                              strokeDashoffset={strokeDashoffset}
                              style={{ stroke: 'var(--success)', strokeWidth: 8 }}
                            />
                          </svg>
                          <div className="gauge-percentage" style={{ fontSize: '0.95rem' }}>{successRate}%</div>
                        </div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>Import Yield Rate</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{item.totalImported} of {totalProcessed} leads successfully parsed</div>
                      </div>
                    </div>

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

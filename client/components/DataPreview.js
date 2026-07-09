'use client';

import { useMemo, useState } from 'react';

const MAX_PREVIEW_ROWS = 100;

export default function DataPreview({ data }) {
  const { records, columns, totalRows, fileName } = data;
  const [search, setSearch] = useState('');

  const displayRecords = useMemo(() => {
    let filtered = records;

    // Apply search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = records.filter((row) =>
        Object.values(row).some((val) =>
          String(val).toLowerCase().includes(q)
        )
      );
    }

    // Limit to max preview rows
    return filtered.slice(0, MAX_PREVIEW_ROWS);
  }, [records, search]);

  return (
    <div className="step-content">
      <div className="section-header">
        <h2 className="section-title">📊 Data Preview</h2>
        <p className="section-desc">
          Review your CSV data before sending it for AI processing.
        </p>
      </div>

      <div className="table-info">
        <div className="table-stats">
          <span className="stat-badge">
            📋 <strong>{totalRows}</strong>&nbsp;rows
          </span>
          <span className="stat-badge">
            📐 <strong>{columns.length}</strong>&nbsp;columns
          </span>
          {fileName && (
            <span className="stat-badge">
              📁 {fileName}
            </span>
          )}
        </div>
        <div>
          <input
            type="text"
            placeholder="Search rows..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            id="preview-search-input"
            style={{
              padding: '6px 12px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--glass-border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
              fontFamily: 'var(--font-sans)',
              outline: 'none',
              width: '180px',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => (e.target.style.borderColor = 'var(--accent-teal)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--glass-border)')}
          />
        </div>
      </div>

      <div className="table-container" id="preview-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th className="row-number">#</th>
              {columns.map((col) => (
                <th key={col}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayRecords.map((row, idx) => (
              <tr key={idx}>
                <td className="row-number">{idx + 1}</td>
                {columns.map((col) => (
                  <td key={col} title={row[col] || ''}>
                    {row[col] || '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalRows > MAX_PREVIEW_ROWS && (
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '8px' }}>
          Showing {Math.min(displayRecords.length, MAX_PREVIEW_ROWS)} of {totalRows} rows
        </p>
      )}
    </div>
  );
}

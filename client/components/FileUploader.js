'use client';

import { useCallback, useRef, useState } from 'react';

export default function FileUploader({ onFileSelect, disabled }) {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const inputRef = useRef(null);

  const handleFile = useCallback(
    (file) => {
      if (!file) return;
      if (!file.name.toLowerCase().endsWith('.csv')) {
        alert('Please upload a CSV file (.csv)');
        return;
      }
      setSelectedFile(file);
      onFileSelect(file);
    },
    [onFileSelect]
  );

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(false);
      const file = e.dataTransfer?.files?.[0];
      handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const handleInputChange = useCallback(
    (e) => {
      const file = e.target.files?.[0];
      handleFile(file);
    },
    [handleFile]
  );

  const handleRemove = useCallback(() => {
    setSelectedFile(null);
    if (inputRef.current) inputRef.current.value = '';
  }, []);

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div>
      <div
        className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !disabled && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Upload CSV file"
        id="csv-upload-zone"
      >
        <div className="upload-icon">📁</div>
        <h2 className="upload-title">Drop your CSV file here</h2>
        <p className="upload-subtitle">
          or click to browse from your computer
        </p>
        <button
          className="upload-btn"
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            inputRef.current?.click();
          }}
          disabled={disabled}
          id="browse-file-btn"
        >
          📎 Browse Files
        </button>
        <p className="upload-formats">
          Supports: Facebook Leads, Google Ads, HubSpot, Salesforce, or any custom CSV
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          onChange={handleInputChange}
          style={{ display: 'none' }}
          aria-hidden="true"
          id="csv-file-input"
        />
      </div>

      {selectedFile && (
        <div className="file-selected">
          <div className="file-selected-icon">📄</div>
          <div className="file-selected-info">
            <div className="file-selected-name">{selectedFile.name}</div>
            <div className="file-selected-size">{formatSize(selectedFile.size)}</div>
          </div>
          <button
            className="file-remove-btn"
            onClick={handleRemove}
            aria-label="Remove file"
            id="remove-file-btn"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

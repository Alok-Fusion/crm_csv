'use client';

export default function AboutView() {
  return (
    <div className="step-content">
      <div className="dashboard-title-section">
        <h2 className="dashboard-title">About System</h2>
        <p className="dashboard-subtitle">GrowEasy CRM CSV Importer details</p>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Product Description</h3>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '16px' }}>
          The GrowEasy CRM CSV Importer is a high-performance, intelligent data mapping engine designed to ingest lead spreadsheets of arbitrary schemas and normalize them into a uniform CRM layout. Using advanced semantic mapping and heuristic validations, the system ensures data cleanliness and consistency before lead ingestion.
        </p>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Product Metadata</h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          <div>
            <strong style={{ color: 'var(--text-primary)' }}>Built By:</strong> Alok Kushwaha
          </div>
          <div>
            <strong style={{ color: 'var(--text-primary)' }}>System Version:</strong> v1.0.0 (Release build)
          </div>
        </div>
      </div>
    </div>
  );
}

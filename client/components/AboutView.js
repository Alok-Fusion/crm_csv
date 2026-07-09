'use client';

export default function AboutView() {
  return (
    <div className="step-content">
      <div className="dashboard-title-section">
        <h2 className="dashboard-title">System Documentation</h2>
        <p className="dashboard-subtitle">Technical specifications and design architecture of the GrowEasy CRM Importer</p>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Overview</h3>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          The GrowEasy CRM CSV Importer is a high-performance, intelligent data mapping engine designed to ingest lead spreadsheets of arbitrary schemas and normalize them into a uniform CRM layout. Using advanced semantic mapping and heuristic validations, the system ensures data cleanliness and consistency before lead ingestion.
        </p>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">System Architecture</h3>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.6 }}>
          Built as a decoupled monorepo, the platform uses Next.js on the client layer and Express on the backend API layer. Data processing is managed statelessly in-memory, backed by a local configuration database.
        </p>
        <div style={{ padding: '16px', backgroundColor: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', overflowX: 'auto', border: '1px solid var(--border-light)', color: 'var(--text-secondary)' }}>
          +------------------------+          HTTP POST /api/upload          +--------------------------+
          |  Next.js Frontend SPA  | --------------------------------------&gt; |   Express Server Upload  |
          |  (Step Importer UI)   | &lt;-------------------------------------- |   (Memory CSV Parser)    |
          +------------------------+          CSV columns preview payload     +--------------------------+
                      |
                      | (Confirm Import Job)
                      |
                      v
          +------------------------+          HTTP POST /api/process         +--------------------------+
          |   Sequential Batcher   | --------------------------------------&gt; |   LLM Extraction Engine  |
          |  - Real progress maps  |                                         |   - Validation Layer     |
          |  - 3x Retry Backoff    | &lt;-------------------------------------- |   - Multi-Model Adapter  |
          +------------------------+          Extracted CRM JSON records     +--------------------------+
                                                                                          |
                                                                                          v
                                                                             +--------------------------+
                                                                             |   Local JSON Database    |
                                                                             |   (server/data/db.json)  |
                                                                             +--------------------------+
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">AI Processing & Normalization Rules</h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          <p>
            The backend formats each lead block and queries the configured Large Language Model (LLM) with a strict schema constraint, enforcing the following structural validations:
          </p>
          <ul style={{ listStyleType: 'square', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li><strong>Lead Status Normalization</strong>: messy status inputs (e.g. "Warm", "Hot", "No answer") are categorized into strict CRM statuses: <code>GOOD_LEAD_FOLLOW_UP</code>, <code>DID_NOT_CONNECT</code>, <code>BAD_LEAD</code>, or <code>SALE_DONE</code>.</li>
            <li><strong>Source Classification</strong>: campaign streams are categorized into recognized channels: <code>leads_on_demand</code>, <code>meridian_tower</code>, <code>eden_park</code>, <code>varah_swamy</code>, or <code>sarjapur_plots</code>.</li>
            <li><strong>Contact Integrity (GDPR / Skip Policy)</strong>: records missing both an email address and a mobile number contain insufficient identifier fields and are filtered out of the import list.</li>
            <li><strong>Overflow Parsing</strong>: multiple contact options or notes are captured, appending excess contact variables into the primary remarks column (<code>crm_note</code>).</li>
          </ul>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Technology Specifications</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', fontSize: '0.85rem' }}>
          <div>
            <h4 style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>Frontend Layer</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: 1.5 }}>
              Next.js 15 App Router. Utilizes client-side chunking to distribute requests, a custom CSS variable design system, and animated inline SVGs for performance tracking.
            </p>
          </div>
          <div>
            <h4 style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>Backend Layer</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: 1.5 }}>
              Node.js and Express.js API. Handles CSV parsing using <code>csv-parse</code>, implements input validators, and records session outputs in a file-based log store.
            </p>
          </div>
          <div>
            <h4 style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>AI Adapter Layer</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: 1.5 }}>
              Adapts system prompts dynamically to map columns. Integrates with Gemini 2.0 Flash, OpenAI GPT-4o-mini, and Anthropic Claude models via environment configurations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

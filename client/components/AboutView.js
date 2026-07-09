'use client';

export default function AboutView() {
  return (
    <div className="step-content">
      <div className="dashboard-title-section">
        <h2 className="dashboard-title">About System</h2>
        <p className="dashboard-subtitle">GrowEasy Software Developer assignment documentation</p>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Applicant Profile</h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem' }}>
          <div><strong>Candidate Name:</strong> Alok Kushwaha</div>
          <div><strong>Position Applied:</strong> Software Developer Intern / Full-Time</div>
          <div><strong>Work Mode:</strong> Work From Home (WFH)</div>
          <div><strong>Submission Deadline:</strong> 12 July 2026</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Compensation Details</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '0.85rem' }}>
          <div style={{ padding: '12px', backgroundColor: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)' }}>
            <h4 style={{ fontWeight: 700, marginBottom: '6px' }}>Internship Position</h4>
            <ul style={{ listStylePosition: 'inside', color: 'var(--text-secondary)' }}>
              <li>Compensation: ₹15,000 – ₹20,000 per month</li>
              <li>Commitment: Minimum 4 months (Full Time)</li>
            </ul>
          </div>
          <div style={{ padding: '12px', backgroundColor: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)' }}>
            <h4 style={{ fontWeight: 700, marginBottom: '6px' }}>Full-Time Position</h4>
            <ul style={{ listStylePosition: 'inside', color: 'var(--text-secondary)' }}>
              <li>Compensation: ₹35,000 – ₹50,000 per month</li>
              <li>Experience: Minimum 1 year post-grad required</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">System Architecture</h3>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
          The GrowEasy CRM CSV Importer maps arbitrary spreadsheets to structured CRM layouts.
        </p>
        <div style={{ padding: '16px', backgroundColor: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', overflowX: 'auto' }}>
          [Next.js App UI]<br />
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|<br />
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|-- (Upload CSV Buffer) --&gt; [Express Server: parseCSV]<br />
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|<br />
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|-- (Confirm Mapped Records) --&gt; [Express Server: processCSV]<br />
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|<br />
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|--&gt; [AI Multi-LLM Adapter]<br />
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|--&gt; [Local JSON Database]
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Technology Specifications</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', fontSize: '0.85rem' }}>
          <div>
            <h4 style={{ fontWeight: 600, marginBottom: '4px' }}>Frontend Layer</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Next.js App Router, CSS Variables theme engine, real-time sequential progress chunking, SVG analytics graphing, stateless view routing.</p>
          </div>
          <div>
            <h4 style={{ fontWeight: 600, marginBottom: '4px' }}>Backend Layer</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Express.js API endpoint, Multer stream, csv-parse parser, system prompt adapter layer, file-based db.json persist operations.</p>
          </div>
          <div>
            <h4 style={{ fontWeight: 600, marginBottom: '4px' }}>AI Layer</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Automated mapping prompts matching status constraints and data source specifications. Supports Gemini, OpenAI and Claude models.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

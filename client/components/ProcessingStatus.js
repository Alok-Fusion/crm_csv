'use client';

export default function ProcessingStatus({ progress, provider }) {
  const percent = progress
    ? Math.round((progress.processedBatches / progress.totalBatches) * 100)
    : 0;

  return (
    <div className="step-content">
      <div className="processing-container">
        <div className="processing-animation">
          <div className="processing-ring" />
          <div className="processing-ring" />
          <div className="processing-ring" />
        </div>

        <h2 className="processing-title">AI is analyzing your data...</h2>
        <p className="processing-subtitle">
          Intelligently mapping CSV columns to FlexCRM fields
        </p>

        {progress && (
          <>
            <div className="progress-bar-container">
              <div
                className="progress-bar-fill"
                style={{ width: `${percent}%` }}
                role="progressbar"
                aria-valuenow={percent}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
            <p className="progress-text">
              Batch {progress.processedBatches} of {progress.totalBatches} &middot;{' '}
              {progress.processedRecords} / {progress.totalRecords} records
            </p>
          </>
        )}

        {!progress && (
          <>
            <div className="progress-bar-container">
              <div
                className="progress-bar-fill"
                style={{ width: '30%' }}
              />
            </div>
            <p className="progress-text">Initializing AI pipeline...</p>
          </>
        )}

        {provider && (
          <div className="provider-badge">
            <span className="dot" />
            <span>
              Powered by{' '}
              {provider === 'gemini'
                ? 'Google Gemini'
                : provider === 'openai'
                ? 'OpenAI GPT'
                : provider === 'anthropic'
                ? 'Anthropic Claude'
                : provider === 'groq'
                ? 'Groq LLaMA'
                : provider}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

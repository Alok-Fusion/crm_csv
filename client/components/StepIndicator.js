'use client';

const STEPS = [
  { number: 1, label: 'Upload' },
  { number: 2, label: 'Preview' },
  { number: 3, label: 'Process' },
  { number: 4, label: 'Results' },
];

export default function StepIndicator({ currentStep }) {
  return (
    <div className="step-indicator" role="navigation" aria-label="Import progress">
      {STEPS.map((step, index) => {
        const isActive = step.number === currentStep;
        const isCompleted = step.number < currentStep;
        const className = `step-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`;

        return (
          <div key={step.number} style={{ display: 'flex', alignItems: 'center' }}>
            <div className={className}>
              <span className="step-circle" aria-current={isActive ? 'step' : undefined}>
                0{step.number}
              </span>
              <span className="step-label">{step.label}</span>
            </div>
            {index < STEPS.length - 1 && <div className="step-connector" />}
          </div>
        );
      })}
    </div>
  );
}

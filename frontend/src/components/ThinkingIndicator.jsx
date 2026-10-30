import React, { useState, useEffect, useMemo } from 'react';
import './ThinkingIndicator.css';

const ThinkingIndicator = ({ isImageGen = false }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = useMemo(() => {
    if (isImageGen) {
      return [
        { label: 'Analyzing visual prompt...' },
        { label: 'Configuring composition & style...' },
        { label: 'Synthesizing image with Flux...' }
      ];
    }
    return [
      { label: 'Analyzing your question...' },
      { label: 'Searching knowledge base...' },
      { label: 'Generating response...' }
    ];
  }, [isImageGen]);

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setCurrentStep(1);
    }, 700);

    const timer2 = setTimeout(() => {
      setCurrentStep(2);
    }, 1500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  return (
    <div className="ai-thinking-card" role="status" aria-live="polite">
      {steps.map((step, idx) => {
        const isCompleted = currentStep > idx;
        const isActive = currentStep === idx;
        const isPending = currentStep < idx;

        return (
          <div
            key={idx}
            className={`thinking-step ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''} ${isPending ? 'pending' : ''}`}
          >
            <span
              className={`thinking-dot ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}
            />
            <span className="thinking-text">{step.label}</span>
            {isActive && (
              <span className="thinking-ellipsis">
                <span />
                <span />
                <span />
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ThinkingIndicator;

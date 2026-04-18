import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Lock, ArrowRight, Sparkles } from 'lucide-react';
import { useModel } from '../hooks/useModel';
import { MODEL_LIST } from '../constants/models';
import './ModelSelector.css';



const ModelSelector = () => {
  const { selectedModel, setSelectedModel } = useModel();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const select = (model) => {
    if (!model.locked) {
      setSelectedModel(model);
      setOpen(false);
    }
  };

  return (
    <div className="model-selector-wrapper" ref={ref}>
      <button
        className="version-selector model-selector-trigger"
        onClick={() => setOpen(prev => !prev)}
      >
        <Sparkles size={14} color="var(--brand-primary)" />
        SumanAI — {selectedModel.name}
        <ChevronDown size={14} className={`chevron ${open ? 'rotated' : ''}`} />
      </button>

      {open && (
        <div className="model-dropdown">
          <a href="#" className="model-dropdown-header">
            <span>Access the top AI models</span>
            <ArrowRight size={16} />
          </a>

          <div className="model-list">
            {MODEL_LIST.map(model => (
              <button
                key={model.id}
                className={`model-item ${selectedModel.id === model.id ? 'selected' : ''} ${model.locked ? 'locked' : ''}`}
                onClick={() => select(model)}
              >
                <span className="model-item-icon"><model.icon /></span>
                <span className="model-item-name">{model.name}</span>
                {model.badge && <span className="model-badge">{model.badge}</span>}
                {model.locked && <Lock size={14} className="model-lock" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelSelector;

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Lock, ArrowRight, Sparkles, ImageOff, Image as ImageIcon } from 'lucide-react';
import { useModel } from '../hooks/useModel';
import { MODEL_LIST } from '../constants/models';
import { useChatStore } from '../store/useChatStore';
import { useAuthStore } from '../store/useAuthStore';
import './ModelSelector.css';

const ModelSelector = () => {
  const { selectedModel, setSelectedModel, models, isGuest } = useModel();
  const { openAuthModal } = useAuthStore();
  const hasAttachments = useChatStore(state => state.hasAttachments);
  const hasImageGenActive = useChatStore(state => state.hasImageGenActive);
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 58, left: 0, transform: 'translateX(-50%)' });

  const modelList = models && models.length > 0 ? models : MODEL_LIST;

  useEffect(() => {
    if (!open) return;
    const updatePosition = () => {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      const isMobile = window.innerWidth <= 768;
      if (isMobile) {
        setDropdownPos({
          top: Math.max(54, rect.bottom + 8),
          left: window.innerWidth / 2,
          transform: 'translateX(-50%)'
        });
      } else {
        setDropdownPos({
          top: rect.bottom + 8,
          left: rect.left + rect.width / 2,
          transform: 'translateX(-50%)'
        });
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open]);

  useEffect(() => {
    const handleClick = (e) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const select = (model) => {
    if (model.locked) {
      setOpen(false);
      openAuthModal();
      return;
    }

    const isDisabledByVision = hasAttachments && !model.supportsVision;
    const isDisabledByImageGen = hasImageGenActive && !model.supportsImageGen;
    
    if (!isDisabledByVision && !isDisabledByImageGen) {
      setSelectedModel(model);
      setOpen(false);
    }
  };

  const isSingle = modelList.length <= 1;

  let headerText = isGuest ? 'Sign in with Google to unlock all models' : 'Access top AI models';
  let footerNote = null;

  if (hasAttachments) {
    headerText = 'Vision models only';
    footerNote = 'Only vision-capable models are selectable while images are attached.';
  } else if (hasImageGenActive) {
    headerText = 'Image Generation models';
    footerNote = 'Only image generation models are selectable in this mode.';
  }

  return (
    <div className="model-selector-wrapper">
      <button
        ref={triggerRef}
        className={`version-selector model-selector-trigger ${isSingle ? 'single' : ''}`}
        onClick={() => !isSingle && setOpen(prev => !prev)}
        style={{ cursor: isSingle ? 'default' : 'pointer' }}
        type="button"
      >
        <Sparkles size={14} color="var(--brand-primary)" className="model-trigger-icon" />
        <span className="model-trigger-text">
          <span className="model-brand-prefix">SumanAI — </span>
          <span className="model-name-label">{selectedModel?.name || 'Model'}</span>
        </span>
        {!isSingle && <ChevronDown size={14} className={`chevron ${open ? 'rotated' : ''}`} />}
      </button>

      {open && typeof document !== 'undefined' && createPortal(
        <>
          <div 
            className="model-dropdown-backdrop" 
            onClick={() => setOpen(false)} 
            aria-hidden="true" 
          />
          <div 
            className="model-dropdown"
            ref={dropdownRef}
            style={{
              top: `${dropdownPos.top}px`,
              left: `${dropdownPos.left}px`,
              transform: dropdownPos.transform
            }}
          >
            <button
              type="button"
              className="model-dropdown-header"
              onClick={() => {
                if (isGuest) {
                  setOpen(false);
                  openAuthModal();
                }
              }}
            >
              <span>{headerText}</span>
              <ArrowRight size={16} />
            </button>

            <div className="model-list">
              {modelList.map(model => {
                const isDisabledByVision = hasAttachments && !model.supportsVision;
                const isDisabledByImageGen = hasImageGenActive && !model.supportsImageGen;
                const isDisabled = isDisabledByVision || isDisabledByImageGen;
                
                let badge = null;
                if (isDisabledByVision) {
                  badge = <span className="model-badge no-vision-badge"><ImageOff size={10} /> No Vision</span>;
                } else if (isDisabledByImageGen) {
                  badge = <span className="model-badge no-vision-badge"><ImageIcon size={10} /> No Image Gen</span>;
                } else if (model.locked) {
                  badge = <span className="model-badge" style={{ background: '#4285F4' }}>Unlock</span>;
                } else if (model.badge) {
                  badge = <span className="model-badge">{model.badge}</span>;
                }

                return (
                  <button
                    key={model.id}
                    className={`model-item ${selectedModel?.id === model.id ? 'selected' : ''} ${model.locked ? 'locked' : ''} ${isDisabled ? 'no-vision' : ''}`}
                    onClick={() => select(model)}
                    title={model.locked ? 'Click to sign in with Google and unlock this model' : isDisabled ? 'Not available in current mode' : model.name}
                    type="button"
                  >
                    <span className="model-item-icon"><model.icon /></span>
                    <span className="model-item-name">{model.name}</span>
                    {badge}
                    {model.locked && <Lock size={14} className="model-lock" />}
                  </button>
                );
              })}
            </div>

            {footerNote && (
              <div className="model-vision-note">
                {footerNote}
              </div>
            )}
          </div>
        </>,
        document.body
      )}
    </div>
  );
};

export default ModelSelector;

import React, { useState, useRef, useEffect, useLayoutEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Lock, ImageOff, Zap, Crown, Cpu, Check, ChevronRight, Lightbulb } from 'lucide-react';
import { useModel } from '../hooks/useModel';
import { MODEL_LIST } from '../constants/models';
import { useChatStore } from '../store/useChatStore';
import { useAuthStore } from '../store/useAuthStore';
import { adminService } from '../services/adminService';
import './ModelSelector.css';

const getModelSubtitle = (model) => {
  if (!model) return '';
  const id = model.id?.toLowerCase() || '';
  const badge = model.badge || '';

  if (id.includes('llama-3.1-8b') || badge.toLowerCase().includes('instant') || badge.toLowerCase().includes('ultra fast')) {
    return 'Fastest answers';
  }
  if (id.includes('llama-3.3-70b-instruct-fp8') || id.includes('llama-3.3-70b')) {
    return 'All-around help';
  }
  if (id.includes('deepseek') || badge.toLowerCase().includes('reasoning')) {
    return 'Advanced reasoning';
  }
  if (id.includes('qwen2.5-72b') || badge.toLowerCase().includes('coding')) {
    return 'Complex tasks';
  }
  if (model.supportsImageGen || id.includes('flux') || id.includes('grok-imagine')) {
    return badge || 'Image generation';
  }
  if (model.supportsVision || id.includes('vision') || id.includes('moondream')) {
    return badge || 'Visual analysis';
  }
  return badge || 'General intelligence';
};

const getCleanModelTitle = (name) => {
  if (!name) return 'Model';
  return name.replace(/^SumanAI\s*/i, '').trim();
};

const getModelBadge = (model) => {
  if (!model?.badge) return null;
  let badgeTypeClass = 'badge-general';
  const lowerBadge = String(model.badge || '').toLowerCase();
  if (model.supportsImageGen || lowerBadge.includes('image') || lowerBadge.includes('art') || lowerBadge.includes('studio') || lowerBadge.includes('compact') || lowerBadge.includes('render') || lowerBadge.includes('diffusion')) {
    badgeTypeClass = 'badge-image';
  } else if (model.supportsVision || lowerBadge.includes('vision') || lowerBadge.includes('visual')) {
    badgeTypeClass = 'badge-vision';
  } else if (lowerBadge.includes('reasoning') || lowerBadge.includes('logic') || lowerBadge.includes('think')) {
    badgeTypeClass = 'badge-reasoning';
  } else if (lowerBadge.includes('speed') || lowerBadge.includes('fast') || lowerBadge.includes('turbo') || lowerBadge.includes('instant')) {
    badgeTypeClass = 'badge-speed';
  } else if (lowerBadge.includes('flagship') || lowerBadge.includes('coding') || lowerBadge.includes('analysis') || lowerBadge.includes('precision') || lowerBadge.includes('versatile')) {
    badgeTypeClass = 'badge-flagship';
  }
  return <span className={`inline-model-badge ${badgeTypeClass}`}>{model.badge}</span>;
};

const ModelSelector = ({ variant = 'default', isCentered = false, deepThinking = false, onToggleThinking = null }) => {
  const { selectedModel, setSelectedModel, models, isPro: modelContextIsPro, isAdmin: modelContextIsAdmin } = useModel();
  const { openAuthModal, user } = useAuthStore();
  const isAdmin = Boolean(modelContextIsAdmin || adminService.checkIsAdmin(user));
  const hasProAccess = Boolean(modelContextIsPro || adminService.checkHasProAccess(user));
  const hasAttachments = useChatStore(state => state.hasAttachments);
  const hasImageGenActive = useChatStore(state => state.hasImageGenActive);
  const [open, setOpen] = useState(false);
  const [premiumToast, setPremiumToast] = useState(null);
  const toastTimeoutRef = useRef(null);
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);
  const [dropdownPos, setDropdownPos] = useState({ top: '58px', bottom: 'auto', left: '0px', transform: 'translateX(-50%)', maxHeight: '380px' });

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const showPremiumToast = (message, iconType = 'crown') => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setPremiumToast({ message, iconType });
    toastTimeoutRef.current = setTimeout(() => {
      setPremiumToast(null);
    }, 4000);
  };

  const modelList = models && models.length > 0 ? models : MODEL_LIST;

  const [tierTab, setTierTab] = useState(null);
  const activeTier = tierTab || (selectedModel?.tier === 'premium' ? 'premium' : 'free');

  const freeModels = useMemo(() => {
    return modelList.filter(m => (m.tier || 'free') === 'free');
  }, [modelList]);

  const premiumModels = useMemo(() => {
    return modelList.filter(m => m.tier === 'premium');
  }, [modelList]);

  const currentModels = activeTier === 'premium' ? premiumModels : freeModels;

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const isMobile = window.innerWidth <= 768;
    const isCenteredContainer = Boolean(isCentered || triggerRef.current?.closest('.input-container.is-centered'));
    const spaceAbove = rect.top;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpward = isCenteredContainer
      ? (spaceBelow < 220 && spaceAbove > spaceBelow)
      : (spaceBelow < 380 || spaceAbove > spaceBelow);
    const availableHeight = openUpward ? spaceAbove - 24 : spaceBelow - 24;
    const maxHeight = Math.min(Math.max(220, Math.floor(availableHeight)), 380);

    if (isMobile) {
      setDropdownPos({
        top: openUpward ? 'auto' : `${Math.round(rect.bottom + 8)}px`,
        bottom: openUpward ? `${Math.round(window.innerHeight - rect.top + 8)}px` : 'auto',
        left: `${Math.round(window.innerWidth / 2)}px`,
        transform: 'translateX(-50%)',
        maxHeight: `${maxHeight}px`
      });
    } else if (variant === 'inline') {
      const modalWidth = 320;
      let leftPos = rect.right - modalWidth;
      if (leftPos < 16) leftPos = 16;
      if (leftPos + modalWidth > window.innerWidth - 16) leftPos = window.innerWidth - modalWidth - 16;

      setDropdownPos({
        top: openUpward ? 'auto' : `${Math.round(rect.bottom + 8)}px`,
        bottom: openUpward ? `${Math.round(window.innerHeight - rect.top + 8)}px` : 'auto',
        left: `${leftPos}px`,
        transform: 'none',
        maxHeight: `${maxHeight}px`
      });
    } else {
      const dropdownWidth = 330;
      const minCenter = dropdownWidth / 2 + 16;
      const maxCenter = window.innerWidth - (dropdownWidth / 2) - 16;
      const centerLeft = Math.max(minCenter, Math.min(maxCenter, rect.left + rect.width / 2));
      const defaultMaxHeight = Math.min(500, Math.max(260, Math.floor(spaceBelow - 24)));

      setDropdownPos({
        top: `${Math.round(rect.bottom + 8)}px`,
        bottom: 'auto',
        left: `${Math.round(centerLeft)}px`,
        transform: 'translateX(-50%)',
        maxHeight: `${defaultMaxHeight}px`
      });
    }
  }, [variant, isCentered]);

  useLayoutEffect(() => {
    if (!open) return;
    const frameId = requestAnimationFrame(updatePosition);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open, updatePosition]);

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
    const isPremium = model.tier === 'premium';
    const isGoogleUser = Boolean(user && !user.isAnonymous);
    const isGuest = !isGoogleUser;

    if (isPremium) {
      if (isGuest && !hasProAccess && !isAdmin) {
        setOpen(false);
        showPremiumToast(
          "Please sign in with Google to unlock and use Premium AI models.",
          "lock"
        );
        openAuthModal();
        return;
      }

      if (model.locked && !hasProAccess && !isAdmin) {
        setOpen(false);
        showPremiumToast(
          `${model.name} is a Premium Pro model. Upgrade to Pro to access this model.`,
          "crown"
        );
        return;
      }

      showPremiumToast(
        `Switched to Premium Model: ${model.name}. Enhanced intelligence & high limits enabled.`,
        "crown"
      );
    }

    if (model.locked && !hasProAccess && !isAdmin) {
      setOpen(false);
      openAuthModal();
      return;
    }

    const isDisabledByVision = hasAttachments && !model.supportsVision;

    if (!isDisabledByVision) {
      if (model.supportsImageGen) {
        useChatStore.getState().setHasImageGenActive(true);
      } else if (hasImageGenActive) {
        useChatStore.getState().setHasImageGenActive(false);
      }
      setSelectedModel(model);
      setOpen(false);
    }
  };

  const isSingle = modelList.length <= 1;

  const handleToggle = () => {
    if (isSingle) return;
    if (!open) {
      updatePosition();
    }
    setOpen(prev => !prev);
  };

  let footerNote = null;
  if (hasAttachments) {
    footerNote = 'Only vision-capable models are selectable while images are attached.';
  }

  const isSelectedPremium = selectedModel?.tier === 'premium';
  const isInline = variant === 'inline';

  const shortModelName = useMemo(() => {
    if (!selectedModel?.name) return 'Model';
    const clean = selectedModel.name.replace(/^SumanAI\s*/i, '').trim();
    if (clean.length > 18) {
      return clean.slice(0, 16) + '…';
    }
    return clean;
  }, [selectedModel]);

  return (
    <div className={`model-selector-wrapper ${isInline ? 'wrapper-inline' : ''}`}>
      {isInline ? (
        <button
          ref={triggerRef}
          className={`inline-model-pill ${isSingle ? 'single' : ''} ${open ? 'active' : ''}`}
          onClick={handleToggle}
          style={{ cursor: isSingle ? 'default' : 'pointer' }}
          type="button"
          aria-haspopup="dialog"
          aria-expanded={open}
          title={`Current model: ${selectedModel?.name || 'Model'}. Click to switch.`}
        >
          <Cpu size={14} className="inline-model-icon" />
          <span className="inline-model-name">{shortModelName}</span>
          {!isSingle && <ChevronDown size={14} className={`chevron ${open ? 'rotated' : ''}`} />}
        </button>
      ) : (
        <button
          ref={triggerRef}
          className={`version-selector model-selector-trigger ${isSingle ? 'single' : ''} ${isSelectedPremium ? 'trigger-premium' : ''}`}
          onClick={handleToggle}
          style={{ cursor: isSingle ? 'default' : 'pointer' }}
          type="button"
          aria-haspopup="dialog"
          aria-expanded={open}
        >
          {isSelectedPremium ? (
            <Crown size={14} color="#D97706" className="model-trigger-icon" />
          ) : (
            <Cpu size={14} className="model-trigger-icon" />
          )}
          <span className="model-trigger-text">
            <span className="model-brand-prefix">SumanAI </span>
            <span className="model-name-label">{selectedModel?.name || 'Model'}</span>
          </span>
          {!isSingle && <ChevronDown size={14} className={`chevron ${open ? 'rotated' : ''}`} />}
        </button>
      )}

      {open && typeof document !== 'undefined' && createPortal(
        <>
          <div
            className="model-dropdown-backdrop"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          {isInline ? (
            <div
              className="inline-model-dropdown"
              ref={dropdownRef}
              style={{
                top: dropdownPos.top,
                bottom: dropdownPos.bottom,
                left: dropdownPos.left,
                transform: dropdownPos.transform,
                maxHeight: dropdownPos.maxHeight
              }}
            >
              <div className="inline-menu-header">Model Selection</div>
              <div className="inline-model-list">
                {modelList.map(model => {
                  const isSelected = model.id === selectedModel?.id;
                  const isDisabledByVision = hasAttachments && !model.supportsVision;
                  const isEffectivelyLocked = model.locked && !hasProAccess && !isAdmin;

                  return (
                    <button
                      key={model.id}
                      type="button"
                      className={`inline-menu-item ${isSelected ? 'selected' : ''} ${isDisabledByVision ? 'disabled' : ''}`}
                      onClick={() => {
                        if (isDisabledByVision) return;
                        select(model);
                      }}
                      disabled={isDisabledByVision}
                    >
                      <div className="inline-menu-icon-slot">
                        {isSelected ? (
                          <Check size={16} className="inline-menu-check" />
                        ) : isEffectivelyLocked ? (
                          <Lock size={14} className="inline-menu-lock" />
                        ) : null}
                      </div>
                      <div className="inline-menu-text-col">
                        <span className="inline-menu-title">{getCleanModelTitle(model.name)}</span>
                        <span className="inline-menu-sub">{getModelSubtitle(model)}</span>
                      </div>
                      {getModelBadge(model)}
                    </button>
                  );
                })}
              </div>

              <div className="inline-menu-divider" />

              <button
                type="button"
                className="inline-menu-footer-item"
                onClick={() => {
                  if (onToggleThinking) onToggleThinking();
                  setOpen(false);
                }}
              >
                <div className="inline-menu-icon-slot">
                  <Lightbulb size={15} className={deepThinking ? 'icon-thinking-active' : ''} />
                </div>
                <div className="inline-menu-text-col">
                  <span className="inline-menu-title">Thinking level</span>
                  <span className="inline-menu-sub">{deepThinking ? 'Deep reasoning active' : 'Standard'}</span>
                </div>
                <ChevronRight size={15} className="inline-menu-arrow" />
              </button>
            </div>
          ) : (
            <div
              className="model-dropdown"
              ref={dropdownRef}
              style={{
                top: dropdownPos.top,
                bottom: dropdownPos.bottom,
                left: dropdownPos.left,
                transform: dropdownPos.transform,
                maxHeight: dropdownPos.maxHeight
              }}
            >
              <div className="model-dropdown-sections" role="tablist" aria-label="Model Tiers">
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTier === 'free'}
                  className={`model-section-tab ${activeTier === 'free' ? 'active' : ''}`}
                  onClick={() => setTierTab('free')}
                >
                  <Zap size={13} className="section-tab-icon" />
                  <span>Free Models</span>
                  <span className="section-count-pill">{freeModels.length}</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTier === 'premium'}
                  className={`model-section-tab ${activeTier === 'premium' ? 'active' : ''} tab-premium`}
                  onClick={() => setTierTab('premium')}
                >
                  <Crown size={13} className="section-tab-icon crown-icon" />
                  <span>Premium Models</span>
                  <span className="section-count-pill">{premiumModels.length}</span>
                </button>
              </div>

              <div className="model-list">
                {activeTier === 'premium' && currentModels.length === 0 ? (
                  <div className="premium-placeholder-card">
                    <div className="premium-crown-wrap">
                      <Crown size={22} color="#F59E0B" />
                    </div>
                    <div className="premium-card-title">Premium Flagship Models</div>
                    <div className="premium-card-desc">
                      Ultra-fast inference, deep reasoning, and high-context frontier intelligence models are arriving soon.
                    </div>
                    <div className="premium-perks-row">
                      <span className="premium-perk-badge"><Cpu size={11} /> Flagship Intelligence</span>
                      <span className="premium-perk-badge"><Zap size={11} /> Priority Compute</span>
                      <span className="premium-perk-badge">Extended Context</span>
                    </div>
                  </div>
                ) : (
                  currentModels.map(model => {
                    const isDisabledByVision = hasAttachments && !model.supportsVision;
                    const isDisabled = isDisabledByVision;
                    const isEffectivelyLocked = model.locked && !hasProAccess && !isAdmin;

                    let badge = null;
                    if (isDisabledByVision) {
                      badge = <span className="model-badge no-vision-badge"><ImageOff size={10} /> No Vision</span>;
                    } else if (isEffectivelyLocked) {
                      const isProLock = model.lockReason === 'pro_required';
                      badge = (
                        <span
                          className="model-badge"
                          style={{
                            background: isProLock ? 'rgba(245, 158, 11, 0.2)' : '#4285F4',
                            color: isProLock ? '#FBBF24' : '#FFFFFF',
                            border: isProLock ? '1px solid rgba(245, 158, 11, 0.4)' : 'none'
                          }}
                        >
                          {isProLock ? 'PRO' : 'Unlock'}
                        </span>
                      );
                    } else if (model.badge) {
                      let badgeTypeClass = 'badge-general';
                      const lowerBadge = String(model.badge || '').toLowerCase();
                      if (model.supportsImageGen || lowerBadge.includes('image') || lowerBadge.includes('art') || lowerBadge.includes('studio') || lowerBadge.includes('compact') || lowerBadge.includes('render') || lowerBadge.includes('diffusion')) {
                        badgeTypeClass = 'badge-image';
                      } else if (model.supportsVision || lowerBadge.includes('vision') || lowerBadge.includes('visual')) {
                        badgeTypeClass = 'badge-vision';
                      } else if (lowerBadge.includes('reasoning') || lowerBadge.includes('logic') || lowerBadge.includes('think')) {
                        badgeTypeClass = 'badge-reasoning';
                      } else if (lowerBadge.includes('speed') || lowerBadge.includes('fast') || lowerBadge.includes('turbo') || lowerBadge.includes('instant')) {
                        badgeTypeClass = 'badge-speed';
                      } else if (lowerBadge.includes('flagship') || lowerBadge.includes('coding') || lowerBadge.includes('analysis') || lowerBadge.includes('precision') || lowerBadge.includes('versatile')) {
                        badgeTypeClass = 'badge-flagship';
                      }
                      badge = <span className={`model-badge ${badgeTypeClass}`}>{model.badge}</span>;
                    }

                    return (
                      <button
                        key={model.id}
                        className={`model-item ${selectedModel?.id === model.id ? 'selected' : ''} ${isEffectivelyLocked ? 'locked' : ''} ${isDisabled ? 'no-vision' : ''} ${model.tier === 'premium' ? 'model-item-premium' : ''}`}
                        onClick={() => select(model)}
                        title={isEffectivelyLocked ? 'Click to sign in with Google and unlock this model' : isDisabled ? 'Not available in current mode' : model.name}
                        type="button"
                      >
                        <span className="model-item-icon"><model.icon /></span>
                        <span className="model-item-name">{model.name}</span>
                        {badge}
                        {isEffectivelyLocked && <Lock size={14} className="model-lock" />}
                      </button>
                    );
                  })
                )}
              </div>

              {footerNote && (
                <div className="model-vision-note">
                  {footerNote}
                </div>
              )}
            </div>
          )}
        </>,
        document.body
      )}

      {premiumToast && typeof document !== 'undefined' && createPortal(
        <div className="vision-toast model-premium-toast" role="status" aria-live="polite">
          <div className="vision-toast-content">
            {premiumToast.iconType === 'lock' ? (
              <Lock size={15} className="premium-toast-icon" />
            ) : (
              <Crown size={15} className="premium-toast-icon" />
            )}
            <span>{premiumToast.message}</span>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default ModelSelector;

import React, { useState, useRef, useEffect, useLayoutEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Lock, ImageOff, Image as ImageIcon, Zap, Crown, Cpu } from 'lucide-react';
import { useModel } from '../hooks/useModel';
import { MODEL_LIST } from '../constants/models';
import { useChatStore } from '../store/useChatStore';
import { useAuthStore } from '../store/useAuthStore';
import { adminService } from '../services/adminService';
import './ModelSelector.css';

const ModelSelector = () => {
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
  const [dropdownPos, setDropdownPos] = useState({ top: 58, left: 0, transform: 'translateX(-50%)' });

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
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
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
    const isDisabledByImageGen = hasImageGenActive && !model.supportsImageGen;

    if (!isDisabledByVision && !isDisabledByImageGen) {
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
  } else if (hasImageGenActive) {
    footerNote = 'Only image generation models are selectable in this mode.';
  }

  const isSelectedPremium = selectedModel?.tier === 'premium';

  return (
    <div className="model-selector-wrapper">
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
                  const isDisabledByImageGen = hasImageGenActive && !model.supportsImageGen;
                  const isDisabled = isDisabledByVision || isDisabledByImageGen;
                  const isEffectivelyLocked = model.locked && !hasProAccess && !isAdmin;

                  let badge = null;
                  if (isDisabledByVision) {
                    badge = <span className="model-badge no-vision-badge"><ImageOff size={10} /> No Vision</span>;
                  } else if (isDisabledByImageGen) {
                    badge = <span className="model-badge no-vision-badge"><ImageIcon size={10} /> No Image Gen</span>;
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
                    badge = <span className={`model-badge ${model.tier === 'premium' ? 'premium-model-badge' : ''}`}>{model.badge}</span>;
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

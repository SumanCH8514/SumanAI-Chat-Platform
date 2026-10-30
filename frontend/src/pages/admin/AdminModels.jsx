import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Cpu,
  User,
  Users,
  Crown,
  CheckCircle2,
  AlertCircle,
  Save,
  RotateCcw,
  Eye,
  Zap,
  Lock,
  Unlock,
  Sliders
} from 'lucide-react';
import { MODEL_LIST } from '../../constants/models';
import { adminService } from '../../services/adminService';
import './AdminModels.css';

export const AdminModels = () => {
  const [activeTier, setActiveTier] = useState('guest');
  const [governance, setGovernance] = useState(null);
  const [draftConfig, setDraftConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg, isError = false) => {
    setToastMessage({ text: msg, isError });
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const config = await adminService.getGovernanceConfig();
        setGovernance(config);
        setDraftConfig(JSON.parse(JSON.stringify(config)));
      } catch {
        showToast('Failed to load governance configuration', true);
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const isDirty = JSON.stringify(governance) !== JSON.stringify(draftConfig);

  const handleToggleModelForTier = (modelId, tier) => {
    if (!draftConfig) return;
    setDraftConfig((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      const currentList = next.tiers[tier].allowedModelIds || [];
      if (currentList.includes(modelId)) {
        if (currentList.length <= 1) {
          showToast(`At least one model must remain active for the ${tier} tier`, true);
          return prev;
        }
        next.tiers[tier].allowedModelIds = currentList.filter((id) => id !== modelId);
        if (next.tiers[tier].defaultModelId === modelId) {
          next.tiers[tier].defaultModelId = next.tiers[tier].allowedModelIds[0];
        }
      } else {
        next.tiers[tier].allowedModelIds = [...currentList, modelId];
      }
      return next;
    });
  };

  const handleTogglePremiumModel = (modelId) => {
    if (!draftConfig) return;
    setDraftConfig((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      const currentPremiums = next.tiers.pro.premiumModelIds || [];
      if (currentPremiums.includes(modelId)) {
        next.tiers.pro.premiumModelIds = currentPremiums.filter((id) => id !== modelId);
      } else {
        next.tiers.pro.premiumModelIds = [...currentPremiums, modelId];
      }
      return next;
    });
  };

  const handleMaxModelsChange = (tier, count) => {
    const num = Math.max(1, Math.min(25, parseInt(count, 10) || 1));
    setDraftConfig((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      next.tiers[tier].maxSelectableModels = num;
      return next;
    });
  };

  const handleSetDefaultModel = (tier, modelId) => {
    setDraftConfig((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      next.tiers[tier].defaultModelId = modelId;
      return next;
    });
  };

  const handleSave = async () => {
    if (!draftConfig) return;
    setSaving(true);
    try {
      const saved = await adminService.saveGovernanceConfig(draftConfig);
      setGovernance(JSON.parse(JSON.stringify(saved)));
      setDraftConfig(JSON.parse(JSON.stringify(saved)));
      showToast('AI Model Governance policy updated successfully');
    } catch {
      showToast('Failed to save governance configuration', true);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (!governance) return;
    setDraftConfig(JSON.parse(JSON.stringify(governance)));
    showToast('Changes discarded');
  };

  if (loading || !draftConfig) {
    return (
      <div className="admin-page-loading">
        <div className="admin-loader-spinner" />
        <span>Loading model governance rules...</span>
      </div>
    );
  }

  const currentTierConfig = draftConfig.tiers[activeTier];
  const allowedModelIds = currentTierConfig?.allowedModelIds || [];
  const premiumModelIds = draftConfig.tiers.pro?.premiumModelIds || [];

  return (
    <div className="admin-models-wrap">
      {toastMessage &&
        createPortal(
          <div className={`admin-toast ${toastMessage.isError ? 'toast-error' : ''}`}>
            {toastMessage.isError ? (
              <AlertCircle size={16} color="#EF4444" />
            ) : (
              <CheckCircle2 size={16} color="#10B981" />
            )}
            <span>{toastMessage.text}</span>
          </div>,
          document.body
        )}

      {isDirty && (
        <div className="admin-dirty-bar">
          <div className="admin-dirty-info">
            <AlertCircle size={15} color="#FBBF24" />
            <span>Unsaved governance configuration changes pending publication</span>
          </div>
          <div className="admin-dirty-actions">
            <button
              type="button"
              className="admin-secondary-btn"
              onClick={handleReset}
              disabled={saving}
            >
              <RotateCcw size={14} />
              <span>Discard</span>
            </button>
            <button
              type="button"
              className="admin-primary-save-btn"
              onClick={handleSave}
              disabled={saving}
            >
              <Save size={14} />
              <span>{saving ? 'Publishing...' : 'Save & Publish Changes'}</span>
            </button>
          </div>
        </div>
      )}

      <div className="admin-page-title-row">
        <div>
          <h1 className="admin-page-heading">AI Model Governance</h1>
          <p className="admin-page-sub">
            Control which models are visible and usable per audience tier, and designate flagship models as Pro Premium.
          </p>
        </div>
        {!isDirty && (
          <button
            type="button"
            className="admin-primary-save-btn"
            onClick={handleSave}
            disabled={saving}
          >
            <Save size={14} />
            <span>Save Configuration</span>
          </button>
        )}
      </div>

      <div className="admin-tier-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTier === 'guest'}
          className={`admin-tier-tab ${activeTier === 'guest' ? 'active' : ''}`}
          onClick={() => setActiveTier('guest')}
        >
          <User size={15} />
          <span className="tab-label-full">Guest / Non-Login Users</span>
          <span className="tab-label-short">Guest</span>
          <span className="admin-tab-count">{draftConfig.tiers.guest.allowedModelIds.length}</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTier === 'free'}
          className={`admin-tier-tab ${activeTier === 'free' ? 'active' : ''}`}
          onClick={() => setActiveTier('free')}
        >
          <Users size={15} />
          <span className="tab-label-full">Logged-in Free Users</span>
          <span className="tab-label-short">Free</span>
          <span className="admin-tab-count">{draftConfig.tiers.free.allowedModelIds.length}</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTier === 'pro'}
          className={`admin-tier-tab tab-pro-tier ${activeTier === 'pro' ? 'active' : ''}`}
          onClick={() => setActiveTier('pro')}
        >
          <Crown size={15} color="#F59E0B" />
          <span className="tab-label-full">Pro / Premium Members</span>
          <span className="tab-label-short">Pro</span>
          <span className="admin-tab-count pro-pill">{draftConfig.tiers.pro.allowedModelIds.length}</span>
        </button>
      </div>

      <div className="admin-tier-settings-panel">
        <div className="admin-panel-header">
          <div>
            <h3 className="admin-panel-title">
              {activeTier === 'guest' && 'Guest Session Policy'}
              {activeTier === 'free' && 'Authenticated Free User Policy'}
              {activeTier === 'pro' && 'Pro / Premium Tier Policy'}
            </h3>
            <p className="admin-panel-desc">
              {activeTier === 'guest' &&
                'Configure models available to visitors before sign in. Unselected models will display a lock icon requiring Google authentication.'}
              {activeTier === 'free' &&
                'Configure models unlocked for standard Google login accounts. Any model marked as Premium will be locked behind the Pro badge.'}
              {activeTier === 'pro' &&
                'Configure models accessible to Pro tier subscribers and designate which models are classified as Premium flagship AI.'}
            </p>
          </div>

          <div className="admin-tier-controls-row">
            <div className="admin-control-item">
              <label className="admin-control-label">Max Selectable Models</label>
              <input
                type="number"
                min="1"
                max="25"
                className="admin-num-input"
                value={currentTierConfig.maxSelectableModels}
                onChange={(e) => handleMaxModelsChange(activeTier, e.target.value)}
              />
            </div>

            <div className="admin-control-item">
              <label className="admin-control-label">Default Model</label>
              <select
                className="admin-select"
                value={currentTierConfig.defaultModelId}
                onChange={(e) => handleSetDefaultModel(activeTier, e.target.value)}
              >
                {allowedModelIds.map((id) => {
                  const m = MODEL_LIST.find((item) => item.id === id);
                  return (
                    <option key={id} value={id}>
                      {m?.name || id}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        </div>

        <div className="admin-models-matrix-grid">
          {MODEL_LIST.map((model) => {
            const isAllowed = allowedModelIds.includes(model.id);
            const isDefault = currentTierConfig.defaultModelId === model.id;
            const isPremium = premiumModelIds.includes(model.id);
            const Icon = model.icon;

            return (
              <div
                key={model.id}
                className={`admin-model-matrix-card ${isAllowed ? 'model-active' : 'model-disabled'} ${
                  isPremium ? 'model-is-premium' : ''
                }`}
              >
                <div className="admin-model-card-top">
                  <div className="admin-model-identity">
                    <div className="admin-model-icon-box">
                      <Icon />
                    </div>
                    <div>
                      <div className="admin-model-name-row">
                        <span className="admin-model-card-name">{model.name}</span>
                        {isDefault && <span className="admin-default-tag">Default</span>}
                      </div>
                      <span className="admin-model-card-id">{model.id}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className={`admin-switch-btn ${isAllowed ? 'switch-on' : 'switch-off'}`}
                    onClick={() => handleToggleModelForTier(model.id, activeTier)}
                    title={isAllowed ? 'Click to disable for this tier' : 'Click to enable for this tier'}
                  >
                    {isAllowed ? <Unlock size={14} /> : <Lock size={14} />}
                    <span>{isAllowed ? 'Active' : 'Locked'}</span>
                  </button>
                </div>

                <div className="admin-model-capabilities">
                  {model.supportsVision && (
                    <span className="admin-cap-badge cap-vision">
                      <Eye size={11} /> Vision
                    </span>
                  )}
                  {model.badge && model.badge.toLowerCase() !== 'vision' && (
                    <span className="admin-cap-badge">{model.badge}</span>
                  )}
                  <span className="admin-cap-badge">
                    <Zap size={11} /> High Speed
                  </span>
                </div>

                <div className="admin-model-card-footer">
                  <div className="admin-tier-status-text">
                    {isAllowed ? (
                      <span className="status-unlocked">
                        <CheckCircle2 size={12} color="#10B981" /> Unlocked in {activeTier.toUpperCase()}
                      </span>
                    ) : (
                      <span className="status-locked">
                        <Lock size={12} color="#EF4444" /> Locked in {activeTier.toUpperCase()}
                      </span>
                    )}
                  </div>

                  {activeTier === 'pro' && (
                    <button
                      type="button"
                      className={`admin-premium-toggle-btn ${isPremium ? 'premium-active' : ''}`}
                      onClick={() => handleTogglePremiumModel(model.id)}
                      title="Flagship models appear under the Premium tab with a Crown icon"
                    >
                      <Crown size={12} color={isPremium ? '#F59E0B' : '#94A3B8'} />
                      <span>{isPremium ? 'Premium Model' : 'Standard Model'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdminModels;


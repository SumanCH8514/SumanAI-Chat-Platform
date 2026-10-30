import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  User,
  Users,
  Crown,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Zap,
  Clock,
  ShieldAlert,
  Image as ImageIcon
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import './AdminQuotas.css';

export const AdminQuotas = () => {
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
        showToast('Failed to load tier quotas', true);
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const isDirty = JSON.stringify(governance) !== JSON.stringify(draftConfig);

  const handleQuotaChange = (tier, field, value) => {
    const num = Math.max(1, parseInt(value, 10) || 1);
    setDraftConfig((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      if (!next.tiers[tier].rateLimit) {
        next.tiers[tier].rateLimit = {};
      }
      next.tiers[tier].rateLimit[field] = num;
      return next;
    });
  };

  const handleImageLimitChange = (tier, value) => {
    const num = parseInt(value, 10);
    setDraftConfig((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      next.tiers[tier].imageGenLimit = isNaN(num) ? 0 : num;
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
      showToast('Tier request quotas updated successfully');
    } catch {
      showToast('Failed to save quota policy', true);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (!governance) return;
    setDraftConfig(JSON.parse(JSON.stringify(governance)));
    showToast('Changes reverted');
  };

  if (loading || !draftConfig) {
    return (
      <div className="admin-page-loading">
        <div className="admin-loader-spinner" />
        <span>Loading tier quota policies...</span>
      </div>
    );
  }

  const { guest, free, pro } = draftConfig.tiers;

  return (
    <div className="admin-quotas-wrap">
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
            <span>Unsaved tier quota limit modifications</span>
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
              <span>{saving ? 'Publishing...' : 'Save & Enforce Quotas'}</span>
            </button>
          </div>
        </div>
      )}

      <div className="admin-page-title-row">
        <div>
          <h1 className="admin-page-heading">Tier Request Quotas & Limits</h1>
          <p className="admin-page-sub">
            Configure hourly and daily prompt budgets per user tier to control compute consumption and enforce fair usage.
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

      <div className="admin-quotas-cards-grid">
        <div className="admin-quota-tier-card quota-guest">
          <div className="admin-quota-card-head">
            <div className="admin-tier-badge-icon guest-icon-box">
              <User size={20} color="#94A3B8" />
            </div>
            <div>
              <h3 className="admin-quota-tier-title">Guest / Non-Login Tier</h3>
              <p className="admin-quota-tier-sub">Unauthenticated public visitors (IP-tracked)</p>
            </div>
          </div>

          <div className="admin-quota-sliders-group">
            <div className="admin-slider-row">
              <div className="admin-slider-label-row">
                <span className="admin-slider-title">
                  <Clock size={14} /> Hourly Request Limit
                </span>
                <span className="admin-slider-val-badge">
                  {guest?.rateLimit?.requestsPerHour || 20} req / hr
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="100"
                step="5"
                className="admin-range-slider"
                value={guest?.rateLimit?.requestsPerHour || 20}
                onChange={(e) => handleQuotaChange('guest', 'requestsPerHour', e.target.value)}
              />
              <div className="admin-slider-scale">
                <span>5 / hr</span>
                <span>50 / hr</span>
                <span>100 / hr</span>
              </div>
            </div>

            <div className="admin-slider-row">
              <div className="admin-slider-label-row">
                <span className="admin-slider-title">
                  <Zap size={14} /> Daily Request Limit
                </span>
                <span className="admin-slider-val-badge">
                  {guest?.rateLimit?.requestsPerDay || 50} req / day
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="300"
                step="10"
                className="admin-range-slider"
                value={guest?.rateLimit?.requestsPerDay || 50}
                onChange={(e) => handleQuotaChange('guest', 'requestsPerDay', e.target.value)}
              />
              <div className="admin-slider-scale">
                <span>10 / day</span>
                <span>150 / day</span>
                <span>300 / day</span>
              </div>
            </div>

            <div className="admin-slider-row">
              <div className="admin-slider-label-row">
                <span className="admin-slider-title">
                  <ImageIcon size={14} /> Daily Image Generations
                </span>
                <span className="admin-slider-val-badge">
                  {(guest?.imageGenLimit ?? 0) === 0 ? 'Disabled (0 / day)' : `${guest?.imageGenLimit} img / day`}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="20"
                step="1"
                className="admin-range-slider"
                value={guest?.imageGenLimit ?? 0}
                onChange={(e) => handleImageLimitChange('guest', e.target.value)}
              />
              <div className="admin-slider-scale">
                <span>0 (Disabled)</span>
                <span>10 / day</span>
                <span>20 / day</span>
              </div>
            </div>
          </div>

          <div className="admin-quota-card-foot">
            <ShieldAlert size={14} color="#64748B" />
            <span>IP-based throttling prevents bot scraping and abuse</span>
          </div>
        </div>

        <div className="admin-quota-tier-card quota-free">
          <div className="admin-quota-card-head">
            <div className="admin-tier-badge-icon free-icon-box">
              <Users size={20} color="#60A5FA" />
            </div>
            <div>
              <h3 className="admin-quota-tier-title">Logged-in Free Tier</h3>
              <p className="admin-quota-tier-sub">Authenticated Google accounts (UID-tracked)</p>
            </div>
          </div>

          <div className="admin-quota-sliders-group">
            <div className="admin-slider-row">
              <div className="admin-slider-label-row">
                <span className="admin-slider-title">
                  <Clock size={14} /> Hourly Request Limit
                </span>
                <span className="admin-slider-val-badge">
                  {free?.rateLimit?.requestsPerHour || 100} req / hr
                </span>
              </div>
              <input
                type="range"
                min="20"
                max="300"
                step="10"
                className="admin-range-slider"
                value={free?.rateLimit?.requestsPerHour || 100}
                onChange={(e) => handleQuotaChange('free', 'requestsPerHour', e.target.value)}
              />
              <div className="admin-slider-scale">
                <span>20 / hr</span>
                <span>150 / hr</span>
                <span>300 / hr</span>
              </div>
            </div>

            <div className="admin-slider-row">
              <div className="admin-slider-label-row">
                <span className="admin-slider-title">
                  <Zap size={14} /> Daily Request Limit
                </span>
                <span className="admin-slider-val-badge">
                  {free?.rateLimit?.requestsPerDay || 300} req / day
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="1000"
                step="25"
                className="admin-range-slider"
                value={free?.rateLimit?.requestsPerDay || 300}
                onChange={(e) => handleQuotaChange('free', 'requestsPerDay', e.target.value)}
              />
              <div className="admin-slider-scale">
                <span>50 / day</span>
                <span>500 / day</span>
                <span>1,000 / day</span>
              </div>
            </div>

            <div className="admin-slider-row">
              <div className="admin-slider-label-row">
                <span className="admin-slider-title">
                  <ImageIcon size={14} /> Daily Image Generations
                </span>
                <span className="admin-slider-val-badge">
                  {free?.imageGenLimit ?? 5} img / day
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                step="1"
                className="admin-range-slider"
                value={free?.imageGenLimit ?? 5}
                onChange={(e) => handleImageLimitChange('free', e.target.value)}
              />
              <div className="admin-slider-scale">
                <span>0</span>
                <span>25 / day</span>
                <span>50 / day</span>
              </div>
            </div>
          </div>

          <div className="admin-quota-card-foot">
            <ShieldAlert size={14} color="#60A5FA" />
            <span>Provides high quality access while incentivizing Pro upgrade</span>
          </div>
        </div>

        <div className="admin-quota-tier-card quota-pro">
          <div className="admin-quota-card-head">
            <div className="admin-tier-badge-icon pro-icon-box">
              <Crown size={20} color="#F59E0B" />
            </div>
            <div>
              <h3 className="admin-quota-tier-title">Pro / Premium Member Tier</h3>
              <p className="admin-quota-tier-sub">Subscribed Pro users with highest priority compute</p>
            </div>
          </div>

          <div className="admin-quota-sliders-group">
            <div className="admin-slider-row">
              <div className="admin-slider-label-row">
                <span className="admin-slider-title">
                  <Clock size={14} /> Hourly Request Limit
                </span>
                <span className="admin-slider-val-badge badge-pro">
                  {pro?.rateLimit?.requestsPerHour || 500} req / hr
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="1500"
                step="50"
                className="admin-range-slider pro-slider"
                value={pro?.rateLimit?.requestsPerHour || 500}
                onChange={(e) => handleQuotaChange('pro', 'requestsPerHour', e.target.value)}
              />
              <div className="admin-slider-scale">
                <span>50 / hr</span>
                <span>750 / hr</span>
                <span>1,500 / hr</span>
              </div>
            </div>

            <div className="admin-slider-row">
              <div className="admin-slider-label-row">
                <span className="admin-slider-title">
                  <Zap size={14} /> Daily Request Limit
                </span>
                <span className="admin-slider-val-badge badge-pro">
                  {pro?.rateLimit?.requestsPerDay || 2000} req / day
                </span>
              </div>
              <input
                type="range"
                min="200"
                max="5000"
                step="100"
                className="admin-range-slider pro-slider"
                value={pro?.rateLimit?.requestsPerDay || 2000}
                onChange={(e) => handleQuotaChange('pro', 'requestsPerDay', e.target.value)}
              />
              <div className="admin-slider-scale">
                <span>200 / day</span>
                <span>2,500 / day</span>
                <span>5,000 / day</span>
              </div>
            </div>

            <div className="admin-slider-row">
              <div className="admin-slider-label-row">
                <span className="admin-slider-title">
                  <ImageIcon size={14} /> Daily Image Generations
                </span>
                <span className="admin-slider-val-badge badge-pro">
                  {(pro?.imageGenLimit ?? -1) === -1 ? 'Unlimited' : `${pro?.imageGenLimit} img / day`}
                </span>
              </div>
              <input
                type="range"
                min="-1"
                max="200"
                step="1"
                className="admin-range-slider pro-slider"
                value={pro?.imageGenLimit ?? -1}
                onChange={(e) => handleImageLimitChange('pro', e.target.value)}
              />
              <div className="admin-slider-scale">
                <span>Unlimited (-1)</span>
                <span>100 / day</span>
                <span>200 / day</span>
              </div>
            </div>
          </div>

          <div className="admin-quota-card-foot">
            <Crown size={14} color="#F59E0B" />
            <span>High-frequency allowance for power users and coding workflows</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminQuotas;


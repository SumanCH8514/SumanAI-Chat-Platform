import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Layers,
  Download,
  Save,
  User,
  Users,
  Crown,
  Zap,
  Image as ImageIcon,
  Search,
  Plus,
  Pencil,
  MoreVertical,
  MessageSquare,
  LayoutTemplate,
  CheckCircle2,
  AlertCircle,
  X,
  Copy,
  RotateCcw
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import './AdminQuotas.css';

export const AdminQuotas = () => {
  const [governance, setGovernance] = useState(null);
  const [draftConfig, setDraftConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortAsc, setSortAsc] = useState(true);
  const [activeModal, setActiveModal] = useState(null);
  const [activeMenuTier, setActiveMenuTier] = useState(null);
  const [tierFormData, setTierFormData] = useState({
    key: 'guest',
    name: '',
    description: '',
    requestsPerHour: 20,
    requestsPerDay: 50,
    imageGenLimit: 0,
    videoGenLimit: 0,
    status: 'Active'
  });
  const [contextFormData, setContextFormData] = useState({
    maxConversationMessages: 100,
    slidingContextWindow: 50
  });

  const showToast = (text, isError = false) => {
    setToastMessage({ text, isError });
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

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.admin-row-menu-wrap')) {
        setActiveMenuTier(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const isDirty = JSON.stringify(governance) !== JSON.stringify(draftConfig);

  const getTiersList = () => {
    if (!draftConfig || !draftConfig.tiers) return [];
    const guest = draftConfig.tiers.guest || {};
    const free = draftConfig.tiers.free || {};
    const pro = draftConfig.tiers.pro || {};

    const list = [
      {
        key: 'guest',
        name: 'Guest / Non-Login',
        description: 'Unauthenticated public visitors (IP-tracked)',
        icon: User,
        iconBoxClass: 'quota-icon-purple',
        iconColor: 'var(--brand-primary)',
        hourlyLimit: guest.rateLimit?.requestsPerHour ?? 20,
        dailyLimit: guest.rateLimit?.requestsPerDay ?? 50,
        imageGenLimit: guest.imageGenLimit ?? 0,
        videoGenLimit: guest.videoGenLimit ?? 0,
        status: 'Active'
      },
      {
        key: 'free',
        name: 'Logged-in Free',
        description: 'Authenticated Google accounts (UID-tracked)',
        icon: Users,
        iconBoxClass: 'quota-icon-blue',
        iconColor: '#2563eb',
        hourlyLimit: free.rateLimit?.requestsPerHour ?? 100,
        dailyLimit: free.rateLimit?.requestsPerDay ?? 300,
        imageGenLimit: free.imageGenLimit ?? 5,
        videoGenLimit: free.videoGenLimit ?? 2,
        status: 'Active'
      },
      {
        key: 'pro',
        name: 'Pro / Premium',
        description: 'Subscribed Pro users with highest priority compute',
        icon: Crown,
        iconBoxClass: 'quota-icon-amber',
        iconColor: '#d97706',
        hourlyLimit: pro.rateLimit?.requestsPerHour ?? 500,
        dailyLimit: pro.rateLimit?.requestsPerDay ?? 2000,
        imageGenLimit: pro.imageGenLimit === -1 ? 99 : (pro.imageGenLimit ?? 99),
        videoGenLimit: pro.videoGenLimit ?? 5,
        status: 'Active'
      }
    ];

    let filtered = list;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = list.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q)
      );
    }

    return filtered.sort((a, b) => {
      const cmp = a.name.localeCompare(b.name);
      return sortAsc ? cmp : -cmp;
    });
  };

  const handleSave = async () => {
    if (!draftConfig) return;
    setSaving(true);
    try {
      const saved = await adminService.saveGovernanceConfig(draftConfig);
      setGovernance(JSON.parse(JSON.stringify(saved)));
      setDraftConfig(JSON.parse(JSON.stringify(saved)));
      showToast('Tier request quotas and limits saved successfully');
    } catch {
      showToast('Failed to save quota policy', true);
    } finally {
      setSaving(false);
    }
  };

  const handleExportConfig = () => {
    if (!draftConfig) return;
    try {
      const jsonStr = JSON.stringify(draftConfig, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sumanai-quotas-config-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Configuration exported successfully');
    } catch {
      showToast('Export failed', true);
    }
  };

  const handleOpenEditTier = (tier) => {
    setTierFormData({
      key: tier.key,
      name: tier.name,
      description: tier.description,
      requestsPerHour: tier.hourlyLimit,
      requestsPerDay: tier.dailyLimit,
      imageGenLimit: tier.imageGenLimit,
      videoGenLimit: tier.videoGenLimit,
      status: tier.status
    });
    setActiveModal('editTier');
    setActiveMenuTier(null);
  };

  const handleSaveTierModal = (e) => {
    e.preventDefault();
    const key = tierFormData.key;
    const reqHour = Math.max(1, parseInt(tierFormData.requestsPerHour, 10) || 1);
    const reqDay = Math.max(1, parseInt(tierFormData.requestsPerDay, 10) || 1);
    const imgLimit = parseInt(tierFormData.imageGenLimit, 10);
    const vidLimit = parseInt(tierFormData.videoGenLimit, 10);

    setDraftConfig((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      if (!next.tiers[key]) {
        next.tiers[key] = { rateLimit: {} };
      }
      if (!next.tiers[key].rateLimit) {
        next.tiers[key].rateLimit = {};
      }
      next.tiers[key].rateLimit.requestsPerHour = reqHour;
      next.tiers[key].rateLimit.requestsPerDay = reqDay;
      next.tiers[key].imageGenLimit = isNaN(imgLimit) ? 0 : imgLimit;
      next.tiers[key].videoGenLimit = isNaN(vidLimit) ? 0 : vidLimit;
      return next;
    });

    setActiveModal(null);
    showToast(`Tier ${tierFormData.name} quotas updated in draft`);
  };

  const handleOpenEditContext = () => {
    setContextFormData({
      maxConversationMessages: draftConfig.systemLimits?.maxConversationMessages || 100,
      slidingContextWindow: draftConfig.systemLimits?.slidingContextWindow || 50
    });
    setActiveModal('editContext');
  };

  const handleSaveContextModal = (e) => {
    e.preventDefault();
    const maxMsgs = Math.max(10, parseInt(contextFormData.maxConversationMessages, 10) || 100);
    const windowMsgs = Math.max(5, parseInt(contextFormData.slidingContextWindow, 10) || 50);

    setDraftConfig((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      if (!next.systemLimits) {
        next.systemLimits = {};
      }
      next.systemLimits.maxConversationMessages = maxMsgs;
      next.systemLimits.slidingContextWindow = windowMsgs;
      return next;
    });

    setActiveModal(null);
    showToast('Conversation context limits updated in draft');
  };

  const handleCopyTierSpecs = (tier) => {
    const specs = JSON.stringify(tier, null, 2);
    navigator.clipboard.writeText(specs);
    setActiveMenuTier(null);
    showToast(`Copied ${tier.name} specs to clipboard`);
  };

  const handleResetTierToDefault = (tierKey) => {
    if (!governance || !governance.tiers || !governance.tiers[tierKey]) return;
    setDraftConfig((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      next.tiers[tierKey] = JSON.parse(JSON.stringify(governance.tiers[tierKey]));
      return next;
    });
    setActiveMenuTier(null);
    showToast(`Reset ${tierKey} to saved limits`);
  };

  if (loading || !draftConfig) {
    return (
      <div className="admin-page-loading">
        <div className="admin-loader-spinner" />
        <span>Loading tier quota policies...</span>
      </div>
    );
  }

  const tiersList = getTiersList();

  const totalHourly = (draftConfig.tiers?.guest?.rateLimit?.requestsPerHour || 20) +
    (draftConfig.tiers?.free?.rateLimit?.requestsPerHour || 100) +
    (draftConfig.tiers?.pro?.rateLimit?.requestsPerHour || 500);

  const totalDaily = (draftConfig.tiers?.guest?.rateLimit?.requestsPerDay || 50) +
    (draftConfig.tiers?.free?.rateLimit?.requestsPerDay || 300) +
    (draftConfig.tiers?.pro?.rateLimit?.requestsPerDay || 2000);

  const proImg = draftConfig.tiers?.pro?.imageGenLimit === -1 ? 99 : (draftConfig.tiers?.pro?.imageGenLimit ?? 99);
  const totalImg = (draftConfig.tiers?.guest?.imageGenLimit || 0) +
    (draftConfig.tiers?.free?.imageGenLimit || 5) +
    proImg;

  const maxHistory = draftConfig.systemLimits?.maxConversationMessages || 100;
  const slidingWindow = draftConfig.systemLimits?.slidingContextWindow || 50;

  return (
    <div className="admin-quotas-view">
      {toastMessage &&
        createPortal(
          <div className={`admin-toast ${toastMessage.isError ? 'toast-error' : ''}`}>
            {toastMessage.isError ? (
              <AlertCircle size={16} color="#ef4444" />
            ) : (
              <CheckCircle2 size={16} color="#10b981" />
            )}
            <span>{toastMessage.text}</span>
          </div>,
          document.body
        )}

      <div className="admin-page-title-row">
        <div className="page-title-with-icon">
          <div className="admin-header-icon-box">
            <Layers size={22} color="var(--brand-primary)" />
          </div>
          <div>
            <h1 className="admin-page-heading">Tier Request Quotas & Limits</h1>
            <p className="admin-page-sub">
              Configure hourly and daily prompt budgets per user tier to control compute consumption and enforce fair usage.
            </p>
          </div>
        </div>

        <div className="admin-page-actions-right">
          <button
            type="button"
            className="admin-outline-action-btn"
            onClick={handleExportConfig}
            title="Download JSON configuration"
          >
            <Download size={13} />
            <span>Export Config</span>
          </button>
          <button
            type="button"
            className="admin-solid-primary-btn"
            onClick={handleSave}
            disabled={saving}
            title={isDirty ? 'Unsaved changes pending' : 'Save configuration'}
          >
            <Save size={14} />
            <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
          </button>
        </div>
      </div>

      <div className="admin-kpi-quad-grid">
        <div className="admin-kpi-box">
          <div className="kpi-icon-tile purple">
            <User size={18} color="var(--brand-primary)" />
          </div>
          <div className="kpi-data-block">
            <span className="kpi-value">3</span>
            <span className="kpi-label-strong">User Tiers</span>
            <span className="kpi-subtext muted">Guest, Free, Pro/Premium</span>
          </div>
        </div>

        <div className="admin-kpi-box">
          <div className="kpi-icon-tile gold">
            <Zap size={18} color="#f59e0b" />
          </div>
          <div className="kpi-data-block">
            <span className="kpi-value">{totalHourly.toLocaleString()} req/hr</span>
            <span className="kpi-label-strong">Total Hourly Limit</span>
            <span className="kpi-subtext muted">Across all tiers</span>
          </div>
        </div>

        <div className="admin-kpi-box">
          <div className="kpi-icon-tile blue">
            <Layers size={18} color="#2563eb" />
          </div>
          <div className="kpi-data-block">
            <span className="kpi-value">{totalDaily.toLocaleString()} req/day</span>
            <span className="kpi-label-strong">Total Daily Limit</span>
            <span className="kpi-subtext muted">Across all tiers</span>
          </div>
        </div>

        <div className="admin-kpi-box">
          <div className="kpi-icon-tile purple">
            <ImageIcon size={18} color="var(--brand-primary)" />
          </div>
          <div className="kpi-data-block">
            <span className="kpi-value">{totalImg.toLocaleString()} img/day</span>
            <span className="kpi-label-strong">Image Generation Limit</span>
            <span className="kpi-subtext muted">Overall platform limit</span>
          </div>
        </div>
      </div>

      <div className="admin-quotas-table-card">
        <div className="admin-quotas-card-header">
          <div className="quotas-card-title-group">
            <div className="quotas-title-icon-box">
              <Layers size={16} color="var(--brand-primary)" />
            </div>
            <h2 className="quotas-card-title">Tier Quotas & Limits</h2>
          </div>

          <div className="quotas-card-controls">
            <div className="quotas-search-input-wrap">
              <Search size={14} className="quotas-search-icon" />
              <input
                type="text"
                placeholder="Search tiers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="quotas-search-input"
              />
            </div>

            <button
              type="button"
              className="admin-solid-primary-btn"
              onClick={() => handleOpenEditTier(tiersList[0] || { key: 'guest', name: 'Guest' })}
            >
              <Plus size={14} />
              <span>Add / Edit Tier</span>
            </button>
          </div>
        </div>

        <div className="admin-table-responsive-wrapper">
          <table className="admin-data-table quotas-table">
            <thead>
              <tr>
                <th
                  className="sortable-th"
                  onClick={() => setSortAsc(!sortAsc)}
                  title="Click to sort by tier"
                >
                  <div className="th-content">
                    <span>TIER ({tiersList.length})</span>
                    <span className="sort-indicator">↕</span>
                  </div>
                </th>
                <th>DESCRIPTION</th>
                <th>HOURLY LIMIT</th>
                <th>DAILY LIMIT</th>
                <th>IMAGE GEN (DAILY)</th>
                <th>VIDEO GEN (DAILY)</th>
                <th>STATUS</th>
                <th className="th-actions">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {tiersList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="admin-table-empty">
                    No matching tiers found.
                  </td>
                </tr>
              ) : (
                tiersList.map((tier) => {
                  const Icon = tier.icon;
                  return (
                    <tr key={tier.key}>
                      <td>
                        <div className="tier-name-cell">
                          <div className={`tier-symbol-box ${tier.iconBoxClass}`}>
                            <Icon size={14} color={tier.iconColor} />
                          </div>
                          <span className="tier-name-text">{tier.name}</span>
                        </div>
                      </td>
                      <td className="tier-desc-cell">
                        {tier.description}
                      </td>
                      <td className="tier-num-cell">
                        {tier.hourlyLimit.toLocaleString()} req/hr
                      </td>
                      <td className="tier-num-cell">
                        {tier.dailyLimit.toLocaleString()} req/day
                      </td>
                      <td className="tier-limit-cell">
                        {tier.imageGenLimit === 0 ? (
                          <span className="limit-disabled">Disabled</span>
                        ) : (
                          `${tier.imageGenLimit} img/day`
                        )}
                      </td>
                      <td className="tier-limit-cell">
                        {tier.videoGenLimit === 0 ? (
                          <span className="limit-disabled">Disabled</span>
                        ) : (
                          `${tier.videoGenLimit} vid/day`
                        )}
                      </td>
                      <td>
                        <span className="admin-status-pill completed">
                          <span className="status-dot" />
                          <span>Active</span>
                        </span>
                      </td>
                      <td className="td-actions">
                        <div className="admin-row-actions">
                          <button
                            type="button"
                            className="admin-row-action-btn"
                            onClick={() => handleOpenEditTier(tier)}
                            title="Edit Tier Quotas"
                          >
                            <Pencil size={14} />
                          </button>
                          <div className="admin-row-menu-wrap">
                            <button
                              type="button"
                              className="admin-row-action-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuTier(activeMenuTier === tier.key ? null : tier.key);
                              }}
                              title="More Options"
                            >
                              <MoreVertical size={14} />
                            </button>
                            {activeMenuTier === tier.key && (
                              <div className="admin-row-popover-menu">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditTier(tier)}
                                  className="popover-menu-item"
                                >
                                  <Pencil size={13} />
                                  <span>Edit Quota Limits</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleCopyTierSpecs(tier)}
                                  className="popover-menu-item"
                                >
                                  <Copy size={13} />
                                  <span>Copy Tier Specs</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleResetTierToDefault(tier.key)}
                                  className="popover-menu-item"
                                >
                                  <RotateCcw size={13} />
                                  <span>Reset to Defaults</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="admin-context-card">
        <div className="context-card-header">
          <div className="context-header-left">
            <div className="context-header-icon-box">
              <MessageSquare size={16} color="var(--brand-primary)" />
            </div>
            <div>
              <h2 className="context-card-title">Conversation Context Limits</h2>
              <p className="context-card-sub">
                Dynamic sliding window configuration for long chat threads.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="admin-outline-action-btn"
            onClick={handleOpenEditContext}
          >
            <Pencil size={13} />
            <span>Edit Limits</span>
          </button>
        </div>

        <div className="context-quad-grid">
          <div className="context-metric-tile">
            <div className="context-metric-left">
              <div className="context-tile-icon-box">
                <Layers size={16} color="var(--brand-primary)" />
              </div>
              <div className="context-metric-info">
                <span className="context-metric-title">Max History Threshold</span>
                <span className="context-metric-desc">Maximum messages per conversation thread.</span>
              </div>
            </div>
            <div className="context-metric-pill">
              {maxHistory} msgs
            </div>
          </div>

          <div className="context-metric-tile">
            <div className="context-metric-left">
              <div className="context-tile-icon-box">
                <LayoutTemplate size={16} color="var(--brand-primary)" />
              </div>
              <div className="context-metric-info">
                <span className="context-metric-title">Sliding Context Window</span>
                <span className="context-metric-desc">Number of recent messages kept in active context.</span>
              </div>
            </div>
            <div className="context-metric-pill">
              {slidingWindow} msgs
            </div>
          </div>
        </div>
      </div>

      {activeModal === 'editTier' &&
        createPortal(
          <div
            className="admin-modal-backdrop"
            onClick={() => setActiveModal(null)}
          >
            <div
              className="admin-modal-dialog"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="admin-modal-header">
                <div>
                  <h3 className="admin-modal-title">Edit Tier Quotas: {tierFormData.name}</h3>
                  <p className="admin-modal-sub">
                    Adjust consumption budgets and generation capabilities for this tier.
                  </p>
                </div>
                <button
                  type="button"
                  className="admin-modal-close-btn"
                  onClick={() => setActiveModal(null)}
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSaveTierModal} className="admin-modal-form">
                <div className="admin-form-group">
                  <label className="admin-form-label">Tier Name</label>
                  <input
                    type="text"
                    value={tierFormData.name}
                    onChange={(e) => setTierFormData({ ...tierFormData, name: e.target.value })}
                    className="admin-form-input"
                    required
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Description</label>
                  <input
                    type="text"
                    value={tierFormData.description}
                    onChange={(e) => setTierFormData({ ...tierFormData, description: e.target.value })}
                    className="admin-form-input"
                    required
                  />
                </div>

                <div className="admin-form-row-2">
                  <div className="admin-form-group">
                    <label className="admin-form-label">Hourly Request Limit (req/hr)</label>
                    <input
                      type="number"
                      min="1"
                      max="10000"
                      value={tierFormData.requestsPerHour}
                      onChange={(e) => setTierFormData({ ...tierFormData, requestsPerHour: e.target.value })}
                      className="admin-form-input"
                      required
                    />
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-form-label">Daily Request Limit (req/day)</label>
                    <input
                      type="number"
                      min="1"
                      max="50000"
                      value={tierFormData.requestsPerDay}
                      onChange={(e) => setTierFormData({ ...tierFormData, requestsPerDay: e.target.value })}
                      className="admin-form-input"
                      required
                    />
                  </div>
                </div>

                <div className="admin-form-row-2">
                  <div className="admin-form-group">
                    <label className="admin-form-label">Daily Image Generations (0 for Disabled)</label>
                    <input
                      type="number"
                      min="0"
                      max="500"
                      value={tierFormData.imageGenLimit}
                      onChange={(e) => setTierFormData({ ...tierFormData, imageGenLimit: e.target.value })}
                      className="admin-form-input"
                      required
                    />
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-form-label">Daily Video Generations (0 for Disabled)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={tierFormData.videoGenLimit}
                      onChange={(e) => setTierFormData({ ...tierFormData, videoGenLimit: e.target.value })}
                      className="admin-form-input"
                      required
                    />
                  </div>
                </div>

                <div className="admin-modal-footer">
                  <button
                    type="button"
                    className="admin-outline-action-btn"
                    onClick={() => setActiveModal(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="admin-solid-primary-btn"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {activeModal === 'editContext' &&
        createPortal(
          <div
            className="admin-modal-backdrop"
            onClick={() => setActiveModal(null)}
          >
            <div
              className="admin-modal-dialog"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="admin-modal-header">
                <div>
                  <h3 className="admin-modal-title">Edit Conversation Context Limits</h3>
                  <p className="admin-modal-sub">
                    Configure thresholds for message history retention and sliding context window.
                  </p>
                </div>
                <button
                  type="button"
                  className="admin-modal-close-btn"
                  onClick={() => setActiveModal(null)}
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSaveContextModal} className="admin-modal-form">
                <div className="admin-form-group">
                  <label className="admin-form-label">Max History Threshold (msgs)</label>
                  <input
                    type="number"
                    min="10"
                    max="1000"
                    value={contextFormData.maxConversationMessages}
                    onChange={(e) =>
                      setContextFormData({
                        ...contextFormData,
                        maxConversationMessages: e.target.value
                      })
                    }
                    className="admin-form-input"
                    required
                  />
                  <span className="admin-form-hint">
                    Maximum historical messages stored in a single thread before auto-truncation.
                  </span>
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Sliding Context Window (msgs)</label>
                  <input
                    type="number"
                    min="5"
                    max="500"
                    value={contextFormData.slidingContextWindow}
                    onChange={(e) =>
                      setContextFormData({
                        ...contextFormData,
                        slidingContextWindow: e.target.value
                      })
                    }
                    className="admin-form-input"
                    required
                  />
                  <span className="admin-form-hint">
                    Number of most recent conversation messages sent in prompt payload to AI models.
                  </span>
                </div>

                <div className="admin-modal-footer">
                  <button
                    type="button"
                    className="admin-outline-action-btn"
                    onClick={() => setActiveModal(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="admin-solid-primary-btn"
                  >
                    Save Limits
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default AdminQuotas;
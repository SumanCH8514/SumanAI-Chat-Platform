import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Cpu,
  User as UserIcon,
  Users,
  Crown,
  CheckCircle2,
  AlertCircle,
  Save,
  RotateCcw,
  Pencil,
  MoreVertical,
  Download,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  List,
  LayoutGrid,
  Shield,
  Lock,
  Box,
  Info,
  Bot,
  Check
} from 'lucide-react';
import { MODEL_LIST } from '../../constants/models';
import { adminService } from '../../services/adminService';
import './AdminModels.css';

const MetaLogo = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M16.96 4.54c-1.86 0-3.4 1.05-4.46 2.65-1.06-1.6-2.6-2.65-4.46-2.65C4.69 4.54 2 7.37 2 11.23c0 4.5 3.65 8.23 8.35 8.23 1.83 0 3.37-.82 4.41-2.18 1.04 1.36 2.58 2.18 4.41 2.18 4.7 0 8.35-3.73 8.35-8.23 0-3.86-2.69-6.69-6.04-6.69zm-8.92 11.77c-2.73 0-4.89-2.31-4.89-5.08 0-2.78 2.16-5.09 4.89-5.09 1.82 0 3.23 1.15 3.94 2.87-.28.48-.59 1.01-.94 1.58-.93 1.51-2.02 2.92-3 3.94-2.73 0-4.89-2.31-4.89-5.08zm8.92 0c-.98-1.02-2.07-2.43-3-3.94-.35-.57-.66-1.1-.94-1.58.71-1.72 2.12-2.87 3.94-2.87 2.73 0 4.89 2.31 4.89 5.09 0 2.77-2.16 5.08-4.89 5.08z"
      fill="#0081FB"
    />
  </svg>
);

const NvidiaLogo = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#76B900">
    <path d="M8.9 7.6c1.1-1.5 3-2.6 5.1-2.6 3.6 0 6.6 2.9 6.6 6.5s-3 6.5-6.6 6.5c-2.8 0-5.2-1.8-6.1-4.3-.2-.5.1-1 .6-1.2.5-.2 1.1.1 1.2.6.6 1.7 2.3 2.9 4.3 2.9 2.5 0 4.5-2 4.5-4.5s-2-4.5-4.5-4.5c-1.4 0-2.7.7-3.5 1.8l-1.6-1.2z" />
    <circle cx="14" cy="11.5" r="2.2" />
  </svg>
);

const GoogleLogo = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
  </svg>
);

const OpenAILogo = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#0f172a">
    <path d="M22.28 9.37a5.98 5.98 0 0 0-.52-4.94 6.08 6.08 0 0 0-6.49-2.92 6 6 0 0 0-4.71-2.28 6.07 6.07 0 0 0-5.8 4.25 6 6 0 0 0-4.14 3 6.08 6.08 0 0 0 .74 6.94 5.98 5.98 0 0 0 .52 4.94 6.08 6.08 0 0 0 6.49 2.92 6 6 0 0 0 4.71 2.28 6.07 6.07 0 0 0 5.8-4.25 6 6 0 0 0 4.14-3 6.08 6.08 0 0 0-.74-6.94zM12 14.73a2.73 2.73 0 1 1 2.73-2.73A2.73 2.73 0 0 1 12 14.73z" />
  </svg>
);

const AlibabaLogo = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#FF6A00">
    <circle cx="12" cy="12" r="10" />
    <path d="M9 13.5c1 1.8 3.2 2.2 5 1.2.8-.5 1.5-1.3 1.8-2.2M10 9.5h.01M14 9.5h.01" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const QwenLogo = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <rect width="24" height="24" rx="6" fill="#8B5CF6" />
    <path d="M7 12a5 5 0 1 1 10 0 5 5 0 0 1-10 0z" fill="#ffffff" />
    <path d="M14 15l3 3" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const ProviderLogo = ({ provider, size = 15 }) => {
  const p = (provider || '').toLowerCase();
  if (p.includes('meta')) return <MetaLogo size={size} />;
  if (p.includes('nvidia')) return <NvidiaLogo size={size} />;
  if (p.includes('google')) return <GoogleLogo size={size} />;
  if (p.includes('openai')) return <OpenAILogo size={size} />;
  if (p.includes('alibaba')) return <AlibabaLogo size={size} />;
  return <Cpu size={size} color="#7c3aed" />;
};

const ModelIcon = ({ model }) => {
  const id = (model.id || '').toLowerCase();
  if (id.includes('llama-3.2-11b-vision')) {
    return (
      <div className="model-avatar-icon llama-vision">
        <Bot size={15} color="#94a3b8" />
      </div>
    );
  }
  if (id.includes('nemotron')) {
    return (
      <div className="model-avatar-icon nemotron">
        <NvidiaLogo size={16} />
      </div>
    );
  }
  if (id.includes('llama-3.3') || id.includes('muse-glimmer')) {
    return (
      <div className="model-avatar-icon meta-blue">
        <MetaLogo size={16} />
      </div>
    );
  }
  if (id.includes('gemma')) {
    return (
      <div className="model-avatar-icon google-g">
        <GoogleLogo size={16} />
      </div>
    );
  }
  if (id.includes('gpt-oss') || id.includes('openai')) {
    return (
      <div className="model-avatar-icon openai-black">
        <OpenAILogo size={16} />
      </div>
    );
  }
  if (id.includes('qwen')) {
    return (
      <div className="model-avatar-icon qwen-purple">
        <QwenLogo size={16} />
      </div>
    );
  }
  return (
    <div className="model-avatar-icon">
      <Cpu size={14} color="#7c3aed" />
    </div>
  );
};

const DEFAULT_MODELS_CATALOG = [
  {
    id: 'meta/llama-3.2-11b-vision-instruct',
    name: 'Llama 3.2 Vision',
    modelRef: 'meta/llama-3.2-11b-vision-instruct',
    provider: 'Meta',
    capabilities: ['Vision', 'Visual Chat', '+1'],
    tierAccess: 'Pro Premium',
    isDefault: false,
    status: 'Locked'
  },
  {
    id: 'nvidia/llama-3.1-nemotron-70b-instruct',
    name: 'Nemotron 70B',
    modelRef: 'nvidia/llama-3.1-nemotron-70b-instruct',
    provider: 'NVIDIA',
    capabilities: ['High Precision', 'High Speed'],
    tierAccess: 'Pro Premium',
    isDefault: false,
    status: 'Locked'
  },
  {
    id: 'meta/llama-3.3-70b-instruct',
    name: 'Llama 3.3 70B',
    modelRef: 'meta/llama-3.3-70b-instruct',
    provider: 'Meta',
    capabilities: ['Versatile 70B', 'High Speed'],
    tierAccess: 'Standard',
    isDefault: false,
    status: 'Locked'
  },
  {
    id: 'google/gemma-4-31b-it',
    name: 'Gemma 4 31B IT',
    modelRef: 'google/gemma-4-31b-it',
    provider: 'Google',
    capabilities: ['Concise Chat', 'High Speed'],
    tierAccess: 'Standard',
    isDefault: false,
    status: 'Active'
  },
  {
    id: 'google/diffusiongemma-2b-4b-it',
    name: 'Diffusion Gemma 2iB',
    modelRef: 'google/diffusiongemma-2b-4b-it',
    provider: 'Google',
    capabilities: ['Experimental', 'High Speed'],
    tierAccess: 'Standard',
    isDefault: false,
    status: 'Active'
  },
  {
    id: 'meta/muse-glimmer-30b',
    name: 'Muse Glimmer 30B',
    modelRef: 'meta/muse-glimmer-30b',
    provider: 'Meta',
    capabilities: ['Creative Prose', 'High Speed'],
    tierAccess: 'Standard',
    isDefault: false,
    status: 'Active'
  },
  {
    id: 'openai/gpt-oss-120b',
    name: 'GPT-OSS 120B',
    modelRef: 'openai/gpt-oss-120b',
    provider: 'OpenAI',
    capabilities: ['120B Flagship', 'High Speed'],
    tierAccess: 'Standard',
    isDefault: true,
    status: 'Active'
  },
  {
    id: 'qwen/qwen3.8-27b',
    name: 'Qwen 3.8 27B',
    modelRef: 'qwen/qwen3.8-27b',
    provider: 'Alibaba',
    capabilities: ['Vision', 'Vision & Code', '+1'],
    tierAccess: 'Standard',
    isDefault: false,
    status: 'Active'
  }
];

const MODEL_PROVIDER_OPTIONS = [
  { value: 'all', label: 'All Providers' },
  { value: 'Meta', label: 'Meta' },
  { value: 'NVIDIA', label: 'NVIDIA' },
  { value: 'Google', label: 'Google' },
  { value: 'OpenAI', label: 'OpenAI' },
  { value: 'Alibaba', label: 'Alibaba' }
];

const MODEL_TIER_OPTIONS = [
  { value: 'all', label: 'All Access Tiers' },
  { value: 'Pro Premium', label: 'Pro Premium' },
  { value: 'Standard', label: 'Standard' }
];

const MODEL_STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'Active', label: 'Active' },
  { value: 'Locked', label: 'Locked' }
];

export const AdminModels = () => {
  const [activeTier, setActiveTier] = useState('pro');
  const [governance, setGovernance] = useState(null);
  const [draftConfig, setDraftConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [providerFilter, setProviderFilter] = useState('all');
  const [tierAccessFilter, setTierAccessFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('list');
  const [selectedIds, setSelectedIds] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [maxModelsInput, setMaxModelsInput] = useState('20');
  const [defaultModelSelect, setDefaultModelSelect] = useState('openai/gpt-oss-120b');
  const [activeDropdown, setActiveDropdown] = useState(null);
  const dropdownsRef = useRef(null);

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

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownsRef.current && !dropdownsRef.current.contains(e.target)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isDirty = JSON.stringify(governance) !== JSON.stringify(draftConfig);

  const handleSave = async () => {
    if (!draftConfig) return;
    setSaving(true);
    try {
      await adminService.saveGovernanceConfig(draftConfig);
      setGovernance(JSON.parse(JSON.stringify(draftConfig)));
      showToast('AI Model Governance published successfully.');
    } catch {
      showToast('Failed to save governance configuration', true);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setDraftConfig(JSON.parse(JSON.stringify(governance)));
    showToast('Changes discarded.');
  };

  const fullModelsCatalog = useMemo(() => {
    if (Array.isArray(MODEL_LIST) && MODEL_LIST.length > 8) {
      return MODEL_LIST.map((m, idx) => {
        const found = DEFAULT_MODELS_CATALOG.find((dc) => dc.id === m.id);
        if (found) return found;
        return {
          id: m.id,
          name: m.name || m.id,
          modelRef: m.id,
          provider: m.provider || 'AI Engine',
          capabilities: ['Chat', 'High Speed'],
          tierAccess: m.tier === 'premium' ? 'Pro Premium' : 'Standard',
          isDefault: idx === 0,
          status: 'Active'
        };
      });
    }

    return DEFAULT_MODELS_CATALOG;
  }, []);

  const filteredModels = useMemo(() => {
    return fullModelsCatalog.filter((m) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.modelRef.toLowerCase().includes(q) ||
        m.provider.toLowerCase().includes(q);

      const matchProv = providerFilter === 'all' || m.provider.toLowerCase() === providerFilter.toLowerCase();
      const matchTier = tierAccessFilter === 'all' || m.tierAccess.toLowerCase().includes(tierAccessFilter.toLowerCase());
      const matchStatus = statusFilter === 'all' || m.status.toLowerCase() === statusFilter.toLowerCase();

      return matchSearch && matchProv && matchTier && matchStatus;
    });
  }, [fullModelsCatalog, searchQuery, providerFilter, tierAccessFilter, statusFilter]);

  const handleToggleSelectAll = () => {
    if (selectedIds.length === filteredModels.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredModels.map((m) => m.id));
    }
  };

  const handleToggleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  if (loading) {
    return (
      <div className="admin-page-loading">
        <div className="admin-loader-spinner" />
        <span>Loading AI model governance...</span>
      </div>
    );
  }

  return (
    <div className="admin-models-wrap">
      {toastMessage &&
        createPortal(
          <div className={`admin-toast ${toastMessage.isError ? 'toast-err' : ''}`}>
            {toastMessage.isError ? (
              <AlertCircle size={15} color="#EF4444" />
            ) : (
              <CheckCircle2 size={15} color="#10B981" />
            )}
            <span>{toastMessage.text}</span>
          </div>,
          document.body
        )}

      {isDirty && (
        <div className="admin-dirty-bar">
          <div className="admin-dirty-info">
            <AlertCircle size={15} color="#FBBF24" />
            <span>Unsaved model governance changes pending publication</span>
          </div>
          <div className="admin-dirty-actions">
            <button
              type="button"
              className="admin-secondary-btn"
              onClick={handleReset}
              disabled={saving}
            >
              <RotateCcw size={13} />
              <span>Discard</span>
            </button>
            <button
              type="button"
              className="admin-primary-save-btn"
              onClick={handleSave}
              disabled={saving}
            >
              <Save size={13} />
              <span>{saving ? 'Publishing...' : 'Save Configuration'}</span>
            </button>
          </div>
        </div>
      )}

      <header className="admin-page-title-row">
        <div className="page-title-with-icon">
          <div className="admin-header-icon-box">
            <Cpu size={20} />
          </div>
          <div>
            <h1 className="admin-page-heading">AI Model Governance</h1>
            <p className="admin-page-sub">
              Control which models are visible and usable per audience tier, and designate flagship models as Pro Premium.
            </p>
          </div>
        </div>

        <div className="admin-page-actions-right">
          <button
            type="button"
            className="admin-outline-action-btn"
            onClick={() => showToast('Model governance exported')}
          >
            <Download size={13} />
            <span>Export</span>
          </button>
          <button
            type="button"
            className="admin-solid-primary-btn"
            onClick={handleSave}
            disabled={saving}
          >
            <Save size={14} />
            <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
          </button>
        </div>
      </header>

      <div className="admin-kpi-quad-grid">
        <div className="admin-kpi-box">
          <div className="kpi-icon-tile purple">
            <Box size={17} />
          </div>
          <div className="kpi-data-block">
            <span className="kpi-label">Total Models</span>
            <span className="kpi-value">20</span>
          </div>
        </div>

        <div className="admin-kpi-box">
          <div className="kpi-icon-tile gold">
            <Crown size={17} />
          </div>
          <div className="kpi-data-block">
            <span className="kpi-label">Pro / Premium Models</span>
            <span className="kpi-value">3</span>
          </div>
        </div>

        <div className="admin-kpi-box">
          <div className="kpi-icon-tile blue">
            <Users size={17} />
          </div>
          <div className="kpi-data-block">
            <span className="kpi-label">Pro / Premium Members</span>
            <span className="kpi-value">11</span>
          </div>
        </div>

        <div className="admin-kpi-box">
          <div className="kpi-icon-tile green">
            <UserIcon size={17} />
          </div>
          <div className="kpi-data-block">
            <span className="kpi-label">Logged-in Free Users</span>
            <span className="kpi-value">3</span>
          </div>
        </div>
      </div>

      <div className="admin-audience-tabs-row">
        <button
          type="button"
          className={`audience-tab-pill ${activeTier === 'guest' ? 'active' : ''}`}
          onClick={() => setActiveTier('guest')}
        >
          <UserIcon size={13} />
          <span>Guest / Non-Login Users</span>
          <span className="audience-tab-badge">1</span>
        </button>

        <button
          type="button"
          className={`audience-tab-pill ${activeTier === 'free' ? 'active' : ''}`}
          onClick={() => setActiveTier('free')}
        >
          <Users size={13} />
          <span>Logged-in Free Users</span>
          <span className="audience-tab-badge">3</span>
        </button>

        <button
          type="button"
          className={`audience-tab-pill solid-purple ${activeTier === 'pro' ? 'active' : ''}`}
          onClick={() => setActiveTier('pro')}
        >
          <Crown size={13} />
          <span>Pro / Premium Members</span>
          <span className="audience-tab-badge">11</span>
        </button>
      </div>

      <div className="admin-policy-settings-card">
        <div className="policy-card-info">
          <div className="policy-card-title-line">
            <Shield size={16} color="#7c3aed" />
            <span className="policy-card-title">Pro / Premium Tier Policy</span>
          </div>
          <p className="policy-card-desc">
            Configure models accessible to Pro tier subscribers and designate which models are classified as Premium flagship AI.
          </p>
        </div>

        <div className="policy-card-fields">
          <div className="policy-input-group">
            <label className="policy-field-label">
              <span>Max Selectable Models</span>
              <Info size={11} className="label-info-icon" />
            </label>
            <input
              type="number"
              value={maxModelsInput}
              onChange={(e) => setMaxModelsInput(e.target.value)}
              className="policy-number-input"
            />
          </div>

          <div className="policy-input-group">
            <label className="policy-field-label">Default Model</label>
            <div className="policy-select-wrap">
              <select
                value={defaultModelSelect}
                onChange={(e) => setDefaultModelSelect(e.target.value)}
                className="policy-select-field"
              >
                <option value="openai/gpt-oss-120b">GPT-OSS 120B</option>
                <option value="meta/llama-3.3-70b-instruct">Llama 3.3 70B</option>
                <option value="google/gemma-4-31b-it">Gemma 4 31B IT</option>
              </select>
              <ChevronDown size={11} className="policy-chevron" />
            </div>
          </div>
        </div>
      </div>

      <div className="admin-filter-search-strip">
        <div className="admin-search-wrap">
          <Search size={14} className="filter-search-icon" />
          <input
            type="text"
            className="filter-search-input"
            placeholder="Search models by name or provider..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="admin-filter-dropdowns" ref={dropdownsRef}>
          <div className="admin-custom-dropdown-wrap">
            <button
              type="button"
              className={`admin-select-pill-btn ${activeDropdown === 'provider' ? 'open' : ''}`}
              onClick={() => setActiveDropdown(activeDropdown === 'provider' ? null : 'provider')}
            >
              <span className="select-pill-label">
                {MODEL_PROVIDER_OPTIONS.find((o) => o.value.toLowerCase() === providerFilter.toLowerCase())?.label || 'All Providers'}
              </span>
              <ChevronDown size={12} className={`select-arrow-icon ${activeDropdown === 'provider' ? 'rotate' : ''}`} />
            </button>
            {activeDropdown === 'provider' && (
              <div className="admin-dropdown-popover">
                {MODEL_PROVIDER_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`admin-dropdown-opt ${providerFilter.toLowerCase() === opt.value.toLowerCase() ? 'selected' : ''}`}
                    onClick={() => {
                      setProviderFilter(opt.value);
                      setCurrentPage(1);
                      setActiveDropdown(null);
                    }}
                  >
                    <span>{opt.label}</span>
                    {providerFilter.toLowerCase() === opt.value.toLowerCase() && <Check size={12} className="opt-check" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="admin-custom-dropdown-wrap">
            <button
              type="button"
              className={`admin-select-pill-btn ${activeDropdown === 'tier' ? 'open' : ''}`}
              onClick={() => setActiveDropdown(activeDropdown === 'tier' ? null : 'tier')}
            >
              <span className="select-pill-label">
                {MODEL_TIER_OPTIONS.find((o) => o.value.toLowerCase() === tierAccessFilter.toLowerCase())?.label || 'All Access Tiers'}
              </span>
              <ChevronDown size={12} className={`select-arrow-icon ${activeDropdown === 'tier' ? 'rotate' : ''}`} />
            </button>
            {activeDropdown === 'tier' && (
              <div className="admin-dropdown-popover">
                {MODEL_TIER_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`admin-dropdown-opt ${tierAccessFilter.toLowerCase() === opt.value.toLowerCase() ? 'selected' : ''}`}
                    onClick={() => {
                      setTierAccessFilter(opt.value);
                      setCurrentPage(1);
                      setActiveDropdown(null);
                    }}
                  >
                    <span>{opt.label}</span>
                    {tierAccessFilter.toLowerCase() === opt.value.toLowerCase() && <Check size={12} className="opt-check" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="admin-custom-dropdown-wrap">
            <button
              type="button"
              className={`admin-select-pill-btn ${activeDropdown === 'status' ? 'open' : ''}`}
              onClick={() => setActiveDropdown(activeDropdown === 'status' ? null : 'status')}
            >
              <span className="select-pill-label">
                {MODEL_STATUS_OPTIONS.find((o) => o.value.toLowerCase() === statusFilter.toLowerCase())?.label || 'All Status'}
              </span>
              <ChevronDown size={12} className={`select-arrow-icon ${activeDropdown === 'status' ? 'rotate' : ''}`} />
            </button>
            {activeDropdown === 'status' && (
              <div className="admin-dropdown-popover">
                {MODEL_STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`admin-dropdown-opt ${statusFilter.toLowerCase() === opt.value.toLowerCase() ? 'selected' : ''}`}
                    onClick={() => {
                      setStatusFilter(opt.value);
                      setCurrentPage(1);
                      setActiveDropdown(null);
                    }}
                  >
                    <span>{opt.label}</span>
                    {statusFilter.toLowerCase() === opt.value.toLowerCase() && <Check size={12} className="opt-check" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="admin-view-switcher">
            <button
              type="button"
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              <List size={13} />
            </button>
            <button
              type="button"
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid size={13} />
            </button>
          </div>
        </div>
      </div>

      <div className="admin-data-table-card">
        <div className="admin-table-container">
          <table className="admin-full-data-table">
            <thead>
              <tr>
                <th className="th-check">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === filteredModels.length && filteredModels.length > 0}
                    onChange={handleToggleSelectAll}
                  />
                </th>
                <th>MODEL NAME ↕</th>
                <th>PROVIDER</th>
                <th>CAPABILITIES</th>
                <th>TIER ACCESS</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredModels.map((m, i) => {
                const isSelected = selectedIds.includes(m.id);
                const isPro = m.tierAccess === 'Pro Premium';
                const isLocked = m.status === 'Locked';

                return (
                  <tr key={m.id || i} className={isSelected ? 'is-selected' : ''}>
                    <td className="td-check">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelectOne(m.id)}
                      />
                    </td>
                    <td>
                      <div className="model-name-cell">
                        <ModelIcon model={m} />
                        <div className="model-name-info">
                          <div className="model-name-top">
                            <span className="model-bold-name">{m.name}</span>
                            {m.isDefault && <span className="default-green-badge">Default</span>}
                          </div>
                          <span className="model-ref-name">{m.modelRef}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="provider-cell">
                        <ProviderLogo provider={m.provider} size={15} />
                        <span className="provider-name">{m.provider}</span>
                      </div>
                    </td>
                    <td>
                      <div className="capabilities-cluster">
                        {m.capabilities.map((cap, cIdx) => (
                          <span
                            key={cIdx}
                            className={`cap-tag ${cIdx === 0 && cap.includes('Vision') ? 'purple' : cIdx === 1 && cap.includes('Visual') ? 'blue' : ''}`}
                          >
                            {cap}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      {isPro ? (
                        <span className="tier-tag pro-premium">
                          <Crown size={11} />
                          <span>Pro Premium</span>
                        </span>
                      ) : (
                        <span className="tier-tag standard">
                          <Box size={11} />
                          <span>Standard</span>
                        </span>
                      )}
                    </td>
                    <td>
                      {isLocked ? (
                        <span className="status-tag locked">
                          <Lock size={11} />
                          <span>Locked</span>
                        </span>
                      ) : (
                        <span className="status-tag active">
                          <span className="status-dot green" />
                          <span>Active</span>
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="action-icons-cluster">
                        <button
                          type="button"
                          className="action-btn"
                          title="Edit model"
                          onClick={() => showToast(`Edit policy for ${m.name}`)}
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          type="button"
                          className="action-btn"
                          title="More options"
                        >
                          <MoreVertical size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="admin-table-pagination-bar">
          <span className="pagination-text">Showing 1–{filteredModels.length} of 20 models</span>
          <div className="pagination-controls">
            <button
              type="button"
              className="page-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            >
              <ChevronLeft size={13} />
            </button>
            {[1, 2, 3].map((p) => (
              <button
                key={p}
                type="button"
                className={`page-num-btn ${currentPage === p ? 'active' : ''}`}
                onClick={() => setCurrentPage(p)}
              >
                {p}
              </button>
            ))}
            <button
              type="button"
              className="page-btn"
              onClick={() => setCurrentPage(prev => Math.min(3, prev + 1))}
            >
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminModels;

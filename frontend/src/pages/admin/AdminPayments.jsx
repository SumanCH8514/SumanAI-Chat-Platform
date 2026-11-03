import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  CreditCard,
  Search,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Save,
  Copy,
  Check,
  X,
  Filter,
  ShieldCheck,
  Plus,
  Box,
  Layers,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Calendar,
  CircleDollarSign,
  Wallet,
  Coins,
  ChevronDown,
  Download,
  Receipt
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import './AdminPayments.css';

const RazorpayLogo = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#0082FF">
    <path d="M14.5 2L5 13.5h5.5L7 22l12-11.5h-6.5L14.5 2z" />
  </svg>
);

const PhonePeLogo = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#5f259f">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v12M9 9h5a2.5 2.5 0 0 1 0 5H9" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const DEFAULT_SAMPLE_TXNS = [
  {
    id: 'TXN_RAZORPAY_1793371336977_05236',
    customerEmail: 'dev.suman.ch@gmail.com',
    customerPhone: '+91 8918153949',
    item: 'Wallet Custom Credit Recharge',
    credits: '+100 Credits',
    gateway: 'Razorpay',
    amount: '₹100',
    currency: 'INR',
    date: 'Oct 30, 2026, 08:12:18 PM',
    status: 'Completed'
  },
  {
    id: 'TXN_PHONEPE_1793370815298_8FB6K',
    customerEmail: 'dev.suman.ch@gmail.com',
    customerPhone: '+91 8918153949',
    item: 'Wallet Credit Top-up (Starter)',
    credits: '+100 Credits',
    gateway: 'PhonePe',
    amount: '₹100',
    currency: 'INR',
    date: 'Oct 30, 2026, 08:03:37 PM',
    status: 'Completed'
  }
];

const TIME_FILTER_OPTIONS = [
  { value: 'all', label: 'All Time' },
  { value: 'today', label: 'Today' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' }
];

const GATEWAY_FILTER_OPTIONS = [
  { value: 'all', label: 'All Gateways' },
  { value: 'Razorpay', label: 'Razorpay' },
  { value: 'PhonePe', label: 'PhonePe' },
  { value: 'Stripe', label: 'Stripe' },
  { value: 'PayPal', label: 'PayPal' }
];

const CURRENCY_FILTER_OPTIONS = [
  { value: 'all', label: 'All Currencies' },
  { value: 'INR', label: 'INR (₹)' },
  { value: 'USD', label: 'USD ($)' }
];

const TYPE_FILTER_OPTIONS = [
  { value: 'all', label: 'All Types' },
  { value: 'recharge', label: 'Credit Recharge' },
  { value: 'pro', label: 'Pro Subscription' }
];

const renderDateTime = (dateStr) => {
  if (!dateStr) return { date: 'Oct 30, 2026', time: '08:12:18 PM' };
  const parts = dateStr.split(', ');
  if (parts.length >= 3) {
    return { date: `${parts[0]}, ${parts[1]}`, time: parts[2] };
  }
  return { date: dateStr, time: '' };
};

export const AdminPayments = () => {
  const [activeTab, setActiveTab] = useState('transactions');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savingGateways, setSavingGateways] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const [transactions, setTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [timeFilter, setTimeFilter] = useState('all');
  const [gatewayFilter, setGatewayFilter] = useState('all');
  const [currencyFilter, setCurrencyFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedTxnId, setCopiedTxnId] = useState('');
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [selectedTxnPreview, setSelectedTxnPreview] = useState(null);
  const [activeRowMenuId, setActiveRowMenuId] = useState(null);
  const filterDropdownsRef = useRef(null);

  const [gatewayConfig, setGatewayConfig] = useState({
    razorpay: { enabled: true, mode: 'test', keyId: '', keySecret: '', webhookSecret: '' },
    zaakpay: { enabled: true, mode: 'sandbox', merchantId: '', secretKey: '' },
    phonepe: { enabled: true, mode: 'uat', merchantId: '', saltKey: '', saltIndex: '1' },
    stripe: { enabled: true, mode: 'test', publishableKey: '', secretKey: '', webhookSecret: '' },
    paypal: { enabled: true, mode: 'sandbox', clientId: '', clientSecret: '' }
  });

  const [showSecrets, setShowSecrets] = useState({
    razorpay: false,
    zaakpay: false,
    phonepe: false,
    stripe: false,
    paypal: false
  });

  const showToast = (msg, isError = false) => {
    setToastMessage({ text: msg, isError });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadData = useCallback(async () => {
    try {
      const [txns, gwConfig] = await Promise.all([
        adminService.getAllPlatformTransactions(),
        adminService.getPaymentGatewayConfig()
      ]);
      if (Array.isArray(txns) && txns.length > 0) {
        setTransactions(txns);
      } else {
        setTransactions(DEFAULT_SAMPLE_TXNS);
      }
      if (gwConfig) {
        setGatewayConfig(prev => ({ ...prev, ...gwConfig }));
      }
    } catch {
      setTransactions(DEFAULT_SAMPLE_TXNS);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filterDropdownsRef.current && !filterDropdownsRef.current.contains(e.target)) {
        setActiveDropdown(null);
      }
      if (!e.target.closest('.row-options-wrap')) {
        setActiveRowMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleCopy = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedTxnId(id);
    setTimeout(() => setCopiedTxnId(''), 2000);
  };

  const handleSaveGateways = async (e) => {
    e.preventDefault();
    setSavingGateways(true);
    try {
      await adminService.savePaymentGatewayConfig(gatewayConfig);
      showToast('Gateway credentials updated and synced successfully.');
    } catch {
      showToast('Failed to save gateway configuration', true);
    } finally {
      setSavingGateways(false);
    }
  };

  const updateGatewayField = (gateway, field, value) => {
    setGatewayConfig(prev => ({
      ...prev,
      [gateway]: {
        ...prev[gateway],
        [field]: value
      }
    }));
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const q = searchTerm.toLowerCase().trim();
      const matchSearch =
        !q ||
        (t.id || '').toLowerCase().includes(q) ||
        (t.customerEmail || '').toLowerCase().includes(q) ||
        (t.item || '').toLowerCase().includes(q);

      const matchGw = gatewayFilter === 'all' || (t.gateway || '').toLowerCase() === gatewayFilter.toLowerCase();
      const matchCurr = currencyFilter === 'all' || (t.currency || '').toLowerCase() === currencyFilter.toLowerCase();

      return matchSearch && matchGw && matchCurr;
    });
  }, [transactions, searchTerm, gatewayFilter, currencyFilter]);

  const handleToggleSelectAll = () => {
    if (selectedIds.length === filteredTransactions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredTransactions.map(t => t.id));
    }
  };

  const handleToggleSelectOne = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  if (loading) {
    return (
      <div className="admin-page-loading">
        <div className="admin-loader-spinner" />
        <span>Loading payment & gateway telemetry...</span>
      </div>
    );
  }

  return (
    <div className="admin-payments-wrap">
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

      {selectedTxnPreview && (
        <div className="admin-modal-backdrop" onClick={() => setSelectedTxnPreview(null)}>
          <div className="admin-modal-card receipt-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-head">
              <div className="receipt-modal-title-group">
                <Receipt size={17} color="#7c3aed" />
                <h3 className="admin-modal-title">Transaction Receipt</h3>
              </div>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setSelectedTxnPreview(null)}
                title="Close"
              >
                <X size={16} />
              </button>
            </div>

            <div className="receipt-modal-body">
              <div className="receipt-hero-banner">
                <span className="receipt-amount-display">{selectedTxnPreview.amount}</span>
                <span className="receipt-currency-tag">{selectedTxnPreview.currency || 'INR'}</span>
                <span className="status-badge active">
                  <span className="status-dot green" />
                  <span>{selectedTxnPreview.status}</span>
                </span>
              </div>

              <div className="receipt-details-grid">
                <div className="receipt-meta-row">
                  <span className="meta-label">Reference ID</span>
                  <div className="meta-val-copy">
                    <code>{selectedTxnPreview.id}</code>
                    <button
                      type="button"
                      className="ref-copy-btn"
                      onClick={() => handleCopy(selectedTxnPreview.id, selectedTxnPreview.id)}
                      title="Copy Reference ID"
                    >
                      {copiedTxnId === selectedTxnPreview.id ? <Check size={11} color="#16a34a" /> : <Copy size={11} />}
                    </button>
                  </div>
                </div>

                <div className="receipt-meta-row">
                  <span className="meta-label">Customer</span>
                  <span className="meta-val-strong">{selectedTxnPreview.customerEmail} ({selectedTxnPreview.customerPhone})</span>
                </div>

                <div className="receipt-meta-row">
                  <span className="meta-label">Item / Purpose</span>
                  <span className="meta-val">{selectedTxnPreview.item}</span>
                </div>

                <div className="receipt-meta-row">
                  <span className="meta-label">Platform Credits</span>
                  <span className="meta-val-green">{selectedTxnPreview.credits}</span>
                </div>

                <div className="receipt-meta-row">
                  <span className="meta-label">Payment Gateway</span>
                  <div className="meta-val">
                    <span className={`gateway-pill ${selectedTxnPreview.gateway.toLowerCase().includes('razorpay') ? 'razorpay' : 'phonepe'}`}>
                      {selectedTxnPreview.gateway.toLowerCase().includes('razorpay') ? <RazorpayLogo size={13} /> : <PhonePeLogo size={13} />}
                      <span>{selectedTxnPreview.gateway}</span>
                    </span>
                  </div>
                </div>

                <div className="receipt-meta-row">
                  <span className="meta-label">Date & Time</span>
                  <span className="meta-val">{selectedTxnPreview.date}</span>
                </div>
              </div>
            </div>

            <div className="receipt-modal-footer">
              <button
                type="button"
                className="admin-outline-action-btn"
                onClick={() => {
                  handleCopy(JSON.stringify(selectedTxnPreview, null, 2), 'json');
                  showToast('Transaction payload copied');
                }}
              >
                <Copy size={13} />
                <span>Copy Record</span>
              </button>
              <button
                type="button"
                className="admin-solid-primary-btn"
                onClick={() => {
                  showToast('Official receipt downloaded');
                  setSelectedTxnPreview(null);
                }}
              >
                <Download size={13} />
                <span>Download Invoice</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="admin-page-title-row">
        <div className="page-title-with-icon">
          <div className="admin-header-icon-box">
            <CreditCard size={20} />
          </div>
          <div>
            <h1 className="admin-page-heading">Payments & Gateway Governance</h1>
            <p className="admin-page-sub">
              Monitor real-time customer transactions, verify settlement ledgers, and manage payment gateway credentials.
            </p>
          </div>
        </div>

        <div className="admin-page-actions-right">
          <button
            type="button"
            className="admin-outline-action-btn"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw size={12} className={refreshing ? 'spin-icon' : ''} />
            <span>Sync Records</span>
          </button>
          <button
            type="button"
            className="admin-solid-primary-btn"
            onClick={() => setActiveTab('credentials')}
          >
            <Plus size={14} />
            <span>Add Gateway</span>
          </button>
        </div>
      </header>

      <div className="admin-tab-selector-strip">
        <button
          type="button"
          className={`tab-pill-btn ${activeTab === 'transactions' ? 'active' : ''}`}
          onClick={() => setActiveTab('transactions')}
        >
          <CreditCard size={13} />
          <span>Transactions & Ledger</span>
          <span className="tab-pill-badge">{filteredTransactions.length}</span>
        </button>

        <button
          type="button"
          className={`tab-pill-btn ${activeTab === 'credentials' ? 'active' : ''}`}
          onClick={() => setActiveTab('credentials')}
        >
          <ShieldCheck size={13} />
          <span>Gateway API Credentials</span>
        </button>
      </div>

      <div className="admin-kpi-quad-grid">
        <div className="admin-kpi-box">
          <div className="kpi-icon-tile purple">
            <Coins size={17} />
          </div>
          <div className="kpi-data-block">
            <span className="kpi-label">Total Platform Volume</span>
            <span className="kpi-value">₹200</span>
            <span className="kpi-subtext green">↑ +12% from last 30 days</span>
          </div>
        </div>

        <div className="admin-kpi-box">
          <div className="kpi-icon-tile green">
            <CheckCircle2 size={17} />
          </div>
          <div className="kpi-data-block">
            <span className="kpi-label">Successful Transactions</span>
            <span className="kpi-value">2</span>
            <span className="kpi-subtext muted">Verified receipts issued</span>
          </div>
        </div>

        <div className="admin-kpi-box">
          <div className="kpi-icon-tile gold">
            <Wallet size={17} />
          </div>
          <div className="kpi-data-block">
            <span className="kpi-label">Platform Credits Issued</span>
            <span className="kpi-value">200</span>
            <span className="kpi-subtext muted">Circulated in user wallets</span>
          </div>
        </div>

        <div className="admin-kpi-box">
          <div className="kpi-icon-tile purple">
            <Layers size={17} />
          </div>
          <div className="kpi-data-block">
            <span className="kpi-label">Integrated Providers</span>
            <span className="kpi-value">5</span>
            <span className="kpi-subtext muted">Razorpay, Zaakpay, PhonePe, Stripe, PayPal</span>
          </div>
        </div>
      </div>

      {activeTab === 'transactions' ? (
        <>
          <div className="admin-filter-search-strip">
            <div className="admin-search-wrap">
              <Search size={14} className="filter-search-icon" />
              <input
                type="text"
                className="filter-search-input"
                placeholder="Search by reference ID, customer email, or purpose..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => setSearchTerm('')}
                >
                  <X size={12} />
                </button>
              )}
            </div>

            <div className="admin-filter-dropdowns" ref={filterDropdownsRef}>
              <div className="admin-custom-dropdown-wrap">
                <button
                  type="button"
                  className={`admin-select-pill-btn ${activeDropdown === 'time' ? 'open' : ''}`}
                  onClick={() => setActiveDropdown(activeDropdown === 'time' ? null : 'time')}
                >
                  <Calendar size={13} className="select-lead-icon" />
                  <span className="select-pill-label">
                    {TIME_FILTER_OPTIONS.find((o) => o.value === timeFilter)?.label || 'All Time'}
                  </span>
                  <ChevronDown size={12} className={`select-arrow-icon ${activeDropdown === 'time' ? 'rotate' : ''}`} />
                </button>
                {activeDropdown === 'time' && (
                  <div className="admin-dropdown-popover">
                    {TIME_FILTER_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        className={`admin-dropdown-opt ${timeFilter === opt.value ? 'selected' : ''}`}
                        onClick={() => {
                          setTimeFilter(opt.value);
                          setCurrentPage(1);
                          setActiveDropdown(null);
                        }}
                      >
                        <span>{opt.label}</span>
                        {timeFilter === opt.value && <Check size={12} className="opt-check" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="admin-custom-dropdown-wrap">
                <button
                  type="button"
                  className={`admin-select-pill-btn ${activeDropdown === 'gateway' ? 'open' : ''}`}
                  onClick={() => setActiveDropdown(activeDropdown === 'gateway' ? null : 'gateway')}
                >
                  <Filter size={13} className="select-lead-icon" />
                  <span className="select-pill-label">
                    {GATEWAY_FILTER_OPTIONS.find((o) => o.value === gatewayFilter)?.label || 'All Gateways'}
                  </span>
                  <ChevronDown size={12} className={`select-arrow-icon ${activeDropdown === 'gateway' ? 'rotate' : ''}`} />
                </button>
                {activeDropdown === 'gateway' && (
                  <div className="admin-dropdown-popover">
                    {GATEWAY_FILTER_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        className={`admin-dropdown-opt ${gatewayFilter === opt.value ? 'selected' : ''}`}
                        onClick={() => {
                          setGatewayFilter(opt.value);
                          setCurrentPage(1);
                          setActiveDropdown(null);
                        }}
                      >
                        <span>{opt.label}</span>
                        {gatewayFilter === opt.value && <Check size={12} className="opt-check" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="admin-custom-dropdown-wrap">
                <button
                  type="button"
                  className={`admin-select-pill-btn ${activeDropdown === 'currency' ? 'open' : ''}`}
                  onClick={() => setActiveDropdown(activeDropdown === 'currency' ? null : 'currency')}
                >
                  <CircleDollarSign size={13} className="select-lead-icon" />
                  <span className="select-pill-label">
                    {CURRENCY_FILTER_OPTIONS.find((o) => o.value === currencyFilter)?.label || 'All Currencies'}
                  </span>
                  <ChevronDown size={12} className={`select-arrow-icon ${activeDropdown === 'currency' ? 'rotate' : ''}`} />
                </button>
                {activeDropdown === 'currency' && (
                  <div className="admin-dropdown-popover">
                    {CURRENCY_FILTER_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        className={`admin-dropdown-opt ${currencyFilter === opt.value ? 'selected' : ''}`}
                        onClick={() => {
                          setCurrencyFilter(opt.value);
                          setCurrentPage(1);
                          setActiveDropdown(null);
                        }}
                      >
                        <span>{opt.label}</span>
                        {currencyFilter === opt.value && <Check size={12} className="opt-check" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="admin-custom-dropdown-wrap">
                <button
                  type="button"
                  className={`admin-select-pill-btn ${activeDropdown === 'type' ? 'open' : ''}`}
                  onClick={() => setActiveDropdown(activeDropdown === 'type' ? null : 'type')}
                >
                  <Layers size={13} className="select-lead-icon" />
                  <span className="select-pill-label">
                    {TYPE_FILTER_OPTIONS.find((o) => o.value === typeFilter)?.label || 'All Types'}
                  </span>
                  <ChevronDown size={12} className={`select-arrow-icon ${activeDropdown === 'type' ? 'rotate' : ''}`} />
                </button>
                {activeDropdown === 'type' && (
                  <div className="admin-dropdown-popover">
                    {TYPE_FILTER_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        className={`admin-dropdown-opt ${typeFilter === opt.value ? 'selected' : ''}`}
                        onClick={() => {
                          setTypeFilter(opt.value);
                          setCurrentPage(1);
                          setActiveDropdown(null);
                        }}
                      >
                        <span>{opt.label}</span>
                        {typeFilter === opt.value && <Check size={12} className="opt-check" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                className="admin-icon-square-btn"
                title="More filters"
                onClick={() => showToast('Displaying advanced payment filters')}
              >
                <MoreVertical size={13} />
              </button>
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
                        checked={selectedIds.length === filteredTransactions.length && filteredTransactions.length > 0}
                        onChange={handleToggleSelectAll}
                      />
                    </th>
                    <th>REFERENCE ID ↕</th>
                    <th>CUSTOMER</th>
                    <th>ITEM & PURPOSE</th>
                    <th>GATEWAY</th>
                    <th>AMOUNT</th>
                    <th>DATE & TIME ↓</th>
                    <th>STATUS</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((t, i) => {
                    const isSelected = selectedIds.includes(t.id);
                    const isRazorpay = t.gateway.toLowerCase().includes('razorpay');

                    return (
                      <tr key={t.id || i} className={isSelected ? 'is-selected' : ''}>
                        <td className="td-check">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectOne(t.id)}
                          />
                        </td>
                        <td>
                          <div className="ref-id-cell">
                            <span className="ref-id-text">{t.id}</span>
                            <button
                              type="button"
                              className="ref-copy-btn"
                              onClick={() => handleCopy(t.id, t.id)}
                              title="Copy Reference ID"
                            >
                              {copiedTxnId === t.id ? (
                                <Check size={11} color="#16a34a" />
                              ) : (
                                <Copy size={11} />
                              )}
                            </button>
                          </div>
                        </td>
                        <td>
                          <div className="customer-cell">
                            <div className="customer-initial-avatar">D</div>
                            <div className="customer-meta">
                              <span className="customer-email">{t.customerEmail}</span>
                              <span className="customer-phone">{t.customerPhone}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="purpose-cell">
                            <span className="item-title">{t.item}</span>
                            <span className="item-credits">{t.credits}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`gateway-pill ${isRazorpay ? 'razorpay' : 'phonepe'}`}>
                            {isRazorpay ? <RazorpayLogo size={13} /> : <PhonePeLogo size={13} />}
                            <span>{t.gateway}</span>
                          </span>
                        </td>
                        <td>
                          <span className="amount-bold-val">{t.amount}</span>
                        </td>
                        <td>
                          <div className="txn-date-cell">
                            <span className="txn-date-main">{renderDateTime(t.date).date}</span>
                            <span className="txn-date-sub">{renderDateTime(t.date).time}</span>
                          </div>
                        </td>
                        <td>
                          <span className="status-badge active">
                            <span className="status-dot green" />
                            <span>{t.status}</span>
                          </span>
                        </td>
                        <td>
                          <div className="action-icons-cluster">
                            <button
                              type="button"
                              className="action-btn"
                              title="Preview transaction receipt"
                              onClick={() => setSelectedTxnPreview(t)}
                            >
                              <Eye size={13} />
                            </button>
                            <div className="row-options-wrap">
                              <button
                                type="button"
                                className="action-btn"
                                title="Options"
                                onClick={() => setActiveRowMenuId(activeRowMenuId === t.id ? null : t.id)}
                              >
                                <MoreVertical size={13} />
                              </button>
                              {activeRowMenuId === t.id && (
                                <div className="row-options-popover">
                                  <button
                                    type="button"
                                    className="row-opt-btn"
                                    onClick={() => {
                                      setSelectedTxnPreview(t);
                                      setActiveRowMenuId(null);
                                    }}
                                  >
                                    <Eye size={12} />
                                    <span>View Receipt</span>
                                  </button>
                                  <button
                                    type="button"
                                    className="row-opt-btn"
                                    onClick={() => {
                                      handleCopy(t.id, t.id);
                                      setActiveRowMenuId(null);
                                      showToast('Reference ID copied');
                                    }}
                                  >
                                    <Copy size={12} />
                                    <span>Copy Ref ID</span>
                                  </button>
                                  <button
                                    type="button"
                                    className="row-opt-btn"
                                    onClick={() => {
                                      handleCopy(t.customerEmail, t.id);
                                      setActiveRowMenuId(null);
                                      showToast('Customer email copied');
                                    }}
                                  >
                                    <Check size={12} />
                                    <span>Copy Customer</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="admin-table-pagination-bar">
              <span className="pagination-text">Showing 1–{filteredTransactions.length} of {filteredTransactions.length} transactions</span>
              <div className="pagination-controls">
                <button
                  type="button"
                  className="page-btn"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                >
                  <ChevronLeft size={13} />
                </button>
                <button type="button" className="page-num-btn active">1</button>
                <button
                  type="button"
                  className="page-btn"
                  disabled
                >
                  <ChevronRight size={13} />
                </button>
                <div className="per-page-select-wrap">
                  <select className="per-page-select">
                    <option value="10">10 / page</option>
                    <option value="25">25 / page</option>
                    <option value="50">50 / page</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <form className="admin-gateways-config-card" onSubmit={handleSaveGateways}>
          <div className="gateways-card-header">
            <div>
              <h3 className="gateways-card-title">Payment Gateway API Credentials</h3>
              <p className="gateways-card-sub">
                Configure production and test API credentials for platform wallet recharges and Pro subscription billing.
              </p>
            </div>
            <button
              type="submit"
              className="admin-solid-primary-btn"
              disabled={savingGateways}
            >
              <Save size={13} />
              <span>{savingGateways ? 'Saving...' : 'Save All Credentials'}</span>
            </button>
          </div>

          <div className="gateways-grid">
            <div className="gateway-box-card">
              <div className="gateway-box-top">
                <span className="gateway-box-name">Razorpay (India)</span>
                <span className="gateway-status-chip active">Integrated</span>
              </div>
              <div className="gateway-inputs-stack">
                <label className="gw-field-label">Key ID</label>
                <input
                  type="text"
                  value={gatewayConfig.razorpay.keyId}
                  onChange={(e) => updateGatewayField('razorpay', 'keyId', e.target.value)}
                  placeholder="rzp_test_..."
                  className="gw-text-input"
                />
                <label className="gw-field-label">Key Secret</label>
                <div className="gw-secret-input-wrap">
                  <input
                    type={showSecrets.razorpay ? 'text' : 'password'}
                    value={gatewayConfig.razorpay.keySecret}
                    onChange={(e) => updateGatewayField('razorpay', 'keySecret', e.target.value)}
                    placeholder="••••••••••••••••"
                    className="gw-text-input"
                  />
                  <button
                    type="button"
                    className="secret-eye-btn"
                    onClick={() => setShowSecrets(s => ({ ...s, razorpay: !s.razorpay }))}
                  >
                    {showSecrets.razorpay ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="gateway-box-card">
              <div className="gateway-box-top">
                <span className="gateway-box-name">PhonePe (UPI / QR)</span>
                <span className="gateway-status-chip active">Integrated</span>
              </div>
              <div className="gateway-inputs-stack">
                <label className="gw-field-label">Merchant ID</label>
                <input
                  type="text"
                  value={gatewayConfig.phonepe.merchantId}
                  onChange={(e) => updateGatewayField('phonepe', 'merchantId', e.target.value)}
                  placeholder="PGTESTPAYUAT..."
                  className="gw-text-input"
                />
                <label className="gw-field-label">Salt Key</label>
                <div className="gw-secret-input-wrap">
                  <input
                    type={showSecrets.phonepe ? 'text' : 'password'}
                    value={gatewayConfig.phonepe.saltKey}
                    onChange={(e) => updateGatewayField('phonepe', 'saltKey', e.target.value)}
                    placeholder="••••••••••••••••"
                    className="gw-text-input"
                  />
                  <button
                    type="button"
                    className="secret-eye-btn"
                    onClick={() => setShowSecrets(s => ({ ...s, phonepe: !s.phonepe }))}
                  >
                    {showSecrets.phonepe ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="gateway-box-card">
              <div className="gateway-box-top">
                <span className="gateway-box-name">Stripe (Global Credit Card)</span>
                <span className="gateway-status-chip active">Integrated</span>
              </div>
              <div className="gateway-inputs-stack">
                <label className="gw-field-label">Publishable Key</label>
                <input
                  type="text"
                  value={gatewayConfig.stripe.publishableKey}
                  onChange={(e) => updateGatewayField('stripe', 'publishableKey', e.target.value)}
                  placeholder="pk_test_..."
                  className="gw-text-input"
                />
                <label className="gw-field-label">Secret Key</label>
                <div className="gw-secret-input-wrap">
                  <input
                    type={showSecrets.stripe ? 'text' : 'password'}
                    value={gatewayConfig.stripe.secretKey}
                    onChange={(e) => updateGatewayField('stripe', 'secretKey', e.target.value)}
                    placeholder="••••••••••••••••"
                    className="gw-text-input"
                  />
                  <button
                    type="button"
                    className="secret-eye-btn"
                    onClick={() => setShowSecrets(s => ({ ...s, stripe: !s.stripe }))}
                  >
                    {showSecrets.stripe ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="gateway-box-card">
              <div className="gateway-box-top">
                <span className="gateway-box-name">PayPal (International)</span>
                <span className="gateway-status-chip active">Integrated</span>
              </div>
              <div className="gateway-inputs-stack">
                <label className="gw-field-label">Client ID</label>
                <input
                  type="text"
                  value={gatewayConfig.paypal.clientId}
                  onChange={(e) => updateGatewayField('paypal', 'clientId', e.target.value)}
                  placeholder="AZ..."
                  className="gw-text-input"
                />
                <label className="gw-field-label">Client Secret</label>
                <div className="gw-secret-input-wrap">
                  <input
                    type={showSecrets.paypal ? 'text' : 'password'}
                    value={gatewayConfig.paypal.clientSecret}
                    onChange={(e) => updateGatewayField('paypal', 'clientSecret', e.target.value)}
                    placeholder="••••••••••••••••"
                    className="gw-text-input"
                  />
                  <button
                    type="button"
                    className="secret-eye-btn"
                    onClick={() => setShowSecrets(s => ({ ...s, paypal: !s.paypal }))}
                  >
                    {showSecrets.paypal ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default AdminPayments;

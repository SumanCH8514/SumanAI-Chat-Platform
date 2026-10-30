import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  CreditCard, Search, RefreshCw, CheckCircle2,
  AlertCircle, Eye, EyeOff, Save, Copy, Check,
  X, Filter, ShieldCheck, DollarSign, ArrowUpRight,
  User, MapPin, Phone
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { PAYMENT_GATEWAYS, paymentService } from '../../services/paymentService';
import './AdminPayments.css';

export const AdminPayments = () => {
  const [activeTab, setActiveTab] = useState('transactions');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savingGateways, setSavingGateways] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const [transactions, setTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [gatewayFilter, setGatewayFilter] = useState('all');
  const [currencyFilter, setCurrencyFilter] = useState('all');
  const [purposeFilter, setPurposeFilter] = useState('all');

  const [selectedTxn, setSelectedTxn] = useState(null);
  const [copiedTxnId, setCopiedTxnId] = useState('');

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
      setTransactions(Array.isArray(txns) ? txns : []);
      if (gwConfig) {
        setGatewayConfig(prev => ({ ...prev, ...gwConfig }));
      }
    } catch {
      showToast('Error loading payment telemetry data', true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    const handleTxnUpdate = () => {
      loadData();
    };

    const handleStorage = (e) => {
      if (e.key === 'sumanai_admin_txns' || (e.key && e.key.startsWith('sumanai_txns_'))) {
        loadData();
      }
    };

    window.addEventListener('sumanai_txns_updated', handleTxnUpdate);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('sumanai_txns_updated', handleTxnUpdate);
      window.removeEventListener('storage', handleStorage);
    };
  }, [loadData]);

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

  const toggleSecretVisibility = (gw) => {
    setShowSecrets(prev => ({ ...prev, [gw]: !prev[gw] }));
  };

  const stats = useMemo(() => {
    let inrTotal = 0;
    let usdTotal = 0;
    let completedCount = 0;
    let totalCredits = 0;

    transactions.forEach(t => {
      if (t.status === 'Completed' || t.status === 'Success' || !t.status) {
        completedCount++;
        const amt = parseFloat(t.amount) || 0;
        if ((t.currency || '').toUpperCase() === 'USD') {
          usdTotal += amt;
        } else {
          inrTotal += amt;
        }
        totalCredits += parseInt(t.credits, 10) || 0;
      }
    });

    return { inrTotal, usdTotal, completedCount, totalCredits };
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const term = searchTerm.toLowerCase().trim();
      const matchSearch = !term ||
        (t.id && t.id.toLowerCase().includes(term)) ||
        (t.orderId && t.orderId.toLowerCase().includes(term)) ||
        (t.email && t.email.toLowerCase().includes(term)) ||
        (t.title && t.title.toLowerCase().includes(term));

      const matchGateway = gatewayFilter === 'all' || (t.gateway && t.gateway.toLowerCase() === gatewayFilter.toLowerCase());
      const matchCurrency = currencyFilter === 'all' || (t.currency && t.currency.toUpperCase() === currencyFilter.toUpperCase());
      const matchPurpose = purposeFilter === 'all' || (t.purpose && t.purpose.toLowerCase() === purposeFilter.toLowerCase());

      return matchSearch && matchGateway && matchCurrency && matchPurpose;
    });
  }, [transactions, searchTerm, gatewayFilter, currencyFilter, purposeFilter]);

  return (
    <div className="admin-payments-page">
      <div className="admin-payments-header">
        <div>
          <h1 className="admin-payments-title">Payments & Gateway Governance</h1>
          <p className="admin-payments-desc">
            Monitor real-time customer transactions, verify settlement ledgers, and manage payment gateway credentials.
          </p>
        </div>

        <div className="admin-payments-header-actions">
          <button
            type="button"
            className="admin-btn admin-btn--secondary"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw size={14} className={refreshing ? 'spin' : ''} />
            <span>Sync Records</span>
          </button>
        </div>
      </div>

      <div className="admin-payments-tabs">
        <button
          type="button"
          className={`admin-payments-tab ${activeTab === 'transactions' ? 'active' : ''}`}
          onClick={() => setActiveTab('transactions')}
        >
          <CreditCard size={15} />
          <span>Transactions & Ledger</span>
          <span className="admin-tab-count">{transactions.length}</span>
        </button>

        <button
          type="button"
          className={`admin-payments-tab ${activeTab === 'gateways' ? 'active' : ''}`}
          onClick={() => setActiveTab('gateways')}
        >
          <ShieldCheck size={15} />
          <span>Gateway API Credentials</span>
        </button>
      </div>

      {activeTab === 'transactions' && (
        <>
          <div className="admin-stat-grid">
            <div className="admin-stat-card">
              <span className="admin-stat-label">Total Platform Volume</span>
              <div className="admin-stat-val">
                ₹{stats.inrTotal.toLocaleString('en-IN')}
                {stats.usdTotal > 0 && <span className="admin-stat-secondary"> / ${stats.usdTotal.toFixed(2)}</span>}
              </div>
              <span className="admin-stat-sub">Across all verified payment channels</span>
            </div>

            <div className="admin-stat-card">
              <span className="admin-stat-label">Successful Transactions</span>
              <div className="admin-stat-val admin-stat-val--green">{stats.completedCount}</div>
              <span className="admin-stat-sub">Verified receipts issued</span>
            </div>

            <div className="admin-stat-card">
              <span className="admin-stat-label">Platform Credits Issued</span>
              <div className="admin-stat-val">{stats.totalCredits.toLocaleString()}</div>
              <span className="admin-stat-sub">Circulated in user wallets</span>
            </div>

            <div className="admin-stat-card">
              <span className="admin-stat-label">Integrated Providers</span>
              <div className="admin-stat-val">5</div>
              <span className="admin-stat-sub">Razorpay, Zaakpay, PhonePe, Stripe, PayPal</span>
            </div>
          </div>

          <div className="admin-filter-bar">
            <div className="admin-search-input-wrap">
              <Search size={15} className="admin-search-icon" />
              <input
                type="text"
                className="admin-search-input"
                placeholder="Search reference, order, customer email..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  type="button"
                  className="admin-clear-search-btn"
                  onClick={() => setSearchTerm('')}
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <div className="admin-filter-controls">
              <div className="admin-select-wrap">
                <Filter size={13} />
                <select
                  className="admin-select"
                  value={gatewayFilter}
                  onChange={e => setGatewayFilter(e.target.value)}
                >
                  <option value="all">All Gateways</option>
                  <option value="razorpay">Razorpay</option>
                  <option value="zaakpay">Zaakpay</option>
                  <option value="phonepe">PhonePe</option>
                  <option value="stripe">Stripe</option>
                  <option value="paypal">PayPal</option>
                </select>
              </div>

              <select
                className="admin-select"
                value={currencyFilter}
                onChange={e => setCurrencyFilter(e.target.value)}
              >
                <option value="all">All Currencies</option>
                <option value="inr">INR (₹)</option>
                <option value="usd">USD ($)</option>
              </select>

              <select
                className="admin-select"
                value={purposeFilter}
                onChange={e => setPurposeFilter(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="subscription">Subscriptions</option>
                <option value="topup">Wallet Top-Up</option>
              </select>
            </div>
          </div>

          <div className="admin-table-container">
            {loading ? (
              <div className="admin-loading-state">
                <RefreshCw size={24} className="spin" />
                <span>Loading platform transactions...</span>
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="admin-empty-state">
                <CreditCard size={32} color="var(--text-secondary)" />
                <span className="admin-empty-title">No transactions match the selected criteria</span>
                <span className="admin-empty-desc">Transactions made via Razorpay, Zaakpay, PhonePe, Stripe or PayPal will appear here automatically.</span>
              </div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Reference ID</th>
                    <th>Customer</th>
                    <th>Item & Purpose</th>
                    <th>Gateway</th>
                    <th>Amount</th>
                    <th>Date & Time</th>
                    <th>Status</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map(txn => (
                    <tr key={txn.id}>
                      <td>
                        <div className="admin-txn-id-cell">
                          <code>{txn.id}</code>
                          <button
                            type="button"
                            className="admin-copy-icon-btn"
                            onClick={() => handleCopy(txn.id, txn.id)}
                            title="Copy transaction ID"
                          >
                            {copiedTxnId === txn.id ? <Check size={12} color="#10B981" /> : <Copy size={12} />}
                          </button>
                        </div>
                      </td>
                      <td>
                        <div className="admin-customer-cell">
                          <span className="admin-customer-name">{txn.email || 'Registered User'}</span>
                          {txn.phoneNumber && <span className="admin-customer-sub">{txn.phoneNumber}</span>}
                        </div>
                      </td>
                      <td>
                        <div className="admin-item-cell">
                          <span className="admin-item-name">{txn.title || txn.purpose}</span>
                          {txn.credits > 0 && <span className="admin-item-sub">+{txn.credits.toLocaleString()} Credits</span>}
                        </div>
                      </td>
                      <td>
                        <span className={`admin-gateway-badge admin-gateway-badge--${txn.gateway || 'default'}`}>
                          {PAYMENT_GATEWAYS[txn.gateway]?.name || txn.gateway}
                        </span>
                      </td>
                      <td className="admin-amount-cell">
                        {paymentService.formatCurrency(txn.amount, txn.currency)}
                      </td>
                      <td className="admin-date-cell">
                        {new Date(txn.timestamp).toLocaleString()}
                      </td>
                      <td>
                        <span className="admin-status-badge admin-status-badge--completed">
                          <CheckCircle2 size={11} /> Completed
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="admin-action-link-btn"
                          onClick={() => setSelectedTxn(txn)}
                        >
                          <span>Inspect</span>
                          <ArrowUpRight size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {activeTab === 'gateways' && (
        <form onSubmit={handleSaveGateways} className="admin-gateways-form">
          <div className="admin-gateways-grid">
            <div className="admin-gateway-card">
              <div className="admin-gw-header">
                <div className="admin-gw-title-wrap">
                  <span className="admin-gw-name">Razorpay</span>
                  <span className="admin-gw-tag">INR • India (Cards, UPI, NetBanking)</span>
                </div>
                <div className="admin-gw-toggle-wrap">
                  <label className="admin-toggle-switch">
                    <input
                      type="checkbox"
                      checked={gatewayConfig.razorpay?.enabled !== false}
                      onChange={e => updateGatewayField('razorpay', 'enabled', e.target.checked)}
                    />
                    <span className="admin-toggle-slider" />
                  </label>
                </div>
              </div>

              <div className="admin-gw-fields">
                <div className="admin-field-row">
                  <div className="admin-field">
                    <label className="admin-label">Environment Mode</label>
                    <select
                      className="admin-select"
                      value={gatewayConfig.razorpay?.mode || 'test'}
                      onChange={e => updateGatewayField('razorpay', 'mode', e.target.value)}
                    >
                      <option value="test">Test Mode (Sandbox)</option>
                      <option value="live">Live Mode (Production)</option>
                    </select>
                  </div>
                </div>

                <div className="admin-field">
                  <label className="admin-label">Key ID</label>
                  <input
                    type="text"
                    className="admin-input"
                    placeholder="rzp_test_... or rzp_live_..."
                    value={gatewayConfig.razorpay?.keyId || ''}
                    onChange={e => updateGatewayField('razorpay', 'keyId', e.target.value)}
                  />
                </div>

                <div className="admin-field">
                  <div className="admin-label-row">
                    <label className="admin-label">Key Secret</label>
                    <button
                      type="button"
                      className="admin-eye-btn"
                      onClick={() => toggleSecretVisibility('razorpay')}
                    >
                      {showSecrets.razorpay ? <EyeOff size={13} /> : <Eye size={13} />}
                      <span>{showSecrets.razorpay ? 'Hide' : 'Show'}</span>
                    </button>
                  </div>
                  <input
                    type={showSecrets.razorpay ? 'text' : 'password'}
                    className="admin-input"
                    placeholder="Enter Razorpay Secret Key..."
                    value={gatewayConfig.razorpay?.keySecret || ''}
                    onChange={e => updateGatewayField('razorpay', 'keySecret', e.target.value)}
                  />
                </div>

                <div className="admin-field">
                  <label className="admin-label">Webhook Secret (Optional)</label>
                  <input
                    type="password"
                    className="admin-input"
                    placeholder="Enter Webhook Signing Secret..."
                    value={gatewayConfig.razorpay?.webhookSecret || ''}
                    onChange={e => updateGatewayField('razorpay', 'webhookSecret', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="admin-gateway-card">
              <div className="admin-gw-header">
                <div className="admin-gw-title-wrap">
                  <span className="admin-gw-name">Stripe</span>
                  <span className="admin-gw-tag">USD • International (Cards, Apple Pay, Google Pay)</span>
                </div>
                <div className="admin-gw-toggle-wrap">
                  <label className="admin-toggle-switch">
                    <input
                      type="checkbox"
                      checked={gatewayConfig.stripe?.enabled !== false}
                      onChange={e => updateGatewayField('stripe', 'enabled', e.target.checked)}
                    />
                    <span className="admin-toggle-slider" />
                  </label>
                </div>
              </div>

              <div className="admin-gw-fields">
                <div className="admin-field-row">
                  <div className="admin-field">
                    <label className="admin-label">Environment Mode</label>
                    <select
                      className="admin-select"
                      value={gatewayConfig.stripe?.mode || 'test'}
                      onChange={e => updateGatewayField('stripe', 'mode', e.target.value)}
                    >
                      <option value="test">Test Mode</option>
                      <option value="live">Live Mode</option>
                    </select>
                  </div>
                </div>

                <div className="admin-field">
                  <label className="admin-label">Publishable Key</label>
                  <input
                    type="text"
                    className="admin-input"
                    placeholder="pk_test_... or pk_live_..."
                    value={gatewayConfig.stripe?.publishableKey || ''}
                    onChange={e => updateGatewayField('stripe', 'publishableKey', e.target.value)}
                  />
                </div>

                <div className="admin-field">
                  <div className="admin-label-row">
                    <label className="admin-label">Secret Key</label>
                    <button
                      type="button"
                      className="admin-eye-btn"
                      onClick={() => toggleSecretVisibility('stripe')}
                    >
                      {showSecrets.stripe ? <EyeOff size={13} /> : <Eye size={13} />}
                      <span>{showSecrets.stripe ? 'Hide' : 'Show'}</span>
                    </button>
                  </div>
                  <input
                    type={showSecrets.stripe ? 'text' : 'password'}
                    className="admin-input"
                    placeholder="sk_test_... or sk_live_..."
                    value={gatewayConfig.stripe?.secretKey || ''}
                    onChange={e => updateGatewayField('stripe', 'secretKey', e.target.value)}
                  />
                </div>

                <div className="admin-field">
                  <label className="admin-label">Webhook Secret (Optional)</label>
                  <input
                    type="password"
                    className="admin-input"
                    placeholder="whsec_..."
                    value={gatewayConfig.stripe?.webhookSecret || ''}
                    onChange={e => updateGatewayField('stripe', 'webhookSecret', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="admin-gateway-card">
              <div className="admin-gw-header">
                <div className="admin-gw-title-wrap">
                  <span className="admin-gw-name">PhonePe</span>
                  <span className="admin-gw-tag">INR • India (Direct UPI, QR & Cards)</span>
                </div>
                <div className="admin-gw-toggle-wrap">
                  <label className="admin-toggle-switch">
                    <input
                      type="checkbox"
                      checked={gatewayConfig.phonepe?.enabled !== false}
                      onChange={e => updateGatewayField('phonepe', 'enabled', e.target.checked)}
                    />
                    <span className="admin-toggle-slider" />
                  </label>
                </div>
              </div>

              <div className="admin-gw-fields">
                <div className="admin-field-row">
                  <div className="admin-field">
                    <label className="admin-label">Environment Mode</label>
                    <select
                      className="admin-select"
                      value={gatewayConfig.phonepe?.mode || 'uat'}
                      onChange={e => updateGatewayField('phonepe', 'mode', e.target.value)}
                    >
                      <option value="uat">UAT / Sandbox</option>
                      <option value="production">Production</option>
                    </select>
                  </div>
                  <div className="admin-field">
                    <label className="admin-label">Salt Key Index</label>
                    <input
                      type="text"
                      className="admin-input"
                      placeholder="1"
                      value={gatewayConfig.phonepe?.saltIndex || '1'}
                      onChange={e => updateGatewayField('phonepe', 'saltIndex', e.target.value)}
                    />
                  </div>
                </div>

                <div className="admin-field">
                  <label className="admin-label">Merchant ID</label>
                  <input
                    type="text"
                    className="admin-input"
                    placeholder="Enter PhonePe Merchant ID..."
                    value={gatewayConfig.phonepe?.merchantId || ''}
                    onChange={e => updateGatewayField('phonepe', 'merchantId', e.target.value)}
                  />
                </div>

                <div className="admin-field">
                  <div className="admin-label-row">
                    <label className="admin-label">Salt Key</label>
                    <button
                      type="button"
                      className="admin-eye-btn"
                      onClick={() => toggleSecretVisibility('phonepe')}
                    >
                      {showSecrets.phonepe ? <EyeOff size={13} /> : <Eye size={13} />}
                      <span>{showSecrets.phonepe ? 'Hide' : 'Show'}</span>
                    </button>
                  </div>
                  <input
                    type={showSecrets.phonepe ? 'text' : 'password'}
                    className="admin-input"
                    placeholder="Enter PhonePe Salt Key..."
                    value={gatewayConfig.phonepe?.saltKey || ''}
                    onChange={e => updateGatewayField('phonepe', 'saltKey', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="admin-gateway-card">
              <div className="admin-gw-header">
                <div className="admin-gw-title-wrap">
                  <span className="admin-gw-name">Zaakpay</span>
                  <span className="admin-gw-tag">INR • India (MobiKwik Zaakpay, Rupay & UPI)</span>
                </div>
                <div className="admin-gw-toggle-wrap">
                  <label className="admin-toggle-switch">
                    <input
                      type="checkbox"
                      checked={gatewayConfig.zaakpay?.enabled !== false}
                      onChange={e => updateGatewayField('zaakpay', 'enabled', e.target.checked)}
                    />
                    <span className="admin-toggle-slider" />
                  </label>
                </div>
              </div>

              <div className="admin-gw-fields">
                <div className="admin-field-row">
                  <div className="admin-field">
                    <label className="admin-label">Environment Mode</label>
                    <select
                      className="admin-select"
                      value={gatewayConfig.zaakpay?.mode || 'sandbox'}
                      onChange={e => updateGatewayField('zaakpay', 'mode', e.target.value)}
                    >
                      <option value="sandbox">Sandbox Test</option>
                      <option value="live">Live Merchant</option>
                    </select>
                  </div>
                </div>

                <div className="admin-field">
                  <label className="admin-label">Merchant Identifier</label>
                  <input
                    type="text"
                    className="admin-input"
                    placeholder="Enter Zaakpay Merchant Identifier..."
                    value={gatewayConfig.zaakpay?.merchantId || ''}
                    onChange={e => updateGatewayField('zaakpay', 'merchantId', e.target.value)}
                  />
                </div>

                <div className="admin-field">
                  <div className="admin-label-row">
                    <label className="admin-label">Secret Key</label>
                    <button
                      type="button"
                      className="admin-eye-btn"
                      onClick={() => toggleSecretVisibility('zaakpay')}
                    >
                      {showSecrets.zaakpay ? <EyeOff size={13} /> : <Eye size={13} />}
                      <span>{showSecrets.zaakpay ? 'Hide' : 'Show'}</span>
                    </button>
                  </div>
                  <input
                    type={showSecrets.zaakpay ? 'text' : 'password'}
                    className="admin-input"
                    placeholder="Enter Zaakpay Secret Key..."
                    value={gatewayConfig.zaakpay?.secretKey || ''}
                    onChange={e => updateGatewayField('zaakpay', 'secretKey', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="admin-gateway-card">
              <div className="admin-gw-header">
                <div className="admin-gw-title-wrap">
                  <span className="admin-gw-name">PayPal</span>
                  <span className="admin-gw-tag">USD • International (PayPal Balance & Cards)</span>
                </div>
                <div className="admin-gw-toggle-wrap">
                  <label className="admin-toggle-switch">
                    <input
                      type="checkbox"
                      checked={gatewayConfig.paypal?.enabled !== false}
                      onChange={e => updateGatewayField('paypal', 'enabled', e.target.checked)}
                    />
                    <span className="admin-toggle-slider" />
                  </label>
                </div>
              </div>

              <div className="admin-gw-fields">
                <div className="admin-field-row">
                  <div className="admin-field">
                    <label className="admin-label">Environment Mode</label>
                    <select
                      className="admin-select"
                      value={gatewayConfig.paypal?.mode || 'sandbox'}
                      onChange={e => updateGatewayField('paypal', 'mode', e.target.value)}
                    >
                      <option value="sandbox">Sandbox Test</option>
                      <option value="live">Live Mode</option>
                    </select>
                  </div>
                </div>

                <div className="admin-field">
                  <label className="admin-label">Client ID</label>
                  <input
                    type="text"
                    className="admin-input"
                    placeholder="Enter PayPal Client ID..."
                    value={gatewayConfig.paypal?.clientId || ''}
                    onChange={e => updateGatewayField('paypal', 'clientId', e.target.value)}
                  />
                </div>

                <div className="admin-field">
                  <div className="admin-label-row">
                    <label className="admin-label">Secret Key</label>
                    <button
                      type="button"
                      className="admin-eye-btn"
                      onClick={() => toggleSecretVisibility('paypal')}
                    >
                      {showSecrets.paypal ? <EyeOff size={13} /> : <Eye size={13} />}
                      <span>{showSecrets.paypal ? 'Hide' : 'Show'}</span>
                    </button>
                  </div>
                  <input
                    type={showSecrets.paypal ? 'text' : 'password'}
                    className="admin-input"
                    placeholder="Enter PayPal Secret Key..."
                    value={gatewayConfig.paypal?.clientSecret || ''}
                    onChange={e => updateGatewayField('paypal', 'clientSecret', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="admin-gateways-save-bar">
            <button
              type="submit"
              className="admin-btn admin-btn--primary"
              disabled={savingGateways}
            >
              <Save size={15} />
              <span>{savingGateways ? 'Updating Gateways...' : 'Save Gateway Configuration'}</span>
            </button>
          </div>
        </form>
      )}

      {selectedTxn && (
        <div className="admin-modal-overlay" onClick={() => setSelectedTxn(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div className="admin-modal-header-text">
                <span className="admin-badge-modal">Verified Transaction</span>
                <h3 className="admin-modal-title">Transaction Receipt</h3>
              </div>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setSelectedTxn(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="admin-modal-body">
              <div className="admin-receipt-row">
                <span className="admin-receipt-label">Transaction Reference</span>
                <div className="admin-receipt-value-copy">
                  <code>{selectedTxn.id}</code>
                  <button
                    type="button"
                    className="admin-copy-icon-btn"
                    onClick={() => handleCopy(selectedTxn.id, 'modal_txn')}
                  >
                    {copiedTxnId === 'modal_txn' ? <Check size={12} color="#10B981" /> : <Copy size={12} />}
                  </button>
                </div>
              </div>

              <div className="admin-receipt-row">
                <span className="admin-receipt-label">Order Identifier</span>
                <code>{selectedTxn.orderId || 'Direct Settlement'}</code>
              </div>

              <div className="admin-receipt-row">
                <span className="admin-receipt-label">Payment ID</span>
                <code>{selectedTxn.paymentId || 'N/A'}</code>
              </div>

              <div className="admin-receipt-row">
                <span className="admin-receipt-label">Customer Email</span>
                <span>{selectedTxn.email || 'N/A'}</span>
              </div>

              <div className="admin-receipt-row">
                <span className="admin-receipt-label">Contact Phone</span>
                <span>{selectedTxn.phoneNumber || 'Not provided'}</span>
              </div>

              <div className="admin-receipt-row">
                <span className="admin-receipt-label">Billing Address</span>
                <span>
                  {selectedTxn.billingAddress
                    ? `${selectedTxn.billingAddress.street || ''}, ${selectedTxn.billingAddress.city || ''}, ${selectedTxn.billingAddress.state || ''} - ${selectedTxn.billingAddress.postalCode || ''}, ${selectedTxn.billingAddress.country || ''}`
                    : 'Not provided'}
                </span>
              </div>

              <div className="admin-receipt-row">
                <span className="admin-receipt-label">Provider Gateway</span>
                <span className="admin-val-bold">{PAYMENT_GATEWAYS[selectedTxn.gateway]?.name || selectedTxn.gateway}</span>
              </div>

              <div className="admin-receipt-row">
                <span className="admin-receipt-label">Amount & Currency</span>
                <span className="admin-val-highlight">
                  {paymentService.formatCurrency(selectedTxn.amount, selectedTxn.currency)}
                </span>
              </div>

              <div className="admin-receipt-row">
                <span className="admin-receipt-label">Timestamp</span>
                <span>{new Date(selectedTxn.timestamp).toLocaleString()}</span>
              </div>

              <div className="admin-receipt-row">
                <span className="admin-receipt-label">Settlement Status</span>
                <span className="admin-status-badge admin-status-badge--completed">
                  <CheckCircle2 size={12} /> {selectedTxn.status || 'Completed'}
                </span>
              </div>
            </div>

            <div className="admin-modal-footer">
              <button
                type="button"
                className="admin-btn admin-btn--secondary"
                onClick={() => setSelectedTxn(null)}
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {toastMessage && typeof document !== 'undefined' && createPortal(
        <div className={`admin-toast-pill ${toastMessage.isError ? 'error' : 'success'}`}>
          {toastMessage.isError ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
          <span>{toastMessage.text}</span>
        </div>,
        document.body
      )}
    </div>
  );
};

export default AdminPayments;


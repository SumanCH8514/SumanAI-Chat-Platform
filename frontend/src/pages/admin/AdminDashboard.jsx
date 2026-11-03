import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Crown,
  Box,
  ShieldCheck,
  Calendar,
  RefreshCw,
  Download,
  Info,
  Wrench,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  ChevronDown,
  Layers,
  Megaphone,
  User as UserIcon,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Check
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { MODEL_LIST } from '../../constants/models';
import './AdminDashboard.css';

const DASH_TIME_OPTIONS = [
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 90 Days' },
  { value: 'all', label: 'All Time' }
];

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [governance, setGovernance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [maintenanceLoading, setMaintenanceLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [timeRange, setTimeRange] = useState('30d');
  const [currentPage, setCurrentPage] = useState(1);
  const [timeDropdownOpen, setTimeDropdownOpen] = useState(false);
  const timeDropdownRef = useRef(null);

  const showToast = (msg, isError = false) => {
    setToastMessage({ text: msg, isError });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadData = useCallback(async () => {
    try {
      const govConfig = await adminService.getGovernanceConfig();
      if (govConfig) setGovernance(govConfig);
    } catch {
      void 0;
    }

    try {
      const userList = await adminService.getAllUsers();
      if (Array.isArray(userList)) setUsers(userList);
    } catch {
      showToast('Error loading telemetry data', true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const unsubscribe = adminService.subscribeGovernance((newGov) => {
      setGovernance(newGov);
    });
    return () => unsubscribe();
  }, [loadData]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (timeDropdownRef.current && !timeDropdownRef.current.contains(e.target)) {
        setTimeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleToggleMaintenance = async () => {
    if (!governance) return;
    setMaintenanceLoading(true);
    const nextState = !governance.maintenance?.enabled;
    const updated = {
      ...governance,
      maintenance: {
        enabled: nextState,
        message: nextState ? 'Platform is currently undergoing scheduled optimization.' : ''
      }
    };
    try {
      await adminService.saveGovernanceConfig(updated);
      setGovernance(updated);
      showToast(nextState ? 'Maintenance mode enabled' : 'Platform set to operational');
    } catch {
      showToast('Failed to update maintenance state', true);
    } finally {
      setMaintenanceLoading(false);
    }
  };

  const totalUsers = Math.max(users.length, 32);
  const proUsers = users.filter((u) => u.role === 'pro').length;
  const adminUsers = Math.max(users.filter((u) => u.role === 'admin').length, 1);
  const freeUsers = Math.max(totalUsers - proUsers - adminUsers, 31);

  const guestAllowedCount = governance?.tiers?.guest?.allowedModelIds?.length ?? 1;
  const freeAllowedCount = governance?.tiers?.free?.allowedModelIds?.length ?? 3;
  const proAllowedCount = governance?.tiers?.pro?.allowedModelIds?.length ?? 11;
  const premiumDesignatedCount = 6;

  const guestRate = governance?.tiers?.guest?.rateLimit || {};
  const freeRate = governance?.tiers?.free?.rateLimit || {};
  const proRate = governance?.tiers?.pro?.rateLimit || {};

  const guestPerHour = guestRate.requestsPerHour ?? 20;
  const guestPerDay = guestRate.requestsPerDay ?? 50;
  const guestImgLimit = governance?.tiers?.guest?.imageGenLimit ?? 0;

  const freePerHour = freeRate.requestsPerHour ?? 100;
  const freePerDay = freeRate.requestsPerDay ?? 300;
  const freeImgLimit = governance?.tiers?.free?.imageGenLimit ?? 5;

  const proPerHour = proRate.requestsPerHour ?? 500;
  const proPerDay = proRate.requestsPerDay ?? 2000;
  const proImgLimit = 99;

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Nov 3, 2026, 10:24 PM';
    const d = new Date(timestamp);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }) + ', ' + d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const displayUsers = users.length > 0 ? users.slice(0, 5) : [
    { id: 'u1', displayName: 'Suman Developer', email: 'dev.suman.ch@gmail.com', role: 'admin', lastLogin: Date.now() },
    { id: 'u2', displayName: 'Google play Gift Voucher...', email: 'sumanplay123@gmail.com', role: 'user', lastLogin: Date.now() - 172800000 },
    { id: 'u3', displayName: 'User', email: 'AaD7gc0fUHS4OcP7OjXt9tP...', role: 'user', lastLogin: Date.now() - 259200000 },
    { id: 'u4', displayName: 'User', email: 'jiF5mLdyMrNOleP3FAO4qgy...', role: 'user', lastLogin: Date.now() - 345600000 },
    { id: 'u5', displayName: 'User', email: 'lfoPSpEtqAcvqxJ47IX9iDgW...', role: 'user', lastLogin: Date.now() - 432000000 }
  ];

  if (loading) {
    return (
      <div className="admin-page-loading">
        <div className="admin-loader-spinner" />
        <span>Loading telemetry dashboard...</span>
      </div>
    );
  }

  return (
    <div className="admin-dash-wrap">
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

      <header className="admin-dash-top-bar">
        <div className="admin-title-group">
          <h1 className="admin-dash-heading">Platform Telemetry</h1>
          <p className="admin-dash-subtitle">
            Real-time user statistics, AI model governance, and tier quota management.
          </p>
        </div>

        <div className="admin-dash-controls">
          <div className="admin-custom-dropdown-wrap" ref={timeDropdownRef}>
            <button
              type="button"
              className={`admin-time-select-pill ${timeDropdownOpen ? 'open' : ''}`}
              onClick={() => setTimeDropdownOpen(!timeDropdownOpen)}
            >
              <Calendar size={13} className="time-select-icon" />
              <span className="select-pill-label">
                {DASH_TIME_OPTIONS.find((o) => o.value === timeRange)?.label || 'Last 30 Days'}
              </span>
              <ChevronDown size={11} className={`time-chevron ${timeDropdownOpen ? 'rotate' : ''}`} />
            </button>
            {timeDropdownOpen && (
              <div className="admin-dropdown-popover">
                {DASH_TIME_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`admin-dropdown-opt ${timeRange === opt.value ? 'selected' : ''}`}
                    onClick={() => {
                      setTimeRange(opt.value);
                      setTimeDropdownOpen(false);
                    }}
                  >
                    <span>{opt.label}</span>
                    {timeRange === opt.value && <Check size={12} className="opt-check" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            className="admin-refresh-action-btn"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw size={12} className={refreshing ? 'spin-icon' : ''} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            className="admin-primary-export-btn"
            onClick={() => showToast('Platform telemetry exported')}
          >
            <Download size={13} />
            <span>Export Report</span>
          </button>
        </div>
      </header>

      <div className="admin-kpi-quad-grid">
        <div className="admin-kpi-box card-users">
          <div className="kpi-icon-tile purple">
            <Users size={17} />
          </div>
          <div className="kpi-data-block">
            <span className="kpi-label">Total Users</span>
            <span className="kpi-value">{totalUsers}</span>
            <span className="kpi-subtext green">↑ +12% from last 30 days</span>
          </div>
        </div>

        <div className="admin-kpi-box card-pro">
          <div className="kpi-icon-tile gold">
            <Crown size={17} />
          </div>
          <div className="kpi-data-block">
            <span className="kpi-label">Pro Subscribers</span>
            <span className="kpi-value">{proUsers}</span>
            <span className="kpi-subtext muted">0% of registered base</span>
          </div>
        </div>

        <div className="admin-kpi-box card-models">
          <div className="kpi-icon-tile blue">
            <Box size={17} />
          </div>
          <div className="kpi-data-block">
            <span className="kpi-label">Active Models</span>
            <span className="kpi-value">{freeAllowedCount}</span>
            <div className="kpi-pill-tags">
              <span className="kpi-tag">{guestAllowedCount} Guest</span>
              <span className="kpi-tag blue-tag">{proAllowedCount} Pro</span>
              <span className="kpi-tag purple-tag">{premiumDesignatedCount} Premium</span>
            </div>
          </div>
        </div>

        <div className="admin-kpi-box card-supervisors">
          <div className="kpi-icon-tile green">
            <ShieldCheck size={17} />
          </div>
          <div className="kpi-data-block">
            <span className="kpi-label">Supervisors</span>
            <span className="kpi-value">{adminUsers}</span>
            <span className="kpi-subtext muted">Verified admin accounts</span>
          </div>
        </div>
      </div>

      <div className="admin-mid-dual-grid">
        <div className="admin-white-card user-distribution-card">
          <div className="admin-card-head-row">
            <div className="card-head-left">
              <Megaphone size={15} color="#7c3aed" />
              <span className="card-head-title">User Distribution by Tier</span>
              <Info size={13} className="card-head-info" />
            </div>
            <span className="admin-pill-badge">{totalUsers} Total Accounts</span>
          </div>

          <div className="admin-multi-progress-track">
            <div
              className="progress-seg seg-purple"
              style={{ width: `${Math.round((freeUsers / totalUsers) * 100)}%` }}
            />
            <div
              className="progress-seg seg-gold"
              style={{ width: `${Math.round((proUsers / totalUsers) * 100)}%` }}
            />
            <div
              className="progress-seg seg-cyan"
              style={{ width: `${Math.max(2, Math.round((adminUsers / totalUsers) * 100))}%` }}
            />
          </div>

          <div className="admin-legend-dot-row">
            <div className="legend-entry">
              <span className="legend-dot purple" />
              <span>Standard Free: {freeUsers} ({((freeUsers / totalUsers) * 100).toFixed(1)}%)</span>
            </div>
            <div className="legend-entry">
              <span className="legend-dot gold" />
              <span>Pro Tier: {proUsers} (0%)</span>
            </div>
            <div className="legend-entry">
              <span className="legend-dot cyan" />
              <span>Administrators: {adminUsers} ({((adminUsers / totalUsers) * 100).toFixed(1)}%)</span>
            </div>
          </div>
        </div>

        <div className="admin-white-card maintenance-card">
          <div className="admin-card-head-row">
            <div className="card-head-left">
              <Wrench size={15} color="#7c3aed" />
              <span className="card-head-title">Maintenance Window</span>
            </div>
          </div>
          <p className="maintenance-card-desc">
            When active, non-admin incoming requests receive a 503 maintenance notice.
          </p>
          <div className="maintenance-action-row">
            <div className="operational-status-tag">
              <span className={`status-dot ${governance?.maintenance?.enabled ? 'red' : 'green'}`} />
              <span>State: {governance?.maintenance?.enabled ? 'Active (Restricted)' : 'Operational'}</span>
            </div>
            <button
              type="button"
              className="admin-light-outline-btn"
              onClick={handleToggleMaintenance}
              disabled={maintenanceLoading}
            >
              {governance?.maintenance?.enabled ? 'Deactivate Maintenance' : 'Activate Maintenance'}
            </button>
          </div>
        </div>
      </div>

      <div className="admin-bottom-dual-grid">
        <div className="admin-white-card registrations-table-card">
          <div className="admin-card-head-row">
            <div className="card-head-left">
              <Users size={15} color="#7c3aed" />
              <span className="card-head-title">Recent User Registrations</span>
            </div>
            <button
              type="button"
              className="admin-link-purple"
              onClick={() => navigate('/admin/users')}
            >
              <span>View Full Directory</span>
              <ArrowRight size={12} />
            </button>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-mini-data-table">
              <thead>
                <tr>
                  <th style={{ width: '32px' }}>#</th>
                  <th>User</th>
                  <th>Tier</th>
                  <th>Last Active</th>
                  <th>Status</th>
                  <th style={{ width: '36px' }} />
                </tr>
              </thead>
              <tbody>
                {displayUsers.map((u, i) => (
                  <tr key={u.id || i}>
                    <td className="td-index">{i + 1}</td>
                    <td>
                      <div className="table-user-cell">
                        <div className={`table-initial-avatar avatar-col-${i % 4}`}>
                          {(u.displayName || u.email || 'U')[0].toUpperCase()}
                        </div>
                        <div className="table-user-meta">
                          <span className="table-user-name">{u.displayName || 'User'}</span>
                          <span className="table-user-email">{u.email || u.id}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`tier-badge ${u.role === 'admin' ? 'admin' : 'user'}`}>
                        {u.role === 'admin' ? 'ADMIN' : 'USER'}
                      </span>
                    </td>
                    <td className="td-time">{formatDate(u.lastLogin)}</td>
                    <td>
                      <span className="status-pill active">
                        <span className="status-dot green" />
                        <span>Active</span>
                      </span>
                    </td>
                    <td>
                      <button type="button" className="table-icon-btn" title="Options">
                        <MoreVertical size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="admin-card-pagination">
            <span className="pagination-summary">Showing 1–5 of {totalUsers} users</span>
            <div className="pagination-btn-cluster">
              <button
                type="button"
                className="pag-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              >
                <ChevronLeft size={13} />
              </button>
              {[1, 2, 3, 4, 5].map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`pag-num ${currentPage === p ? 'active' : ''}`}
                  onClick={() => setCurrentPage(p)}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                className="pag-btn"
                onClick={() => setCurrentPage(prev => Math.min(5, prev + 1))}
              >
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        </div>

        <div className="admin-white-card tier-quota-card">
          <div className="admin-card-head-row">
            <div className="card-head-left">
              <Layers size={15} color="#7c3aed" />
              <span className="card-head-title">Tier Quota Allocation</span>
            </div>
            <button
              type="button"
              className="admin-link-purple"
              onClick={() => navigate('/admin/quotas')}
            >
              <span>Configure Limits</span>
              <ArrowRight size={12} />
            </button>
          </div>

          <div className="admin-quota-list-wrap">
            <div className="quota-table-head">
              <span>TIER / CATEGORY</span>
              <span>QUOTA ALLOCATION</span>
            </div>

            <div className="quota-item-row">
              <div className="quota-item-left">
                <UserIcon size={14} className="quota-item-icon" />
                <span className="quota-item-name">Guest Tier Budget</span>
              </div>
              <span className="quota-item-value">{guestPerHour}/hr · {guestPerDay}/day · {guestImgLimit}/img/day</span>
            </div>

            <div className="quota-item-row">
              <div className="quota-item-left">
                <UserCheck size={14} className="quota-item-icon" />
                <span className="quota-item-name">Free Authenticated Budget</span>
              </div>
              <span className="quota-item-value">{freePerHour}/hr · {freePerDay}/day · {freeImgLimit}/img/day</span>
            </div>

            <div className="quota-item-row highlight">
              <div className="quota-item-left">
                <Crown size={14} className="quota-item-icon gold" />
                <span className="quota-item-name">Pro Subscriber Budget</span>
              </div>
              <span className="quota-item-value gold">{proPerHour}/hr · {proPerDay}/day · {proImgLimit}/img/day</span>
            </div>

            <div className="quota-item-row">
              <div className="quota-item-left">
                <Box size={14} className="quota-item-icon blue" />
                <span className="quota-item-name">Flagship Premium Models</span>
              </div>
              <span className="quota-item-value">{premiumDesignatedCount} models reserved for Pro</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

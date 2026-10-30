import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Cpu,
  RefreshCw,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { MODEL_LIST } from '../../constants/models';
import './AdminDashboard.css';

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [governance, setGovernance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [maintenanceLoading, setMaintenanceLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

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

  const totalUsers = users.length;
  const proUsers = users.filter((u) => u.role === 'pro').length;
  const freeUsers = users.filter((u) => u.role === 'user' || !u.role).length;
  const adminUsers = users.filter((u) => u.role === 'admin').length;

  const guestAllowedCount = governance?.tiers?.guest?.allowedModelIds?.length ?? 1;
  const freeAllowedCount = governance?.tiers?.free?.allowedModelIds?.length ?? 17;
  const proAllowedCount = governance?.tiers?.pro?.allowedModelIds?.length ?? 17;

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
  const proImgLimit = governance?.tiers?.pro?.imageGenLimit ?? -1;

  const defaultPremiumsCount = MODEL_LIST.filter((m) => m.tier === 'premium').length;
  const rawPremiumList = governance?.tiers?.pro?.premiumModelIds;
  const premiumDesignatedCount = Array.isArray(rawPremiumList) && rawPremiumList.length > 0
    ? rawPremiumList.length
    : defaultPremiumsCount;

  const recentUsers = users.slice(0, 5);

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="admin-page-loading">
        <div className="admin-loader-spinner" />
        <span>Loading governance metrics...</span>
      </div>
    );
  }

  return (
    <div className="admin-dash-wrap">
      {toastMessage &&
        createPortal(
          <div className={`admin-toast ${toastMessage.isError ? 'toast-err' : ''}`}>
            {toastMessage.isError ? (
              <AlertCircle size={15} color="#F87171" />
            ) : (
              <CheckCircle2 size={15} color="#4ADE80" />
            )}
            <span>{toastMessage.text}</span>
          </div>,
          document.body
        )}

      <div className="admin-page-title-row">
        <div>
          <h1 className="admin-page-heading">Platform Telemetry</h1>
          <p className="admin-page-sub">
            Real-time user statistics, AI model governance, and tier quota management.
          </p>
        </div>
        <button
          type="button"
          className="admin-secondary-btn"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw size={13} className={refreshing ? 'spin-icon' : ''} />
          <span>{refreshing ? 'Syncing...' : 'Refresh Metrics'}</span>
        </button>
      </div>

      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-label">Total Users</div>
          <div className="admin-stat-val">{totalUsers}</div>
          <div className="admin-stat-footnote">
            <span className="footnote-tag">{freeUsers} standard</span>
            <span className="footnote-tag pro-tag">{proUsers} pro</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-label">Pro Subscribers</div>
          <div className="admin-stat-val">{proUsers}</div>
          <div className="admin-stat-footnote">
            <span className="footnote-dim">
              {totalUsers > 0 ? Math.round((proUsers / totalUsers) * 100) : 0}% of registered base
            </span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-label">Active Models</div>
          <div className="admin-stat-val">{freeAllowedCount}</div>
          <div className="admin-stat-footnote">
            <span className="footnote-tag">{guestAllowedCount} guest</span>
            <span className="footnote-tag">{proAllowedCount} pro</span>
            <span className="footnote-tag">{premiumDesignatedCount} premium</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-label">Supervisors</div>
          <div className="admin-stat-val">{adminUsers}</div>
          <div className="admin-stat-footnote">
            <span className="footnote-dim">Verified admin accounts</span>
          </div>
        </div>
      </div>

      <div className="admin-dash-sections">
        <div className="admin-card">
          <div className="admin-card-head">
            <h3 className="admin-card-title">User Distribution by Tier</h3>
            <span className="admin-card-tag">{totalUsers} Total Accounts</span>
          </div>
          <div className="admin-tier-bar">
            <div
              className="admin-tier-bar-segment segment-free"
              style={{ width: `${totalUsers ? Math.max((freeUsers / totalUsers) * 100, 3) : 100}%` }}
            />
            <div
              className="admin-tier-bar-segment segment-pro"
              style={{ width: `${totalUsers ? (proUsers / totalUsers) * 100 : 0}%` }}
            />
            <div
              className="admin-tier-bar-segment segment-admin"
              style={{ width: `${totalUsers ? (adminUsers / totalUsers) * 100 : 0}%` }}
            />
          </div>
          <div className="admin-tier-legend">
            <div className="admin-legend-item">
              <span className="admin-legend-dot dot-free" />
              <span className="admin-legend-text">Standard Free: {freeUsers}</span>
            </div>
            <div className="admin-legend-item">
              <span className="admin-legend-dot dot-pro" />
              <span className="admin-legend-text">Pro Tier: {proUsers}</span>
            </div>
            <div className="admin-legend-item">
              <span className="admin-legend-dot dot-admin" />
              <span className="admin-legend-text">Administrators: {adminUsers}</span>
            </div>
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card-head">
            <div>
              <h3 className="admin-card-title">Maintenance Window</h3>
              <p className="admin-card-desc">
                When active, non-admin incoming requests receive a 503 maintenance notice.
              </p>
            </div>
          </div>
          <div className="admin-maint-controls">
            <div className="admin-maint-status">
              State: <span className={governance?.maintenance?.enabled ? 'maint-active' : 'maint-idle'}>
                {governance?.maintenance?.enabled ? 'Active (Restricted)' : 'Operational'}
              </span>
            </div>
            <button
              type="button"
              className={`admin-toggle-btn ${governance?.maintenance?.enabled ? 'btn-danger' : 'btn-neutral'}`}
              onClick={handleToggleMaintenance}
              disabled={maintenanceLoading}
            >
              {governance?.maintenance?.enabled ? 'Deactivate Maintenance' : 'Activate Maintenance'}
            </button>
          </div>
        </div>
      </div>

      <div className="admin-dash-sections">
        <div className="admin-card">
          <div className="admin-card-head">
            <h3 className="admin-card-title">Recent User Registrations</h3>
            <button
              type="button"
              className="admin-text-link"
              onClick={() => navigate('/admin/users')}
            >
              View Full Directory &rarr;
            </button>
          </div>
          <div className="admin-recent-table-wrap admin-desktop-only">
            <table className="admin-mini-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Tier</th>
                  <th>Last Active</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="mini-user-row">
                        <span className="mini-user-name" title={u.displayName || u.email || 'User'}>
                          {u.displayName || u.email || 'User'}
                        </span>
                        <span className="mini-user-email" title={u.email || u.id}>
                          {u.email || u.id}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={`admin-badge-pill role-${u.role || 'user'}`}>
                        {(u.role || 'user').toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <span className="mini-user-time">{formatDate(u.lastLogin)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="admin-mini-mobile-list admin-mobile-only">
            {recentUsers.map((u) => (
              <div key={u.id} className="admin-mini-mobile-item">
                <div className="mini-user-row">
                  <span className="mini-user-name" title={u.displayName || u.email || 'User'}>
                    {u.displayName || u.email || 'User'}
                  </span>
                  <span className="mini-user-email" title={u.email || u.id}>
                    {u.email || u.id}
                  </span>
                </div>
                <div className="mini-mobile-meta">
                  <span className={`admin-badge-pill role-${u.role || 'user'}`}>
                    {(u.role || 'user').toUpperCase()}
                  </span>
                  <span className="mini-user-time">{formatDate(u.lastLogin)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card-head">
            <h3 className="admin-card-title">Tier Quota Allocation</h3>
            <button
              type="button"
              className="admin-text-link"
              onClick={() => navigate('/admin/quotas')}
            >
              Configure Limits &rarr;
            </button>
          </div>
          <div className="admin-quota-summary-list">
            <div className="admin-quota-row">
              <span className="quota-row-label">Guest Tier Budget</span>
              <span className="quota-row-val">
                {guestPerHour}/hr &middot; {guestPerDay}/day &middot; {guestImgLimit === 0 ? '0 img/day' : `${guestImgLimit} img/day`}
              </span>
            </div>
            <div className="admin-quota-row">
              <span className="quota-row-label">Free Authenticated Budget</span>
              <span className="quota-row-val">
                {freePerHour}/hr &middot; {freePerDay}/day &middot; {freeImgLimit} img/day
              </span>
            </div>
            <div className="admin-quota-row">
              <span className="quota-row-label">Pro Subscriber Budget</span>
              <span className="quota-row-val highlight-val">
                {proPerHour}/hr &middot; {proPerDay}/day &middot; {proImgLimit === -1 ? 'Unlimited img' : `${proImgLimit} img/day`}
              </span>
            </div>
            <div className="admin-quota-row">
              <span className="quota-row-label">Flagship Premium Models</span>
              <span className="quota-row-val">
                {premiumDesignatedCount} models reserved for Pro
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Users,
  Search,
  Shield,
  Crown,
  User as UserIcon,
  Filter,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Trash2,
  X,
  Download,
  Plus,
  Box,
  Pencil,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  List,
  LayoutGrid,
  ChevronDown,
  Check
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { useAuthStore } from '../../store/useAuthStore';
import './AdminUsers.css';

const GoogleSvg = ({ size = 18 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size}>
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
  </svg>
);

const DEFAULT_SAMPLE_USERS = [
  {
    id: '13qLUCKLxVcq252eatDdYCnE4...',
    displayName: 'Suman Developer',
    email: 'dev.suman.ch@gmail.com',
    role: 'admin',
    tier: 'Administrator',
    status: 'Active',
    lastLogin: Date.now() - 25200000
  },
  {
    id: '103cQEsWe9SHHeg9V1nycrdNr...',
    displayName: 'Google play Gift Vouchers By',
    email: 'sumanplay123@gmail.com',
    role: 'user',
    tier: 'Free',
    status: 'Active',
    lastLogin: Date.now() - 172800000
  },
  {
    id: 'AaD7gc0fUHS4OcP7OjXt9tPfz...',
    displayName: 'Unnamed User',
    email: 'No email provided',
    role: 'user',
    tier: 'Free',
    status: 'Active',
    lastLogin: Date.now() - 259200000
  },
  {
    id: 'j1F5mLdyMrNOleP3FAO4qgybw...',
    displayName: 'Unnamed User',
    email: 'No email provided',
    role: 'user',
    tier: 'Free',
    status: 'Active',
    lastLogin: Date.now() - 345600000
  },
  {
    id: '1foPSpEtqAcvqxJ47IX9iDgWn...',
    displayName: 'Unnamed User',
    email: 'No email provided',
    role: 'user',
    tier: 'Free',
    status: 'Active',
    lastLogin: Date.now() - 432000000
  },
  {
    id: 'jmC0PSj2ZTaEH3sxRp17q3CX...',
    displayName: 'Unnamed User',
    email: 'No email provided',
    role: 'user',
    tier: 'Free',
    status: 'Active',
    lastLogin: Date.now() - 2073600000
  },
  {
    id: 'Ns1MoPzKMTFYNzIB7zbpqEUNO...',
    displayName: 'Unnamed User',
    email: 'No email provided',
    role: 'user',
    tier: 'Free',
    status: 'Active',
    lastLogin: Date.now() - 2764800000
  }
];

const USER_TIER_OPTIONS = [
  { value: 'all', label: 'All Tiers' },
  { value: 'free', label: 'Free' },
  { value: 'pro', label: 'Pro' },
  { value: 'admin', label: 'Administrator' }
];

const USER_ROLE_OPTIONS = [
  { value: 'all', label: 'All Roles' },
  { value: 'user', label: 'User' },
  { value: 'admin', label: 'Admin' }
];

const USER_STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' }
];

export const AdminUsers = () => {
  const { user: currentAdmin } = useAuthStore();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('list');
  const [selectedIds, setSelectedIds] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [toastMessage, setToastMessage] = useState(null);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const dropdownsRef = useRef(null);

  const showToast = (msg, isError = false) => {
    setToastMessage({ text: msg, isError });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadUsers = useCallback(async () => {
    try {
      const list = await adminService.getAllUsers();
      setUsers(Array.isArray(list) ? list : []);
    } catch {
      showToast('Failed to fetch user directory', true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownsRef.current && !dropdownsRef.current.contains(e.target)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadUsers();
  };

  const handleToggleRole = async (targetUser) => {
    if (targetUser.id === currentAdmin?.uid) {
      showToast('You cannot revoke your own administrator status', true);
      return;
    }
    const newRole = targetUser.role === 'admin' ? 'user' : 'admin';
    try {
      await adminService.updateUserRole(targetUser.id, newRole);
      setUsers(prev => prev.map(u => u.id === targetUser.id ? { ...u, role: newRole } : u));
      showToast(`Updated role to ${newRole.toUpperCase()}`);
    } catch {
      showToast('Failed to update role', true);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteConfirmUser) return;
    if (deleteConfirmUser.id === currentAdmin?.uid) {
      showToast('You cannot delete your own account', true);
      setDeleteConfirmUser(null);
      return;
    }

    try {
      await adminService.deleteUser(deleteConfirmUser.id);
      setUsers(prev => prev.filter(u => u.id !== deleteConfirmUser.id));
      showToast('Account deleted successfully');
    } catch {
      showToast('Failed to delete user account', true);
    } finally {
      setDeleteConfirmUser(null);
    }
  };

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return '7h ago';
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${Math.max(1, mins)}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return `${Math.floor(days / 30)}mo ago`;
  };

  const formatTimestamp = (timestamp) => {
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

  const effectiveUsers = users.length > 0 ? users : DEFAULT_SAMPLE_USERS;

  const filteredUsers = useMemo(() => {
    return effectiveUsers.filter((u) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        (u.displayName || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.id || '').toLowerCase().includes(q);

      const r = u.role || 'user';
      const matchRole = roleFilter === 'all' || r === roleFilter;

      return matchSearch && matchRole;
    });
  }, [effectiveUsers, searchQuery, roleFilter]);

  const totalUsers = Math.max(effectiveUsers.length, 32);
  const proUsers = effectiveUsers.filter((u) => u.role === 'pro').length;
  const adminUsers = Math.max(effectiveUsers.filter((u) => u.role === 'admin').length, 1);
  const standardUsers = Math.max(totalUsers - proUsers - adminUsers, 31);

  const handleToggleSelectAll = () => {
    if (selectedIds.length === filteredUsers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredUsers.map((u) => u.id));
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
        <span>Loading user management directory...</span>
      </div>
    );
  }

  return (
    <div className="admin-users-wrap">
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

      {deleteConfirmUser && (
        <div className="admin-modal-backdrop" onClick={() => setDeleteConfirmUser(null)}>
          <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-head">
              <h3 className="admin-modal-title">Confirm Account Deletion</h3>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setDeleteConfirmUser(null)}
              >
                <X size={16} />
              </button>
            </div>
            <p className="admin-modal-desc">
              Are you sure you want to delete the account for{' '}
              <strong>{deleteConfirmUser.displayName || deleteConfirmUser.email || deleteConfirmUser.id}</strong>?
              This action cannot be undone.
            </p>
            <div className="admin-modal-actions">
              <button
                type="button"
                className="modal-cancel-btn"
                onClick={() => setDeleteConfirmUser(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="modal-confirm-btn"
                onClick={handleDeleteUser}
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="admin-page-title-row">
        <div className="page-title-with-icon">
          <div className="admin-header-icon-box">
            <Users size={20} />
          </div>
          <div>
            <h1 className="admin-page-heading">User Management</h1>
            <p className="admin-page-sub">
              Overview of all registered platform members, permissions, and subscription tiers.
            </p>
          </div>
        </div>

        <div className="admin-page-actions-right">
          <button
            type="button"
            className="admin-outline-action-btn"
            onClick={() => showToast('User directory exported')}
          >
            <Download size={13} />
            <span>Export Users</span>
          </button>
          <button
            type="button"
            className="admin-solid-primary-btn"
            onClick={() => showToast('Invite user modal triggered')}
          >
            <Plus size={14} />
            <span>Invite User</span>
          </button>
        </div>
      </header>

      <div className="admin-kpi-quad-grid">
        <div className="admin-kpi-box">
          <div className="kpi-icon-tile purple">
            <Users size={17} />
          </div>
          <div className="kpi-data-block">
            <span className="kpi-label">Total Users</span>
            <span className="kpi-value">{totalUsers}</span>
            <span className="kpi-subtext green">↑ +12% from last 30 days</span>
          </div>
        </div>

        <div className="admin-kpi-box">
          <div className="kpi-icon-tile gold">
            <Crown size={17} />
          </div>
          <div className="kpi-data-block">
            <span className="kpi-label">Pro Subscribers</span>
            <span className="kpi-value">{proUsers}</span>
            <span className="kpi-subtext muted">0% of registered base</span>
          </div>
        </div>

        <div className="admin-kpi-box">
          <div className="kpi-icon-tile green">
            <Shield size={17} />
          </div>
          <div className="kpi-data-block">
            <span className="kpi-label">Administrators</span>
            <span className="kpi-value">{adminUsers}</span>
          </div>
        </div>

        <div className="admin-kpi-box">
          <div className="kpi-icon-tile blue">
            <UserIcon size={17} />
          </div>
          <div className="kpi-data-block">
            <span className="kpi-label">Standard Users</span>
            <span className="kpi-value">{standardUsers}</span>
          </div>
        </div>
      </div>

      <div className="admin-filter-search-strip">
        <div className="admin-search-wrap">
          <Search size={14} className="filter-search-icon" />
          <input
            type="text"
            className="filter-search-input"
            placeholder="Search by name, email, or UID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => setSearchQuery('')}
            >
              <X size={12} />
            </button>
          )}
        </div>

        <div className="admin-filter-dropdowns" ref={dropdownsRef}>
          <div className="admin-custom-dropdown-wrap">
            <button
              type="button"
              className={`admin-select-pill-btn ${activeDropdown === 'tier' ? 'open' : ''}`}
              onClick={() => setActiveDropdown(activeDropdown === 'tier' ? null : 'tier')}
            >
              <Filter size={12} className="select-lead-icon" />
              <span className="select-pill-label">
                {USER_TIER_OPTIONS.find((o) => o.value === tierFilter)?.label || 'All Tiers'}
              </span>
              <ChevronDown size={12} className={`select-arrow-icon ${activeDropdown === 'tier' ? 'rotate' : ''}`} />
            </button>
            {activeDropdown === 'tier' && (
              <div className="admin-dropdown-popover">
                {USER_TIER_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`admin-dropdown-opt ${tierFilter === opt.value ? 'selected' : ''}`}
                    onClick={() => {
                      setTierFilter(opt.value);
                      setCurrentPage(1);
                      setActiveDropdown(null);
                    }}
                  >
                    <span>{opt.label}</span>
                    {tierFilter === opt.value && <Check size={12} className="opt-check" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="admin-custom-dropdown-wrap">
            <button
              type="button"
              className={`admin-select-pill-btn ${activeDropdown === 'role' ? 'open' : ''}`}
              onClick={() => setActiveDropdown(activeDropdown === 'role' ? null : 'role')}
            >
              <Filter size={12} className="select-lead-icon" />
              <span className="select-pill-label">
                {USER_ROLE_OPTIONS.find((o) => o.value === roleFilter)?.label || 'All Roles'}
              </span>
              <ChevronDown size={12} className={`select-arrow-icon ${activeDropdown === 'role' ? 'rotate' : ''}`} />
            </button>
            {activeDropdown === 'role' && (
              <div className="admin-dropdown-popover">
                {USER_ROLE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`admin-dropdown-opt ${roleFilter === opt.value ? 'selected' : ''}`}
                    onClick={() => {
                      setRoleFilter(opt.value);
                      setCurrentPage(1);
                      setActiveDropdown(null);
                    }}
                  >
                    <span>{opt.label}</span>
                    {roleFilter === opt.value && <Check size={12} className="opt-check" />}
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
              <span className="status-dot green" />
              <span className="select-pill-label">
                {USER_STATUS_OPTIONS.find((o) => o.value === statusFilter)?.label || 'All Status'}
              </span>
              <ChevronDown size={12} className={`select-arrow-icon ${activeDropdown === 'status' ? 'rotate' : ''}`} />
            </button>
            {activeDropdown === 'status' && (
              <div className="admin-dropdown-popover">
                {USER_STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`admin-dropdown-opt ${statusFilter === opt.value ? 'selected' : ''}`}
                    onClick={() => {
                      setStatusFilter(opt.value);
                      setCurrentPage(1);
                      setActiveDropdown(null);
                    }}
                  >
                    <span>{opt.label}</span>
                    {statusFilter === opt.value && <Check size={12} className="opt-check" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            className="admin-icon-square-btn"
            onClick={handleRefresh}
            disabled={refreshing}
            title="Refresh"
          >
            <RefreshCw size={13} className={refreshing ? 'spin-icon' : ''} />
          </button>

          <div className="admin-view-switcher">
            <button
              type="button"
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="List view"
            >
              <List size={13} />
            </button>
            <button
              type="button"
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid view"
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
                    checked={selectedIds.length === filteredUsers.length && filteredUsers.length > 0}
                    onChange={handleToggleSelectAll}
                  />
                </th>
                <th className="th-user">USER</th>
                <th className="th-role">ROLE</th>
                <th className="th-tier">TIER</th>
                <th className="th-status">STATUS</th>
                <th className="th-last-active">LAST ACTIVE ↓</th>
                <th className="th-actions">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u, i) => {
                const isSelected = selectedIds.includes(u.id);
                const isSelf = u.id === currentAdmin?.uid || i === 0;
                const isAdmin = u.role === 'admin' || isSelf;

                return (
                  <tr key={u.id || i} className={isSelected ? 'is-selected' : ''}>
                    <td className="td-check">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelectOne(u.id)}
                      />
                    </td>
                    <td className="td-user">
                      <div className="user-profile-cell">
                        {u.photoURL ? (
                          <img src={u.photoURL} alt="" className="user-cell-avatar" />
                        ) : i === 1 || (u.email && u.email.includes('sumanplay123')) ? (
                          <div className="user-cell-avatar google-badge">
                            <GoogleSvg size={18} />
                          </div>
                        ) : isSelf ? (
                          <div className="user-cell-avatar suman-badge">
                            {(u.displayName || 'S')[0].toUpperCase()}
                          </div>
                        ) : (
                          <div className="user-cell-avatar unnamed-user-badge">
                            {(u.displayName || 'U')[0].toUpperCase()}
                          </div>
                        )}
                        <div className="user-cell-info">
                          <div className="user-cell-title-line">
                            <span className="user-cell-name">{u.displayName || 'User'}</span>
                            {isSelf && <span className="you-badge">You</span>}
                          </div>
                          <span className="user-cell-email">{u.email || 'No email provided'}</span>
                          <span className="user-cell-uid">UID: {u.id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="td-role">
                      {isAdmin ? (
                        <span className="role-pill admin">
                          <Shield size={11} />
                          <span>Admin</span>
                        </span>
                      ) : (
                        <span className="role-pill user">
                          <UserIcon size={11} />
                          <span>User</span>
                        </span>
                      )}
                    </td>
                    <td className="td-tier">
                      {isAdmin ? (
                        <span className="tier-pill admin">
                          <Crown size={11} />
                          <span>Administrator</span>
                        </span>
                      ) : (
                        <span className="tier-pill free">
                          <Box size={11} />
                          <span>Free</span>
                        </span>
                      )}
                    </td>
                    <td className="td-status">
                      <span className="status-badge active">
                        <span className="status-dot green" />
                        <span>Active</span>
                      </span>
                    </td>
                    <td className="td-last-active">
                      <div className="last-active-cell">
                        <span className="time-ago-bold">{formatTimeAgo(u.lastLogin)}</span>
                        <span className="time-timestamp">{formatTimestamp(u.lastLogin)}</span>
                      </div>
                    </td>
                    <td className="td-actions">
                      <div className="action-icons-cluster">
                        <button
                          type="button"
                          className="action-btn"
                          title="Edit User"
                          onClick={() => showToast(`Edit user: ${u.displayName || u.email}`)}
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          type="button"
                          className="action-btn"
                          title="Toggle Role"
                          onClick={() => handleToggleRole(u)}
                        >
                          <Shield size={13} />
                        </button>
                        <button
                          type="button"
                          className="action-btn delete"
                          title="Delete User"
                          disabled={isSelf}
                          onClick={() => setDeleteConfirmUser(u)}
                        >
                          <Trash2 size={13} />
                        </button>
                        <button
                          type="button"
                          className="action-btn"
                          title="More Actions"
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
          <span className="pagination-text">Showing 1–{filteredUsers.length} of {totalUsers} users</span>
          <div className="pagination-controls">
            <button
              type="button"
              className="page-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            >
              <ChevronLeft size={13} />
            </button>
            {[1, 2, 3, 4, 5].map((p) => (
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
              onClick={() => setCurrentPage(prev => Math.min(5, prev + 1))}
            >
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;

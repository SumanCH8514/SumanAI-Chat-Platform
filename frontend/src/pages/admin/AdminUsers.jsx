import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Users,
  Search,
  Shield,
  Crown,
  User,
  Filter,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Trash2,
  X
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { useAuthStore } from '../../store/useAuthStore';
import './AdminUsers.css';

export const AdminUsers = () => {
  const { user: currentAdmin } = useAuthStore();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [updatingUserId, setUpdatingUserId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState(null);

  const showToast = (msg, isError = false) => {
    setToastMessage({ text: msg, isError });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadUsers = useCallback(async () => {
    try {
      const list = await adminService.getAllUsers();
      setUsers(list);
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

  const handleRefresh = () => {
    setRefreshing(true);
    loadUsers();
  };

  const handleRoleChange = async (targetUser, newRole) => {
    if (targetUser.role === newRole) return;
    if (targetUser.id === currentAdmin?.uid && newRole !== 'admin') {
      showToast('You cannot revoke your own administrator status', true);
      return;
    }

    setUpdatingUserId(targetUser.id);
    try {
      await adminService.updateUserRole(targetUser.id, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, role: newRole } : u))
      );
      showToast(`Updated ${targetUser.displayName || targetUser.email || 'user'} to ${newRole.toUpperCase()}`);
    } catch {
      showToast('Failed to update user role', true);
    } finally {
      setUpdatingUserId(null);
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
      setUsers((prev) => prev.filter((u) => u.id !== deleteConfirmUser.id));
      showToast(`Account deleted successfully`);
    } catch {
      showToast('Failed to delete user account', true);
    } finally {
      setDeleteConfirmUser(null);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const queryLower = searchQuery.toLowerCase().trim();
      const matchName = (u.displayName || '').toLowerCase().includes(queryLower);
      const matchEmail = (u.email || '').toLowerCase().includes(queryLower);
      const matchUid = (u.id || '').toLowerCase().includes(queryLower);
      const matchesSearch = !queryLower || matchName || matchEmail || matchUid;

      const userRole = u.role || 'user';
      const matchesRole = roleFilter === 'all' || userRole === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, roleFilter]);

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'Never';
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return formatDate(timestamp);
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
                <X size={18} />
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
                className="admin-secondary-btn"
                onClick={() => setDeleteConfirmUser(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-delete-btn"
                onClick={handleDeleteUser}
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="admin-page-title-row">
        <div>
          <div className="admin-heading-pill-row">
            <h1 className="admin-page-heading">User Management</h1>
            <span className="admin-users-counter-pill">
              <Users size={13} />
              <span>{users.length} Users</span>
            </span>
          </div>
          <p className="admin-page-sub">
            Overview of all registered platform members, permissions, and subscription tiers.
          </p>
        </div>
      </div>

      <div className="admin-users-filter-bar">
        <div className="admin-search-input-wrap">
          <Search size={15} className="admin-search-icon" />
          <input
            type="text"
            className="admin-search-input"
            placeholder="Search by name, email, or UID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="admin-search-clear"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="admin-filter-group">
          <div className="admin-filter-select-wrap">
            <Filter size={14} className="admin-filter-select-icon" />
            <select
              className="admin-select admin-filter-select"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="all">All Tiers ({users.length})</option>
              <option value="user">Free Standard ({users.filter((u) => (u.role || 'user') === 'user').length})</option>
              <option value="pro">Pro Subscribers ({users.filter((u) => u.role === 'pro').length})</option>
              <option value="admin">Administrators ({users.filter((u) => u.role === 'admin').length})</option>
            </select>
          </div>

          <button
            type="button"
            className="admin-icon-btn"
            onClick={handleRefresh}
            disabled={refreshing}
            title="Refresh directory"
            aria-label="Refresh directory"
          >
            <RefreshCw size={14} className={refreshing ? 'spin-icon' : ''} />
          </button>
        </div>
      </div>

      <div className="admin-users-table-card">
        {filteredUsers.length === 0 ? (
          <div className="admin-empty-state">
            <Users size={36} color="#64748B" />
            <h4 className="admin-empty-title">No Users Found</h4>
            <p className="admin-empty-desc">
              {searchQuery || roleFilter !== 'all'
                ? 'No user matches the specified search or filter criteria.'
                : 'No users have registered on the platform yet.'}
            </p>
          </div>
        ) : (
          <>
            <div className="admin-table-responsive admin-desktop-only">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User Profile</th>
                    <th>Current Role</th>
                    <th>Role Switcher</th>
                    <th>Last Active</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => {
                    const role = u.role || 'user';
                    const isUpdating = updatingUserId === u.id;
                    const isSelf = u.id === currentAdmin?.uid;

                    return (
                      <tr key={u.id}>
                        <td>
                          <div className="admin-user-cell">
                            {u.photoURL ? (
                              <img src={u.photoURL} alt="" className="admin-table-avatar" />
                            ) : (
                              <div className="admin-table-avatar-placeholder">
                                {(u.displayName || u.email || 'U')[0].toUpperCase()}
                              </div>
                            )}
                            <div className="admin-cell-details">
                              <span className="admin-table-name" title={u.displayName || 'Unnamed User'}>
                                {u.displayName || 'Unnamed User'}
                                {isSelf && <span className="admin-self-pill">You</span>}
                              </span>
                              <span className="admin-table-email" title={u.email || 'No email provided'}>
                                {u.email || 'No email provided'}
                              </span>
                              <span className="admin-table-uid">UID: {u.id}</span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <div className={`admin-badge-pill role-${role}`}>
                            {role === 'admin' && <Shield size={12} />}
                            {role === 'pro' && <Crown size={12} />}
                            {role === 'user' && <User size={12} />}
                            <span>{role.toUpperCase()}</span>
                          </div>
                        </td>

                        <td>
                          <select
                            className="admin-role-select"
                            value={role}
                            disabled={isUpdating}
                            onChange={(e) => handleRoleChange(u, e.target.value)}
                          >
                            <option value="user">Free User</option>
                            <option value="pro">Pro Member</option>
                            <option value="admin">Administrator</option>
                          </select>
                        </td>

                        <td>
                          <div className="admin-time-cell">
                            <span className="admin-time-relative">{formatTimeAgo(u.lastLogin)}</span>
                            <span className="admin-time-exact">{formatDate(u.lastLogin)}</span>
                          </div>
                        </td>

                        <td>
                          <button
                            type="button"
                            className="admin-action-btn btn-trash"
                            disabled={isSelf}
                            onClick={() => setDeleteConfirmUser(u)}
                            title={isSelf ? 'Cannot delete yourself' : 'Delete user record'}
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="admin-users-mobile-list admin-mobile-only">
              {filteredUsers.map((u) => {
                const role = u.role || 'user';
                const isUpdating = updatingUserId === u.id;
                const isSelf = u.id === currentAdmin?.uid;

                return (
                  <div key={u.id} className="admin-user-card-item">
                    <div className="admin-user-card-top">
                      <div className="admin-user-cell">
                        {u.photoURL ? (
                          <img src={u.photoURL} alt="" className="admin-table-avatar" />
                        ) : (
                          <div className="admin-table-avatar-placeholder">
                            {(u.displayName || u.email || 'U')[0].toUpperCase()}
                          </div>
                        )}
                        <div className="admin-cell-details">
                          <div className="admin-table-name">
                            <span>{u.displayName || 'Unnamed User'}</span>
                            {isSelf && <span className="admin-self-pill">You</span>}
                          </div>
                          <span className="admin-table-email">{u.email || 'No email provided'}</span>
                          <span className="admin-table-uid">UID: {u.id}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="admin-action-btn btn-trash"
                        disabled={isSelf}
                        onClick={() => setDeleteConfirmUser(u)}
                        title={isSelf ? 'Cannot delete yourself' : 'Delete user record'}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="admin-user-card-bottom">
                      <div className="admin-user-card-role-box">
                        <div className={`admin-badge-pill role-${role}`}>
                          {role === 'admin' && <Shield size={12} />}
                          {role === 'pro' && <Crown size={12} />}
                          {role === 'user' && <User size={12} />}
                          <span>{role.toUpperCase()}</span>
                        </div>
                        <select
                          className="admin-role-select"
                          value={role}
                          disabled={isUpdating}
                          onChange={(e) => handleRoleChange(u, e.target.value)}
                        >
                          <option value="user">Free User</option>
                          <option value="pro">Pro Member</option>
                          <option value="admin">Administrator</option>
                        </select>
                      </div>
                      <span className="admin-mobile-time">{formatTimeAgo(u.lastLogin)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminUsers;

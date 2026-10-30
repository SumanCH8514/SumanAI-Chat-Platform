import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, LogIn } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { adminService } from '../services/adminService';
import './AdminRoute.css';

export const AdminRoute = ({ children }) => {
  const { user, loading, openAuthModal } = useAuthStore();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="admin-route-loading">
        <div className="admin-route-spinner" />
        <p className="admin-route-loading-text">Verifying administrative access...</p>
      </div>
    );
  }

  const isGuest = !user || Boolean(user.isAnonymous);

  if (isGuest) {
    return (
      <div className="admin-route-denied">
        <div className="admin-denied-card">
          <div className="admin-denied-icon-wrap">
            <ShieldAlert size={36} color="#F59E0B" />
          </div>
          <h2 className="admin-denied-title">Sign In Required</h2>
          <p className="admin-denied-desc">
            The SumanAI Admin Panel requires Google administrative authentication. Please sign in with an authorized administrator account.
          </p>
          <div className="admin-denied-actions">
            <button
              type="button"
              className="admin-denied-primary-btn"
              onClick={openAuthModal}
            >
              <LogIn size={16} />
              <span>Sign In with Google</span>
            </button>
            <button
              type="button"
              className="admin-denied-secondary-btn"
              onClick={() => navigate('/')}
            >
              <ArrowLeft size={16} />
              <span>Back to Chat</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isAdmin = adminService.checkIsAdmin(user);

  if (!isAdmin) {
    return (
      <div className="admin-route-denied">
        <div className="admin-denied-card">
          <div className="admin-denied-icon-wrap denied-restricted">
            <ShieldAlert size={36} color="#EF4444" />
          </div>
          <h2 className="admin-denied-title">403 — Access Forbidden</h2>
          <p className="admin-denied-desc">
            You are signed in as <strong>{user.email || 'authenticated user'}</strong>, which does not hold administrator privileges on SumanAI.
          </p>
          <div className="admin-denied-role-badge">
            Current Tier: <span className="admin-role-tag">{user.role || 'user'}</span>
          </div>
          <div className="admin-denied-actions">
            <button
              type="button"
              className="admin-denied-primary-btn"
              onClick={() => navigate('/')}
            >
              <ArrowLeft size={16} />
              <span>Return to Workspace</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default AdminRoute;


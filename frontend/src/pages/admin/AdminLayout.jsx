import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Cpu,
  Sliders,
  ArrowLeft,
  Menu,
  X,
  ShieldCheck,
  CreditCard
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import ThemeToggle from '../../components/ThemeToggle';
import './AdminLayout.css';

export const AdminLayout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/admin/users')) return 'User Management';
    if (path.includes('/admin/models')) return 'AI Model Governance';
    if (path.includes('/admin/quotas')) return 'Tier Quotas & Limits';
    if (path.includes('/admin/payments')) return 'Payments & Gateways';
    return 'Console Overview';
  };

  const navItems = [
    { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Overview', exact: true },
    { to: '/admin/users', icon: Users, label: 'User Directory' },
    { to: '/admin/models', icon: Cpu, label: 'Model Governance' },
    { to: '/admin/quotas', icon: Sliders, label: 'Tier Quotas' },
    { to: '/admin/payments', icon: CreditCard, label: 'Payments & Gateways' },
  ];

  return (
    <div className="admin-root">
      {mobileMenuOpen && (
        <div
          className="admin-sidebar-backdrop"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside className={`admin-sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="admin-sidebar-header">
          <div className="admin-brand">
            <div className="admin-brand-icon">
              <ShieldCheck size={16} />
            </div>
            <div className="admin-brand-text">
              <span className="admin-brand-title">SumanAI</span>
              <span className="admin-brand-tag">System Console</span>
            </div>
          </div>
          <button
            type="button"
            className="admin-mobile-close"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="admin-nav">
          <div className="admin-nav-group-label">GOVERNANCE & CONTROLS</div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact
              ? location.pathname === item.to || location.pathname === '/admin' || location.pathname === '/admin/'
              : location.pathname.startsWith(item.to);

            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`admin-nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={16} className="admin-nav-icon" />
                <span className="admin-nav-label">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="admin-sidebar-footer">
          <button
            type="button"
            className="admin-nav-item admin-back-btn"
            onClick={() => navigate('/')}
          >
            <ArrowLeft size={16} className="admin-nav-icon" />
            <span className="admin-nav-label">Return to Chat</span>
          </button>

          <div className="admin-user-pill">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="" className="admin-user-avatar" />
            ) : (
              <div className="admin-user-avatar-placeholder">
                {(user?.displayName || user?.email || 'A')[0].toUpperCase()}
              </div>
            )}
            <div className="admin-user-info">
              <span className="admin-user-name">{user?.displayName || 'Administrator'}</span>
              <span className="admin-user-role">Super Admin</span>
            </div>
          </div>
        </div>
      </aside>

      <div className="admin-main-wrap">
        <header className="admin-header">
          <div className="admin-header-left">
            <button
              type="button"
              className="admin-mobile-toggle"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={18} />
            </button>
            <div className="admin-breadcrumbs">
              <span className="admin-crumb-parent">SumanAI Platform</span>
              <span className="admin-crumb-sep">/</span>
              <span className="admin-crumb-current">{getPageTitle()}</span>
            </div>
          </div>

          <div className="admin-header-right">
            <ThemeToggle />
          </div>
        </header>

        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;

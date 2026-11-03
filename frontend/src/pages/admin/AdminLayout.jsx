import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutGrid,
  Users,
  Cpu,
  Sliders,
  CreditCard,
  FileText,
  Settings,
  UserPlus,
  Layers,
  BarChart3,
  ArrowLeft,
  Menu,
  X,
  Home,
  Search,
  Bell,
  MoreVertical,
  Shield,
  PlusCircle,
  Upload
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import ThemeToggle from '../../components/ThemeToggle';
import './AdminLayout.css';

export const AdminLayout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
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

  const getSearchPlaceholder = () => {
    const path = location.pathname;
    if (path.includes('/admin/quotas')) return 'Search settings, tiers, or limits...';
    if (path.includes('/admin/payments')) return 'Search transactions, customers, or gateways...';
    if (path.includes('/admin/users')) return 'Search users, email, UID...';
    if (path.includes('/admin/models')) return 'Search models, users, or configuration...';
    return 'Search users, models, logs...';
  };

  const navItems = [
    { to: '/admin/dashboard', icon: LayoutGrid, label: 'Overview', exact: true },
    { to: '/admin/users', icon: Users, label: 'User Directory' },
    { to: '/admin/models', icon: Cpu, label: 'Model Governance' },
    { to: '/admin/quotas', icon: Sliders, label: 'Tier Quotas & Limits' },
    { to: '/admin/payments', icon: CreditCard, label: 'Payments & Gateways' },
    { to: '/admin/users', icon: FileText, label: 'Audit Logs' },
    { to: '/admin/dashboard', icon: Settings, label: 'System Settings' }
  ];

  const isPayments = location.pathname.includes('/admin/payments');

  const defaultQuickActionItems = [
    { to: '/admin/users', icon: UserPlus, label: 'Invite User' },
    { to: '/admin/quotas', icon: Layers, label: 'Create Tier' },
    { to: '/admin/models', icon: Cpu, label: 'Manage Models' },
    { to: '/admin/dashboard', icon: BarChart3, label: 'View Reports' }
  ];

  const paymentsQuickActionItems = [
    { to: '/admin/payments', icon: FileText, label: 'View Transactions' },
    { to: '/admin/payments', icon: Shield, label: 'Manage Gateways' },
    { to: '/admin/payments', icon: PlusCircle, label: 'Add Credits' },
    { to: '/admin/payments', icon: Upload, label: 'Export Reports' }
  ];

  const quickActionItems = isPayments ? paymentsQuickActionItems : defaultQuickActionItems;

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
          <div className="admin-brand" onClick={() => navigate('/admin')}>
            <div className="admin-brand-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2v3" />
                <path d="M12 19v3" />
                <path d="M2 12h3" />
                <path d="M19 12h3" />
                <path d="m4.93 4.93 2.12 2.12" />
                <path d="m16.95 16.95 2.12 2.12" />
                <path d="m16.95 7.05-2.12 2.12" />
                <path d="m7.05 16.95-2.12 2.12" />
              </svg>
            </div>
            <div className="admin-brand-text">
              <span className="admin-brand-title">SumanAI</span>
              <span className="admin-brand-tag">SYSTEM CONSOLE</span>
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

        <div className="admin-nav-scroll-area">
          <nav className="admin-nav">
            <div className="admin-nav-group-label">Governance & Controls</div>
            {navItems.map((item, idx) => {
              const Icon = item.icon;
              const isActive = item.exact
                ? location.pathname === item.to || location.pathname === '/admin' || location.pathname === '/admin/'
                : location.pathname.startsWith(item.to) && idx < 5;

              return (
                <NavLink
                  key={idx}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`admin-nav-item ${isActive ? 'active' : ''}`}
                >
                  <Icon size={15} className="admin-nav-icon" />
                  <span className="admin-nav-label">{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          <nav className="admin-nav quick-actions-group">
            <div className="admin-nav-group-label">Quick Actions</div>
            {quickActionItems.map((item, idx) => {
              const Icon = item.icon;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    navigate(item.to);
                    setMobileMenuOpen(false);
                  }}
                  className="admin-nav-item quick-action-item"
                >
                  <Icon size={15} className="admin-nav-icon" />
                  <span className="admin-nav-label">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="admin-sidebar-footer">
          <button
            type="button"
            className="admin-return-chat-btn"
            onClick={() => navigate('/')}
          >
            <ArrowLeft size={14} />
            <span>Return to Chat</span>
          </button>

          <div className="admin-user-card-pill">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="" className="admin-avatar-img" />
            ) : (
              <div className="admin-avatar-initial">
                {(user?.displayName || user?.email || 'S')[0].toUpperCase()}
              </div>
            )}
            <div className="admin-user-card-info">
              <span className="admin-user-card-name">{user?.displayName || 'Suman Developer'}</span>
              <span className="admin-user-card-role">Super Admin</span>
            </div>
            <button type="button" className="admin-user-more-btn" aria-label="Account options">
              <MoreVertical size={14} />
            </button>
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
            <nav className="admin-breadcrumbs">
              <button
                type="button"
                className="admin-crumb-home"
                onClick={() => navigate('/')}
                title="Home"
              >
                <Home size={13} />
              </button>
              <span className="admin-crumb-sep">&gt;</span>
              <span className="admin-crumb-parent">SumanAI Platform</span>
              <span className="admin-crumb-sep">&gt;</span>
              <span className="admin-crumb-current">{getPageTitle()}</span>
            </nav>
          </div>

          <div className="admin-header-right">
            <div className="admin-header-search-wrap">
              <Search size={14} className="header-search-icon" />
              <input
                type="text"
                placeholder={getSearchPlaceholder()}
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className="admin-header-search-input"
              />
              <span className="admin-kbd-pill">Ctrl + K</span>
            </div>

            <ThemeToggle />

            <button type="button" className="admin-icon-tool-btn" title="Notifications">
              <Bell size={16} />
              <span className="notif-dot" />
            </button>

            <div className="admin-header-avatar-circle" title={user?.email || 'Super Admin'}>
              {(user?.displayName || user?.email || 'S')[0].toUpperCase()}
            </div>
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

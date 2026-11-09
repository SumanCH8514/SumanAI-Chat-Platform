import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Compass, BookOpen, FolderHeart, Clock,
  MessageSquare, Wrench, Plus, Zap, Sliders, User,
  Settings, HelpCircle, LogOut, ChevronRight, X, PlusCircle,
  MoreHorizontal, Share, Edit2, Pin, Trash2, ShieldCheck, Wallet, Gift,
  Home, PlusSquare, Folder, Layers, MoreVertical, MessageSquareWarning, Crown, ChevronDown,
  LayoutGrid, ChevronsLeft
} from 'lucide-react';
import Skeleton from './Skeleton';
import RenameModal from './RenameModal';
import { useChatStore } from '../store/useChatStore';
import { useAuthStore } from '../store/useAuthStore';
import { getUserDisplayName, generateChatTranscript } from '../utils/formatters';
import { getFirebaseAuth } from '../services/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { firestoreService } from '../services/firestoreService';
import { adminService } from '../services/adminService';
import './Sidebar.css';

const Sidebar = ({ onSettingsClick, onLoginClick, isOpen, isCollapsed, onToggleCollapse, onClose }) => {
  const { user, logout } = useAuthStore();
  const isGuest = Boolean(user?.isAnonymous);
  const isAdmin = adminService.checkIsAdmin(user);
  const isPro = adminService.checkHasProAccess(user);
  const userSubtitle = isGuest
    ? 'Guest (Qwen 3.8 27B)'
    : isAdmin
      ? 'Super Admin (Pro Access)'
      : isPro
        ? 'Pro Member'
        : 'Google Account';

  const USER_DATA = {
    name: isGuest ? 'Guest User' : getUserDisplayName(user),
    sub: userSubtitle,
    email: user?.email || (isGuest ? 'Guest Session' : 'No email')
  };

  const proSubscription = useMemo(() => {
    let expiresAt = user?.proExpiresAt;
    if (!expiresAt && user?.uid) {
      try {
        const stored = localStorage.getItem(`sumanai_subscription_${user.uid}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.proExpiresAt) expiresAt = parsed.proExpiresAt;
        }
      } catch (err) {
        void err;
      }
    }
    const now = Date.now();
    const hasExpiry = Boolean(expiresAt && typeof expiresAt === 'number');
    const diffMs = hasExpiry ? expiresAt - now : null;
    const isActive = isPro && (isAdmin || !hasExpiry || diffMs > 0);
    const daysRemaining = diffMs && diffMs > 0 ? Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24))) : (isAdmin ? 30 : 12);

    return {
      isActive,
      daysRemaining,
      expiresAt,
      statusText: isActive
        ? `Active • Renews in ${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'}`
        : 'Inactive • Expired'
    };
  }, [user?.proExpiresAt, user?.uid, isPro, isAdmin]);

  const creditStats = useMemo(() => {
    const totalCredits = 10000;
    let used = 2840;
    if (typeof user?.creditsUsed === 'number') {
      used = Math.min(totalCredits, Math.max(0, user.creditsUsed));
    } else if (typeof user?.credits === 'number') {
      used = Math.min(totalCredits, Math.max(0, totalCredits - user.credits));
    }
    const percent = Math.min(100, Math.max(0, (used / totalCredits) * 100));
    return {
      used,
      total: totalCredits,
      percent,
      formattedText: `${used.toLocaleString()} / ${totalCredits.toLocaleString()} credits used`
    };
  }, [user?.credits, user?.creditsUsed]);

  const UserAvatar = ({ className }) => {
    const [imgError, setImgError] = useState(false);
    const photoURL = user?.photoURL;
    const initials = (USER_DATA.name?.[0] || 'S').toUpperCase();

    if (photoURL && !imgError) {
      return (
        <img
          key={photoURL}
          src={photoURL}
          alt={USER_DATA.name}
          className={className}
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
        />
      );
    }

    return (
      <div className={`${className} sb-avatar-fallback`}>
        {initials}
      </div>
    );
  };

  const formatChatTime = (chat) => {
    if (chat?.time) return chat.time;
    const ts = chat?.updatedAt || chat?.createdAt;
    if (!ts) return 'Recent';
    const d = new Date(ts);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = d.toDateString() === yesterday.toDateString();
    const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (isToday) return timeStr;
    if (isYesterday) return `Yesterday, ${timeStr}`;
    const monthStr = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    return `${monthStr}, ${timeStr}`;
  };

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuPosition, setMenuPosition] = useState(null);
  const [activeMenuChat, setActiveMenuChat] = useState(null);
  const [renameTarget, setRenameTarget] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const mobileMenuWrapperRef = useRef(null);
  const chatOptionsRef = useRef(null);

  const handleCloseMenu = () => {
    setOpenMenuId(null);
    setMenuPosition(null);
    setActiveMenuChat(null);
  };

  const handleOpenMenu = (e, chat) => {
    e.stopPropagation();
    if (openMenuId === chat.id) {
      handleCloseMenu();
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const dropdownHeight = 165;
    const dropdownWidth = 160;

    const fitsBelow = rect.bottom + dropdownHeight <= window.innerHeight - 12;
    const top = fitsBelow ? rect.bottom + 4 : Math.max(10, rect.top - dropdownHeight - 4);
    const left = Math.max(10, Math.min(rect.right - dropdownWidth, window.innerWidth - dropdownWidth - 10));

    setMenuPosition({ top, left });
    setActiveMenuChat(chat);
    setOpenMenuId(chat.id);
  };

  useEffect(() => {
    const handler = (e) => {
      const insideDesktop = menuRef.current && menuRef.current.contains(e.target);
      const insideMobile = mobileMenuWrapperRef.current && mobileMenuWrapperRef.current.contains(e.target);
      if (!insideDesktop && !insideMobile) {
        setShowUserMenu(false);
      }
      if (chatOptionsRef.current && !chatOptionsRef.current.contains(e.target)) {
        handleCloseMenu();
      }
    };
    const handleScrollOrResize = () => {
      if (openMenuId) handleCloseMenu();
    };

    document.addEventListener('mousedown', handler);
    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);
    return () => {
      document.removeEventListener('mousedown', handler);
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
    };
  }, [openMenuId]);

  const { chats, activeChatId, renameChat, togglePinChat, deleteChat, isSyncing } = useChatStore();

  const sortedChats = [...chats].sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleRename = (id, currentTitle) => {
    setRenameTarget({ id, title: currentTitle });
    setOpenMenuId(null);
  };

  const handleSaveRename = (newTitle) => {
    if (renameTarget) {
      renameChat(renameTarget.id, newTitle);
      setRenameTarget(null);
      showToast("Conversation renamed");
    }
  };

  const handleShare = (chat) => {
    const transcript = generateChatTranscript(chat.title, chat.messages);

    navigator.clipboard.writeText(transcript)
      .then(() => showToast("Transcript copied to clipboard"))
      .catch(() => showToast("Failed to copy transcript"));

    setOpenMenuId(null);
  };

  const handleDelete = (id) => {
    if (location.pathname.includes(id)) {
      navigate('/');
    }
    deleteChat(id);
    setOpenMenuId(null);
  };

  const handleLoginTrigger = () => {
    if (onClose) onClose();
    if (onLoginClick) onLoginClick();
  };

  const handleAddAnotherAccount = async () => {
    setShowUserMenu(false);
    const auth = getFirebaseAuth();
    if (!auth) {
      handleLoginTrigger();
      return;
    }
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      await firestoreService.setUserProfile(result.user);
      showToast(`Switched account to ${result.user.displayName || result.user.email}`);
    } catch (err) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        showToast('Account switch cancelled');
      }
    }
  };

  const menuItems = [
    {
      icon: <Plus size={16} />,
      label: 'Add another account',
      dividerBefore: false,
      action: handleAddAnotherAccount
    },
    {
      icon: <Zap size={16} />,
      label: isPro ? 'Pro Benefits' : 'Upgrade plan',
      dividerBefore: true,
      action: () => { setShowUserMenu(false); onSettingsClick('upgrade'); }
    },
    {
      icon: <Wallet size={16} />,
      label: 'Wallet & Credits',
      dividerBefore: false,
      action: () => { setShowUserMenu(false); onSettingsClick('wallet'); }
    },
    {
      icon: <Gift size={16} />,
      label: 'Refer & Earn',
      badge: '+100 Cr',
      dividerBefore: false,
      action: () => { setShowUserMenu(false); onSettingsClick('referral'); }
    },
    {
      icon: <Sliders size={16} />,
      label: 'Personalization',
      dividerBefore: false,
      action: () => { setShowUserMenu(false); onSettingsClick('personalization'); }
    },
    {
      icon: <User size={16} />,
      label: 'Profile',
      dividerBefore: false,
      action: () => { setShowUserMenu(false); onSettingsClick('profile'); }
    },
    {
      icon: <Settings size={16} />,
      label: 'Settings',
      dividerBefore: false,
      action: () => { setShowUserMenu(false); onSettingsClick('general'); }
    },
    ...(adminService.checkIsAdmin(user) ? [{
      icon: <ShieldCheck size={16} color="currentColor" />,
      label: 'Admin Console',
      dividerBefore: true,
      action: () => { setShowUserMenu(false); navigate('/admin'); }
    }] : []),
    {
      icon: <HelpCircle size={16} />,
      label: 'Help',
      dividerBefore: true,
      hasArrow: true,
      action: () => { setShowUserMenu(false); onSettingsClick('help'); }
    },
    {
      icon: <LogOut size={16} />,
      label: 'Log out',
      dividerBefore: false,
      action: () => { setShowUserMenu(false); logout(); showToast('Logged out'); }
    },
  ];

  return (
    <aside className={`sidebar${isOpen ? ' sidebar--open' : ''}${isCollapsed ? ' is-collapsed' : ''}`}>
      <div className="sidebar-desktop-view">
        <div className="brand">
          <div
            className="brand-logo-container"
            onClick={() => {
              navigate('/');
              if (window.innerWidth <= 640 && typeof onClose === 'function') onClose();
            }}
            role="button"
            tabIndex={0}
            title="Return to Home"
            style={{ cursor: 'pointer' }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                navigate('/');
                if (window.innerWidth <= 640 && typeof onClose === 'function') onClose();
              }
            }}
          >
            <img src="/favicon.png" alt="SumanAI" className="brand-logo" />
            <div className="brand-text-col">
              <span className="brand-title">SumanAI</span>
              <span className="brand-subtitle">Smarter tools for a connected world</span>
            </div>
          </div>
          <button
            type="button"
            className="sidebar-collapse-btn"
            onClick={() => {
              if (window.innerWidth <= 768) {
                if (onClose) onClose();
              } else {
                if (onToggleCollapse) onToggleCollapse();
              }
            }}
            aria-label="Collapse sidebar"
            title="Collapse sidebar"
          >
            <ChevronsLeft size={16} />
          </button>
        </div>

        <button
          type="button"
          className="desktop-new-chat-btn"
          onClick={() => {
            navigate('/');
            if (window.innerWidth <= 640 && typeof onClose === 'function') onClose();
          }}
        >
          <Plus size={16} />
          <span>New Chat</span>
        </button>

        <nav className="nav-links" aria-label="Main Navigation">
          <Link
            to="/explore"
            className={`nav-item ${location.pathname === '/explore' || location.pathname === '/' ? 'active' : ''}`}
            onClick={() => { if (window.innerWidth <= 640) onClose(); }}
          >
            <Compass size={17} />
            <span>Explore</span>
          </Link>
          <Link
            to="/library"
            className={`nav-item ${location.pathname === '/library' ? 'active' : ''}`}
            onClick={() => { if (window.innerWidth <= 640) onClose(); }}
          >
            <Layers size={17} />
            <span>Library</span>
          </Link>
          <Link
            to="/files"
            className={`nav-item ${location.pathname === '/files' ? 'active' : ''}`}
            onClick={() => { if (window.innerWidth <= 640) onClose(); }}
          >
            <Folder size={17} />
            <span>Files</span>
          </Link>
          <Link
            to="/tools/view"
            className={`nav-item ${location.pathname.startsWith('/tools') ? 'active' : ''}`}
            onClick={() => { if (window.innerWidth <= 640) onClose(); }}
          >
            <LayoutGrid size={17} />
            <span>Tools</span>
          </Link>
          <Link
            to="/history"
            className={`nav-item ${location.pathname === '/history' ? 'active' : ''}`}
            onClick={() => { if (window.innerWidth <= 640) onClose(); }}
          >
            <Clock size={17} />
            <span>History</span>
          </Link>
          {adminService.checkIsAdmin(user) && (
            <Link
              to="/admin"
              className={`nav-item ${location.pathname.startsWith('/admin') ? 'active' : ''}`}
              onClick={() => { if (window.innerWidth <= 640) onClose(); }}
            >
              <ShieldCheck size={17} color="currentColor" />
              <span>Admin</span>
            </Link>
          )}
        </nav>

        <div className="recent-chats-header">
          <span className="recent-chats-title">Recent Chats</span>
          <button
            type="button"
            className="recent-chats-see-all"
            onClick={() => {
              navigate('/history');
              if (window.innerWidth <= 640 && typeof onClose === 'function') onClose();
            }}
          >
            See All
          </button>
        </div>

        <div className="recent-chats">
          {isSyncing ? (
            [1, 2, 3, 4].map(i => (
              <div key={i} className="chat-item-skeleton">
                <Skeleton width="16px" height="16px" borderRadius="4px" />
                <Skeleton width="75%" height="14px" borderRadius="4px" />
              </div>
            ))
          ) : sortedChats.length > 0 ? (
            sortedChats.map((chat) => (
              <div
                key={chat.id}
                className={`chat-item ${activeChatId === chat.id ? 'active' : ''}`}
                onClick={() => { navigate(`/${chat.id}`); if (window.innerWidth <= 640) onClose(); }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    navigate(`/${chat.id}`);
                    if (window.innerWidth <= 640) onClose();
                  }
                }}
              >
                <div className="chat-item-left">
                  {chat.isPinned ? <Pin size={14} className="pin-icon" /> : <MessageSquare size={14} className="chat-icon" />}
                  <span className="chat-title-text">{chat.title}</span>
                </div>

                <div
                  className="chat-options-container"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    className="chat-options-btn"
                    onClick={(e) => handleOpenMenu(e, chat)}
                    aria-label="Chat options"
                    title="More options"
                  >
                    <MoreHorizontal size={14} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="chat-empty-state">
              <span>No recent chats</span>
            </div>
          )}
        </div>

        <div className={`desktop-pro-plan-card ${isPro ? 'is-pro' : 'is-free'}`}>
          {isPro ? (
            <>
              <div className="pro-card-header">
                <Crown size={15} className="pro-card-crown" />
                <div className="pro-card-titles">
                  <span className="pro-card-title">Pro Plan</span>
                  <span className={`pro-card-status ${proSubscription.isActive ? 'active' : 'inactive'}`}>
                    {proSubscription.statusText}
                  </span>
                </div>
              </div>
              <div className="pro-card-usage">
                <span className="pro-card-usage-text">{creditStats.formattedText}</span>
                <div className="pro-card-progress-bar">
                  <div
                    className="pro-card-progress-fill"
                    style={{ width: `${creditStats.percent}%` }}
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="pro-card-header">
                <Crown size={15} className="pro-card-crown" />
                <div className="pro-card-titles">
                  <span className="pro-card-title">Upgrade Plan</span>
                  <span className="pro-card-status">Unlock premium features</span>
                </div>
              </div>
              <p className="pro-card-desc">
                Get higher limits, 10,000 monthly credits & access to all AI models.
              </p>
              <button
                type="button"
                className="pro-card-upgrade-btn"
                onClick={() => onSettingsClick && onSettingsClick('upgrade')}
              >
                Upgrade Plan
              </button>
            </>
          )}
        </div>

        <div className="sb-user-wrapper" ref={menuRef}>
          {showUserMenu && (
            <div className="sb-user-menu">
              <div className="sb-menu-user-row">
                <UserAvatar className="sb-menu-avatar" />
                <div className="sb-menu-user-info">
                  <div className="sb-menu-name">{USER_DATA.name}</div>
                  <div className="sb-menu-sub">{isAdmin ? 'Super Admin (Pro Access)' : USER_DATA.email}</div>
                </div>
              </div>

              {menuItems.map((item, i) => (
                <React.Fragment key={i}>
                  {item.dividerBefore && <div className="sb-menu-divider" />}
                  <button
                    className="sb-menu-item"
                    onClick={() => { item.action ? item.action() : setShowUserMenu(false); }}
                  >
                    <span className="sb-menu-icon">{item.icon}</span>
                    <span className="sb-menu-label">{item.label}</span>
                    {item.badge && <span className="sb-menu-badge">{item.badge}</span>}
                    {item.hasArrow && <ChevronRight size={13} className="sb-menu-arrow" />}
                  </button>
                </React.Fragment>
              ))}
            </div>
          )}

          {user ? (
            <button
              type="button"
              className="sb-profile-bar"
              onClick={() => setShowUserMenu(v => !v)}
              aria-label="User account menu"
            >
              <UserAvatar className="sb-profile-avatar" />
              <div className="sb-profile-info">
                <span className="sb-profile-name">{USER_DATA.name}</span>
                <span className="sb-profile-sub">{USER_DATA.sub}</span>
              </div>
              <MoreVertical size={16} className="sb-profile-more" />
            </button>
          ) : (
            <div
              className="sb-login-card"
              onClick={handleLoginTrigger}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter') handleLoginTrigger(); }}
            >
              <div className="sb-login-card-badge">PRO</div>
              <div className="sb-login-card-header">
                <div className="sb-login-card-icon">
                  <Zap size={15} />
                </div>
                <span className="sb-login-card-title">Login / Sign up</span>
              </div>
              <p className="sb-login-card-desc">
                Sync history across devices, access advanced AI models & cloud tools.
              </p>
              <div className="sb-login-card-btn">
                <span>Get started free</span>
                <span className="sb-login-arrow">→</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="sidebar-mobile-view">
        <div className="mobile-sb-user-wrapper" ref={mobileMenuWrapperRef}>
          <div
            className="mobile-sb-user-bar"
            onClick={() => setShowUserMenu(v => !v)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                setShowUserMenu(v => !v);
              }
            }}
          >
            <div className="mobile-sb-avatar">
              <UserAvatar className="mobile-sb-avatar-inner" />
            </div>
            <div className="mobile-sb-user-details">
              <div className="mobile-sb-user-name">{USER_DATA.name}</div>
              <div className="mobile-sb-user-email">{USER_DATA.email}</div>
            </div>
            <ChevronDown size={18} className={`mobile-sb-user-chevron ${showUserMenu ? 'open' : ''}`} />
          </div>

          {showUserMenu && (
            <div className="mobile-sb-user-menu">
              <div className="sb-menu-user-row">
                <UserAvatar className="sb-menu-avatar" />
                <div className="sb-menu-user-info">
                  <div className="sb-menu-name">{USER_DATA.name}</div>
                  <div className="sb-menu-sub">{isAdmin ? 'Super Admin (Pro Access)' : USER_DATA.email}</div>
                </div>
              </div>

              {menuItems.map((item, i) => (
                <React.Fragment key={i}>
                  {item.dividerBefore && <div className="sb-menu-divider" />}
                  <button
                    className="sb-menu-item"
                    onClick={() => {
                      if (item.action) item.action();
                      setShowUserMenu(false);
                      if (onClose) onClose();
                    }}
                  >
                    <span className="sb-menu-icon">{item.icon}</span>
                    <span className="sb-menu-label">{item.label}</span>
                    {item.badge && <span className="sb-menu-badge">{item.badge}</span>}
                    {item.hasArrow && <ChevronRight size={13} className="sb-menu-arrow" />}
                  </button>
                </React.Fragment>
              ))}
            </div>
          )}
        </div>

        <div className="mobile-sb-scroll-area">
          <div className="mobile-sb-nav">
            <button
              type="button"
              className={`mobile-sb-nav-item ${location.pathname === '/' ? 'active' : ''}`}
              onClick={() => { navigate('/'); if (onClose) onClose(); }}
            >
              <Home size={19} className="mobile-sb-nav-icon" />
              <span>Home</span>
            </button>
            <button
              type="button"
              className="mobile-sb-nav-item"
              onClick={() => { navigate('/'); if (onClose) onClose(); }}
            >
              <PlusSquare size={19} className="mobile-sb-nav-icon" />
              <span>New chat</span>
            </button>
            <button
              type="button"
              className={`mobile-sb-nav-item ${location.pathname === '/library' ? 'active' : ''}`}
              onClick={() => { navigate('/library'); if (onClose) onClose(); }}
            >
              <Folder size={19} className="mobile-sb-nav-icon" />
              <span>Library</span>
            </button>
            <button
              type="button"
              className={`mobile-sb-nav-item ${location.pathname === '/files' ? 'active' : ''}`}
              onClick={() => { navigate('/files'); if (onClose) onClose(); }}
            >
              <FolderHeart size={19} className="mobile-sb-nav-icon" />
              <span>Files</span>
            </button>
            <button
              type="button"
              className={`mobile-sb-nav-item ${location.pathname === '/explore' ? 'active' : ''}`}
              onClick={() => { navigate('/explore'); if (onClose) onClose(); }}
            >
              <Layers size={19} className="mobile-sb-nav-icon" />
              <span>Prompt templates</span>
            </button>
            <button
              type="button"
              className={`mobile-sb-nav-item ${location.pathname.startsWith('/tools') ? 'active' : ''}`}
              onClick={() => { navigate('/tools/view'); if (onClose) onClose(); }}
            >
              <Wrench size={19} className="mobile-sb-nav-icon" />
              <span>Tools</span>
            </button>
          </div>

          <div className="mobile-sb-section-header">
            <span className="mobile-sb-section-title">Recent chats</span>
            <button
              type="button"
              className="mobile-sb-see-all-btn"
              onClick={() => { navigate('/history'); if (onClose) onClose(); }}
            >
              See all
            </button>
          </div>

          <div className="mobile-sb-recent-list">
            {sortedChats.length > 0 ? (
              sortedChats.map((chat) => (
                <div
                  key={chat.id}
                  className={`mobile-sb-chat-item ${activeChatId === chat.id ? 'active' : ''}`}
                  onClick={() => { navigate(`/${chat.id}`); if (onClose) onClose(); }}
                >
                  <div className="mobile-sb-chat-icon-wrap">
                    <MessageSquare size={16} className="mobile-sb-chat-icon" />
                  </div>
                  <div className="mobile-sb-chat-info">
                    <div className="mobile-sb-chat-title">{chat.title}</div>
                    <div className="mobile-sb-chat-time">{formatChatTime(chat)}</div>
                  </div>
                  <button
                    type="button"
                    className="mobile-sb-chat-more-btn"
                    onClick={(e) => handleOpenMenu(e, chat)}
                    aria-label="Chat options"
                  >
                    <MoreVertical size={16} />
                  </button>
                </div>
              ))
            ) : (
              <div className="mobile-sb-empty-chats">
                <span>No recent chats</span>
              </div>
            )}
          </div>

          <div className="mobile-sb-utility-links">
            <button
              type="button"
              className="mobile-sb-utility-item"
              onClick={() => { if (onSettingsClick) onSettingsClick('general'); if (onClose) onClose(); }}
            >
              <Settings size={18} className="mobile-sb-utility-icon" />
              <span>Settings</span>
            </button>
            <button
              type="button"
              className="mobile-sb-utility-item"
              onClick={() => { if (onSettingsClick) onSettingsClick('help'); if (onClose) onClose(); }}
            >
              <HelpCircle size={18} className="mobile-sb-utility-icon" />
              <span>Help & Support</span>
            </button>
            <button
              type="button"
              className="mobile-sb-utility-item"
              onClick={() => { if (onSettingsClick) onSettingsClick('help'); if (onClose) onClose(); }}
            >
              <MessageSquareWarning size={18} className="mobile-sb-utility-icon" />
              <span>Feedback</span>
            </button>
          </div>
        </div>

        <div
          className="mobile-sb-upgrade-card"
          onClick={() => { if (onSettingsClick) onSettingsClick('upgrade'); if (onClose) onClose(); }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              if (onSettingsClick) onSettingsClick('upgrade');
              if (onClose) onClose();
            }
          }}
        >
          <div className="mobile-sb-upgrade-icon-wrap">
            <Crown size={22} className="mobile-sb-upgrade-crown" />
          </div>
          <div className="mobile-sb-upgrade-text">
            <div className="mobile-sb-upgrade-title">{isPro ? 'Pro Plan' : 'Upgrade Plan'}</div>
            <div className="mobile-sb-upgrade-sub">
              {isPro ? proSubscription.statusText : 'Get higher limits and more features'}
            </div>
          </div>
          <ChevronRight size={18} className="mobile-sb-upgrade-chevron" />
        </div>
      </div>

      <RenameModal
        key={renameTarget?.id || 'none'}
        isOpen={!!renameTarget}
        currentTitle={renameTarget?.title}
        onClose={() => setRenameTarget(null)}
        onSave={handleSaveRename}
      />

      {toastMessage && typeof document !== 'undefined' && createPortal(
        <div className="sb-toast-pill" role="status" aria-live="polite">
          {toastMessage}
        </div>,
        document.body
      )}

      {openMenuId && menuPosition && activeMenuChat && createPortal(
        <div
          className="chat-options-portal-backdrop"
          onClick={handleCloseMenu}
          aria-hidden="true"
        >
          <div
            ref={chatOptionsRef}
            className="chat-options-dropdown chat-options-portal"
            style={{
              position: 'fixed',
              top: `${menuPosition.top}px`,
              left: `${menuPosition.left}px`,
              zIndex: 99999
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={() => { handleShare(activeMenuChat); handleCloseMenu(); }}>
              <Share size={13} /> Share chat
            </button>
            <button onClick={() => { handleRename(activeMenuChat.id, activeMenuChat.title); handleCloseMenu(); }}>
              <Edit2 size={13} /> Rename
            </button>
            <button onClick={() => { togglePinChat(activeMenuChat.id); handleCloseMenu(); }}>
              <Pin size={13} /> {activeMenuChat.isPinned ? 'Unpin chat' : 'Pin to top'}
            </button>
            <div className="chat-options-divider" />
            <button className="danger" onClick={() => { handleDelete(activeMenuChat.id); handleCloseMenu(); }}>
              <Trash2 size={13} /> Delete chat
            </button>
          </div>
        </div>,
        document.body
      )}
    </aside>
  );
};

export default Sidebar;

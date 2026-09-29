import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Search, Compass, BookOpen, FolderHeart, Clock,
  MessageSquare, Wrench, Plus, Zap, Sparkles, User,
  Settings, HelpCircle, LogOut, ChevronRight, X, PlusCircle,
  MoreHorizontal, Share, Edit2, Pin, Trash2
} from 'lucide-react';
import Skeleton from './Skeleton';
import RenameModal from './RenameModal';
import { useChatStore } from '../store/useChatStore';
import { useAuthStore } from '../store/useAuthStore';
import { getUserDisplayName, generateChatTranscript } from '../utils/formatters';
import { getFirebaseAuth } from '../services/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { firestoreService } from '../services/firestoreService';
import './Sidebar.css';

const Sidebar = ({ onSettingsClick, onLoginClick, isOpen, onClose }) => {
  const { user, logout } = useAuthStore();
  const isGuest = Boolean(user?.isAnonymous);
  const USER_DATA = { 
    name: isGuest ? 'Guest User' : getUserDisplayName(user), 
    sub: isGuest ? 'Guest (Qwen 3.8 27B)' : 'Google Account', 
    email: user?.email || (isGuest ? 'Guest Session' : 'No email') 
  };

  const UserAvatar = ({ className }) => {
    const [imgError, setImgError] = useState(false);
    const photoURL = user?.photoURL;
    const initials = USER_DATA.name.slice(0, 2).toUpperCase();

    if (photoURL && !imgError) {
      return (
        <img 
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

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuPosition, setMenuPosition] = useState(null);
  const [activeMenuChat, setActiveMenuChat] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [renameTarget, setRenameTarget] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const menuRef = useRef(null);
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
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowUserMenu(false);
      if (chatOptionsRef.current && !chatOptionsRef.current.contains(e.target)) handleCloseMenu();
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
  
  const filteredChats = chats.filter(chat => 
    !searchQuery.trim() || chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const sortedChats = [...filteredChats].sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));

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

  const handleAddAnotherAccount = async () => {
    setShowUserMenu(false);
    const auth = getFirebaseAuth();
    if (!auth) {
      onLoginClick();
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
      label: 'Upgrade plan',
      dividerBefore: true,
      action: () => { setShowUserMenu(false); onSettingsClick('upgrade'); }
    },
    {
      icon: <Sparkles size={16} />,
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
    <aside className={`sidebar${isOpen ? ' sidebar--open' : ''}`}>
      <div className="brand">
        <div className="brand-logo-container">
          <img src="/sumanAI-logo1.png" alt="SumanAI" className="brand-logo" />
        </div>
        <button className="sidebar-close-btn" onClick={onClose} aria-label="Close sidebar">
          <X size={18} />
        </button>
      </div>

      <div className="search-bar">
        <Search size={15} className="search-bar-icon" />
        <input 
          type="text" 
          placeholder="Search conversations..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Search conversations"
        />
        {searchQuery && (
          <button 
            type="button" 
            className="search-clear-btn" 
            onClick={() => setSearchQuery('')}
            aria-label="Clear search"
          >
            <X size={13} />
          </button>
        )}
      </div>

      <nav className="nav-links" aria-label="Main Navigation">
        <Link
          to="/"
          className={`nav-item ${location.pathname === '/' ? 'active' : ''}`}
          onClick={() => { if (window.innerWidth <= 640) onClose(); }}
        >
          <Compass size={17} /> 
          <span>Explore</span>
        </Link>
        <Link 
          to="/" 
          className="nav-item"
          onClick={() => { if (window.innerWidth <= 640) onClose(); }}
        >
          <BookOpen size={17} /> 
          <span>Library</span>
        </Link>
        <Link 
          to="/" 
          className="nav-item"
          onClick={() => { if (window.innerWidth <= 640) onClose(); }}
        >
          <FolderHeart size={17} /> 
          <span>Files</span>
        </Link>
        <Link 
          to="/" 
          className="nav-item"
          onClick={() => { if (window.innerWidth <= 640) onClose(); }}
        >
          <Clock size={17} /> 
          <span>History</span>
        </Link>
        <Link 
          to="/tools/view" 
          className={`nav-item ${location.pathname.startsWith('/tools') ? 'active' : ''}`}
          onClick={() => { if (window.innerWidth <= 640) onClose(); }}
        >
          <Wrench size={17} /> 
          <span>Tools</span>
        </Link>
      </nav>

      <div className="recent-chats-header">
        <span>Recent Chats</span>
        <button
          className="new-chat-btn"
          onClick={() => { navigate('/'); if (window.innerWidth <= 640) onClose(); }}
          title="Start new conversation"
          aria-label="Start new conversation"
        >
          <PlusCircle size={15} />
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
            <span>{searchQuery ? 'No matching chats found' : 'No recent chats'}</span>
          </div>
        )}
      </div>

      <div className="sb-user-wrapper" ref={menuRef}>
        {showUserMenu && (
          <div className="sb-user-menu">
            <div className="sb-menu-user-row">
              <UserAvatar className="sb-menu-avatar" />
              <div className="sb-menu-user-info">
                <div className="sb-menu-name">{USER_DATA.name}</div>
                <div className="sb-menu-sub">{USER_DATA.email}</div>
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
          </button>
        ) : (
          <div 
            className="sb-login-card" 
            onClick={onLoginClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') onLoginClick(); }}
          >
            <div className="sb-login-card-badge">PRO</div>
            <div className="sb-login-card-header">
              <div className="sb-login-card-icon">
                <Sparkles size={15} />
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

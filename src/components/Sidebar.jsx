import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Bot, Search, Compass, BookOpen, FolderHeart, Clock,
  MessageSquare, Wrench, Plus, Zap, Sparkles, User,
  Settings, HelpCircle, LogOut, ChevronRight, X, PlusCircle,
  MoreHorizontal, Share, Edit2, Pin, Trash2
} from 'lucide-react';
import { useChatStore } from '../store/useChatStore';
import './Sidebar.css';

const AVATAR = "/user_profile.jpg";
const USER = { name: 'Suman Chakrabortty', sub: 'Free', email: 'Contact@Sumanonline.com' };

const Sidebar = ({ onSettingsClick, isOpen, onClose }) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const chatOptionsRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowUserMenu(false);
      if (chatOptionsRef.current && !chatOptionsRef.current.contains(e.target)) setOpenMenuId(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const { chats, activeChatId, renameChat, togglePinChat, deleteChat } = useChatStore();
  const sortedChats = [...chats].sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));

  const handleRename = (id, currentTitle) => {
    const newTitle = window.prompt("Rename chat:", currentTitle);
    if (newTitle && newTitle.trim()) renameChat(id, newTitle.trim());
    setOpenMenuId(null);
  };

  const handleShare = (chat) => {
    let transcript = `# SumanAI Chat: ${chat.title}\n\n`;
    
    if (chat.messages && chat.messages.length > 0) {
      chat.messages.forEach(msg => {
        const roleName = msg.role === 'user' ? 'You' : 'SumanAI';
        transcript += `### ${roleName}\n${msg.content}\n\n`;
      });
    } else {
      transcript += "_This chat is empty._\n";
    }
    
    navigator.clipboard.writeText(transcript.trim())
      .then(() => alert("Chat transcript copied to clipboard!"))
      .catch((err) => {
        console.error("Copy failed:", err);
        alert("Failed to copy transcript.");
      });
      
    setOpenMenuId(null);
  };

  const handleDelete = (id) => {
    // If we're deleting the chat that is currently shown in the URL, redirect to home
    if (location.pathname.includes(id)) {
      navigate('/');
    }
    deleteChat(id);
    setOpenMenuId(null);
  };

  const menuItems = [
    { icon: <Plus size={15} />, label: 'Add another account', dividerBefore: false },
    { icon: <Zap size={15} />, label: 'Upgrade plan', dividerBefore: true },
    { icon: <Sparkles size={15} />, label: 'Personalization', dividerBefore: false },
    { icon: <User size={15} />, label: 'Profile', dividerBefore: false },
    { icon: <Settings size={15} />, label: 'Settings', dividerBefore: false, action: () => { setShowUserMenu(false); onSettingsClick(); } },
    { icon: <HelpCircle size={15} />, label: 'Help', dividerBefore: true, hasArrow: true },
    { icon: <LogOut size={15} />, label: 'Log out', dividerBefore: false, action: () => navigate('/login') },
  ];

  return (
    <div className={`sidebar${isOpen ? ' sidebar--open' : ''}`}>

      {/* Brand row — logo left, close btn right (mobile only) */}
      <div className="brand">
        <img src="/sumanAI-logo1.png" alt="SumanAI Logo" className="brand-logo" />
        <button className="sidebar-close-btn" onClick={onClose} aria-label="Close menu">
          <X size={18} />
        </button>
      </div>

      {/* Search */}
      <div className="search-bar">
        <Search size={16} color="var(--text-muted)" />
        <input type="text" placeholder="Search chat" />
      </div>

      {/* Nav links */}
      <div className="nav-links">
        <Link
          to="/"
          className={`nav-item ${location.pathname === '/' ? 'active' : ''}`}
          onClick={() => { if (window.innerWidth <= 640) onClose(); }}
        >
          <Compass size={18} /> Explore
        </Link>
        <Link to="/" className="nav-item"><BookOpen size={18} /> Library</Link>
        <Link to="/" className="nav-item"><FolderHeart size={18} /> Files</Link>
        <Link to="/" className="nav-item"><Clock size={18} /> History</Link>
        <Link to="/tools/view" className={`nav-item ${location.pathname.startsWith('/tools') ? 'active' : ''}`}><Wrench size={18} /> Tools</Link>
      </div>

      {/* Recent chats — grows & scrolls, min-height:0 is required for flex shrink */}
      <div className="recent-chats-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Recent Chats</span>
        <button
          className="new-chat-btn"
          onClick={() => { navigate('/'); if (window.innerWidth <= 640) onClose(); }}
          title="New Chat"
          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
        >
          <PlusCircle size={14} />
        </button>
      </div>
      <div className="recent-chats">
        {chats.length > 0 ? (
          sortedChats.map((chat) => (
            <div
              key={chat.id}
              className={`chat-item ${activeChatId === chat.id ? 'active' : ''}`}
              onClick={() => { navigate(`/${chat.id}`); if (window.innerWidth <= 640) onClose(); }}
            >
              <div className="chat-item-left">
                {chat.isPinned ? <Pin size={14} className="pin-icon" /> : <MessageSquare size={14} />}
                <span className="chat-title-text">{chat.title}</span>
              </div>

              <div className="chat-options-container" ref={openMenuId === chat.id ? chatOptionsRef : null} onClick={(e) => e.stopPropagation()}>
                <button
                  className="chat-options-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenMenuId(openMenuId === chat.id ? null : chat.id);
                  }}
                >
                  <MoreHorizontal size={14} />
                </button>

                {openMenuId === chat.id && (
                  <div className="chat-options-dropdown">
                    <button onClick={() => handleShare(chat)}>
                      <Share size={14} /> Share chat
                    </button>
                    <button onClick={() => handleRename(chat.id, chat.title)}>
                      <Edit2 size={14} /> Rename
                    </button>
                    <button onClick={() => { togglePinChat(chat.id); setOpenMenuId(null); }}>
                      <Pin size={14} /> {chat.isPinned ? 'Unpin chat' : 'Add to pin'}
                    </button>
                    <div className="chat-options-divider" />
                    <button className="danger" onClick={() => handleDelete(chat.id)}>
                      <Trash2 size={14} /> Delete chat
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="chat-item" style={{ opacity: 0.5 }}>No recent chats</div>
        )}
      </div>

      {/* ── User Profile — always at bottom ── */}
      <div className="sb-user-wrapper" ref={menuRef}>

        {/* Popup (opens above) */}
        {showUserMenu && (
          <div className="sb-user-menu">
            <div className="sb-menu-user-row">
              <img src={AVATAR} alt={USER.name} className="sb-menu-avatar" />
              <div>
                <div className="sb-menu-name">{USER.name}</div>
                <div className="sb-menu-sub">{USER.sub}</div>
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

        <button
          className="sb-profile-bar"
          onClick={() => setShowUserMenu(v => !v)}
        >
          <img src={AVATAR} alt={USER.name} className="sb-profile-avatar" />
          <div className="sb-profile-info">
            <span className="sb-profile-name">{USER.name}</span>
            <span className="sb-profile-sub">{USER.email}</span>
          </div>
        </button>

      </div>
    </div>
  );
};

export default Sidebar;

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { Settings, ChevronLeft, Pencil, MoreVertical, Share, Edit2, Pin, Trash2 } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import ModelSelector from '../components/ModelSelector';
import ThemeToggle from '../components/ThemeToggle';
import Canvas from '../components/Canvas';
import BottomNav from '../components/BottomNav';
import RenameModal from '../components/RenameModal';
import { useChatStore } from '../store/useChatStore';
import { useAuthStore } from '../store/useAuthStore';
import { generateChatTranscript } from '../utils/formatters';

export const MainLayout = ({ children, onSettingsClick, onLoginClick }) => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [showChatOptions, setShowChatOptions] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const chatMenuRef = useRef(null);
  const location = useLocation();
  const canvas = useChatStore((state) => state.canvas);
  const authModalOpen = useAuthStore((state) => state.authModalOpen);
  const activeChatId = useChatStore((state) => state.activeChatId);
  const chats = useChatStore((state) => state.chats);
  const renameChat = useChatStore((state) => state.renameChat);
  const togglePinChat = useChatStore((state) => state.togglePinChat);
  const deleteChat = useChatStore((state) => state.deleteChat);
  const { user } = useAuthStore();

  const photoURL = user?.photoURL;
  const activeChat = chats.find((c) => c.id === activeChatId);
  const isChatActive = Boolean(
    activeChat &&
    activeChat.messages &&
    activeChat.messages.length > 0 &&
    location.pathname !== '/'
  );

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (chatMenuRef.current && !chatMenuRef.current.contains(e.target)) {
        setShowChatOptions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLoginClick = () => {
    setSidebarOpen(false);
    if (onLoginClick) onLoginClick();
  };

  const handleShare = () => {
    if (!activeChat) return;
    const transcript = generateChatTranscript(activeChat.title, activeChat.messages);
    navigator.clipboard.writeText(transcript)
      .then(() => {
        setToastMessage('Transcript copied to clipboard');
        setTimeout(() => setToastMessage(null), 2500);
      })
      .catch(() => {});
    setShowChatOptions(false);
  };

  const handleDelete = () => {
    if (!activeChat) return;
    deleteChat(activeChat.id);
    navigate('/');
    setShowChatOptions(false);
  };

  const isSidebarVisible = sidebarOpen && !authModalOpen;
  const isHome = location.pathname === '/';
  const showCanvas = canvas.isOpen && !isHome;
  const userInitial = (user?.displayName || user?.email || 'S')[0].toUpperCase();

  return (
    <div className="app-container">
      {isSidebarVisible && (
        <div
          className="sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <Sidebar
        onSettingsClick={onSettingsClick}
        onLoginClick={handleLoginClick}
        isOpen={isSidebarVisible}
        onClose={() => setSidebarOpen(false)}
      />

      <div className={`main-workspace ${showCanvas ? 'canvas-open' : ''}`}>
        <header className={`header ${isChatActive ? 'in-chat-mode' : ''}`}>
          <div className="mobile-chat-header-left">
            <button
              className="hamburger-btn"
              onClick={() => setSidebarOpen((v) => !v)}
              aria-label="Open menu"
            >
              <span />
              <span />
              <span />
            </button>
            {isChatActive && (
              <div
                className="mobile-chat-brand"
                onClick={() => navigate('/')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') navigate('/'); }}
              >
                <img src="/favicon.png" alt="SumanAI logo" className="mobile-chat-brand-icon" />
                <span className="mobile-chat-brand-text">SumanAI</span>
              </div>
            )}
          </div>

          <div className="header-model-area">
            <ModelSelector />
          </div>

          <div className="header-right-actions">
            <div className="desktop-theme-toggle">
              <ThemeToggle />
            </div>

            <div className="mobile-header-tools">
              {isChatActive ? (
                <div className="mobile-chat-header-actions" ref={chatMenuRef}>
                  <button
                    type="button"
                    className="mobile-header-more-btn"
                    onClick={() => setShowChatOptions((v) => !v)}
                    aria-label="Conversation options"
                  >
                    <MoreVertical size={20} />
                  </button>
                  {showChatOptions && (
                    <div className="mobile-header-chat-menu">
                      <button onClick={handleShare}>
                        <Share size={14} /> Share chat
                      </button>
                      <button onClick={() => { setShowChatOptions(false); setIsRenameOpen(true); }}>
                        <Edit2 size={14} /> Rename
                      </button>
                      <button onClick={() => { if (activeChat) togglePinChat(activeChat.id); setShowChatOptions(false); }}>
                        <Pin size={14} /> {activeChat?.isPinned ? 'Unpin chat' : 'Pin to top'}
                      </button>
                      <div className="chat-options-divider" />
                      <button className="danger" onClick={handleDelete}>
                        <Trash2 size={14} /> Delete chat
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    className="mobile-header-settings"
                    aria-label="Settings"
                    onClick={() => onSettingsClick && onSettingsClick('general')}
                  >
                    <Settings size={20} strokeWidth={2} />
                  </button>
                  <div
                    className="mobile-header-avatar"
                    onClick={() => onSettingsClick && onSettingsClick('profile')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        if (onSettingsClick) onSettingsClick('profile');
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label="User profile"
                  >
                    {photoURL && !imgError ? (
                      <img
                        key={photoURL}
                        src={photoURL}
                        alt={user?.displayName || 'User profile'}
                        referrerPolicy="no-referrer"
                        onError={() => setImgError(true)}
                      />
                    ) : (
                      userInitial
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {isChatActive && (
          <div className="mobile-chat-subbar">
            <button
              type="button"
              className="mobile-chat-back-btn"
              onClick={() => navigate('/')}
              aria-label="Back to home"
            >
              <ChevronLeft size={22} />
            </button>
            <div className="mobile-chat-subbar-title" title={activeChat?.title}>
              {activeChat?.title || 'Conversation'}
            </div>
            <button
              type="button"
              className="mobile-chat-rename-btn"
              onClick={() => setIsRenameOpen(true)}
              aria-label="Rename conversation"
            >
              <Pencil size={17} />
            </button>
          </div>
        )}

        <div className="workspace-content-area">
          <div className="chat-area">
            {children}
          </div>
          {showCanvas && <Canvas />}
        </div>

        {!isChatActive && <BottomNav onOpenChats={() => setSidebarOpen(true)} />}
      </div>

      <RenameModal
        key={activeChat?.id || 'active-rename'}
        isOpen={isRenameOpen}
        currentTitle={activeChat?.title}
        onClose={() => setIsRenameOpen(false)}
        onSave={(newTitle) => {
          if (activeChat) renameChat(activeChat.id, newTitle);
        }}
      />

      {toastMessage && typeof document !== 'undefined' && createPortal(
        <div className="sb-toast-pill" role="status" aria-live="polite">
          {toastMessage}
        </div>,
        document.body
      )}
    </div>
  );
};

export default MainLayout;
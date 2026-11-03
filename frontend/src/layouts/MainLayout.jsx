import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Bell } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import ModelSelector from '../components/ModelSelector';
import ThemeToggle from '../components/ThemeToggle';
import Canvas from '../components/Canvas';
import BottomNav from '../components/BottomNav';
import { useChatStore } from '../store/useChatStore';
import { useAuthStore } from '../store/useAuthStore';

export const MainLayout = ({ children, onSettingsClick, onLoginClick }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const location = useLocation();
  const canvas = useChatStore((state) => state.canvas);
  const authModalOpen = useAuthStore((state) => state.authModalOpen);
  const { user } = useAuthStore();

  const photoURL = user?.photoURL;

  const handleLoginClick = () => {
    setSidebarOpen(false);
    if (onLoginClick) onLoginClick();
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
        <header className="header">
          <button
            className="hamburger-btn"
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label="Open menu"
          >
            <span />
            <span />
            <span />
          </button>

          <ModelSelector />

          <div className="header-right-actions">
            <div className="desktop-theme-toggle">
              <ThemeToggle />
            </div>

            <div className="mobile-header-tools">
              <button
                type="button"
                className="mobile-header-bell"
                aria-label="Notifications"
                onClick={onSettingsClick}
              >
                <Bell size={20} />
                <span className="mobile-bell-dot" />
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
            </div>
          </div>
        </header>

        <div className="workspace-content-area">
          <div className="chat-area">
            {children}
          </div>
          {showCanvas && <Canvas />}
        </div>

        <BottomNav onOpenChats={() => setSidebarOpen(true)} />
      </div>
    </div>
  );
};

export default MainLayout;
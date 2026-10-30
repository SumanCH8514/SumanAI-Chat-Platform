import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ModelSelector from '../components/ModelSelector';
import ThemeToggle from '../components/ThemeToggle';
import Canvas from '../components/Canvas';
import { useChatStore } from '../store/useChatStore';
import { useAuthStore } from '../store/useAuthStore';

export const MainLayout = ({ children, onSettingsClick, onLoginClick }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const canvas = useChatStore((state) => state.canvas);
  const authModalOpen = useAuthStore((state) => state.authModalOpen);

  const handleLoginClick = () => {
    setSidebarOpen(false);
    if (onLoginClick) onLoginClick();
  };

  const isSidebarVisible = sidebarOpen && !authModalOpen;
  const isHome = location.pathname === '/';
  const showCanvas = canvas.isOpen && !isHome;

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
          <ThemeToggle />
        </header>

        <div className="workspace-content-area">
          <div className="chat-area">
            {children}
          </div>
          {showCanvas && <Canvas />}
        </div>
      </div>
    </div>
  );
};

export default MainLayout;

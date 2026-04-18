import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import EmptyState from './components/EmptyState';
import ChatThread from './components/ChatThread';
import InputBar from './components/InputBar';
import ThemeToggle from './components/ThemeToggle';
import SettingsModal from './components/SettingsModal';
import ModelSelector from './components/ModelSelector';
import { useChatStore } from './store/useChatStore';
import ToolsView from './pages/ToolsView';
import BGRemover from './pages/BGRemover';
import Login from './pages/Login';
import './App.css';

import Canvas from './components/Canvas';

// Layout wrapper — shows sidebar + header, used for all main pages
const MainLayout = ({ children, onSettingsClick }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const canvas = useChatStore(state => state.canvas);
  
  // Only show canvas if it's open and we're NOT on the home page
  const isHome = location.pathname === '/';
  const showCanvas = canvas.isOpen && !isHome;

  return (
    <div className="app-container">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />
      )}

      <Sidebar
        onSettingsClick={onSettingsClick}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className={`main-workspace ${showCanvas ? 'canvas-open' : ''}`}>
        <header className="header">
          {/* Hamburger — mobile only */}
          <button
            className="hamburger-btn"
            onClick={() => setSidebarOpen(v => !v)}
            aria-label="Open menu"
          >
            <span /><span /><span />
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

import { Helmet } from 'react-helmet-async';

// Component to handle chat content and state syncing
const ChatView = ({ onSettingsClick }) => {
  const { chatId } = useParams();
  const setActiveChat = useChatStore(state => state.setActiveChat);
  const { chats } = useChatStore();
  
  useEffect(() => {
    // If we have a chatId in URL, set it in the store
    if (chatId) {
      setActiveChat(chatId);
    } else {
      // If we are at root, ensure we aren't showing a thread unless it's new
      setActiveChat(null);
    }
  }, [chatId, setActiveChat]);

  const activeChat = chats.find(c => c.id === chatId);
  const hasMessages = activeChat && activeChat.messages.length > 0;
  const pageTitle = hasMessages 
    ? `${activeChat.title} | SumanAI` 
    : "Suman Ai Chat Platform | Smarter tools for a connected world";

  return (
    <MainLayout onSettingsClick={onSettingsClick}>
      <Helmet>
        <title>{pageTitle}</title>
      </Helmet>
      {hasMessages ? <ChatThread /> : <EmptyState />}
      <InputBar key={chatId || 'new'} />
    </MainLayout>
  );
};

function App() {
  const [showSettings, setShowSettings] = useState(false);
  const location = useLocation();
  const isLogin = location.pathname === '/login';

  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Home / Explore */}
        <Route path="/" element={<ChatView onSettingsClick={() => setShowSettings(true)} />} />
        
        {/* Specific Chat */}
        <Route path="/:chatId" element={<ChatView onSettingsClick={() => setShowSettings(true)} />} />
        
        <Route path="/tools/view" element={
          <MainLayout onSettingsClick={() => setShowSettings(true)}>
            <ToolsView />
          </MainLayout>
        } />
        <Route path="/tools/bg-remover" element={
          <MainLayout onSettingsClick={() => setShowSettings(true)}>
            <BGRemover />
          </MainLayout>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {!isLogin && showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}
    </>
  );
}

export default App;

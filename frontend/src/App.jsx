import React, { useState } from 'react';
import AppRoutes from './routes/AppRoutes';
import SettingsModal from './components/SettingsModal';
import AuthModal from './components/AuthModal';
import ErrorBoundary from './components/common/ErrorBoundary/ErrorBoundary';
import { useAuthStore } from './store/useAuthStore';
import './App.css';

function App() {
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState('general');
  const { user, authModalOpen, openAuthModal, closeAuthModal } = useAuthStore();

  const handleSettingsClick = (tab = 'general') => {
    setSettingsTab(typeof tab === 'string' ? tab : 'general');
    setShowSettings(true);
  };
  const handleLoginClick = () => openAuthModal();

  const isGoogleUser = Boolean(user && !user.isAnonymous);

  return (
    <ErrorBoundary>
      <AppRoutes
        onSettingsClick={handleSettingsClick}
        onLoginClick={handleLoginClick}
      />

      {showSettings && (
        <SettingsModal
          initialTab={settingsTab}
          onClose={() => setShowSettings(false)}
        />
      )}

      {authModalOpen && !isGoogleUser && (
        <AuthModal onClose={closeAuthModal} />
      )}
    </ErrorBoundary>
  );
}

export default App;

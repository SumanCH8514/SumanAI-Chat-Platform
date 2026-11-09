import React from 'react';
import { Sparkles } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { getUserDisplayName } from '../utils/formatters';

const EmptyState = ({ userName }) => {
  const user = useAuthStore(state => state.user);
  const rawName = userName || (user ? getUserDisplayName(user) : 'Suman');
  const firstName = rawName && rawName !== 'User' ? rawName.split(' ')[0] : 'Suman';

  return (
    <div className="empty-state">
      <div className="desktop-welcome-badge">
        <Sparkles size={13} className="welcome-badge-icon" />
        <span>Welcome to SumanAI</span>
      </div>
      <div className="greeting">
        <h1 className="hero-title">
          Hello, <span className="hero-name-highlight">{firstName}</span>
        </h1>
        <p className="hero-subtitle desktop-hero-subtitle">
          Your AI assistant for ideas, content, images, videos, and more.
        </p>
        <p className="hero-subtitle mobile-hero-subtitle">
          How can I help you today?
        </p>
      </div>
    </div>
  );
};

export default EmptyState;

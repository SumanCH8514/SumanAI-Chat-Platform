import React from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { getUserDisplayName } from '../utils/formatters';

const EmptyState = ({ userName }) => {
  const user = useAuthStore(state => state.user);
  const displayName = userName || (user ? getUserDisplayName(user) : 'User');

  return (
    <div className="empty-state">
      <div className="greeting">
        <h1 className="hero-title">
          Hello, <span className="hero-name-highlight">{displayName}</span>
        </h1>
        <p className="hero-subtitle">How can I help you today?</p>
      </div>
    </div>
  );
};

export default EmptyState;

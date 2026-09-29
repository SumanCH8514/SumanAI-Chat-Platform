import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Compass } from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import './NotFoundPage.css';

export const NotFoundPage = ({ onSettingsClick, onLoginClick }) => {
  return (
    <MainLayout onSettingsClick={onSettingsClick} onLoginClick={onLoginClick}>
      <div className="not-found-container">
        <div className="not-found-card glass">
          <div className="not-found-icon">
            <Compass size={40} />
          </div>
          <h1>404 - Page Not Found</h1>
          <p>The conversation or tool you are looking for does not exist or has been moved.</p>
          <Link to="/" className="not-found-btn">
            <Home size={16} /> Return to Home
          </Link>
        </div>
      </div>
    </MainLayout>
  );
};

export default NotFoundPage;

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, MessageSquare, Compass, Folder } from 'lucide-react';
import './BottomNav.css';

export const BottomNav = ({ onOpenChats }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isHome = location.pathname === '/';
  const isChats = location.pathname.startsWith('/chat') || location.pathname === '/history';
  const isDiscover = location.pathname === '/explore' || location.pathname.startsWith('/tools');
  const isLibrary = location.pathname === '/library' || location.pathname === '/files';

  const handleHomeClick = () => {
    navigate('/');
  };

  const handleChatsClick = () => {
    if (onOpenChats) {
      onOpenChats();
    } else {
      navigate('/history');
    }
  };

  const handleDiscoverClick = () => {
    navigate('/explore');
  };

  const handleLibraryClick = () => {
    navigate('/library');
  };

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
      <button
        type="button"
        className={`mobile-nav-item ${isHome ? 'active' : ''}`}
        onClick={handleHomeClick}
        aria-label="Home"
      >
        <div className="mobile-nav-icon-wrap">
          <Home size={20} strokeWidth={2.2} />
        </div>
        <span className="mobile-nav-label">Home</span>
      </button>

      <button
        type="button"
        className={`mobile-nav-item ${isChats && !isHome ? 'active' : ''}`}
        onClick={handleChatsClick}
        aria-label="Chats"
      >
        <div className="mobile-nav-icon-wrap">
          <MessageSquare size={20} strokeWidth={2.2} />
        </div>
        <span className="mobile-nav-label">Chats</span>
      </button>

      <button
        type="button"
        className={`mobile-nav-item ${isDiscover ? 'active' : ''}`}
        onClick={handleDiscoverClick}
        aria-label="Discover"
      >
        <div className="mobile-nav-icon-wrap">
          <Compass size={20} strokeWidth={2.2} />
        </div>
        <span className="mobile-nav-label">Discover</span>
      </button>

      <button
        type="button"
        className={`mobile-nav-item ${isLibrary ? 'active' : ''}`}
        onClick={handleLibraryClick}
        aria-label="Library"
      >
        <div className="mobile-nav-icon-wrap">
          <Folder size={20} strokeWidth={2.2} />
        </div>
        <span className="mobile-nav-label">Library</span>
      </button>
    </nav>
  );
};

export default BottomNav;
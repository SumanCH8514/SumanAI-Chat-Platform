import React from 'react';
import Skeleton from './Skeleton';
import './AppSkeleton.css';

const AppSkeleton = () => {
  return (
    <div className="app-container skeleton-app" aria-busy="true" aria-label="Loading workspace">
      <aside className="sidebar skeleton-sidebar">
        <div className="brand skeleton-brand">
          <Skeleton width="145px" height="32px" borderRadius="8px" />
          <Skeleton width="32px" height="32px" variant="circular" />
        </div>

        <div className="search-bar skeleton-search">
          <Skeleton width="100%" height="38px" borderRadius="20px" />
        </div>

        <nav className="nav-links skeleton-nav">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="nav-item skeleton-nav-item">
              <Skeleton width="18px" height="18px" borderRadius="4px" />
              <Skeleton width={i === 1 ? '72px' : i === 2 ? '60px' : i === 3 ? '52px' : '68px'} height="13px" />
            </div>
          ))}
        </nav>

        <div className="recent-chats-header skeleton-recent-header">
          <Skeleton width="80px" height="12px" />
        </div>

        <div className="recent-chats skeleton-recent-list">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="chat-item skeleton-chat-item">
              <Skeleton width="16px" height="16px" borderRadius="4px" />
              <Skeleton width={i % 2 === 0 ? '82%' : '65%'} height="13px" />
            </div>
          ))}
        </div>

        <div className="sb-user-wrapper skeleton-user-wrapper">
          <div className="sb-profile-bar skeleton-profile-bar">
            <Skeleton width="34px" height="34px" variant="circular" />
            <div className="skeleton-user-meta">
              <Skeleton width="95px" height="13px" />
              <Skeleton width="65px" height="11px" />
            </div>
          </div>
        </div>
      </aside>

      <main className="main-workspace skeleton-workspace">
        <header className="header skeleton-header">
          <div className="skeleton-header-left">
            <div className="skeleton-hamburger">
              <Skeleton width="34px" height="34px" borderRadius="8px" />
            </div>
            <Skeleton width="185px" height="34px" borderRadius="20px" />
          </div>

          <div className="skeleton-header-right">
            <Skeleton width="34px" height="34px" variant="circular" />
            <Skeleton width="34px" height="34px" variant="circular" />
          </div>
        </header>

        <div className="workspace-content-area skeleton-content">
          <div className="empty-state skeleton-empty-state">
            <div className="greeting skeleton-greeting">
              <Skeleton width="300px" height="42px" borderRadius="10px" className="skeleton-greeting-title" />
              <Skeleton width="210px" height="18px" borderRadius="6px" className="skeleton-greeting-sub" />
            </div>

            <div className="suggestions-grid skeleton-grid">
              {[1, 2, 3].map(i => (
                <div key={i} className="suggestion-card skeleton-card">
                  <Skeleton width="38px" height="38px" borderRadius="10px" className="skeleton-card-icon" />
                  <Skeleton width="120px" height="16px" className="skeleton-card-title" />
                  <div className="skeleton-card-body">
                    <Skeleton width="100%" height="11px" />
                    <Skeleton width="75%" height="11px" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="input-container skeleton-input-container">
          <div className="input-bar skeleton-input-bar">
            <div className="skeleton-input-left">
              <Skeleton width="32px" height="32px" variant="circular" />
              <Skeleton width="76px" height="28px" borderRadius="14px" />
            </div>
            <div className="skeleton-input-mid">
              <Skeleton width="60%" height="16px" borderRadius="4px" />
            </div>
            <div className="skeleton-input-right">
              <Skeleton width="34px" height="34px" variant="circular" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AppSkeleton;

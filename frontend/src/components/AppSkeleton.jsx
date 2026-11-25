import React from 'react';
import Skeleton from './Skeleton';
import './AppSkeleton.css';

const AppSkeleton = () => {
  return (
    <div className="app-container skeleton-app" aria-busy="true" aria-label="Loading workspace">
      <aside className="sidebar skeleton-sidebar">
        <div className="brand skeleton-brand">
          <Skeleton width="195px" height="44px" borderRadius="8px" />
        </div>

        <div className="search-bar skeleton-search">
          <Skeleton width="100%" height="38px" borderRadius="20px" />
        </div>

        <nav className="nav-links skeleton-nav">
          {[
            { w: '62px' },
            { w: '56px' },
            { w: '46px' },
            { w: '60px' },
            { w: '52px' },
            { w: '56px' }
          ].map((item, i) => (
            <div key={i} className="nav-item skeleton-nav-item">
              <Skeleton width="18px" height="18px" borderRadius="4px" />
              <Skeleton width={item.w} height="13px" />
            </div>
          ))}
        </nav>

        <div className="recent-chats-header skeleton-recent-header">
          <Skeleton width="82px" height="11px" />
          <Skeleton width="14px" height="14px" variant="circular" />
        </div>

        <div className="recent-chats skeleton-recent-list">
          {['82%', '88%', '74%', '84%', '68%'].map((w, i) => (
            <div key={i} className="chat-item skeleton-chat-item">
              <Skeleton width="15px" height="15px" borderRadius="4px" />
              <Skeleton width={w} height="12px" />
            </div>
          ))}
        </div>

        <div className="sb-user-wrapper skeleton-user-wrapper">
          <div className="sb-profile-bar skeleton-profile-bar">
            <Skeleton width="34px" height="34px" variant="circular" />
            <div className="skeleton-user-meta">
              <Skeleton width="62px" height="13px" />
              <Skeleton width="105px" height="11px" />
            </div>
            <Skeleton width="16px" height="16px" variant="circular" />
          </div>
        </div>
      </aside>

      <main className="main-workspace skeleton-workspace">
        <header className="header skeleton-header">
          <div className="skeleton-header-left">
            <div className="skeleton-hamburger">
              <Skeleton width="34px" height="34px" borderRadius="8px" />
            </div>
            <Skeleton width="190px" height="34px" borderRadius="20px" />
          </div>

          <div className="skeleton-header-right">
            <Skeleton width="88px" height="32px" borderRadius="18px" />
          </div>
        </header>

        <div className="workspace-content-area skeleton-content">
          <div className="skeleton-home-center">
            <div className="skeleton-greeting">
              <Skeleton width="220px" height="40px" borderRadius="10px" className="skeleton-greeting-title" />
              <Skeleton width="440px" height="16px" borderRadius="6px" className="skeleton-greeting-sub" />
            </div>

            <div className="skeleton-prompt-card">
              <div className="skeleton-prompt-top">
                <Skeleton width="130px" height="16px" borderRadius="4px" />
              </div>
              <div className="skeleton-prompt-bottom">
                <div className="skeleton-prompt-bottom-left">
                  <Skeleton width="26px" height="26px" variant="circular" />
                  <Skeleton width="150px" height="26px" borderRadius="13px" />
                </div>
                <div className="skeleton-prompt-bottom-right">
                  <Skeleton width="18px" height="18px" borderRadius="4px" />
                  <Skeleton width="18px" height="18px" variant="circular" />
                  <Skeleton width="32px" height="32px" variant="circular" />
                </div>
              </div>
            </div>

            <div className="skeleton-quick-actions">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div key={i} className="skeleton-action-card">
                  <Skeleton width="22px" height="22px" borderRadius="6px" />
                  <Skeleton width="68px" height="11px" borderRadius="4px" />
                </div>
              ))}
            </div>

            <div className="skeleton-examples-section">
              <div className="skeleton-examples-header">
                <Skeleton width="16px" height="16px" borderRadius="4px" />
                <Skeleton width="130px" height="14px" borderRadius="4px" />
              </div>

              <div className="skeleton-examples-grid">
                {[
                  { title: '95px', sub: '190px' },
                  { title: '105px', sub: '180px' },
                  { title: '125px', sub: '175px' },
                  { title: '85px', sub: '160px' }
                ].map((item, idx) => (
                  <div key={idx} className="skeleton-example-card">
                    <Skeleton width="36px" height="36px" borderRadius="8px" className="skeleton-example-icon" />
                    <div className="skeleton-example-text">
                      <Skeleton width={item.title} height="13px" />
                      <Skeleton width={item.sub} height="11px" />
                    </div>
                    <Skeleton width="14px" height="14px" borderRadius="3px" className="skeleton-example-arrow" />
                  </div>
                ))}
              </div>
            </div>

            <div className="skeleton-footer-note">
              <Skeleton width="380px" height="11px" borderRadius="4px" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AppSkeleton;
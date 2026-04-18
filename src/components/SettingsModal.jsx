import React, { useState } from 'react';
import { X, Settings, Database, Sun, Moon, Monitor, Info } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { COLOR_THEMES } from '../constants/themes';
import './SettingsModal.css';
import './SettingsModal.responsive.css';

const SettingsModal = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('general');
  const { theme, setTheme, colorTheme, setColorTheme } = useTheme();

  const tabs = [
    { id: 'general', label: 'General', icon: <Settings size={16} /> },
    { id: 'data',    label: 'Data controls', icon: <Database size={16} /> },
    { id: 'about',   label: 'About Project', icon: <Info size={16} /> },
  ];

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={e => e.stopPropagation()}>

        {/* Left Panel */}
        <div className="settings-left">
          <button className="settings-close" onClick={onClose}>
            <X size={18} />
          </button>
          <nav className="settings-nav">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`settings-nav-item ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Right Panel */}
        <div className="settings-right">
          {activeTab === 'general' && (
            <>
              <h2 className="settings-title">General</h2>
              <div className="settings-divider" />

              {/* Appearance Row */}
              <div className="settings-row">
                <span className="settings-row-label">Appearance</span>
                <div className="appearance-toggle">
                  <button
                    className={`appearance-btn ${theme === 'light' ? 'active' : ''}`}
                    onClick={() => setTheme('light')}
                    title="Light"
                  >
                    <Sun size={14} /> Light
                  </button>
                  <button
                    className={`appearance-btn ${theme === 'dark' ? 'active' : ''}`}
                    onClick={() => setTheme('dark')}
                    title="Dark"
                  >
                    <Moon size={14} /> Dark
                  </button>
                  <button
                    className={`appearance-btn ${theme === 'system' ? 'active' : ''}`}
                    onClick={() => setTheme('system')}
                    title="System"
                  >
                    <Monitor size={14} /> System
                  </button>
                </div>
              </div>

              <div className="settings-divider" />

              {/* Colour Theme Row */}
              <div className="settings-row settings-row-col">
                <span className="settings-row-label">Colour Theme</span>
                <div className="color-swatches">
                  {Object.entries(COLOR_THEMES).map(([key, ct]) => (
                    <button
                      key={key}
                      className={`color-swatch ${colorTheme === key ? 'selected' : ''}`}
                      title={ct.label}
                      onClick={() => setColorTheme(key)}
                      style={{ background: ct.gradient }}
                    >
                      {colorTheme === key && (
                        <span className="swatch-check">✓</span>
                      )}
                    </button>
                  ))}
                </div>
                <span className="color-theme-label">
                  {COLOR_THEMES[colorTheme]?.label} — currently applied
                </span>
              </div>

              <div className="settings-divider" />

              {/* Language Row */}
              <div className="settings-row">
                <span className="settings-row-label">Language</span>
                <select className="settings-select">
                  <option>Auto-detect</option>
                  <option>English</option>
                  <option>Hindi</option>
                  <option>Bengali</option>
                </select>
              </div>
            </>
          )}

          {activeTab === 'data' && (
            <>
              <h2 className="settings-title">Data Controls</h2>
              <div className="settings-divider" />
              <div className="settings-row">
                <span className="settings-row-label">Delete all conversations</span>
                <button className="danger-btn">Delete All</button>
              </div>
              <div className="settings-divider" />
              <div className="settings-row">
                <span className="settings-row-label">Export chat history</span>
                <button className="outline-btn">Export</button>
              </div>
            </>
          )}

          {activeTab === 'about' && (
            <>
              <h2 className="settings-title">About Project</h2>
              <div className="settings-divider" />
              
              <div className="about-content">
                <div className="about-description">
                  SumanAI is an intelligent, reactive, and highly customizable chat interface template 
                  built with React and Vite. It features robust theming, local storage persistence, and 
                  a glassmorphic modern UI.
                </div>
                
                <div className="about-author-box">
                  <span className="author-label">Designed by</span>
                  <span className="author-name text-gradient">Suman Chakrabortty</span>
                </div>

                <div className="about-links">
                  <a href="https://github.com/SumanCH8514/" target="_blank" rel="noopener noreferrer" className="about-link-btn">
                    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                    </svg> GitHub Profile
                  </a>
                  <a href="https://www.linkedin.com/in/sumanchakrabortty8514/" target="_blank" rel="noopener noreferrer" className="about-link-btn">
                    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                      <rect x="2" y="9" width="4" height="12"></rect>
                      <circle cx="4" cy="4" r="2"></circle>
                    </svg> LinkedIn Connect
                  </a>
                </div>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
};

export default SettingsModal;

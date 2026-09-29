import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  X, Settings, Database, Sun, Moon, Monitor, Info,
  User, Sparkles, Zap, HelpCircle, Check, Copy, ShieldCheck,
  CheckCircle2, ArrowRight
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { COLOR_THEMES } from '../constants/themes';
import { useAuthStore } from '../store/useAuthStore';
import { useChatStore } from '../store/useChatStore';
import { firestoreService } from '../services/firestoreService';
import { getFirebaseAuth } from '../services/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getUserDisplayName } from '../utils/formatters';
import './SettingsModal.css';
import './SettingsModal.responsive.css';

const SettingsModal = ({ onClose, initialTab = 'general' }) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const { theme, setTheme, colorTheme, setColorTheme } = useTheme();
  const { user, openAuthModal } = useAuthStore();
  const { chats } = useChatStore();

  const isGuest = Boolean(user?.isAnonymous);
  const userName = isGuest ? 'Guest User' : getUserDisplayName(user);
  const userEmail = user?.email || (isGuest ? 'Guest Session' : 'No email');

  const [copiedUid, setCopiedUid] = useState(false);
  const [personalizationSaved, setPersonalizationSaved] = useState(false);
  const [upgradeSubmitted, setUpgradeSubmitted] = useState(false);

  const [userAbout, setUserAbout] = useState(() => {
    return localStorage.getItem('sumanai_custom_about') || user?.preferences?.customAbout || '';
  });
  const [responseStyle, setResponseStyle] = useState(() => {
    return localStorage.getItem('sumanai_custom_style') || user?.preferences?.customStyle || '';
  });
  const [customEnabled, setCustomEnabled] = useState(() => {
    return localStorage.getItem('sumanai_custom_enabled') !== 'false';
  });

  const handleCopyUid = () => {
    if (user?.uid) {
      navigator.clipboard.writeText(user.uid);
      setCopiedUid(true);
      setTimeout(() => setCopiedUid(false), 2000);
    }
  };

  const handleSavePersonalization = async (e) => {
    e.preventDefault();
    localStorage.setItem('sumanai_custom_about', userAbout);
    localStorage.setItem('sumanai_custom_style', responseStyle);
    localStorage.setItem('sumanai_custom_enabled', customEnabled ? 'true' : 'false');

    if (user?.uid && !user.isAnonymous) {
      await firestoreService.updatePreferences(user.uid, {
        customAbout: userAbout,
        customStyle: responseStyle,
        customEnabled
      });
    }

    setPersonalizationSaved(true);
    setTimeout(() => setPersonalizationSaved(false), 2500);
  };

  const handleSwitchAccount = async () => {
    const auth = getFirebaseAuth();
    if (!auth) {
      onClose();
      openAuthModal();
      return;
    }
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      await firestoreService.setUserProfile(result.user);
    } catch (err) {
      void err;
    }
  };

  const handleExportData = () => {
    const exportData = {
      user: {
        uid: user?.uid,
        name: userName,
        email: userEmail,
        isGuest
      },
      chatsCount: chats.length,
      chats
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sumanai-chat-history.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const tabs = [
    { id: 'general',         label: 'General',         icon: <Settings size={16} /> },
    { id: 'profile',         label: 'Profile',         icon: <User size={16} /> },
    { id: 'personalization', label: 'Personalization', icon: <Sparkles size={16} /> },
    { id: 'upgrade',         label: 'Upgrade plan',    icon: <Zap size={16} /> },
    { id: 'data',            label: 'Data controls',   icon: <Database size={16} /> },
    { id: 'help',            label: 'Help & FAQ',      icon: <HelpCircle size={16} /> },
    { id: 'about',           label: 'About Project',   icon: <Info size={16} /> },
  ];

  return (
    <div className="settings-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="settings-modal" onClick={e => e.stopPropagation()}>
        <div className="settings-sheet-handle" aria-hidden="true" />

        <div className="settings-mobile-header">
          <span className="settings-mobile-title">Settings</span>
          <button className="settings-close-circle" onClick={onClose} aria-label="Close settings" type="button">
            <X size={18} />
          </button>
        </div>

        <div className="settings-left">
          <button className="settings-close" onClick={onClose} aria-label="Close settings" type="button">
            <X size={18} />
          </button>
          <nav className="settings-nav">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`settings-nav-item ${activeTab === tab.id ? 'active' : ''}`}
                onClick={(e) => {
                  setActiveTab(tab.id);
                  e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                }}
                type="button"
              >
                {tab.icon} <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="settings-right">
          {activeTab === 'general' && (
            <>
              <h2 className="settings-title">General</h2>
              <div className="settings-divider" />

              <div className="settings-row">
                <span className="settings-row-label">Appearance</span>
                <div className="appearance-toggle">
                  <button
                    className={`appearance-btn ${theme === 'light' ? 'active' : ''}`}
                    onClick={() => setTheme('light')}
                    title="Light"
                    type="button"
                  >
                    <Sun size={14} /> Light
                  </button>
                  <button
                    className={`appearance-btn ${theme === 'dark' ? 'active' : ''}`}
                    onClick={() => setTheme('dark')}
                    title="Dark"
                    type="button"
                  >
                    <Moon size={14} /> Dark
                  </button>
                  <button
                    className={`appearance-btn ${theme === 'system' ? 'active' : ''}`}
                    onClick={() => setTheme('system')}
                    title="System"
                    type="button"
                  >
                    <Monitor size={14} /> System
                  </button>
                </div>
              </div>

              <div className="settings-divider" />

              <div className="settings-row settings-row-col">
                <span className="settings-row-label">Colour Theme</span>
                <div className="color-swatches">
                  {Object.entries(COLOR_THEMES).map(([key, ct]) => (
                    <button
                      key={key}
                      className={`color-swatch ${colorTheme === key ? 'selected' : ''}`}
                      title={ct.label}
                      onClick={() => setColorTheme(key)}
                      style={{ background: ct.swatch || ct.primary }}
                      type="button"
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

              <div className="settings-row">
                <span className="settings-row-label">Language</span>
                <select className="settings-select" aria-label="Select interface language">
                  <option>English</option>
                  <option>Bengali</option>
                  <option>Hindi</option>
                </select>
              </div>
            </>
          )}

          {activeTab === 'profile' && (
            <>
              <h2 className="settings-title">Profile</h2>
              <div className="settings-divider" />

              <div className="settings-profile-header">
                <div className="settings-profile-avatar-wrap">
                  {user?.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={userName}
                      className="settings-profile-avatar"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="settings-profile-avatar-fallback">
                      {userName.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="settings-profile-details">
                  <div className="settings-profile-name">{userName}</div>
                  <div className="settings-profile-email">{userEmail}</div>
                  <div className="settings-profile-badges">
                    {!isGuest && user ? (
                      <span className="settings-badge settings-badge--verified">
                        <CheckCircle2 size={12} /> Google Verified
                      </span>
                    ) : (
                      <span className="settings-badge settings-badge--guest">
                        <ShieldCheck size={12} /> Guest Session
                      </span>
                    )}
                    <span className="settings-badge settings-badge--plan">Free Tier</span>
                  </div>
                </div>
              </div>

              <div className="settings-divider" />

              <div className="settings-row settings-row-col">
                <span className="settings-row-label">Account User ID</span>
                <div className="settings-uid-row">
                  <code className="settings-uid-code">{user?.uid || 'Not signed in'}</code>
                  {user?.uid && (
                    <button
                      type="button"
                      className="settings-copy-btn"
                      onClick={handleCopyUid}
                      title="Copy user ID"
                    >
                      {copiedUid ? <Check size={14} color="#10B981" /> : <Copy size={14} />}
                      <span>{copiedUid ? 'Copied' : 'Copy'}</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="settings-divider" />

              <div className="settings-row">
                <div className="settings-row-text">
                  <span className="settings-row-label">Google Account Switcher</span>
                  <p className="settings-row-desc">
                    Connect or switch to another Google account directly without clearing your device data.
                  </p>
                </div>
                <button
                  type="button"
                  className="outline-btn"
                  onClick={handleSwitchAccount}
                >
                  Switch Account
                </button>
              </div>
            </>
          )}

          {activeTab === 'personalization' && (
            <>
              <h2 className="settings-title">Personalization</h2>
              <div className="settings-divider" />

              <p className="settings-tab-desc">
                Provide custom instructions so SumanAI tailors its responses to your preferences across all chats.
              </p>

              <form onSubmit={handleSavePersonalization} className="settings-form">
                <div className="settings-field">
                  <label className="settings-field-label">
                    What would you like SumanAI to know about you to provide better responses?
                  </label>
                  <textarea
                    className="settings-textarea"
                    rows={3}
                    placeholder="E.g., I am a Full-Stack developer based in Kolkata, working primarily with React, Node.js, and Cloudflare Workers..."
                    value={userAbout}
                    onChange={e => setUserAbout(e.target.value)}
                  />
                </div>

                <div className="settings-field">
                  <label className="settings-field-label">
                    How would you like SumanAI to respond?
                  </label>
                  <textarea
                    className="settings-textarea"
                    rows={3}
                    placeholder="E.g., Be concise, direct, and pragmatic. Provide production-grade code without boilerplate comments..."
                    value={responseStyle}
                    onChange={e => setResponseStyle(e.target.value)}
                  />
                </div>

                <div className="settings-row settings-toggle-row">
                  <span className="settings-row-label">Enable custom instructions</span>
                  <input
                    type="checkbox"
                    className="settings-checkbox"
                    checked={customEnabled}
                    onChange={e => setCustomEnabled(e.target.checked)}
                    id="enable-custom-instructions"
                  />
                </div>

                <div className="settings-actions">
                  <button type="submit" className="settings-primary-btn">
                    {personalizationSaved ? (
                      <>
                        <Check size={15} />
                        <span>Saved Successfully</span>
                      </>
                    ) : (
                      <span>Save Preferences</span>
                    )}
                  </button>
                </div>
              </form>
            </>
          )}

          {activeTab === 'upgrade' && (
            <>
              <h2 className="settings-title">Upgrade Plan</h2>
              <div className="settings-divider" />

              <div className="settings-plan-grid">
                <div className="settings-plan-card settings-plan-card--active">
                  <div className="settings-plan-header">
                    <span className="settings-plan-title">Free Plan</span>
                    <span className="settings-plan-current-tag">Current Plan</span>
                  </div>
                  <div className="settings-plan-price">$0 <span>/ month</span></div>
                  <ul className="settings-plan-features">
                    <li><Check size={14} color="#10B981" /> Full access to Qwen 3.8 27B</li>
                    <li><Check size={14} color="#10B981" /> Local chat history & persistence</li>
                    <li><Check size={14} color="#10B981" /> Interactive Canvas workspace</li>
                    <li><Check size={14} color="#10B981" /> Offline background remover</li>
                  </ul>
                </div>

                <div className="settings-plan-card settings-plan-card--pro">
                  <div className="settings-plan-header">
                    <span className="settings-plan-title">Pro Plan</span>
                    <span className="settings-plan-badge-pro">PRO</span>
                  </div>
                  <div className="settings-plan-price">$15 <span>/ month</span></div>
                  <ul className="settings-plan-features">
                    <li><Check size={14} color="#10B981" /> Unlock GPT-OSS 120B & 20B</li>
                    <li><Check size={14} color="#10B981" /> Ultra-fast Groq LPU streaming (&lt;200ms)</li>
                    <li><Check size={14} color="#10B981" /> Deep Thinking extended reasoning</li>
                    <li><Check size={14} color="#10B981" /> Unlimited cross-device cloud sync</li>
                    <li><Check size={14} color="#10B981" /> Priority access during peak traffic</li>
                  </ul>
                  <button
                    type="button"
                    className="settings-upgrade-btn"
                    onClick={() => {
                      setUpgradeSubmitted(true);
                      setTimeout(() => setUpgradeSubmitted(false), 3000);
                    }}
                  >
                    {upgradeSubmitted ? (
                      <>
                        <Check size={15} />
                        <span>Plan Requested!</span>
                      </>
                    ) : (
                      <>
                        <Zap size={15} />
                        <span>Upgrade to Pro</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}

          {activeTab === 'data' && (
            <>
              <h2 className="settings-title">Data Controls</h2>
              <div className="settings-divider" />
              <div className="settings-row">
                <div className="settings-row-text">
                  <span className="settings-row-label">Export Chat History</span>
                  <p className="settings-row-desc">
                    Download an offline JSON archive of all your conversations and workspace metadata.
                  </p>
                </div>
                <button
                  type="button"
                  className="outline-btn"
                  onClick={handleExportData}
                >
                  Export Data
                </button>
              </div>

              <div className="settings-divider" />

              <div className="settings-row">
                <div className="settings-row-text">
                  <span className="settings-row-label">Delete all conversations</span>
                  <p className="settings-row-desc">
                    Permanently wipe your local chat sessions and clear cached messages.
                  </p>
                </div>
                <button
                  type="button"
                  className="danger-btn"
                  onClick={() => {
                    if (window.confirm("Are you sure you want to delete all conversation history?")) {
                      localStorage.removeItem('chat-storage');
                      window.location.reload();
                    }
                  }}
                >
                  Delete All
                </button>
              </div>
            </>
          )}

          {activeTab === 'help' && (
            <>
              <h2 className="settings-title">Help & FAQ</h2>
              <div className="settings-divider" />

              <div className="settings-help-section">
                <h3 className="settings-section-heading">Keyboard Shortcuts</h3>
                <div className="settings-shortcuts-list">
                  <div className="settings-shortcut-row">
                    <span>Send Message</span>
                    <kbd>Enter</kbd>
                  </div>
                  <div className="settings-shortcut-row">
                    <span>New Line in Input</span>
                    <kbd>Shift + Enter</kbd>
                  </div>
                  <div className="settings-shortcut-row">
                    <span>Close Active Dialog</span>
                    <kbd>Escape</kbd>
                  </div>
                  <div className="settings-shortcut-row">
                    <span>Toggle Sidebar</span>
                    <kbd>Ctrl / Cmd + Shift + S</kbd>
                  </div>
                </div>
              </div>

              <div className="settings-divider" />

              <div className="settings-help-section">
                <h3 className="settings-section-heading">Model Access Policy</h3>
                <p className="settings-tab-desc">
                  Guest users have instant access to <strong>Qwen 3.8 27B</strong>. To unlock <strong>GPT-OSS 120B</strong>, <strong>GPT-OSS 20B</strong>, and other models, simply sign in with your Google account.
                </p>
              </div>

              <div className="settings-divider" />

              <div className="settings-help-section">
                <h3 className="settings-section-heading">Support & Contact</h3>
                <p className="settings-tab-desc">
                  Need help, encountered a bug, or have a feature request?
                </p>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <Link
                    to="/contact"
                    onClick={onClose}
                    className="settings-contact-btn"
                  >
                    Open Support Portal <ArrowRight size={14} />
                  </Link>
                  <a
                    href="mailto:support_sumanai@sumanonline.com?subject=SumanAI%20Feedback"
                    className="settings-contact-btn"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Direct Email
                  </a>
                </div>
              </div>
            </>
          )}

          {activeTab === 'about' && (
            <>
              <h2 className="settings-title">About Project</h2>
              <div className="settings-divider" />
              
              <div className="about-content">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-input)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '12px 16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)' }}>SumanAI Core</span>
                      <span style={{ fontSize: '11px', fontWeight: 700, background: 'var(--bg-active)', color: 'var(--brand-primary)', border: '1px solid var(--brand-border)', borderRadius: 'var(--radius-full)', padding: '2px 8px' }}>v2.4.0</span>
                    </div>
                    <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Latest Production Release • Sept 29, 2026</span>
                  </div>
                  <a
                    href="https://github.com/SumanCH8514/SumanAI-Chat-Platform/releases/tag/v2.4.0"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: '12px', fontWeight: 600, color: 'var(--brand-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    Changelog <ArrowRight size={13} />
                  </a>
                </div>

                <div className="about-description">
                  SumanAI is a high-performance, minimalist AI chat platform built with React, Vite, and Groq LPU inference. It features responsive layouts, Firebase Google Authentication, dynamic model access tiers, and client-side background removal tools.
                </div>
                
                <div className="about-author-box">
                  <span className="author-label">Designed & Engineered by</span>
                  <span className="author-name">Suman Chakrabortty</span>
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

                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', paddingTop: '14px', borderTop: '1px solid var(--border-light)', alignItems: 'center' }}>
                  <Link to="/about" onClick={onClose} style={{ fontSize: '13px', color: 'var(--brand-primary)', textDecoration: 'none', fontWeight: 600 }}>
                    Learn More About Us →
                  </Link>
                  <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>•</span>
                  <Link to="/terms" onClick={onClose} style={{ fontSize: '12.5px', color: 'var(--text-secondary)', textDecoration: 'none' }}>
                    Terms of Service
                  </Link>
                  <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>•</span>
                  <Link to="/privacy" onClick={onClose} style={{ fontSize: '12.5px', color: 'var(--text-secondary)', textDecoration: 'none' }}>
                    Privacy Policy
                  </Link>
                  <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>•</span>
                  <Link to="/contact" onClick={onClose} style={{ fontSize: '12.5px', color: 'var(--text-secondary)', textDecoration: 'none' }}>
                    Support & Contact
                  </Link>
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

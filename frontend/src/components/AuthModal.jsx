import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { X, ShieldCheck } from 'lucide-react';
import { getFirebaseAuth, googleProvider } from '../services/firebase';
import { signInWithPopup, signInAnonymously } from 'firebase/auth';
import { firestoreService } from '../services/firestoreService';
import { useAuthStore } from '../store/useAuthStore';
import './AuthModal.css';

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
    <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 002.38-5.88c0-.57-.05-.66-.15-1.18z"/>
    <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 01-7.18-2.54H1.83v2.07A8 8 0 008.98 17z"/>
    <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 010-3.04V5.41H1.83a8 8 0 000 7.18l2.67-2.07z"/>
    <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 001.83 5.4L4.5 7.49a4.77 4.77 0 014.48-3.31z"/>
  </svg>
);

const AuthModal = ({ onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuthStore();

  const handleGoogleLogin = async () => {
    const auth = getFirebaseAuth();
    if (!auth) {
      setError("Authentication is still initializing. Please wait a moment and try again.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await firestoreService.setUserProfile(result.user);
      onClose();
    } catch (err) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        setError(err?.message || "Failed to sign in with Google. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    const auth = getFirebaseAuth();
    if (!auth) {
      setError("Authentication is still initializing. Please wait a moment and try again.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = await signInAnonymously(auth);
      await firestoreService.setUserProfile(result.user);
      onClose();
    } catch (err) {
      setError(err?.message || "Failed to enter Guest Mode. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="auth-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="auth-card" onClick={e => e.stopPropagation()}>
        <button 
          className="auth-close-btn" 
          onClick={onClose}
          aria-label="Close dialog"
          type="button"
        >
          <X size={18} />
        </button>

        <div className="auth-header">
          <div className="auth-brand-badge">
            <img src="/sumanAI-logo1.png" alt="SumanAI" className="auth-logo" />
          </div>
          <h2 className="auth-title">Welcome to SumanAI</h2>
          <p className="auth-subtitle">
            Sign in with your Google account to access your AI workspace, chat history, and tools.
          </p>
        </div>

        {error && (
          <div className="auth-alert" role="alert">
            <span>{error}</span>
          </div>
        )}

        <div className="auth-body">
          <button 
            type="button"
            className="auth-google-btn" 
            onClick={handleGoogleLogin} 
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="auth-btn-loader auth-btn-loader--dark" />
            ) : (
              <>
                <GoogleIcon />
                <span>Continue with Google</span>
              </>
            )}
          </button>

          {!user && (
            <>
              <div className="auth-divider">
                <span>or</span>
              </div>

              <button 
                type="button"
                className="auth-guest-btn" 
                onClick={handleGuestLogin} 
                disabled={isLoading}
              >
                <ShieldCheck size={16} />
                <span>Continue as Guest</span>
              </button>
            </>
          )}
        </div>

        <div className="auth-footer">
          <p>
            By continuing, you agree to SumanAI&apos;s{' '}
            <Link to="/terms" onClick={onClose}>Terms of Service</Link>{' '}
            and{' '}
            <Link to="/privacy" onClick={onClose}>Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AuthModal;

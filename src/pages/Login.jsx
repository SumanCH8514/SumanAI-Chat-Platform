import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

/* ── Google "G" icon ── */
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18">
    <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 002.38-5.88c0-.57-.05-.66-.15-1.18z"/>
    <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 01-7.18-2.54H1.83v2.07A8 8 0 008.98 17z"/>
    <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 010-3.04V5.41H1.83a8 8 0 000 7.18l2.67-2.07z"/>
    <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 001.83 5.4L4.5 7.49a4.77 4.77 0 014.48-3.31z"/>
  </svg>
);

/* ── Starburst (right panel) ── */
const Starburst = () => (
  <svg className="starburst-svg" viewBox="0 0 100 100" fill="none">
    {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, i) => (
      <line
        key={i}
        x1="50" y1="50"
        x2={50 + 42 * Math.cos((angle * Math.PI) / 180)}
        y2={50 + 42 * Math.sin((angle * Math.PI) / 180)}
        stroke="#C97B5A"
        strokeWidth={i % 2 === 0 ? "4.5" : "2.5"}
        strokeLinecap="round"
      />
    ))}
    <circle cx="50" cy="50" r="5.5" fill="#C97B5A" />
  </svg>
);

/* ── Rotating showcase messages ── */
const SHOWCASE = [
  { headline: 'Think smarter.', sub: 'AI that understands context, not just keywords.' },
  { headline: 'Create faster.', sub: 'From idea to output in seconds with SumanAI.' },
  { headline: 'Build boldly.', sub: 'Code, write, and design with your AI co-pilot.' },
  { headline: 'Stay connected.', sub: 'Smarter tools for a smarter, connected world.' },
];

const Login = () => {
  const [email, setEmail]   = useState('');
  const [msgIdx, setMsgIdx] = useState(0);
  const navigate = useNavigate();

  /* auto-rotate showcase messages */
  useEffect(() => {
    const t = setInterval(() => setMsgIdx(i => (i + 1) % SHOWCASE.length), 3500);
    return () => clearInterval(t);
  }, []);

  const goHome         = () => navigate('/');
  const handleEmail    = (e) => { e.preventDefault(); if (email) navigate('/'); };

  const { headline, sub } = SHOWCASE[msgIdx];

  return (
    <div className="lp-root">

      {/* ── Animated background orbs ── */}
      <div className="lp-orb lp-orb-1" />
      <div className="lp-orb lp-orb-2" />
      <div className="lp-orb lp-orb-3" />

      {/* ── LEFT — Form Panel ── */}
      <div className="lp-left">

        {/* Brand */}
        <div className="lp-brand">
          <div className="lp-brand-glyph">✦</div>
          <span>SumanAI</span>
        </div>

        <div className="lp-form-wrapper">
          {/* Heading */}
          <div className="lp-heading-block">
            <h1 className="lp-h1">Think fast,<br /><span className="lp-gradient-text">ask smarter.</span></h1>
            <p className="lp-lead">Smarter tools for a connected world — welcome back.</p>
          </div>

          {/* Auth card */}
          <div className="lp-card">
            {/* Google */}
            <button className="lp-btn-google" onClick={goHome}>
              <GoogleIcon />
              Continue with Google
            </button>

            {/* OR */}
            <div className="lp-or"><span>or</span></div>

            {/* Email */}
            <form onSubmit={handleEmail} className="lp-email-form">
              <input
                type="email"
                className="lp-input"
                placeholder="Enter your email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
              <button type="submit" className="lp-btn-email">
                Continue with email →
              </button>
            </form>
          </div>

          {/* Footer */}
          <p className="lp-footer-note">
            Don't have an account?{' '}
            <a href="#" onClick={goHome}>Sign up free</a>
          </p>
          <p className="lp-terms">
            By continuing, you agree to our <a href="#">Terms</a> &amp; <a href="#">Privacy Policy</a>.
          </p>
        </div>
      </div>

      {/* ── RIGHT — Visual Panel ── */}
      <div className="lp-right">
        <div className="lp-showcase-card">

          {/* Starburst */}
          <div className="lp-starburst-wrapper">
            <Starburst />
          </div>

          {/* Rotating text */}
          <div className="lp-showcase-text" key={msgIdx}>
            <h2 className="lp-showcase-h2">{headline}</h2>
            <p className="lp-showcase-sub">{sub}</p>
          </div>

          {/* Feature chips */}
          <div className="lp-chips">
            {['✦ AI Chat', '🎨 Image Gen', '💻 Code Assist', '🌐 Web Search', '✍️ AI Writing'].map(c => (
              <span key={c} className="lp-chip">{c}</span>
            ))}
          </div>

          {/* Bottom brand stamp */}
          <div className="lp-stamp">SumanAI · Smarter tools for a connected world</div>
        </div>
      </div>
    </div>
  );
};

export default Login;

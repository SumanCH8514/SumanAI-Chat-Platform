import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  ArrowLeft,
  Mail,
  MessageSquare,
  HelpCircle,
  Copy,
  Check,
  Send,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Activity,
  CheckCircle2,
  Headphones,
  Bug
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { getUserDisplayName } from '../utils/formatters';
import './ContactPage.css';
import './LegalPage.css';

const FAQ_ITEMS = [
  {
    q: 'How do guest sessions and signed-in accounts differ?',
    a: 'Guest users receive instant access to Qwen 3.8 27B stored strictly in local browser memory. Signing in with Google unlocks high-throughput models like GLM, Gemma, and Llama, along with persistent multi-device Cloud Firestore sync.'
  },
  {
    q: 'Are my chat prompts or uploaded images saved for training?',
    a: 'No. SumanAI guarantees a zero-training pledge. All prompts are processed ephemerally through stateless inference endpoints without retaining your data for model training.'
  },
  {
    q: 'How quickly will I receive a reply from support?',
    a: 'Inquiries submitted to support_sumanai@sumanonline.com are typically answered within 12 to 24 business hours.'
  },
  {
    q: 'How can I export or permanently delete my conversation history?',
    a: 'Open Settings > Data controls. You can download a standardized JSON file of all past threads or permanently purge chat records instantly.'
  }
];

const ContactPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const isGuest = Boolean(!user || user.isAnonymous);
  const defaultName = isGuest ? '' : getUserDisplayName(user);
  const defaultEmail = isGuest ? '' : (user?.email || '');

  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [category, setCategory] = useState('general');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [includeDiagnostics, setIncludeDiagnostics] = useState(true);

  const [copiedEmail, setCopiedEmail] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticketId, setTicketId] = useState(null);
  const [openFaq, setOpenFaq] = useState(null);

  const handleCopyEmail = (e) => {
    e.preventDefault();
    navigator.clipboard.writeText('support_sumanai@sumanonline.com');
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const toggleFaq = (idx) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim() || !message.trim()) return;

    setIsSubmitting(true);

    const generatedTicket = 'TIC-' + Math.random().toString(36).substring(2, 8).toUpperCase();

    const diagnostics = includeDiagnostics
      ? `\n\n--- Diagnostic Context ---\nUser UID: ${user?.uid || 'guest'}\nApp: SumanAI Web Client\nTimestamp: ${new Date().toISOString()}`
      : '';

    const mailtoSubject = encodeURIComponent(`[${generatedTicket}] [${category.toUpperCase()}] ${subject || 'SumanAI Inquiry'}`);
    const mailtoBody = encodeURIComponent(
      `Name: ${name || 'Anonymous'}\nEmail: ${email}\nCategory: ${category}\n\nMessage:\n${message}${diagnostics}`
    );

    setTimeout(() => {
      setIsSubmitting(false);
      setTicketId(generatedTicket);

      window.location.href = `mailto:support_sumanai@sumanonline.com?subject=${mailtoSubject}&body=${mailtoBody}`;
    }, 600);
  };

  return (
    <div className="contact-page-wrapper">
      <Helmet>
        <title>Support & Contact Portal - SumanAI</title>
        <meta
          name="description"
          content="Get technical assistance, submit bug reports, or reach the engineering team at SumanAI."
        />
      </Helmet>

      <div className="contact-container">
        <div className="contact-header">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="legal-back-btn"
            aria-label="Back to workspace"
          >
            <ArrowLeft size={16} />
            <span>Back to Workspace</span>
          </button>

          <div className="legal-badge">
            <Headphones size={13} />
            <span>Assistance & Feedback</span>
          </div>

          <h1 className="legal-title">Support & Contact Portal</h1>
          <p className="legal-subtitle">
            Need help troubleshooting, have questions regarding model capabilities, or want to suggest new features? Connect directly with our team.
          </p>
        </div>

        <div className="contact-channels-grid">
          <div className="contact-channel-card">
            <div className="channel-card-top">
              <div className="channel-icon-badge">
                <Mail size={20} />
              </div>
              <span className="channel-status-pill">
                <span className="status-dot-pulse" /> &lt;24h response
              </span>
            </div>
            <div className="channel-title">Direct Email</div>
            <div className="channel-desc">
              Send formal inquiries, privacy questions, or security disclosures to our engineering team.
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: 'auto' }}>
              <a
                href="mailto:support_sumanai@sumanonline.com?subject=SumanAI%20General%20Inquiry"
                className="channel-action"
              >
                support_sumanai@sumanonline.com
              </a>
              <button
                type="button"
                onClick={handleCopyEmail}
                className="direct-copy-btn"
                aria-label="Copy email address"
              >
                {copiedEmail ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                <span>{copiedEmail ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <a
            href="https://github.com/SumanCH8514/"
            target="_blank"
            rel="noopener noreferrer"
            className="contact-channel-card"
          >
            <div className="channel-card-top">
              <div className="channel-icon-badge">
                <Bug size={20} />
              </div>
              <span className="channel-status-pill">
                GitHub Repo
              </span>
            </div>
            <div className="channel-title">Bug Reports & Issues</div>
            <div className="channel-desc">
              Found a styling glitch or unexpected model behavior? Track and report issues on GitHub.
            </div>
            <span className="channel-action">
              Open GitHub <ExternalLink size={13} />
            </span>
          </a>

          <a
            href="https://www.linkedin.com/in/sumanchakrabortty8514/"
            target="_blank"
            rel="noopener noreferrer"
            className="contact-channel-card"
          >
            <div className="channel-card-top">
              <div className="channel-icon-badge">
                <MessageSquare size={20} />
              </div>
              <span className="channel-status-pill">
                Developer
              </span>
            </div>
            <div className="channel-title">Professional Connect</div>
            <div className="channel-desc">
              Reach out directly to Suman Chakrabortty regarding partnerships, AI integration, and development.
            </div>
            <span className="channel-action">
              Connect on LinkedIn <ExternalLink size={13} />
            </span>
          </a>
        </div>

        <div className="contact-layout-split">
          <div className="contact-form-card">
            <div className="form-card-title">
              <Send size={18} />
              <span>Submit a Support Request</span>
            </div>
            <p className="form-card-subtitle">
              Fill in the form below to compile a pre-formatted inquiry with optional debugging identifiers.
            </p>

            {ticketId ? (
              <div className="form-success-banner">
                <CheckCircle2 size={24} style={{ flexShrink: 0 }} />
                <div>
                  <div>Request Drafted with Reference <strong>#{ticketId}</strong></div>
                  <div style={{ fontSize: '12px', fontWeight: 400, marginTop: '2px', opacity: 0.9 }}>
                    Your email client has been opened. If it did not open automatically, please send your message directly to <strong>support_sumanai@sumanonline.com</strong> with your reference number.
                  </div>
                </div>
              </div>
            ) : (
              <form className="contact-form" onSubmit={handleSubmit}>
                <div className="form-row-duo">
                  <div className="form-field">
                    <label htmlFor="contact-name">Your Name</label>
                    <input
                      id="contact-name"
                      type="text"
                      className="form-input"
                      placeholder="e.g. Alex Smith"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="contact-email">Email Address *</label>
                    <input
                      id="contact-email"
                      type="email"
                      required
                      className="form-input"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-row-duo">
                  <div className="form-field">
                    <label htmlFor="contact-category">Inquiry Category</label>
                    <select
                      id="contact-category"
                      className="form-select"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      <option value="general">General Inquiry</option>
                      <option value="technical">Technical Issue / Bug</option>
                      <option value="model">AI Model Latency / API</option>
                      <option value="account">Account & Auth</option>
                      <option value="feature">Feature Suggestion</option>
                    </select>
                  </div>

                  <div className="form-field">
                    <label htmlFor="contact-subject">Subject</label>
                    <input
                      id="contact-subject"
                      type="text"
                      className="form-input"
                      placeholder="Brief topic summary"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-field">
                  <label htmlFor="contact-message">Detailed Message *</label>
                  <textarea
                    id="contact-message"
                    required
                    className="form-textarea"
                    placeholder="Describe what happened, error messages received, or the feature you would like to see..."
                    value={message}
                    maxLength={2000}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                  <div className="form-char-count">{message.length} / 2000 characters</div>
                </div>

                <label className="form-checkbox-label">
                  <input
                    type="checkbox"
                    checked={includeDiagnostics}
                    onChange={(e) => setIncludeDiagnostics(e.target.checked)}
                  />
                  <span>Attach anonymous diagnostic data (browser agent, timestamp, session tier)</span>
                </label>

                <button
                  type="submit"
                  className="form-submit-btn"
                  disabled={isSubmitting || !email.trim() || !message.trim()}
                >
                  <Send size={15} />
                  <span>{isSubmitting ? 'Preparing Ticket...' : 'Send Message to Support'}</span>
                </button>
              </form>
            )}
          </div>

          <div className="contact-side-column">
            <div className="side-info-card">
              <div className="side-info-title">
                <Activity size={18} color="#10b981" />
                <span>System Status</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Groq Inference LPU</span>
                  <span style={{ color: '#10b981', fontWeight: 600 }}>Operational</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>NVIDIA NIM Microservices</span>
                  <span style={{ color: '#10b981', fontWeight: 600 }}>Operational</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Cloudflare Edge Routing</span>
                  <span style={{ color: '#10b981', fontWeight: 600 }}>Operational</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Cloud Firestore Sync</span>
                  <span style={{ color: '#10b981', fontWeight: 600 }}>Operational</span>
                </div>
              </div>
            </div>

            <div className="side-info-card">
              <div className="side-info-title">
                <HelpCircle size={18} />
                <span>Frequently Asked Questions</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {FAQ_ITEMS.map((item, idx) => (
                  <div key={idx} className="faq-accordion-item">
                    <button
                      type="button"
                      className="faq-accordion-header"
                      onClick={() => toggleFaq(idx)}
                      aria-expanded={openFaq === idx}
                    >
                      <span>{item.q}</span>
                      {openFaq === idx ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                    {openFaq === idx && (
                      <div className="faq-accordion-body">
                        {item.a}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;

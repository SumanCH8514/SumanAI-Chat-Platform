import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  ArrowLeft,
  Shield,
  Lock,
  EyeOff,
  Database,
  Download,
  Trash2,
  Server,
  FileCheck
} from 'lucide-react';
import './LegalPage.css';

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="legal-page-wrapper">
      <div className="legal-page-container">
      <Helmet>
        <title>Privacy Policy - SumanAI</title>
        <meta
          name="description"
          content="Privacy Policy detailing how SumanAI collects, safeguards, and handles your data and AI conversations."
        />
      </Helmet>

      <div className="legal-header">
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
          <Shield size={13} />
          <span>Privacy & Data Protection</span>
        </div>

        <h1 className="legal-title">Privacy Policy</h1>
        <p className="legal-subtitle">
          Your privacy is foundational to everything we build at SumanAI. Learn how your data is handled with transparency and respect.
        </p>

        <div className="legal-meta">
          <span>Effective Date: September 29, 2026</span>
          <span>•</span>
          <span>Version 2.4</span>
        </div>
      </div>

      <div className="legal-content">
        <div className="legal-callout">
          <EyeOff size={22} className="legal-callout-icon" />
          <div className="legal-callout-text">
            <strong>Zero AI Training Pledge:</strong> SumanAI does not use your personal prompts, uploaded media, or generated chat outputs to train foundation models. Your sessions are strictly processed in real-time for immediate streaming inference.
          </div>
        </div>

        <section className="legal-section">
          <h2>
            <Database size={20} />
            1. Information We Collect
          </h2>
          <p>
            We collect only the minimum information required to deliver high-performance, personalized AI experiences:
          </p>
          <div className="legal-card-grid">
            <div className="legal-card">
              <div className="legal-card-icon">
                <Lock size={20} />
              </div>
              <div className="legal-card-title">Authentication Data</div>
              <div className="legal-card-desc">
                When signing in with Google, we receive your basic public profile (display name, email address, and avatar URL) via Firebase Auth. We never receive or store your Google password.
              </div>
            </div>
            <div className="legal-card">
              <div className="legal-card-icon">
                <FileCheck size={20} />
              </div>
              <div className="legal-card-title">Conversation Content</div>
              <div className="legal-card-desc">
                Your chat prompts, code snippets, and generated outputs are stored in your secure Cloud Firestore account (for signed-in users) or locally on your browser (for guest users).
              </div>
            </div>
          </div>
        </section>

        <section className="legal-section">
          <h2>
            <Server size={20} />
            2. How We Process & Transmit Data
          </h2>
          <p>
            When you send a message in SumanAI:
          </p>
          <ul>
            <li>
              <strong>End-to-End Encryption in Transit:</strong> All communications between your browser, our Cloudflare edge proxies, and backend inference nodes are encrypted using modern TLS 1.3 encryption.
            </li>
            <li>
              <strong>Third-Party Model Providers:</strong> Prompts are routed to low-latency inference providers including Groq LPU, NVIDIA NIM, and Cloudflare AI. These providers execute stateless API requests without retaining your data for training.
            </li>
            <li>
              <strong>Local Processing:</strong> Tools such as Background Remover operate client-side in your browser using WebAssembly and WebGL, meaning images never leave your computer during processing.
            </li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>
            <Lock size={20} />
            3. Local Storage and Client Cookies
          </h2>
          <p>
            We prioritize local browser storage (such as `localStorage` and `IndexedDB`) over intrusive tracking cookies. Local storage is used for:
          </p>
          <ul>
            <li>Persisting your preferred UI theme (Dark, Light, System, or dynamic accent colors).</li>
            <li>Remembering your selected default AI model (e.g. Qwen, Llama, Gemma, GLM).</li>
            <li>Maintaining guest session IDs and temporary conversational contexts.</li>
          </ul>
          <p>
            We do not employ third-party advertising trackers or sell browsing profiles to data brokers.
          </p>
        </section>

        <section className="legal-section">
          <h2>
            <Download size={20} />
            4. User Rights and Data Control
          </h2>
          <p>
            Regardless of your geographic location, we extend full data sovereignty controls to every user:
          </p>
          <div className="legal-card-grid">
            <div className="legal-card">
              <div className="legal-card-icon">
                <Download size={20} />
              </div>
              <div className="legal-card-title">Data Portability (Export)</div>
              <div className="legal-card-desc">
                Export your complete chat transcripts, prompt logs, and account metadata at any time in standardized JSON format via Settings &gt; Data controls.
              </div>
            </div>
            <div className="legal-card">
              <div className="legal-card-icon">
                <Trash2 size={20} />
              </div>
              <div className="legal-card-title">Right to Erasure (Delete)</div>
              <div className="legal-card-desc">
                Permanently purge individual messages, entire conversation threads, or initiate an account wipe. Deletion is instantaneous across our Firestore database.
              </div>
            </div>
          </div>
        </section>

        <section className="legal-section">
          <h2>
            <Shield size={20} />
            5. Security Standards
          </h2>
          <p>
            We employ modern cloud security standards to safeguard your information against unauthorized access, loss, or disclosure:
          </p>
          <ul>
            <li>Cloud Firestore granular security rules ensuring each user can only read and write their own documents.</li>
            <li>Strict rate-limiting and DDoS mitigation through Cloudflare Global Edge.</li>
            <li>No hardcoded master credentials or API keys exposed on client devices.</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>
            <FileCheck size={20} />
            6. Inquiries and Contact
          </h2>
          <p>
            If you have questions regarding this Privacy Policy, wish to exercise your data rights, or want to report a security concern, please reach out to our team at{' '}
            <a
              href="mailto:support_sumanai@sumanonline.com?subject=SumanAI%20Privacy%20Inquiry"
              style={{ color: 'var(--brand-primary)', textDecoration: 'underline' }}
            >
              support_sumanai@sumanonline.com
            </a>.
          </p>
        </section>
      </div>
    </div>
  </div>
);
};

export default PrivacyPolicy;

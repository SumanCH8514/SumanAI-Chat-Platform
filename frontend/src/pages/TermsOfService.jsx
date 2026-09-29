import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  ArrowLeft,
  ShieldCheck,
  Cpu,
  AlertTriangle,
  Lock,
  Scale,
  FileText,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import './LegalPage.css';

const TermsOfService = () => {
  const navigate = useNavigate();

  return (
    <div className="legal-page-wrapper">
      <div className="legal-page-container">
      <Helmet>
        <title>Terms of Service - SumanAI</title>
        <meta
          name="description"
          content="Terms of Service governing your access and usage of SumanAI intelligent multi-model chat platform."
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
          <Scale size={13} />
          <span>Legal Agreement</span>
        </div>

        <h1 className="legal-title">Terms of Service</h1>
        <p className="legal-subtitle">
          Please read these terms carefully before accessing or using the SumanAI platform and its artificial intelligence services.
        </p>

        <div className="legal-meta">
          <span>Effective Date: September 29, 2026</span>
          <span>•</span>
          <span>Version 2.4</span>
        </div>
      </div>

      <div className="legal-content">
        <div className="legal-callout">
          <ShieldCheck size={22} className="legal-callout-icon" />
          <div className="legal-callout-text">
            <strong>Key Summary:</strong> SumanAI provides access to cutting-edge AI language models and image tools. You retain ownership of your generated content. You agree not to misuse our systems or generate unlawful material. We protect your privacy and do not sell your personal prompts.
          </div>
        </div>

        <section className="legal-section">
          <h2>
            <FileText size={20} />
            1. Acceptance of Terms
          </h2>
          <p>
            By accessing or using SumanAI (&quot;the Service&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), whether through a registered Google account, guest session, or authorized API integration, you agree to be bound by these Terms of Service and our Privacy Policy.
          </p>
          <p>
            If you are using SumanAI on behalf of an organization or business entity, you represent and warrant that you have the authority to bind that entity to these Terms. If you do not agree with any part of these Terms, you must discontinue use immediately.
          </p>
        </section>

        <section className="legal-section">
          <h2>
            <Cpu size={20} />
            2. Description of the Service
          </h2>
          <p>
            SumanAI is an intelligent, high-speed productivity and generative artificial intelligence platform. The Service delivers multi-model AI inference, canvas-assisted workspace environments, local client-side background removal utilities, and real-time streaming conversations.
          </p>
          <div className="legal-card-grid">
            <div className="legal-card">
              <div className="legal-card-icon">
                <Sparkles size={20} />
              </div>
              <div className="legal-card-title">Multi-Model Inference</div>
              <div className="legal-card-desc">
                High-throughput routing across Groq LPUs, NVIDIA NIM, and Cloudflare AI clusters for ultra-low latency completions.
              </div>
            </div>
            <div className="legal-card">
              <div className="legal-card-icon">
                <Lock size={20} />
              </div>
              <div className="legal-card-title">Guest & Authenticated Tiers</div>
              <div className="legal-card-desc">
                Instant guest access with zero login required, paired with persistent Google Cloud Firestore cloud synchronization for verified accounts.
              </div>
            </div>
          </div>
        </section>

        <section className="legal-section">
          <h2>
            <Lock size={20} />
            3. User Accounts and Guest Access
          </h2>
          <p>
            You may use SumanAI as a Guest or authenticate via Google OAuth 2.0. You are responsible for safeguarding any device or credentials used to access the Service.
          </p>
          <ul>
            <li>
              <strong>Guest Sessions:</strong> Guest data is primarily stored on your local browser device. Clearing cookies, application caches, or browsing in incognito mode will permanently erase unsaved guest sessions.
            </li>
            <li>
              <strong>Authenticated Accounts:</strong> When signing in with Google, your account profile is stored securely in Firebase Authentication and Cloud Firestore. You agree to notify us immediately of any unauthorized access.
            </li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>
            <AlertTriangle size={20} />
            4. Acceptable Use Policy
          </h2>
          <p>
            You agree not to misuse the Service or assist any third party in doing so. You expressly agree that you will not:
          </p>
          <ul>
            <li>Generate or disseminate illegal, sexually explicit, defamatory, or hateful content.</li>
            <li>Facilitate the creation of malware, malicious scripts, cyber weapons, or system exploits.</li>
            <li>Attempt to reverse-engineer, decompile, scrape, or extract source code or underlying neural model weights.</li>
            <li>Bypass rate limits, security tokens, or quota restrictions imposed by SumanAI or upstream model providers.</li>
            <li>Transmit unsolicited communications, spam, or automated bot requests that impair platform stability.</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>
            <Cpu size={20} />
            5. AI Output & Disclaimer of Hallucinations
          </h2>
          <p>
            Generative artificial intelligence operates through probabilistic modeling. You acknowledge and accept that:
          </p>
          <div className="legal-callout">
            <AlertTriangle size={22} className="legal-callout-icon" />
            <div className="legal-callout-text">
              <strong>Non-Deterministic Outputs:</strong> AI responses may occasionally contain factual inaccuracies, unintended biases, or model hallucinations. Outputs should never replace professional medical, legal, financial, or safety advice. Always verify mission-critical information.
            </div>
          </div>
        </section>

        <section className="legal-section">
          <h2>
            <Scale size={20} />
            6. Intellectual Property & Ownership
          </h2>
          <p>
            As between you and SumanAI, you retain ownership of all original text, prompts, and media that you submit to the Service. Subject to applicable third-party model licensing:
          </p>
          <ul>
            <li>You own the outputs generated specifically for you by the AI models during your valid sessions.</li>
            <li>SumanAI does not claim copyright ownership over your unique created outputs.</li>
            <li>You grant SumanAI a non-exclusive, worldwide, royalty-free license solely to process, stream, and format your inputs as necessary to deliver the Service to you.</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>
            <ShieldCheck size={20} />
            7. Limitation of Liability
          </h2>
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, SUMANAI AND ITS AFFILIATES, OFFICERS, DIRECTORS, AND PARTNERS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES RESULTING FROM:
          </p>
          <ul>
            <li>YOUR ACCESS TO OR INABILITY TO ACCESS OR USE THE SERVICE;</li>
            <li>ANY RELIANCE PLACED ON GENERATED AI OUTPUTS;</li>
            <li>ANY UNAUTHORIZED ACCESS OR ALTERATION OF YOUR CONTENT OR DATA;</li>
            <li>SERVICE DOWNTIME OR UPSTREAM PROVIDER LATENCY.</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>
            <HelpCircle size={20} />
            8. Modifications and Contact
          </h2>
          <p>
            We reserve the right to revise or replace these Terms at any time. When modifications are made, we will update the &quot;Effective Date&quot; at the top of this document. Continued usage following updates signifies acceptance of the amended Terms.
          </p>
          <p>
            For questions, legal notices, or inquiries regarding these Terms, contact our engineering and legal team at{' '}
            <a
              href="mailto:support_sumanai@sumanonline.com?subject=SumanAI%20Terms%20Inquiry"
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

export default TermsOfService;

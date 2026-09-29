import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  ArrowLeft,
  Sparkles,
  Zap,
  ShieldCheck,
  Cpu,
  Layers,
  Code2,
  Globe2,
  ExternalLink,
  MessageSquare,
  Mail
} from 'lucide-react';
import './LegalPage.css';

const AboutUs = () => {
  const navigate = useNavigate();

  return (
    <div className="legal-page-wrapper">
      <div className="legal-page-container">
      <Helmet>
        <title>About Us - SumanAI</title>
        <meta
          name="description"
          content="Learn about SumanAI, our mission to build ultra-fast, multi-model generative intelligence, and the engineer behind it."
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
          <Sparkles size={13} />
          <span>Vision & Engineering</span>
        </div>

        <h1 className="legal-title">About SumanAI</h1>
        <p className="legal-subtitle">
          Empowering creators, developers, and thinkers with ultra-low latency multi-model intelligence and local edge privacy.
        </p>

        <div className="legal-meta">
          <span>Release: <strong>v2.4.0</strong></span>
          <span>•</span>
          <span>Build: September 29, 2026</span>
          <span>•</span>
          <a
            href="https://github.com/SumanCH8514/SumanAI-Chat-Platform/releases/tag/v2.4.0"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--brand-primary)', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            GitHub Release Notes <ExternalLink size={12} />
          </a>
        </div>
      </div>

      <div className="about-hero-stats">
        <div className="stat-item">
          <div className="stat-number">&lt;200ms</div>
          <div className="stat-label">Stream Latency</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">10+</div>
          <div className="stat-label">AI Models</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">100%</div>
          <div className="stat-label">Local Image Tools</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">Zero</div>
          <div className="stat-label">Prompts Sold</div>
        </div>
      </div>

      <div className="legal-content">
        <section className="legal-section">
          <h2>
            <Globe2 size={20} />
            Our Mission
          </h2>
          <p>
            SumanAI was conceived with a clear objective: to dismantle the friction between human thought and machine intelligence. Most modern AI platforms are slow, lock users into a single proprietary model, and gate essential privacy controls behind steep paywalls.
          </p>
          <p>
            We designed SumanAI from the ground up as a fluid, multi-model cockpit. Whether you are debugging complex code, brainstorming creative narratives, analyzing documents, or isolating image subjects, SumanAI provides direct access to the world&apos;s best open and state-of-the-art weights in a unified, beautiful workspace.
          </p>
        </section>

        <section className="legal-section">
          <h2>
            <Layers size={20} />
            Core Engineering Pillars
          </h2>
          <div className="legal-card-grid">
            <div className="legal-card">
              <div className="legal-card-icon">
                <Zap size={20} />
              </div>
              <div className="legal-card-title">Low-Latency Streaming</div>
              <div className="legal-card-desc">
                Powered by Groq LPUs and NVIDIA NIM, tokens stream instantaneously, delivering near-instant cognitive feedback and fluid conversational pacing.
              </div>
            </div>

            <div className="legal-card">
              <div className="legal-card-icon">
                <Cpu size={20} />
              </div>
              <div className="legal-card-title">Multi-Model Agility</div>
              <div className="legal-card-desc">
                Switch effortlessly between Llama, Qwen, Gemma, GLM, and specialized vision models depending on the nuance of your creative or analytical task.
              </div>
            </div>

            <div className="legal-card">
              <div className="legal-card-icon">
                <Code2 size={20} />
              </div>
              <div className="legal-card-title">Interactive Canvas & Tools</div>
              <div className="legal-card-desc">
                Integrated client-side WebAssembly utilities allow background removal and media manipulation directly on your hardware without cloud upload delays.
              </div>
            </div>

            <div className="legal-card">
              <div className="legal-card-icon">
                <ShieldCheck size={20} />
              </div>
              <div className="legal-card-title">Privacy Sovereignty</div>
              <div className="legal-card-desc">
                Zero telemetry on your private prompts, zero model fine-tuning on your inputs, and complete JSON data portability with one-click export.
              </div>
            </div>
          </div>
        </section>

        <section className="legal-section">
          <h2>
            <Code2 size={20} />
            Architecture & Technology
          </h2>
          <p>
            SumanAI operates on a modern, high-resilience architecture crafted for performance:
          </p>
          <ul>
            <li><strong>Frontend:</strong> React 19, Vite, responsive vanilla CSS tokens with glassmorphism styling and zero heavy runtime bloat.</li>
            <li><strong>Edge Infrastructure:</strong> Cloudflare Workers and global edge caching for secure proxying and DDoS defense.</li>
            <li><strong>Authentication & Storage:</strong> Firebase Authentication with Google OAuth 2.0 and Google Cloud Firestore real-time synchronization.</li>
            <li><strong>AI Acceleration:</strong> NVIDIA NIM cloud microservices and Groq Language Processing Units (LPUs).</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>
            <Sparkles size={20} />
            Creator & Engineering
          </h2>
          <div className="about-author-card">
            <div className="about-author-info">
              <div className="about-author-name">Suman Chakrabortty</div>
              <div className="about-author-role">Founder & Lead Software Architect</div>
              <div className="about-author-bio">
                Passionate software engineer specialized in full-stack architecture, distributed systems, and real-time generative AI interfaces. Committed to creating high-performance tools that elevate human potential.
              </div>
              <div className="about-author-links">
                <a
                  href="https://github.com/SumanCH8514/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="about-social-btn"
                >
                  <ExternalLink size={14} />
                  <span>GitHub</span>
                </a>
                <a
                  href="https://www.linkedin.com/in/sumanchakrabortty8514/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="about-social-btn"
                >
                  <ExternalLink size={14} />
                  <span>LinkedIn</span>
                </a>
                <a
                  href="mailto:support_sumanai@sumanonline.com?subject=SumanAI%20Inquiry"
                  className="about-social-btn"
                >
                  <Mail size={14} />
                  <span>Email Support</span>
                </a>
              </div>
            </div>
          </div>
        </section>

        <div className="about-cta-box">
          <div className="about-cta-title">Start Creating with SumanAI</div>
          <div className="about-cta-desc">
            Experience the combination of high-speed multi-model intelligence, instant guest access, and an ultra-modern workspace.
          </div>
          <Link to="/" className="about-cta-btn">
            <MessageSquare size={16} />
            <span>Launch Workspace</span>
          </Link>
        </div>
      </div>
    </div>
  </div>
);
};

export default AboutUs;

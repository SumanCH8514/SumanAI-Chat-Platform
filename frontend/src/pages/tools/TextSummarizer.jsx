import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, ArrowLeft, Copy, Check, Download, Trash2,
  RefreshCw, Sparkles, BookOpen, Clock, FileDown,
  Home, ExternalLink, Zap, ShieldCheck, Layers
} from 'lucide-react';
import { chatService } from '../../services/ChatService';
import './ToolAppShared.css';
import './TextSummarizer.css';

const SUMMARY_MODES = [
  {
    id: 'executive',
    label: 'Executive Brief',
    desc: 'C-level 3-paragraph briefing with background, impact, and decision recommendations'
  },
  {
    id: 'takeaways',
    label: 'Key Takeaways',
    desc: 'Bullet points categorized by strategic value, technical implications, and milestones'
  },
  {
    id: 'actions',
    label: 'Action Items & Next Steps',
    desc: 'Operational checklist with deliverables, ownership targets, and deadlines'
  },
  {
    id: 'tldr',
    label: 'TL;DR One-Liner',
    desc: 'High-density single sentence distillations for rapid status broadcasts'
  }
];

const LENGTHS = [
  { id: 'short', label: 'Concise (~100w)' },
  { id: 'medium', label: 'Balanced (~250w)' },
  { id: 'long', label: 'Comprehensive (~500w)' }
];

const SAMPLE_TEXTS = [
  {
    id: 'infra',
    label: 'Database Migration Report',
    text: `Executive Engineering Update: Q3 Database Sharding & Migration
Over the past 6 weeks, the Data Infrastructure team executed Phase 2 of our transition from a monolithic PostgreSQL cluster to a horizontally-partitioned distributed architecture utilizing CockroachDB with Redis cluster caching tiers. 

Key Metrics & Observed Gains:
- P99 read latencies dropped from 240ms to 24ms under 45,000 requests per second.
- Write query throughput scaled linearly across 8 regional replica nodes.
- Storage efficiency increased 38% due to Zstandard compression blocks.

Critical Incidents & Mitigations:
During the scheduled cutover window on October 14 at 02:00 UTC, connection pooling saturation in the US-East edge cluster caused a 4-minute intermittent timeout window for 1.8% of active sessions. The automated failover circuit breaker isolated the affected nodes within 180 seconds, restoring 100% nominal traffic without transactional data corruption.

Immediate Next Steps:
1. Complete validation of cross-region read replicas by November 15 (Lead: Dave Chen).
2. Decommission legacy cold backup storage to reclaim $18,400 monthly cloud expenditure (Lead: Sarah Jenkins).
3. Conduct disaster recovery simulated partition drills on December 2.`
  },
  {
    id: 'earnings',
    label: 'Corporate Strategy Memo',
    text: `To: Senior Leadership Team
From: Office of the Chief Executive
Subject: FY27 Enterprise AI Strategy & Operational Efficiency

As we prepare for the upcoming fiscal cycle, our primary corporate objective centers on embedding automated generative workflows directly into our core product pipelines while aggressively defending our operating margins. 

Market Assessment:
The enterprise software space is witnessing a compression of basic SaaS pricing tiers. Value capture is shifting toward autonomous task execution, verifiable accuracy, and zero-data-retention compliance guarantees. Enterprise prospects are declining multi-year commitments unless enterprise SOC2 Type II and on-premise model deployment options are guaranteed.

Strategic Initiatives:
First, we are consolidating our fragmented ML infrastructure onto unified GPU inference clusters, targeting an 40% reduction in unit token costs. Second, our customer support automation tier will undergo a full redesign to support real-time audio and ticket resolution without human escalation for Tier-1 inquiries. Third, product marketing will reposition our platform from an "AI-assisted utility" to an "Agentic Operations System".

Budget Allocations:
We are reallocating $4.2M from outbound marketing into developer relations and SDK documentation. All departmental leads must submit their revised head-count forecasts reflecting these priority shifts by Friday at 17:00 EST.`
  }
];

export const TextSummarizer = () => {
  const navigate = useNavigate();
  const [inputText, setInputText] = useState(SAMPLE_TEXTS[0].text);
  const [mode, setMode] = useState('executive');
  const [length, setLength] = useState('medium');
  const [summary, setSummary] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileUploadRef = useRef(null);

  const wordCount = inputText.trim() ? inputText.trim().split(/\s+/).length : 0;
  const readingTime = Math.max(1, Math.round(wordCount / 200));

  const summaryWordCount = summary.trim() ? summary.trim().split(/\s+/).length : 0;
  const compressionRatio = wordCount > 0 && summaryWordCount > 0
    ? Math.max(0, Math.round((1 - summaryWordCount / wordCount) * 100))
    : 0;

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result;
        if (typeof content === 'string') {
          setInputText(content);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleSummarize = async () => {
    if (!inputText.trim() || isSummarizing) return;
    setIsSummarizing(true);
    setSummary('');

    const modeObj = SUMMARY_MODES.find((m) => m.id === mode);
    const lengthObj = LENGTHS.find((l) => l.id === length);

    const systemPrompt = `You are an elite executive communications analyst. Your job is to summarize text with high precision, authoritative prose, zero fluff, and zero conversational pleasantries.
Format mode: ${modeObj?.label} (${modeObj?.desc})
Target length: ${lengthObj?.label}
Rules:
- Never say "Here is a summary" or similar intros.
- Maintain dense, informative language.
- Preserve all real metrics, numbers, and dates.`;

    try {
      await chatService.generateResponse(
        'qwen/qwen3.8-27b',
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: inputText }
        ],
        (chunk) => {
          setSummary((prev) => prev + chunk);
        }
      );
    } catch {
      setSummary('Failed to generate summary. Please check your network connection and try again.');
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleCopy = () => {
    if (!summary) return;
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (format) => {
    if (!summary) return;
    const blob = new Blob([summary], { type: format === 'md' ? 'text/markdown' : 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SumanAI_Executive_Summary.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="tool-app-wrapper">
      <header className="tool-app-header">
        <nav className="tool-nav-breadcrumb">
          <div className="tool-breadcrumb-left">
            <button
              type="button"
              className="breadcrumb-home-btn"
              onClick={() => navigate('/')}
              title="Home"
            >
              <Home size={13} />
            </button>
            <span className="breadcrumb-sep">&gt;</span>
            <button
              type="button"
              className="breadcrumb-link"
              onClick={() => navigate('/tools/view')}
            >
              Tools
            </button>
            <span className="breadcrumb-sep">&gt;</span>
            <span className="breadcrumb-link">Writing & Docs</span>
            <span className="breadcrumb-sep">&gt;</span>
            <span className="breadcrumb-current">Executive Summarizer</span>
          </div>

          <a
            href="https://ai.google.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="tool-doc-btn"
            title="Summarization Documentation"
          >
            <BookOpen size={13} />
            <span>Documentation</span>
            <ExternalLink size={11} className="doc-ext-icon" />
          </a>
        </nav>

        <div className="tool-header-content">
          <div className="tool-title-row">
            <div className="tool-avatar-icon purple">
              <FileText size={22} />
            </div>
            <div className="tool-title-texts">
              <h1 className="tool-app-heading">Executive Summarizer</h1>
              <p className="tool-app-subheading">
                Distill technical memos, boardroom decks, and transcripts into high-impact structured briefings.
              </p>
            </div>
          </div>

          <div className="tool-chips-row">
            <span className="chip-badge chip-qwen">
              <Layers size={12} />
              <span>Qwen-3.8-27B</span>
            </span>
            <span className="chip-badge chip-purple">
              <Zap size={12} />
              <span>Strategic Brief</span>
            </span>
            <span className="chip-badge chip-zerogpu">
              <ShieldCheck size={12} />
              <span>Zero Retention</span>
            </span>
          </div>
        </div>
      </header>

      <main className="tool-app-body">
        <section className="tool-config-panel">
          <div className="tool-input-group">
            <div className="tool-label">
              <span>Source Document</span>
              <div className="summarizer-input-telemetry">
                <span>{wordCount} words</span>
                <span>•</span>
                <span>~{readingTime} min read</span>
              </div>
            </div>

            <div className="summarizer-sample-pills">
              {SAMPLE_TEXTS.map((sample) => (
                <button
                  key={sample.id}
                  type="button"
                  className="summarizer-sample-pill"
                  onClick={() => setInputText(sample.text)}
                >
                  {sample.label}
                </button>
              ))}
              <button
                type="button"
                className="summarizer-sample-pill"
                onClick={() => fileUploadRef.current?.click()}
              >
                Upload File (.txt, .md)
              </button>
              <input
                ref={fileUploadRef}
                type="file"
                accept=".txt,.md,.csv"
                style={{ display: 'none' }}
                onChange={handleFileUpload}
              />
            </div>

            <textarea
              className="tool-textarea summarizer-textarea"
              rows={8}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste reports, meeting logs, customer interviews, or whitepapers..."
            />
          </div>

          <div className="tool-input-group">
            <label className="tool-label">Summary Architecture</label>
            <div className="tool-grid-options">
              {SUMMARY_MODES.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className={`tool-option-card ${mode === m.id ? 'active' : ''}`}
                  onClick={() => setMode(m.id)}
                >
                  <span>{m.label}</span>
                  <span className="tool-option-desc">{m.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="tool-input-group">
            <label className="tool-label">Target Output Density</label>
            <div className="summarizer-density-row">
              {LENGTHS.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  className={`summarizer-density-pill ${length === l.id ? 'active' : ''}`}
                  onClick={() => setLength(l.id)}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            className="tool-btn-primary"
            onClick={handleSummarize}
            disabled={isSummarizing || !inputText.trim()}
          >
            {isSummarizing ? (
              <>
                <RefreshCw size={16} className="tool-loading-spinner" />
                Synthesizing Briefing...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Generate Executive Brief
              </>
            )}
          </button>
        </section>

        <section className="tool-result-panel">
          <div className="tool-result-header">
            <div className="tool-result-title">
              <BookOpen size={16} />
              <span>Structured Briefing</span>
              {summary && (
                <span className="tool-telemetry-badge">
                  {summaryWordCount} words • {compressionRatio}% compressed
                </span>
              )}
            </div>

            {summary && (
              <div className="tool-result-actions">
                <button
                  type="button"
                  className="tool-btn-secondary"
                  onClick={handleCopy}
                  title="Copy to clipboard"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  type="button"
                  className="tool-btn-secondary"
                  onClick={() => handleDownload('md')}
                  title="Download Markdown"
                >
                  <Download size={14} />
                  <span>.MD</span>
                </button>
                <button
                  type="button"
                  className="tool-btn-secondary"
                  onClick={() => handleDownload('txt')}
                  title="Download Plain Text"
                >
                  <FileDown size={14} />
                  <span>.TXT</span>
                </button>
                <button
                  type="button"
                  className="tool-btn-secondary"
                  onClick={() => setSummary('')}
                  title="Clear Output"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </div>

          <div className="summarizer-output-container">
            {isSummarizing && !summary ? (
              <div className="summarizer-loading-box">
                <RefreshCw size={32} className="tool-loading-spinner" />
                <p className="summarizer-loading-text">
                  Distilling source text through {SUMMARY_MODES.find((m) => m.id === mode)?.label} model...
                </p>
              </div>
            ) : summary ? (
              <div className="summarizer-rendered-content">
                {summary.split('\n\n').map((para, i) => (
                  <p key={i} className="summarizer-paragraph">
                    {para}
                  </p>
                ))}
              </div>
            ) : (
              <div className="tool-empty-display">
                <div className="tool-empty-icon-box">
                  <FileText size={28} />
                </div>
                <h3 className="empty-state-title">Awaiting Source Material</h3>
                <p className="empty-state-desc">
                  Paste transcripts or documentation on the left, pick a summarization profile, and initiate synthesis.
                </p>

                <div className="empty-features-grid">
                  <div className="feature-pill-card">
                    <Zap size={14} className="feature-card-icon" />
                    <div className="feature-card-text">
                      <span className="feature-card-title">Strategic Density</span>
                      <span className="feature-card-desc">C-level high impact synthesis</span>
                    </div>
                  </div>
                  <div className="feature-pill-card">
                    <Layers size={14} className="feature-card-icon" />
                    <div className="feature-card-text">
                      <span className="feature-card-title">Structured Output</span>
                      <span className="feature-card-desc">Action items & key takeaways</span>
                    </div>
                  </div>
                  <div className="feature-pill-card">
                    <ShieldCheck size={14} className="feature-card-icon" />
                    <div className="feature-card-text">
                      <span className="feature-card-title">100% Confidential</span>
                      <span className="feature-card-desc">Private workspace processing</span>
                    </div>
                  </div>
                  <div className="feature-pill-card">
                    <Clock size={14} className="feature-card-icon" />
                    <div className="feature-card-text">
                      <span className="feature-card-title">Streaming Delivery</span>
                      <span className="feature-card-desc">Fast markdown response</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default TextSummarizer;


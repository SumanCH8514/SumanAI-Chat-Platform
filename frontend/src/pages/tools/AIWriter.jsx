import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileEdit, ArrowLeft, Copy, Check, Download, Trash2,
  RefreshCw, Sparkles, Eye, Edit3, FileDown, BookOpen
} from 'lucide-react';
import { chatService } from '../../services/ChatService';
import './ToolAppShared.css';
import './AIWriter.css';

const DOC_TYPES = [
  { id: 'memo', label: 'Executive Memo', desc: 'Internal briefing for senior management with background, objectives, and directives' },
  { id: 'rfc', label: 'Technical RFC / Spec', desc: 'Architecture specification with design decisions, API contracts, and trade-offs' },
  { id: 'press', label: 'Product Press Release', desc: 'Public launch announcement following Amazon working-backwards PR/FAQ format' },
  { id: 'incident', label: 'Incident Post-Mortem', desc: 'SRE root cause analysis with impact timeline, triage steps, and preventative tasks' },
  { id: 'client', label: 'Client Communication', desc: 'Formal client-facing update, proposal, or quarterly business review note' }
];

const TONES = [
  { id: 'authoritative', label: 'Authoritative & Direct' },
  { id: 'technical', label: 'Technical & Precise' },
  { id: 'persuasive', label: 'Persuasive & Engaging' },
  { id: 'neutral', label: 'Neutral & Objective' }
];

const AUDIENCES = [
  { id: 'exec', label: 'C-Suite & Board' },
  { id: 'eng', label: 'Engineering & Product' },
  { id: 'clients', label: 'Enterprise Clients' },
  { id: 'general', label: 'General Public' }
];

const LENGTHS = [
  { id: 'compact', label: 'Brief (~250 words)' },
  { id: 'standard', label: 'Standard (~500 words)' },
  { id: 'detailed', label: 'Comprehensive (~900 words)' }
];

export const AIWriter = () => {
  const navigate = useNavigate();
  const [topic, setTopic] = useState('Deployment of Zero-Trust Network Architecture across Regional Production Nodes');
  const [keyPoints, setKeyPoints] = useState('- Cutover scheduled for midnight Saturday\n- Enforces mTLS between internal microservices\n- Estimated 1.2ms latency improvement\n- Requires updated SPIFFE identity tokens on all nodes');
  const [docType, setDocType] = useState('rfc');
  const [tone, setTone] = useState('technical');
  const [audience, setAudience] = useState('eng');
  const [targetLength, setTargetLength] = useState('standard');
  const [draft, setDraft] = useState('');
  const [isDrafting, setIsDrafting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editorMode, setEditorMode] = useState('preview');

  const wordCount = draft.trim() ? draft.trim().split(/\s+/).length : 0;
  const charCount = draft.length;
  const readTime = Math.max(1, Math.round(wordCount / 220));

  const handleDraft = async () => {
    if (!topic.trim() || isDrafting) return;
    setIsDrafting(true);
    setDraft('');

    const docObj = DOC_TYPES.find((d) => d.id === docType);
    const toneObj = TONES.find((t) => t.id === tone);
    const audObj = AUDIENCES.find((a) => a.id === audience);
    const lenObj = LENGTHS.find((l) => l.id === targetLength);

    const systemPrompt = `You are an exceptional principal technical writer and corporate communications strategist.
Produce a production-ready, fully structured document matching these requirements:
- Document Format: ${docObj?.label} (${docObj?.desc})
- Tone: ${toneObj?.label}
- Target Audience: ${audObj?.label}
- Length Target: ${lenObj?.label}
Rules:
- Output clean, professional markdown with appropriate headings, lists, and sections.
- Do NOT provide conversational meta-commentary like "Here is your document". Begin directly with the title or header.`;

    const userPrompt = `TOPIC: ${topic.trim()}\n\nKEY POINTS & REQUIREMENTS:\n${keyPoints.trim()}`;

    try {
      await chatService.generateResponse(
        'qwen/qwen3.8-27b',
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        (chunk) => {
          setDraft((prev) => prev + chunk);
        }
      );
    } catch {
      setDraft('An error occurred during generation. Please check your connectivity and retry.');
    } finally {
      setIsDrafting(false);
    }
  };

  const handleCopy = () => {
    if (!draft) return;
    navigator.clipboard.writeText(draft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (ext) => {
    if (!draft) return;
    const blob = new Blob([draft], { type: ext === 'md' ? 'text/markdown' : 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SumanAI_Document_${docType}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="tool-app-wrapper">
      <header className="tool-app-header">
        <nav className="tool-nav-breadcrumb">
          <button
            type="button"
            className="tool-nav-back-btn"
            onClick={() => navigate('/tools/view')}
          >
            <ArrowLeft size={13} />
            <span>Utilities</span>
          </button>
          <span className="tool-nav-sep">/</span>
          <span className="tool-nav-current">Professional Writer</span>
        </nav>

        <div className="tool-header-content">
          <div className="tool-title-row">
            <h1 className="tool-app-heading">Professional Writer</h1>
            <span className="tool-tag-pill">Enterprise Documentation</span>
          </div>
          <p className="tool-app-subheading">
            Compose executive memos, technical RFCs, post-mortems, and press releases with editorial precision.
          </p>
        </div>
      </header>

      <main className="tool-app-body">
        <section className="tool-config-panel">
          <div className="tool-input-group">
            <label className="tool-label">Document Title & Objective</label>
            <input
              type="text"
              className="tool-input-text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Migration to Distributed Event Bus Architecture..."
            />
          </div>

          <div className="tool-input-group">
            <label className="tool-label">Document Architecture</label>
            <div className="tool-grid-options">
              {DOC_TYPES.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  className={`tool-option-card ${docType === d.id ? 'active' : ''}`}
                  onClick={() => setDocType(d.id)}
                >
                  <span>{d.label}</span>
                  <span className="tool-option-desc">{d.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="tool-input-group">
            <label className="tool-label">Key Requirements & Bullet Points</label>
            <textarea
              className="tool-textarea writer-textarea"
              rows={4}
              value={keyPoints}
              onChange={(e) => setKeyPoints(e.target.value)}
              placeholder="List milestones, data points, dates, constraints, and dependencies..."
            />
          </div>

          <div className="tool-row-two-col">
            <div className="tool-input-group">
              <label className="tool-label">Voice & Tone</label>
              <select
                className="tool-select"
                value={tone}
                onChange={(e) => setTone(e.target.value)}
              >
                {TONES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="tool-input-group">
              <label className="tool-label">Audience</label>
              <select
                className="tool-select"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
              >
                {AUDIENCES.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="tool-input-group">
            <label className="tool-label">Document Target Length</label>
            <div className="writer-length-pills">
              {LENGTHS.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  className={`writer-length-pill ${targetLength === l.id ? 'active' : ''}`}
                  onClick={() => setTargetLength(l.id)}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            className="tool-btn-primary"
            onClick={handleDraft}
            disabled={isDrafting || !topic.trim()}
          >
            {isDrafting ? (
              <>
                <RefreshCw size={16} className="tool-loading-spinner" />
                Composing Document...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Generate Document
              </>
            )}
          </button>
        </section>

        <section className="tool-result-panel">
          <div className="tool-result-header">
            <div className="tool-result-title">
              <BookOpen size={16} />
              <span>Draft Workspace</span>
              {draft && (
                <span className="tool-telemetry-badge">
                  {wordCount} words • {charCount} chars • ~{readTime} min read
                </span>
              )}
            </div>

            <div className="tool-result-actions">
              {draft && (
                <>
                  <div className="writer-mode-pills">
                    <button
                      type="button"
                      className={`writer-mode-pill ${editorMode === 'preview' ? 'active' : ''}`}
                      onClick={() => setEditorMode('preview')}
                      title="Rendered Preview"
                    >
                      <Eye size={13} /> Preview
                    </button>
                    <button
                      type="button"
                      className={`writer-mode-pill ${editorMode === 'edit' ? 'active' : ''}`}
                      onClick={() => setEditorMode('edit')}
                      title="Raw Markdown Editor"
                    >
                      <Edit3 size={13} /> Edit
                    </button>
                  </div>

                  <button
                    type="button"
                    className="tool-btn-secondary"
                    onClick={handleCopy}
                    title="Copy formatted text"
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
                    onClick={() => setDraft('')}
                    title="Clear Document"
                  >
                    <Trash2 size={14} />
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="writer-workspace-container">
            {isDrafting && !draft ? (
              <div className="writer-loading-state">
                <RefreshCw size={34} className="tool-loading-spinner" />
                <p className="writer-loading-text">
                  Synthesizing {DOC_TYPES.find((d) => d.id === docType)?.label}...
                </p>
              </div>
            ) : draft ? (
              editorMode === 'edit' ? (
                <textarea
                  className="writer-raw-textarea"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                />
              ) : (
                <div className="writer-rendered-content">
                  {draft.split('\n\n').map((block, idx) => {
                    if (block.startsWith('# ')) {
                      return <h1 key={idx} className="writer-h1">{block.replace('# ', '')}</h1>;
                    }
                    if (block.startsWith('## ')) {
                      return <h2 key={idx} className="writer-h2">{block.replace('## ', '')}</h2>;
                    }
                    if (block.startsWith('### ')) {
                      return <h3 key={idx} className="writer-h3">{block.replace('### ', '')}</h3>;
                    }
                    return <p key={idx} className="writer-p">{block}</p>;
                  })}
                </div>
              )
            ) : (
              <div className="tool-empty-display">
                <div className="tool-empty-icon-box">
                  <FileEdit size={28} />
                </div>
                <p className="tool-empty-text">Drafting Canvas Ready</p>
                <p className="tool-empty-subtext">
                  Specify your document topic and architecture parameters to draft comprehensive enterprise documents.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default AIWriter;


import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Code2, ArrowLeft, Copy, Check, Download, Trash2,
  RefreshCw, Sparkles, ShieldAlert, Cpu, Bug, Wrench, FileCode
} from 'lucide-react';
import { chatService } from '../../services/ChatService';
import './ToolAppShared.css';
import './CodeAssistant.css';

const LANGUAGES = [
  { id: 'typescript', label: 'TypeScript', ext: 'ts' },
  { id: 'javascript', label: 'JavaScript', ext: 'js' },
  { id: 'python', label: 'Python', ext: 'py' },
  { id: 'go', label: 'Go (Golang)', ext: 'go' },
  { id: 'rust', label: 'Rust', ext: 'rs' },
  { id: 'sql', label: 'PostgreSQL / SQL', ext: 'sql' },
  { id: 'cpp', label: 'C++', ext: 'cpp' },
  { id: 'shell', label: 'Bash / Shell', ext: 'sh' }
];

const AUDIT_MODES = [
  { id: 'security', label: 'Security & Vulnerability', icon: ShieldAlert, desc: 'Detect injection vectors, credential leaks, and unsafe deserialization' },
  { id: 'performance', label: 'Complexity & Big-O', icon: Cpu, desc: 'Analyze time/space complexity, allocations, and loop bottlenecks' },
  { id: 'bugfix', label: 'Logic & Race Conditions', icon: Bug, desc: 'Diagnose null pointers, unhandled edge cases, and asynchronous bugs' },
  { id: 'refactor', label: 'Idiomatic Refactoring', icon: Wrench, desc: 'Modernize syntax, modularize routines, and enforce strict type safety' },
  { id: 'tests', label: 'Test Suite Generator', icon: FileCode, desc: 'Generate unit and integration suites with edge case coverage' }
];

const SAMPLE_SNIPPETS = {
  typescript: `async function fetchUserData(userId: string) {
  const query = "SELECT * FROM users WHERE id = '" + userId + "' AND active = 1";
  const user = await db.raw(query);
  
  if (!globalCache[userId]) {
    globalCache[userId] = user;
  }
  
  return globalCache[userId];
}`,
  python: `def compute_fibonacci_sequence(n):
    if n <= 0:
        return []
    def fib(k):
        if k <= 1:
            return k
        return fib(k - 1) + fib(k - 2)
    return [fib(i) for i in range(n)]`,
  sql: `SELECT o.id, o.created_at, u.email, COUNT(i.id) as item_count
FROM orders o
JOIN users u ON o.user_id = u.id
JOIN order_items i ON i.order_id = o.id
WHERE o.status != 'cancelled'
GROUP BY o.id, o.created_at, u.email
ORDER BY o.created_at DESC;`
};

export const CodeAssistant = () => {
  const navigate = useNavigate();
  const [selectedLang, setSelectedLang] = useState('typescript');
  const [auditMode, setAuditMode] = useState('security');
  const [code, setCode] = useState(SAMPLE_SNIPPETS.typescript);
  const [analysis, setAnalysis] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleLangChange = (langId) => {
    setSelectedLang(langId);
    if (SAMPLE_SNIPPETS[langId]) {
      setCode(SAMPLE_SNIPPETS[langId]);
    }
  };

  const handleAudit = async () => {
    if (!code.trim() || isAnalyzing) return;
    setIsAnalyzing(true);
    setAnalysis('');

    const langObj = LANGUAGES.find((l) => l.id === selectedLang);
    const modeObj = AUDIT_MODES.find((m) => m.id === auditMode);

    const systemPrompt = `You are a principal software engineer and staff systems security architect.
Conduct a rigorous code review focusing on: ${modeObj?.label} (${modeObj?.desc})
Language: ${langObj?.label}

Provide your evaluation in this strict structure:
1. Executive Summary & Severity Rating (Critical / Warning / Clean)
2. Specific Findings & Root-Cause Explanation
3. Algorithmic Complexity / Performance Impact
4. Production-Grade Refactored Code (in a complete code block)

Rules:
- Be concise, direct, and technically exact.
- Do NOT use fluff intros or generic advice.`;

    try {
      await chatService.generateResponse(
        'qwen/qwen3.8-27b',
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Here is the code to audit:\n\`\`\`${selectedLang}\n${code}\n\`\`\`` }
        ],
        (chunk) => {
          setAnalysis((prev) => prev + chunk);
        }
      );
    } catch {
      setAnalysis('Code review failed. Please check your network and retry.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCopy = () => {
    if (!analysis) return;
    navigator.clipboard.writeText(analysis);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!analysis) return;
    const blob = new Blob([analysis], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SumanAI_CodeReview_${selectedLang}_${auditMode}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const lineCount = code.split('\n').length;

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
          <span className="tool-nav-current">Code Reviewer & Optimizer</span>
        </nav>

        <div className="tool-header-content">
          <div className="tool-title-row">
            <h1 className="tool-app-heading">Code Reviewer & Optimizer</h1>
            <span className="tool-tag-pill">Staff Engineer Audit</span>
          </div>
          <p className="tool-app-subheading">
            Audit algorithms, benchmark performance, diagnose security vulnerabilities, and inspect Big-O complexity.
          </p>
        </div>
      </header>

      <main className="tool-app-body code-layout">
        <section className="tool-config-panel code-editor-pane">
          <div className="code-lang-row">
            <div className="code-lang-select-wrap">
              <select
                className="tool-select code-select"
                value={selectedLang}
                onChange={(e) => handleLangChange(e.target.value)}
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.id} value={lang.id}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="code-meta-badge">
              {lineCount} lines • {code.length} chars
            </div>
          </div>

          <div className="tool-input-group">
            <label className="tool-label">Review Focus & Mode</label>
            <div className="tool-grid-options">
              {AUDIT_MODES.map((mode) => {
                const IconComponent = mode.icon;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    className={`tool-option-card ${auditMode === mode.id ? 'active' : ''}`}
                    onClick={() => setAuditMode(mode.id)}
                  >
                    <div className="code-mode-header">
                      <IconComponent size={14} />
                      <span>{mode.label}</span>
                    </div>
                    <span className="tool-option-desc">{mode.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="tool-input-group code-textarea-group">
            <div className="tool-label">
              <span>Source Snippet</span>
              <button
                type="button"
                className="tool-enhance-btn"
                onClick={() => setCode('')}
              >
                <Trash2 size={12} /> Clear
              </button>
            </div>

            <textarea
              className="code-editor-textarea"
              rows={12}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Paste functions, SQL queries, or scripts here..."
              spellCheck={false}
            />
          </div>

          <button
            type="button"
            className="tool-btn-primary"
            onClick={handleAudit}
            disabled={isAnalyzing || !code.trim()}
          >
            {isAnalyzing ? (
              <>
                <RefreshCw size={16} className="tool-loading-spinner" />
                Auditing Codebase Logic...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Run Code Review
              </>
            )}
          </button>
        </section>

        <section className="tool-result-panel code-result-pane">
          <div className="tool-result-header">
            <div className="tool-result-title">
              <FileCode size={16} />
              <span>Diagnostic Findings & Refactored Solution</span>
            </div>

            {analysis && (
              <div className="tool-result-actions">
                <button
                  type="button"
                  className="tool-btn-secondary"
                  onClick={handleCopy}
                  title="Copy analysis report"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  type="button"
                  className="tool-btn-secondary"
                  onClick={handleDownload}
                  title="Download Markdown Report"
                >
                  <Download size={14} />
                  <span>Download .MD</span>
                </button>
                <button
                  type="button"
                  className="tool-btn-secondary"
                  onClick={() => setAnalysis('')}
                  title="Clear Analysis"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </div>

          <div className="code-result-container">
            {isAnalyzing && !analysis ? (
              <div className="code-loading-state">
                <RefreshCw size={34} className="tool-loading-spinner" />
                <p className="code-loading-title">
                  Scanning for {AUDIT_MODES.find((m) => m.id === auditMode)?.label}...
                </p>
                <p className="code-loading-desc">
                  Profiling memory allocations, execution complexity, and anti-patterns.
                </p>
              </div>
            ) : analysis ? (
              <div className="code-rendered-markdown">
                {analysis.split('\n\n').map((block, idx) => {
                  if (block.startsWith('```')) {
                    const cleanCode = block.replace(/```[a-z]*\n?/g, '');
                    return (
                      <pre key={idx} className="code-pre-block">
                        <code>{cleanCode}</code>
                      </pre>
                    );
                  }
                  if (block.startsWith('# ') || block.startsWith('## ') || block.startsWith('### ')) {
                    return (
                      <div key={idx} className="code-section-heading">
                        {block.replace(/^#+\s*/, '')}
                      </div>
                    );
                  }
                  return (
                    <p key={idx} className="code-paragraph">
                      {block}
                    </p>
                  );
                })}
              </div>
            ) : (
              <div className="tool-empty-display">
                <div className="tool-empty-icon-box">
                  <Code2 size={28} />
                </div>
                <p className="tool-empty-text">Review Pipeline Ready</p>
                <p className="tool-empty-subtext">
                  Choose an audit focus on the left, paste your source code, and run diagnostics to receive line-by-line optimizations.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default CodeAssistant;

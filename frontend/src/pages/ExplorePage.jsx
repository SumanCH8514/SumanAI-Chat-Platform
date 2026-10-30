import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Compass,
  Search,
  Copy,
  Check,
  ArrowRight,
  Code2,
  Cpu,
  BarChart3,
  FileText,
  Eye,
  ShieldCheck,
  Terminal,
  Zap
} from 'lucide-react';
import { useChatStore } from '../store/useChatStore';
import { useModel } from '../hooks/useModel';
import './ExplorePage.css';

const EXPLORE_PROMPTS = [
  {
    id: 'code-audit',
    title: 'Code Security & Architecture Audit',
    category: 'Engineering',
    modelId: 'openai/gpt-oss-120b',
    modelName: 'GPT-OSS 120B',
    description: 'Audit a component or API route for privilege escalation, memory leaks, and SSRF vulnerabilities.',
    prompt: 'Perform a comprehensive architectural and security audit of the following code. Identify potential edge cases, injection vectors, memory or concurrency issues, and provide optimized production drop-in replacements:\n\n[PASTE CODE HERE]',
    icon: ShieldCheck
  },
  {
    id: 'react-perf',
    title: 'React Performance & State Optimization',
    category: 'Engineering',
    modelId: 'openai/gpt-oss-120b',
    modelName: 'GPT-OSS 120B',
    description: 'Pinpoint unnecessary re-renders, optimize memoization hooks, and profile bundle bottlenecks.',
    prompt: 'Analyze this React component tree for unnecessary renders and expensive recalculations. Refactor it using useMemo, useCallback, or state colocation with clean TypeScript types:\n\n[PASTE REACT COMPONENT HERE]',
    icon: Code2
  },
  {
    id: 'sql-schema',
    title: 'Relational Schema & Index Modeling',
    category: 'Data Analysis',
    modelId: 'qwen/qwen3.8-27b',
    modelName: 'Qwen 3.8 27B',
    description: 'Design normalized database tables with foreign keys, composite indexes, and migration scripts.',
    prompt: 'Design a high-throughput relational database schema for a high-concurrency platform. Include tables, foreign key constraints, B-Tree and GIN indexes, and an explanation of query patterns:\n\nEntity Requirements: [DESCRIBE APPLICATION REQUIREMENTS]',
    icon: Terminal
  },
  {
    id: 'vision-analysis',
    title: 'Multimodal Document & Diagram Extraction',
    category: 'Vision & Media',
    modelId: 'meta/llama-3.2-11b-vision-instruct',
    modelName: 'Llama 3.2 Vision',
    description: 'Transcribe structured tables, flowcharts, or handwritten notes from uploaded images.',
    prompt: 'Please analyze the attached image in detail. Extract any tabular data into clean Markdown format, translate any technical flow diagrams into Mermaid syntax, and summarize the key operational takeaways.',
    icon: Eye
  },
  {
    id: 'api-contract',
    title: 'REST / GraphQL API Contract Spec',
    category: 'Engineering',
    modelId: 'z-ai/glm-5.3',
    modelName: 'GLM 5.3',
    description: 'Draft OpenAPI 3.1 specifications with payload schemas, error status codes, and mock examples.',
    prompt: 'Draft an enterprise OpenAPI 3.1 contract specification for a multi-tenant service. Include request/response payloads, authentication headers, error envelopes (400, 401, 403, 429), and rate limit headers for:\n\nEndpoints: [LIST ENDPOINTS]',
    icon: Zap
  },
  {
    id: 'data-summary',
    title: 'Executive Metric & Trend Synthesizer',
    category: 'Writing & Logic',
    modelId: 'moonshotai/kimi-k3',
    modelName: 'Kimi K3',
    description: 'Condense raw operational telemetry and logs into structured executive briefs.',
    prompt: 'Analyze the following operational dataset. Calculate key variance metrics, identify root cause anomalies, and format an executive summary with clear action items and risk assessments:\n\n[PASTE DATA/METRICS HERE]',
    icon: BarChart3
  },
  {
    id: 'algo-solver',
    title: 'Algorithmic Complexity & Benchmark',
    category: 'Engineering',
    modelId: 'google/gemma-4-31b-it',
    modelName: 'Gemma 4 31B IT',
    description: 'Solve competitive programming challenges with formal time and space complexity proofs.',
    prompt: 'Provide an optimal algorithm to solve the following computational problem. State the Big-O time and space complexity, explain mathematical invariants, and implement the solution in modern Python and TypeScript:\n\nProblem Statement: [PASTE PROBLEM HERE]',
    icon: Cpu
  },
  {
    id: 'tech-doc',
    title: 'Technical Specification & RFC Writer',
    category: 'Writing & Logic',
    modelId: 'openai/gpt-oss-20b',
    modelName: 'GPT-OSS 20B',
    description: 'Compose comprehensive Request for Comments (RFC) documents for engineering proposals.',
    prompt: 'Write an engineering RFC (Request for Comments) for the proposed technical initiative below. Structure it with: Problem Statement, Design Goals, Architectural Alternatives Considered, Security & Threat Model, and Rollout Plan:\n\nInitiative: [DESCRIBE PROPOSED FEATURE/SYSTEM]',
    icon: FileText
  }
];

const CATEGORIES = ['All', 'Engineering', 'Data Analysis', 'Writing & Logic', 'Vision & Media'];

export const ExplorePage = () => {
  const navigate = useNavigate();
  const startChatWithPrompt = useChatStore((state) => state.startChatWithPrompt);
  const { models, setSelectedModel } = useModel();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  const filteredPrompts = useMemo(() => {
    return EXPLORE_PROMPTS.filter((item) => {
      const matchCat = selectedCategory === 'All' || item.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.prompt.toLowerCase().includes(q);
      return matchCat && matchQuery;
    });
  }, [selectedCategory, searchQuery]);

  const handleLaunchPrompt = (item) => {
    const targetModel = models.find((m) => m.id === item.modelId);
    if (targetModel && !targetModel.locked) {
      setSelectedModel(targetModel);
    }
    startChatWithPrompt(item.prompt);
    navigate('/');
  };

  const handleCopyPrompt = (id, prompt) => {
    navigator.clipboard.writeText(prompt);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="explore-page-wrap">
      <header className="explore-header">
        <div className="explore-header-text">
          <h1 className="explore-title">Explore Capabilities</h1>
          <p className="explore-subtitle">
            Curated prompt workflows and specialized task architectures tailored for frontier AI models.
          </p>
        </div>
      </header>

      <section className="explore-controls-row">
        <div className="explore-search-wrap">
          <Search size={15} className="explore-search-icon" />
          <input
            type="text"
            className="explore-search-input"
            placeholder="Search prompts and workflows..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="explore-category-bar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`explore-cat-pill ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      <div className="explore-grid">
        {filteredPrompts.map((item) => {
          const Icon = item.icon;
          const isCopied = copiedId === item.id;

          return (
            <div key={item.id} className="explore-card">
              <div className="explore-card-top">
                <div className="explore-badge-row">
                  <span className="explore-category-tag">{item.category}</span>
                  <span className="explore-model-tag">
                    <Cpu size={11} /> {item.modelName}
                  </span>
                </div>
                <div className="explore-card-icon-wrap">
                  <Icon size={18} />
                </div>
              </div>

              <h3 className="explore-card-title">{item.title}</h3>
              <p className="explore-card-desc">{item.description}</p>

              <div className="explore-prompt-preview">
                <code>{item.prompt}</code>
              </div>

              <div className="explore-card-actions">
                <button
                  type="button"
                  className="explore-copy-btn"
                  onClick={() => handleCopyPrompt(item.id, item.prompt)}
                  title="Copy prompt text"
                >
                  {isCopied ? <Check size={14} color="#22C55E" /> : <Copy size={14} />}
                  <span>{isCopied ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  type="button"
                  className="explore-launch-btn"
                  onClick={() => handleLaunchPrompt(item)}
                >
                  <span>Launch in Chat</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ExplorePage;


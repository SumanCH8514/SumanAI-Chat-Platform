import React, { useState } from 'react';
import { Sparkles, Image, Wand2, Eraser, Video, FileText, Code2, Languages, Mic, Layers, Star, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './ToolsView.css';

const toolCategories = [
  {
    id: 'image',
    label: '🎨 Image Tools',
    tools: [
      {
        id: 'bg-remover',
        name: 'BG Remover',
        desc: 'Instantly remove backgrounds from any image with AI precision.',
        icon: <Eraser size={28} />,
        bgColor: '#4F46E5',
        badge: 'Popular',
      },
      {
        id: 'text-to-image',
        name: 'Text to Image',
        desc: 'Transform your words into stunning visuals using diffusion AI.',
        icon: <Wand2 size={28} />,
        bgColor: '#DB2777',
        badge: 'New',
      },
      {
        id: 'image-generator',
        name: 'AI Image Generator',
        desc: 'Create unique, high-quality AI-generated images from scratch.',
        icon: <Image size={28} />,
        bgColor: '#0284C7',
        badge: null,
      },
      {
        id: 'face-enhancer',
        name: 'Face Enhancer',
        desc: 'Restore and enhance facial details in any photo with deep learning.',
        icon: <Star size={28} />,
        bgColor: '#059669',
        badge: null,
      },
      {
        id: 'object-remover',
        name: 'Object Remover',
        desc: 'Select and erase unwanted objects from photos seamlessly.',
        icon: <Layers size={28} />,
        bgColor: '#EA580C',
        badge: null,
      },
    ],
  },
  {
    id: 'writing',
    label: '✍️ Writing & Language',
    tools: [
      {
        id: 'text-summarizer',
        name: 'Text Summarizer',
        desc: 'Condense long documents into clear, concise summaries instantly.',
        icon: <FileText size={28} />,
        bgColor: '#7C3AED',
        badge: 'Popular',
      },
      {
        id: 'ai-writer',
        name: 'AI Writing Helper',
        desc: 'Generate blog posts, emails, and creative content in seconds.',
        icon: <Sparkles size={28} />,
        bgColor: '#D97706',
        badge: null,
      },
      {
        id: 'translator',
        name: 'Language Translator',
        desc: 'Translate text across 100+ languages with context-aware AI.',
        icon: <Languages size={28} />,
        bgColor: '#2563EB',
        badge: null,
      },
    ],
  },
  {
    id: 'dev',
    label: '💻 Dev & Productivity',
    tools: [
      {
        id: 'code-assistant',
        name: 'Code Assistant',
        desc: 'Debug, explain, and write code across any programming language.',
        icon: <Code2 size={28} />,
        bgColor: '#1E293B',
        badge: 'New',
      },
      {
        id: 'voice-to-text',
        name: 'Voice to Text',
        desc: 'Convert spoken audio into accurate transcriptions in real-time.',
        icon: <Mic size={28} />,
        bgColor: '#E11D48',
        badge: null,
      },
      {
        id: 'video-generator',
        name: 'AI Video Generator',
        desc: 'Create short AI-powered video clips from text prompts.',
        icon: <Video size={28} />,
        bgColor: '#0891B2',
        badge: 'Beta',
      },
    ],
  },
];

const ToolCard = ({ tool, onLaunch }) => (
  <div className="tool-card">
    <div className="tool-card-visual" style={{ background: tool.bgColor }}>
      <div className="tool-card-icon">{tool.icon}</div>
      {tool.badge && (
        <span className={`tool-badge tool-badge--${tool.badge.toLowerCase()}`}>{tool.badge}</span>
      )}
    </div>
    <div className="tool-card-body">
      <h3 className="tool-card-name">{tool.name}</h3>
      <p className="tool-card-desc">{tool.desc}</p>
      <button className="tool-launch-btn" onClick={() => onLaunch(tool.id)}>
        Launch <ExternalLink size={13} />
      </button>
    </div>
  </div>
);

const ToolsView = () => {
  const [collapsed, setCollapsed] = useState({});
  const navigate = useNavigate();

  const toggle = (id) => setCollapsed(prev => ({ ...prev, [id]: !prev[id] }));

  const handleLaunch = (id) => {
    if (id === 'bg-remover') {
      navigate('/tools/bg-remover');
    } else {
      alert("This tool integration is coming soon!");
    }
  };

  return (
    <div className="tools-page">
      <div className="tools-hero">
        <div className="tools-hero-icon">
          <Sparkles size={32} />
        </div>
        <div>
          <h1 className="tools-hero-title">Build smarter with <span className="tools-hero-highlight">SumanAI Tools</span></h1>
          <p className="tools-hero-subtitle">
            A curated collection of AI-powered tools to supercharge your workflow — all in one place.
          </p>
        </div>
      </div>

      <div className="tools-sections">
        {toolCategories.map(cat => (
          <section key={cat.id} className="tools-section">
            <div className="tools-section-header">
              <h2 className="tools-section-title">{cat.label}</h2>
              <button className="show-more-btn" onClick={() => toggle(cat.id)}>
                {collapsed[cat.id] ? <>Show more <ChevronDown size={14} /></> : <>Show less <ChevronUp size={14} /></>}
              </button>
            </div>

            {!collapsed[cat.id] && (
              <div className="tools-grid">
                {cat.tools.map(tool => (
                  <ToolCard key={tool.id} tool={tool} onLaunch={handleLaunch} />
                ))}
              </div>
            )}
          </section>
        ))}
      </div>

      <section className="tools-section">
        <div className="tools-section-header">
          <h2 className="tools-section-title">⭐ My Saved Tools</h2>
        </div>
        <div className="tools-empty-state">
          <Layers size={32} color="var(--text-muted)" />
          <p>Tools you save or launch will appear here.</p>
        </div>
      </section>
    </div>
  );
};

export default ToolsView;

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Home,
  Search,
  LayoutGrid,
  Image as ImageIcon,
  Video,
  PenLine,
  Code2,
  Star,
  Bookmark,
  Eraser,
  Wand2,
  Sparkles,
  Layers,
  FileText,
  Languages,
  Mic,
  ArrowRight,
  Play
} from 'lucide-react';
import './ToolsView.css';

const TOOL_DEFINITIONS = [
  {
    id: 'bg-remover',
    category: 'image',
    name: 'BG Remover',
    desc: 'Remove backgrounds from portrait and product photography with precision.',
    icon: <Eraser size={20} />,
    badge: 'Popular',
    badgeType: 'popular',
    iconTheme: 'purple',
    route: '/tools/bg-remover'
  },
  {
    id: 'text-to-image',
    category: 'image',
    name: 'Text to Image',
    desc: 'Generate detailed visual concepts and scenes using diffusion prompts.',
    icon: <Wand2 size={20} />,
    badge: 'New',
    badgeType: 'new',
    iconTheme: 'blue',
    route: '/tools/text-to-image'
  },
  {
    id: 'uncensored-image',
    category: 'image',
    name: 'Uncensored Image Gen',
    desc: 'Generate text-to-image or modify photos with Qwen 2.1 uncensored model.',
    icon: <Sparkles size={20} />,
    badge: null,
    iconTheme: 'purple',
    route: '/tools/uncensored-image'
  },
  {
    id: 'image-generator',
    category: 'image',
    name: 'AI Image Generator',
    desc: 'Create vector illustrations, interface mockups, and digital paintings.',
    icon: <ImageIcon size={20} />,
    badge: null,
    iconTheme: 'purple',
    route: '/tools/image-generator'
  },
  {
    id: 'face-enhancer',
    category: 'image',
    name: 'Face & Image Enhancer',
    desc: 'Enhance portrait contrast, lighting balance, and sharpness.',
    icon: <Layers size={20} />,
    badge: null,
    iconTheme: 'purple',
    route: '/tools/face-enhancer'
  },
  {
    id: 'text-summarizer',
    category: 'writing',
    name: 'Executive Summarizer',
    desc: 'Distill lengthy reports, meeting transcripts, and whitepapers into key takeaways.',
    icon: <FileText size={20} />,
    badge: 'Popular',
    badgeType: 'popular',
    iconTheme: 'purple',
    route: '/tools/text-summarizer'
  },
  {
    id: 'ai-writer',
    category: 'writing',
    name: 'Professional Writer',
    desc: 'Draft executive memos, documentation, client communications, and announcements.',
    icon: <FileText size={20} />,
    badge: null,
    iconTheme: 'purple',
    route: '/tools/ai-writer'
  },
  {
    id: 'translator',
    category: 'writing',
    name: 'Multi-Lingual Translator',
    desc: 'Translate text across global languages with cultural and contextual nuances.',
    icon: <Languages size={20} />,
    badge: null,
    iconTheme: 'purple',
    route: '/tools/translator'
  },
  {
    id: 'code-assistant',
    category: 'code',
    name: 'Code Reviewer & Optimizer',
    desc: 'Audit algorithms, benchmark performance, refactor syntax, and diagnose logic errors.',
    icon: <Code2 size={20} />,
    badge: 'New',
    badgeType: 'new',
    iconTheme: 'purple',
    route: '/tools/code-assistant'
  },
  {
    id: 'voice-to-text',
    category: 'audio',
    name: 'Audio Transcript Structurer',
    desc: 'Format, punctuate, and extract structured notes from raw speech recordings.',
    icon: <Mic size={20} />,
    badge: null,
    iconTheme: 'purple',
    route: '/tools/voice-to-text'
  },
  {
    id: 'video-generator',
    category: 'video',
    name: 'Video Storyboard Generator',
    desc: 'Create scene outlines, camera directions, and dialogue timing for short videos.',
    icon: <Video size={20} />,
    badge: 'Beta',
    badgeType: 'beta',
    iconTheme: 'purple',
    route: '/tools/video-generator'
  }
];

const CATEGORIES = [
  { id: 'all', label: 'All Tools', icon: LayoutGrid },
  { id: 'image', label: 'Image', icon: ImageIcon },
  { id: 'video', label: 'Video', icon: Video },
  { id: 'writing', label: 'Writing', icon: PenLine },
  { id: 'code', label: 'Code', icon: Code2 },
  { id: 'audio', label: 'Audio', icon: Star },
  { id: 'saved', label: 'Saved', icon: Bookmark }
];

export const ToolsView = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [savedToolIds] = useState(() => {
    try {
      const stored = localStorage.getItem('sumanai_saved_tools');
      return stored ? JSON.parse(stored) : ['bg-remover', 'code-assistant'];
    } catch {
      return ['bg-remover', 'code-assistant'];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('sumanai_saved_tools', JSON.stringify(savedToolIds));
    } catch {
      return;
    }
  }, [savedToolIds]);

  const handleLaunch = (tool) => {
    if (tool.route) {
      navigate(tool.route);
    }
  };

  const filteredTools = useMemo(() => {
    return TOOL_DEFINITIONS.filter((tool) => {
      if (activeCategory === 'saved' && !savedToolIds.includes(tool.id)) {
        return false;
      }
      if (activeCategory !== 'all' && activeCategory !== 'saved' && tool.category !== activeCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return tool.name.toLowerCase().includes(q) || tool.desc.toLowerCase().includes(q);
      }
      return true;
    });
  }, [activeCategory, searchQuery, savedToolIds]);

  return (
    <div className="tools-container">
      <div className="tools-top-nav">
        <div className="tools-breadcrumb">
          <button type="button" className="tools-breadcrumb-home" onClick={() => navigate('/')}>
            <Home size={14} />
          </button>
          <span className="tools-breadcrumb-sep">&gt;</span>
          <span className="tools-breadcrumb-current">Tools</span>
        </div>
      </div>

      <header className="tools-header">
        <h1 className="tools-main-title">AI Automation Tools</h1>
        <p className="tools-main-subtitle">
          Curated processing utilities, background workflows, and model pipelines for professional tasks.
        </p>
      </header>

      <section className="tools-hero-banner">
        <div className="tools-hero-content">
          <h2 className="tools-hero-title">Do More with AI Tools</h2>
          <p className="tools-hero-desc">
            A powerful collection of AI utilities for image, video, text, code, and more.
          </p>
          <button
            type="button"
            className="tools-hero-cta"
            onClick={() => {
              setActiveCategory('all');
              setSearchQuery('');
            }}
          >
            <Play size={11} fill="currentColor" />
            <span>Explore All Tools</span>
            <ArrowRight size={13} />
          </button>
        </div>

        <div className="tools-hero-visual" aria-hidden="true">
          <div className="tools-hero-art">
            <div className="hero-glow-orb" />
            <div className="hero-floating-card hero-card-video">
              <Play size={20} fill="currentColor" className="hero-icon-purple" />
            </div>
            <div className="hero-floating-card hero-card-image">
              <ImageIcon size={22} className="hero-icon-blue" />
            </div>
            <div className="hero-floating-card hero-card-code">
              <span className="hero-code-symbol">&lt;/&gt;</span>
            </div>
            <div className="hero-floating-card hero-card-doc">
              <FileText size={20} className="hero-icon-cyan" />
            </div>
            <span className="hero-sparkle hero-sparkle-1">&#10022;</span>
            <span className="hero-sparkle hero-sparkle-2">&#10022;</span>
          </div>
        </div>
      </section>

      <section className="tools-controls-bar">
        <div className="tools-search-box">
          <Search size={15} className="tools-search-icon" />
          <input
            type="text"
            className="tools-search-input"
            placeholder="Search tools by task or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="tools-category-tabs">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSaved = cat.id === 'saved';
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                className={`tools-tab-pill ${isActive ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat.id)}
              >
                <Icon size={14} className="tab-pill-icon" />
                <span className="tab-pill-label">
                  {cat.label}
                  {isSaved && ` ${savedToolIds.length}`}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <main className="tools-grid-section">
        {filteredTools.length === 0 ? (
          <div className="tools-empty-state">
            <Layers size={28} />
            <h3>No tools match your criteria</h3>
            <p>Try searching for a different keyword or switch to another category filter.</p>
            <button
              type="button"
              className="tools-reset-btn"
              onClick={() => {
                setSearchQuery('');
                setActiveCategory('all');
              }}
            >
              Show All Tools
            </button>
          </div>
        ) : (
          <div className="tools-catalog-grid">
            {filteredTools.map((tool) => (
              <article
                key={tool.id}
                className="tool-card"
                onClick={() => handleLaunch(tool)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleLaunch(tool)}
              >
                <div className={`tool-card-icon-frame ${tool.iconTheme || 'purple'}`}>
                  {tool.icon}
                </div>

                <div className="tool-card-body">
                  <div className="tool-card-top-line">
                    <h2 className="tool-card-name">{tool.name}</h2>
                    {tool.badge && (
                      <span className={`tool-pill-badge ${tool.badgeType || 'popular'}`}>
                        {tool.badge}
                      </span>
                    )}
                  </div>
                  <p className="tool-card-desc">{tool.desc}</p>
                </div>

                <button
                  type="button"
                  className="tool-card-arrow-btn"
                  title="Open tool"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLaunch(tool);
                  }}
                >
                  <ArrowRight size={14} />
                </button>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default ToolsView;
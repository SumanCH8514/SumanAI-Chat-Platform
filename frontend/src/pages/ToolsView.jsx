import React, { useState, useEffect, useMemo } from 'react';
import {
  Wrench, Image, Wand2, Eraser, Video, FileText,
  Code2, Languages, Mic, Layers, Star, ExternalLink,
  Search, Bookmark, BookmarkCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './ToolsView.css';

const TOOL_DEFINITIONS = [
  {
    id: 'bg-remover',
    category: 'image',
    name: 'BG Remover',
    desc: 'Remove backgrounds from portrait and product photography with precision edge matting.',
    icon: <Eraser size={22} />,
    badge: 'Popular',
    type: 'dedicated',
    route: '/tools/bg-remover'
  },
  {
    id: 'text-to-image',
    category: 'image',
    name: 'Text to Image',
    desc: 'Generate detailed visual concepts and scenes using diffusion prompts.',
    icon: <Wand2 size={22} />,
    badge: 'New',
    type: 'dedicated',
    route: '/tools/text-to-image'
  },
  {
    id: 'image-generator',
    category: 'image',
    name: 'AI Image Generator',
    desc: 'Create vector illustrations, interface mockups, and digital paintings.',
    icon: <Image size={22} />,
    badge: null,
    type: 'dedicated',
    route: '/tools/image-generator'
  },
  {
    id: 'face-enhancer',
    category: 'image',
    name: 'Face & Image Enhancer',
    desc: 'Enhance portrait contrast, lighting balance, and sharpness.',
    icon: <Layers size={22} />,
    badge: null,
    type: 'dedicated',
    route: '/tools/face-enhancer'
  },
  {
    id: 'text-summarizer',
    category: 'writing',
    name: 'Executive Summarizer',
    desc: 'Distill lengthy reports, meeting transcripts, and whitepapers into key takeaways.',
    icon: <FileText size={22} />,
    badge: 'Popular',
    type: 'dedicated',
    route: '/tools/text-summarizer'
  },
  {
    id: 'ai-writer',
    category: 'writing',
    name: 'Professional Writer',
    desc: 'Draft executive memos, documentation, client communications, and announcements.',
    icon: <FileText size={22} />,
    badge: null,
    type: 'dedicated',
    route: '/tools/ai-writer'
  },
  {
    id: 'translator',
    category: 'writing',
    name: 'Multi-Lingual Translator',
    desc: 'Translate text across global languages with cultural and contextual nuances preserved.',
    icon: <Languages size={22} />,
    badge: null,
    type: 'dedicated',
    route: '/tools/translator'
  },
  {
    id: 'code-assistant',
    category: 'dev',
    name: 'Code Reviewer & Optimizer',
    desc: 'Audit algorithms, benchmark performance, refactor syntax, and diagnose logic errors.',
    icon: <Code2 size={22} />,
    badge: 'New',
    type: 'dedicated',
    route: '/tools/code-assistant'
  },
  {
    id: 'voice-to-text',
    category: 'dev',
    name: 'Audio Transcript Structurer',
    desc: 'Format, punctuate, and extract structured notes from raw speech recordings.',
    icon: <Mic size={22} />,
    badge: null,
    type: 'dedicated',
    route: '/tools/voice-to-text'
  },
  {
    id: 'video-generator',
    category: 'dev',
    name: 'Video Storyboard Generator',
    desc: 'Create scene outlines, camera directions, and dialogue timing for short videos.',
    icon: <Video size={22} />,
    badge: 'Beta',
    type: 'dedicated',
    route: '/tools/video-generator'
  }
];

const CATEGORIES = [
  { id: 'all', label: 'All Utilities' },
  { id: 'image', label: 'Image Processing' },
  { id: 'writing', label: 'Writing & Language' },
  { id: 'dev', label: 'Developer & Logic' },
  { id: 'saved', label: 'Saved Utilities' }
];

const ToolsView = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [savedToolIds, setSavedToolIds] = useState(() => {
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

  const toggleSaveTool = (id, e) => {
    e.stopPropagation();
    setSavedToolIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

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
      <header className="tools-header">
        <div className="tools-header-text">
          <div className="tools-badge-top">
            <Wrench size={13} />
            <span>Operational Utilities</span>
          </div>
          <h1 className="tools-main-title">AI Automation Tools</h1>
          <p className="tools-main-subtitle">
            Curated processing utilities, background workflows, and model pipelines for professional tasks.
          </p>
        </div>
      </header>

      <section className="tools-controls-row">
        <div className="tools-search-box">
          <Search size={15} className="tools-search-icon" />
          <input
            type="text"
            className="tools-search-input"
            placeholder="Search utilities by task or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="tools-category-tabs">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`tools-tab-btn ${activeCategory === cat.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              {cat.id === 'saved' && <Star size={13} />}
              <span>{cat.label}</span>
              {cat.id === 'saved' && (
                <span className="tools-tab-count">{savedToolIds.length}</span>
              )}
            </button>
          ))}
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
            {filteredTools.map((tool) => {
              const isSaved = savedToolIds.includes(tool.id);
              return (
                <article
                  key={tool.id}
                  className="tool-catalog-card"
                  onClick={() => handleLaunch(tool)}
                >
                  <div className="tool-card-top">
                    <div className="tool-card-icon-frame">
                      {tool.icon}
                    </div>
                    <div className="tool-card-actions-top">
                      {tool.badge && (
                        <span className={`tool-tag-pill ${tool.badge.toLowerCase()}`}>
                          {tool.badge}
                        </span>
                      )}
                      <button
                        type="button"
                        className={`tool-save-btn ${isSaved ? 'is-saved' : ''}`}
                        onClick={(e) => toggleSaveTool(tool.id, e)}
                        title={isSaved ? 'Remove from saved' : 'Save utility'}
                      >
                        {isSaved ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
                      </button>
                    </div>
                  </div>

                  <div className="tool-card-info">
                    <h2 className="tool-catalog-title">{tool.name}</h2>
                    <p className="tool-catalog-description">{tool.desc}</p>
                  </div>

                  <div className="tool-card-action-bar">
                    <span className="tool-action-label">Open Application</span>
                    <span className="tool-action-arrow">
                      <ExternalLink size={13} />
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default ToolsView;

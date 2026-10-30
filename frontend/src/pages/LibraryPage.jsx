import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Search,
  Plus,
  Trash2,
  Copy,
  Check,
  ArrowRight,
  Edit2,
  X,
  FileCode,
  Tag
} from 'lucide-react';
import { useChatStore } from '../store/useChatStore';
import './LibraryPage.css';

const DEFAULT_TEMPLATES = [
  {
    id: 'tpl-1',
    title: 'TypeScript Interface & Type Guard Generator',
    category: 'Code',
    content: 'Generate comprehensive TypeScript types, strict interfaces, and runtime type-guard validation functions for the following JSON schema or API response payload:\n\n[PASTE PAYLOAD HERE]',
    createdAt: 1730000000000
  },
  {
    id: 'tpl-2',
    title: 'System Design Interview Scenario',
    category: 'Architecture',
    content: 'Walk me through an end-to-end distributed system design for: [DESCRIBE SERVICE, e.g. URL Shortener / Real-time Notification System]. Include latency/throughput math, partitioning strategies, caching layers, and database choice justifications.',
    createdAt: 1730100000000
  },
  {
    id: 'tpl-3',
    title: 'Pull Request Review & Edge Case Checklist',
    category: 'Productivity',
    content: 'Review the following git diff / pull request. Summarize key logic changes, flag subtle null/undefined regressions, analyze performance trade-offs, and suggest test cases:\n\n[PASTE PR DIFF HERE]',
    createdAt: 1730200000000
  }
];

export const LibraryPage = () => {
  const navigate = useNavigate();
  const startChatWithPrompt = useChatStore((state) => state.startChatWithPrompt);

  const [templates, setTemplates] = useState(() => {
    try {
      const saved = localStorage.getItem('sumanai_prompt_library');
      return saved ? JSON.parse(saved) : DEFAULT_TEMPLATES;
    } catch {
      return DEFAULT_TEMPLATES;
    }
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [copiedId, setCopiedId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [formData, setFormData] = useState({ title: '', category: 'Code', content: '' });

  useEffect(() => {
    try {
      localStorage.setItem('sumanai_prompt_library', JSON.stringify(templates));
    } catch {
      void 0;
    }
  }, [templates]);

  const categories = useMemo(() => {
    const set = new Set(['All']);
    templates.forEach((t) => {
      if (t.category) set.add(t.category);
    });
    return Array.from(set);
  }, [templates]);

  const filteredTemplates = useMemo(() => {
    return templates.filter((item) => {
      const matchCat = selectedCategory === 'All' || item.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.content.toLowerCase().includes(q);
      return matchCat && matchQuery;
    });
  }, [templates, selectedCategory, searchQuery]);

  const handleLaunch = (content) => {
    startChatWithPrompt(content);
    navigate('/');
  };

  const handleCopy = (id, content) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = (id) => {
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  };

  const handleOpenCreateModal = () => {
    setEditingTemplate(null);
    setFormData({ title: '', category: 'Code', content: '' });
    setModalOpen(true);
  };

  const handleOpenEditModal = (template) => {
    setEditingTemplate(template);
    setFormData({
      title: template.title,
      category: template.category || 'Code',
      content: template.content
    });
    setModalOpen(true);
  };

  const handleSaveModal = (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) return;

    if (editingTemplate) {
      setTemplates((prev) =>
        prev.map((t) =>
          t.id === editingTemplate.id
            ? { ...t, title: formData.title.trim(), category: formData.category, content: formData.content.trim() }
            : t
        )
      );
    } else {
      const newTpl = {
        id: `tpl-${Date.now()}`,
        title: formData.title.trim(),
        category: formData.category,
        content: formData.content.trim(),
        createdAt: Date.now()
      };
      setTemplates((prev) => [newTpl, ...prev]);
    }

    setModalOpen(false);
  };

  return (
    <div className="library-page-wrap">
      {modalOpen && (
        <div className="library-modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="library-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="library-modal-head">
              <h3 className="library-modal-title">
                {editingTemplate ? 'Edit Prompt Template' : 'Create Prompt Template'}
              </h3>
              <button
                type="button"
                className="library-modal-close"
                onClick={() => setModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="library-form">
              <div className="library-form-row">
                <label className="library-form-label">Title</label>
                <input
                  type="text"
                  required
                  className="library-form-input"
                  placeholder="e.g. Code Review Checklist"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="library-form-row">
                <label className="library-form-label">Category</label>
                <select
                  className="library-form-select"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="Code">Code</option>
                  <option value="Architecture">Architecture</option>
                  <option value="Productivity">Productivity</option>
                  <option value="Writing">Writing</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div className="library-form-row">
                <label className="library-form-label">Prompt Content</label>
                <textarea
                  required
                  rows={5}
                  className="library-form-textarea"
                  placeholder="Enter prompt template with variables like [PASTE CODE HERE]..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                />
              </div>

              <div className="library-form-actions">
                <button
                  type="button"
                  className="library-btn-secondary"
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="library-btn-primary">
                  {editingTemplate ? 'Save Changes' : 'Create Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="library-header">
        <div className="library-header-text">
          <h1 className="library-title">Prompt Library</h1>
          <p className="library-subtitle">
            Personal repository of reusable prompt templates, system instructions, and task runbooks.
          </p>
        </div>

        <button type="button" className="library-create-btn" onClick={handleOpenCreateModal}>
          <Plus size={16} />
          <span>New Template</span>
        </button>
      </div>

      <div className="library-filter-row">
        <div className="library-search-wrap">
          <Search size={16} className="library-search-icon" />
          <input
            type="text"
            className="library-search-input"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="library-cat-list">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`library-cat-btn ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="library-grid">
        {filteredTemplates.length === 0 ? (
          <div className="library-empty">
            <BookOpen size={36} color="var(--text-muted)" />
            <h4 className="library-empty-title">No templates found</h4>
            <p className="library-empty-desc">
              {searchQuery ? 'No templates match your search criteria.' : 'Save your frequently used prompts for instant access.'}
            </p>
          </div>
        ) : (
          filteredTemplates.map((item) => {
            const isCopied = copiedId === item.id;

            return (
              <div key={item.id} className="library-card">
                <div className="library-card-head">
                  <span className="library-tag">
                    <Tag size={11} /> {item.category}
                  </span>
                  <div className="library-card-tools">
                    <button
                      type="button"
                      className="library-icon-btn"
                      onClick={() => handleOpenEditModal(item)}
                      title="Edit template"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      type="button"
                      className="library-icon-btn btn-del"
                      onClick={() => handleDelete(item.id)}
                      title="Delete template"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <h3 className="library-card-title">{item.title}</h3>
                <div className="library-card-content">
                  <code>{item.content}</code>
                </div>

                <div className="library-card-footer">
                  <button
                    type="button"
                    className="library-copy-btn"
                    onClick={() => handleCopy(item.id, item.content)}
                  >
                    {isCopied ? <Check size={14} color="#22C55E" /> : <Copy size={14} />}
                    <span>{isCopied ? 'Copied' : 'Copy'}</span>
                  </button>
                  <button
                    type="button"
                    className="library-launch-btn"
                    onClick={() => handleLaunch(item.content)}
                  >
                    <span>Use Prompt</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default LibraryPage;

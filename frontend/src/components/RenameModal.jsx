import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Edit3, Check } from 'lucide-react';
import './RenameModal.css';

export const RenameModal = ({ isOpen, onClose, currentTitle, onSave }) => {
  const [title, setTitle] = useState(currentTitle || '');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const clean = title.trim();
    if (!clean) return;
    if (clean !== (currentTitle || '').trim()) {
      onSave(clean);
    }
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const isSaveDisabled = !title.trim();

  return createPortal(
    <div className="rename-modal-overlay" onClick={onClose} onKeyDown={handleKeyDown}>
      <div 
        className="rename-modal-card" 
        onClick={(e) => e.stopPropagation()} 
        role="dialog" 
        aria-modal="true"
        aria-labelledby="rename-modal-heading"
      >
        <div className="rename-modal-header">
          <div className="rename-modal-icon-badge">
            <Edit3 size={18} />
          </div>
          <div className="rename-modal-title-group">
            <h2 id="rename-modal-heading" className="rename-modal-title">Rename conversation</h2>
            <p className="rename-modal-subtitle">Enter a new name for this chat</p>
          </div>
          <button 
            type="button" 
            className="rename-modal-close-btn" 
            onClick={onClose} 
            aria-label="Close rename dialog"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="rename-modal-form">
          <div className="rename-input-container">
            <input
              ref={inputRef}
              type="text"
              className="rename-text-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Project overview"
              maxLength={100}
              aria-label="Conversation title"
            />
            <div className="rename-input-meta">
              <span className="rename-hint">Press Enter to save</span>
              <span className="rename-char-counter">{title.length}/100</span>
            </div>
          </div>

          <div className="rename-modal-footer">
            <button 
              type="button" 
              className="rename-action-btn secondary" 
              onClick={onClose}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="rename-action-btn primary" 
              disabled={isSaveDisabled}
            >
              <Check size={14} />
              <span>Save</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default RenameModal;

import React, { useState, useEffect } from 'react';
import { X, ArrowLeft, Check, Play, VolumeX } from 'lucide-react';
import { AI_VOICE_GROUPS, DEFAULT_VOICE_ID, ALL_VOICES, getVoiceById, getVoiceCategory } from '../constants/voices';
import { ttsService } from '../services/ttsService';
import './VoiceSelectionModal.css';

const VoiceSelectionModal = ({ onClose, onVoiceSelected }) => {
  const [selectedVoiceId, setSelectedVoiceId] = useState(() => {
    try {
      return localStorage.getItem('sumanai_selected_voice_id') || DEFAULT_VOICE_ID;
    } catch {
      return DEFAULT_VOICE_ID;
    }
  });

  const [activeCategory, setActiveCategory] = useState('all');
  const [previewingVoiceId, setPreviewingVoiceId] = useState(null);

  const categories = [
    { id: 'all', label: 'All Voices', count: ALL_VOICES.length },
    ...AI_VOICE_GROUPS.map(g => ({
      id: g.category,
      label: g.category,
      count: g.voices.length
    }))
  ];

  const filteredGroups = activeCategory === 'all'
    ? AI_VOICE_GROUPS
    : AI_VOICE_GROUPS.filter(g => g.category === activeCategory);

  const handleSelectVoice = (voiceId) => {
    setSelectedVoiceId(voiceId);
    try {
      localStorage.setItem('sumanai_selected_voice_id', voiceId);
    } catch {
      void 0;
    }
    if (previewingVoiceId) {
      ttsService.stop();
      setPreviewingVoiceId(null);
    }
    if (onVoiceSelected) {
      onVoiceSelected(voiceId);
    }
  };

  const handleAuditionVoice = (voice, e) => {
    e.stopPropagation();
    if (previewingVoiceId === voice.id) {
      ttsService.stop();
      setPreviewingVoiceId(null);
      return;
    }

    ttsService.stop();
    const sampleText = `Hello! I am ${voice.name}. I will be your AI voice assistant.`;
    setPreviewingVoiceId(voice.id);
    ttsService.speak(sampleText, {
      referenceId: voice.id,
      onStart: () => setPreviewingVoiceId(voice.id),
      onEnd: () => setPreviewingVoiceId(null),
      onError: () => setPreviewingVoiceId(null)
    });
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      ttsService.stop();
    };
  }, [onClose]);

  const currentVoice = getVoiceById(selectedVoiceId);

  return (
    <div className="voice-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="voice-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="voice-modal-mobile-header">
          <button
            type="button"
            className="voice-modal-back-btn"
            onClick={onClose}
            aria-label="Go back"
          >
            <ArrowLeft size={20} />
          </button>
          <span className="voice-modal-mobile-title">Voice Model</span>
          <button
            type="button"
            className="voice-modal-close-circle"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="voice-modal-desktop-header">
          <div className="voice-modal-header-meta">
            <h2 className="voice-modal-title">AI Assistant Voice</h2>
            <p className="voice-modal-desc">
              Select the voice persona used for spoken responses and audio reading
            </p>
          </div>
          <button
            type="button"
            className="voice-modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        <div className="voice-modal-tabs-bar">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`voice-modal-tab-pill ${activeCategory === cat.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              <span>{cat.label}</span>
              <span className="voice-modal-tab-count">{cat.count}</span>
            </button>
          ))}
        </div>

        <div className="voice-modal-body">
          {filteredGroups.map((group) => (
            <div key={group.category} className="voice-modal-group">
              <div className="voice-modal-group-heading">
                <span className="voice-modal-group-title">{group.category}</span>
                <span className="voice-modal-group-count">{group.voices.length} models</span>
              </div>
              <div className="voice-modal-grid">
                {group.voices.map((v) => {
                  const isSelected = v.id === selectedVoiceId;
                  const isItemPlaying = previewingVoiceId === v.id;
                  return (
                    <div
                      key={v.id}
                      role="button"
                      tabIndex={0}
                      className={`voice-modal-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleSelectVoice(v.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleSelectVoice(v.id);
                        }
                      }}
                    >
                      <div className="voice-modal-card-left">
                        <span className="voice-modal-avatar">{v.initials || 'AI'}</span>
                        <div className="voice-modal-card-info">
                          <span className="voice-modal-card-name">{v.name}</span>
                          <span className="voice-modal-card-tag">{v.tag}</span>
                        </div>
                      </div>
                      <div className="voice-modal-card-actions">
                        <button
                          type="button"
                          className={`voice-modal-audition-btn ${isItemPlaying ? 'playing' : ''}`}
                          title={isItemPlaying ? 'Stop preview' : 'Audition voice'}
                          aria-label={`Audition ${v.name}`}
                          onClick={(e) => handleAuditionVoice(v, e)}
                        >
                          {isItemPlaying ? <VolumeX size={13} /> : <Play size={12} />}
                        </button>
                        {isSelected && (
                          <span className="voice-modal-check" aria-hidden="true">
                            <Check size={14} />
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="voice-modal-footer">
          <div className="voice-modal-current">
            <span className="voice-modal-current-label">Active:</span>
            <span className="voice-modal-current-name">{currentVoice.name}</span>
            <span className="voice-modal-current-cat">{getVoiceCategory(selectedVoiceId)}</span>
          </div>
          <button
            type="button"
            className="voice-modal-done-btn"
            onClick={onClose}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default VoiceSelectionModal;


import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Gauge,
  Maximize2,
  SlidersHorizontal,
  Volume2,
  VolumeX,
  ChevronDown,
  ChevronUp,
  Check
} from 'lucide-react';
import { useChatStore } from '../store/useChatStore';
import './VideoOptionsToolbar.css';

const DURATION_OPTIONS = [
  { id: 'auto', label: 'Auto', badge: 'DEFAULT', desc: '2.0 seconds' },
  { id: '2s', label: '2s', desc: 'Fast motion' },
  { id: '3s', label: '3s', desc: 'Balanced motion' },
  { id: '4s', label: '4s', desc: 'Extended clip' },
  { id: '5s', label: '5s', desc: 'Cinematic scene' }
];

const ASPECT_RATIO_OPTIONS = [
  { id: 'auto', label: 'Auto', badge: 'DEFAULT', desc: 'Widescreen (704x512)' },
  { id: '16:9', label: '16:9', desc: 'Landscape widescreen' },
  { id: '9:16', label: '9:16', desc: 'Vertical / Story (384x704)' },
  { id: '1:1', label: '1:1', desc: 'Square feed (512x512)' },
  { id: '4:3', label: '4:3', desc: 'Classic TV (640x480)' }
];

const QUALITY_OPTIONS = [
  { id: 'auto', label: 'Auto', badge: 'DEFAULT', desc: 'Adaptive quality & speed' },
  { id: 'standard', label: 'Standard', desc: 'Balanced 512p' },
  { id: 'high', label: 'High', desc: 'Refined 704p texture' },
  { id: 'fast', label: 'Fast', desc: 'Quick 384p draft' }
];

const AUDIO_OPTIONS = [
  { id: 'auto', label: 'Auto', badge: 'DEFAULT', desc: 'Synthetic soundtrack' },
  { id: 'mute', label: 'Muted', desc: 'Silent video output' }
];

export const VideoOptionsToolbar = () => {
  const [openMenu, setOpenMenu] = useState(null);
  const [popoverPos, setPopoverPos] = useState({ top: 'auto', bottom: 'auto', left: '0px', maxHeight: '300px' });

  const durationRef = useRef(null);
  const aspectRef = useRef(null);
  const qualityRef = useRef(null);
  const audioRef = useRef(null);
  const popoverRef = useRef(null);

  const videoOptions = useChatStore((state) => state.videoOptions);
  const setVideoOptions = useChatStore((state) => state.setVideoOptions);

  const getTriggerRef = useCallback((category) => {
    switch (category) {
      case 'duration': return durationRef;
      case 'aspectRatio': return aspectRef;
      case 'quality': return qualityRef;
      case 'audio': return audioRef;
      default: return null;
    }
  }, []);

  const updatePopoverPosition = useCallback(() => {
    if (!openMenu) return;
    const trigger = getTriggerRef(openMenu)?.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const popoverWidth = 240;
    const spaceAbove = rect.top;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpward = spaceAbove > 260 || spaceAbove > spaceBelow;
    const availableHeight = openUpward ? spaceAbove - 20 : spaceBelow - 20;
    const maxHeight = Math.min(Math.max(180, Math.floor(availableHeight)), 320);

    let left = rect.left;
    if (left + popoverWidth > window.innerWidth - 12) {
      left = window.innerWidth - popoverWidth - 12;
    }
    if (left < 12) {
      left = 12;
    }

    setPopoverPos({
      top: openUpward ? 'auto' : `${Math.round(rect.bottom + 6)}px`,
      bottom: openUpward ? `${Math.round(window.innerHeight - rect.top + 6)}px` : 'auto',
      left: `${Math.round(left)}px`,
      maxHeight: `${maxHeight}px`
    });
  }, [openMenu, getTriggerRef]);

  useLayoutEffect(() => {
    if (!openMenu) return;
    const frameId = requestAnimationFrame(updatePopoverPosition);
    return () => cancelAnimationFrame(frameId);
  }, [openMenu, updatePopoverPosition]);

  useEffect(() => {
    if (!openMenu) return;

    const handleScrollOrResize = () => {
      updatePopoverPosition();
    };

    const handleClickOutside = (e) => {
      const activeTrigger = getTriggerRef(openMenu)?.current;
      if (
        activeTrigger && !activeTrigger.contains(e.target) &&
        popoverRef.current && !popoverRef.current.contains(e.target)
      ) {
        setOpenMenu(null);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setOpenMenu(null);
      }
    };

    window.addEventListener('resize', handleScrollOrResize, { passive: true });
    window.addEventListener('scroll', handleScrollOrResize, { passive: true, capture: true });
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, { capture: true });
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [openMenu, updatePopoverPosition, getTriggerRef]);

  const handleToggle = (menuName) => {
    setOpenMenu((prev) => (prev === menuName ? null : menuName));
  };

  const handleSelect = (category, value) => {
    setVideoOptions({ [category]: value });
    setOpenMenu(null);
  };

  const getDurationLabel = () => {
    const item = DURATION_OPTIONS.find((o) => o.id === videoOptions?.duration);
    return item ? item.label : 'Auto';
  };

  const getAspectLabel = () => {
    const item = ASPECT_RATIO_OPTIONS.find((o) => o.id === videoOptions?.aspectRatio);
    return item ? item.label : 'Auto';
  };

  const getQualityLabel = () => {
    const item = QUALITY_OPTIONS.find((o) => o.id === videoOptions?.quality);
    return item ? item.label : 'Auto';
  };

  const getAudioLabel = () => {
    const item = AUDIO_OPTIONS.find((o) => o.id === videoOptions?.audio);
    return item ? item.label : 'Auto';
  };

  const isAudioMuted = videoOptions?.audio === 'mute';

  const renderActivePopoverContent = () => {
    if (!openMenu) return null;

    let title = '';
    let items = [];
    let activeVal = '';
    let category = '';

    if (openMenu === 'duration') {
      title = 'Duration';
      items = DURATION_OPTIONS;
      activeVal = videoOptions?.duration || 'auto';
      category = 'duration';
    } else if (openMenu === 'aspectRatio') {
      title = 'Aspect Ratio';
      items = ASPECT_RATIO_OPTIONS;
      activeVal = videoOptions?.aspectRatio || 'auto';
      category = 'aspectRatio';
    } else if (openMenu === 'quality') {
      title = 'Quality';
      items = QUALITY_OPTIONS;
      activeVal = videoOptions?.quality || 'auto';
      category = 'quality';
    } else if (openMenu === 'audio') {
      title = 'Audio';
      items = AUDIO_OPTIONS;
      activeVal = videoOptions?.audio || 'auto';
      category = 'audio';
    }

    return (
      <div
        className="video-option-popover"
        ref={popoverRef}
        role="listbox"
        aria-label={`Select ${title}`}
        style={{
          top: popoverPos.top,
          bottom: popoverPos.bottom,
          left: popoverPos.left,
          maxHeight: popoverPos.maxHeight
        }}
      >
        <div className="video-popover-header">{title}</div>
        <div className="video-popover-list">
          {items.map((opt) => {
            const isSelected = activeVal === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                className={`video-popover-row ${isSelected ? 'selected' : ''}`}
                onClick={() => handleSelect(category, opt.id)}
                role="option"
                aria-selected={isSelected}
              >
                <div className="video-row-content">
                  <div className="video-row-top">
                    <span className="video-row-label">{opt.label}</span>
                    {opt.badge && <span className="video-row-badge">{opt.badge}</span>}
                  </div>
                  {opt.desc && <span className="video-row-desc">{opt.desc}</span>}
                </div>
                {isSelected && <Check size={14} className="video-row-check" />}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="video-options-toolbar" role="toolbar" aria-label="Video generation parameters">
      <div className="video-option-item">
        <button
          ref={durationRef}
          type="button"
          className={`video-option-pill ${openMenu === 'duration' ? 'is-active' : ''}`}
          onClick={() => handleToggle('duration')}
          title="Video Duration"
          aria-haspopup="listbox"
          aria-expanded={openMenu === 'duration'}
        >
          <Gauge size={13} className="video-pill-icon" />
          <span className="video-pill-label">{getDurationLabel()}</span>
          {openMenu === 'duration' ? <ChevronUp size={12} className="video-pill-chevron" /> : <ChevronDown size={12} className="video-pill-chevron" />}
        </button>
      </div>

      <div className="video-option-item">
        <button
          ref={aspectRef}
          type="button"
          className={`video-option-pill ${openMenu === 'aspectRatio' ? 'is-active' : ''}`}
          onClick={() => handleToggle('aspectRatio')}
          title="Aspect Ratio"
          aria-haspopup="listbox"
          aria-expanded={openMenu === 'aspectRatio'}
        >
          <Maximize2 size={13} className="video-pill-icon" />
          <span className="video-pill-label">{getAspectLabel()}</span>
          {openMenu === 'aspectRatio' ? <ChevronUp size={12} className="video-pill-chevron" /> : <ChevronDown size={12} className="video-pill-chevron" />}
        </button>
      </div>

      <div className="video-option-item">
        <button
          ref={qualityRef}
          type="button"
          className={`video-option-pill ${openMenu === 'quality' ? 'is-active' : ''}`}
          onClick={() => handleToggle('quality')}
          title="Video Quality"
          aria-haspopup="listbox"
          aria-expanded={openMenu === 'quality'}
        >
          <SlidersHorizontal size={13} className="video-pill-icon" />
          <span className="video-pill-label">{getQualityLabel()}</span>
          {openMenu === 'quality' ? <ChevronUp size={12} className="video-pill-chevron" /> : <ChevronDown size={12} className="video-pill-chevron" />}
        </button>
      </div>

      <div className="video-option-item">
        <button
          ref={audioRef}
          type="button"
          className={`video-option-pill ${openMenu === 'audio' ? 'is-active' : ''}`}
          onClick={() => handleToggle('audio')}
          title="Audio Track"
          aria-haspopup="listbox"
          aria-expanded={openMenu === 'audio'}
        >
          {isAudioMuted ? <VolumeX size={13} className="video-pill-icon" /> : <Volume2 size={13} className="video-pill-icon" />}
          <span className="video-pill-label">{getAudioLabel()}</span>
          {openMenu === 'audio' ? <ChevronUp size={12} className="video-pill-chevron" /> : <ChevronDown size={12} className="video-pill-chevron" />}
        </button>
      </div>

      {openMenu && typeof document !== 'undefined' && createPortal(renderActivePopoverContent(), document.body)}
    </div>
  );
};

export default VideoOptionsToolbar;

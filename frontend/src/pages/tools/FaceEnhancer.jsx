import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Home, BookOpen, ExternalLink, Image as ImageIcon,
  Download, Maximize2, Trash2, Layers, ShieldCheck, Zap, Clock,
  ArrowRight, Upload, X, RotateCcw, Link as LinkIcon
} from 'lucide-react';
import { isValidImageUrl } from '../../utils/imageUtils';
import './ToolAppShared.css';
import './FaceEnhancer.css';

const SAMPLE_PRESETS = [
  { text: 'Studio portrait', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80' },
  { text: 'Low light street', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80' },
  { text: 'Urban architecture', url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80' }
];

const DEFAULT_RECENT_IMAGES = [
  { url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80', prompt: 'Studio portrait' },
  { url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80', prompt: 'Street portrait' },
  { url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=300&q=80', prompt: 'Architecture' }
];

export const FaceEnhancer = () => {
  const navigate = useNavigate();
  const [imageSrc, setImageSrc] = useState(SAMPLE_PRESETS[0].url);
  const [mode, setMode] = useState('upload');
  const [urlInput, setUrlInput] = useState('');
  const [urlError, setUrlError] = useState('');
  const [sliderPosition, setSliderPosition] = useState(50);
  const [viewMode, setViewMode] = useState('split');

  const [sharpness, setSharpness] = useState(45);
  const [contrast, setContrast] = useState(30);
  const [vibrance, setVibrance] = useState(25);
  const [warmth, setWarmth] = useState(15);

  const fileInputRef = useRef(null);
  const splitContainerRef = useRef(null);
  const originalCanvasRef = useRef(null);
  const enhancedCanvasRef = useRef(null);
  const isDraggingRef = useRef(false);

  const resetFilters = () => {
    setSharpness(45);
    setContrast(30);
    setVibrance(25);
    setWarmth(15);
  };

  const applyEnhancements = useCallback(() => {
    const orig = originalCanvasRef.current;
    const enh = enhancedCanvasRef.current;
    if (!orig || !enh || !orig.width || !orig.height) return;

    enh.width = orig.width;
    enh.height = orig.height;

    const ctxOrig = orig.getContext('2d');
    const ctxEnh = enh.getContext('2d');
    if (!ctxOrig || !ctxEnh) return;

    const srcData = ctxOrig.getImageData(0, 0, orig.width, orig.height);
    const dstData = ctxEnh.createImageData(orig.width, orig.height);

    const src = srcData.data;
    const dst = dstData.data;
    const w = orig.width;
    const h = orig.height;

    const sharpWeight = sharpness / 100;
    const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));
    const satFactor = 1 + (vibrance / 100) * 1.5;
    const warmR = 1 + (warmth / 100) * 0.15;
    const warmB = 1 - (warmth / 100) * 0.15;

    const kernelCenter = 1 + 4 * sharpWeight;
    const kernelEdge = -sharpWeight;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;
        let r = src[idx];
        let g = src[idx + 1];
        let b = src[idx + 2];
        const a = src[idx + 3];

        if (x > 0 && x < w - 1 && y > 0 && y < h - 1 && sharpWeight > 0) {
          const up = ((y - 1) * w + x) * 4;
          const down = ((y + 1) * w + x) * 4;
          const left = (y * w + (x - 1)) * 4;
          const right = (y * w + (x + 1)) * 4;

          r = r * kernelCenter + (src[up] + src[down] + src[left] + src[right]) * kernelEdge;
          g = g * kernelCenter + (src[up + 1] + src[down + 1] + src[left + 1] + src[right + 1]) * kernelEdge;
          b = b * kernelCenter + (src[up + 2] + src[down + 2] + src[left + 2] + src[right + 2]) * kernelEdge;
        }

        r = contrastFactor * (r - 128) + 128;
        g = contrastFactor * (g - 128) + 128;
        b = contrastFactor * (b - 128) + 128;

        const gray = 0.2989 * r + 0.5870 * g + 0.1140 * b;
        r = gray + satFactor * (r - gray);
        g = gray + satFactor * (g - gray);
        b = gray + satFactor * (b - gray);

        r = r * warmR;
        b = b * warmB;

        dst[idx] = Math.min(255, Math.max(0, r));
        dst[idx + 1] = Math.min(255, Math.max(0, g));
        dst[idx + 2] = Math.min(255, Math.max(0, b));
        dst[idx + 3] = a;
      }
    }

    ctxEnh.putImageData(dstData, 0, 0);
  }, [sharpness, contrast, vibrance, warmth]);

  useEffect(() => {
    if (!imageSrc) return;
    let isCancelled = false;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;
    img.onload = () => {
      if (isCancelled) return;
      const orig = originalCanvasRef.current;
      if (!orig) return;
      orig.width = img.naturalWidth || img.width;
      orig.height = img.naturalHeight || img.height;
      const ctx = orig.getContext('2d');
      ctx.drawImage(img, 0, 0);
      applyEnhancements();
    };
    return () => {
      isCancelled = true;
    };
  }, [imageSrc, applyEnhancements]);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setImageSrc(url);
      setUrlError('');
    }
  };

  const handleUrlSubmit = (e) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    if (!isValidImageUrl(urlInput.trim())) {
      setUrlError('Please enter a valid image URL');
      return;
    }
    setImageSrc(urlInput.trim());
    setUrlError('');
    setUrlInput('');
  };

  const handleDownload = () => {
    const canvas = enhancedCanvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `SumanAI_Enhanced_${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleMouseDown = () => {
    isDraggingRef.current = true;
  };

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current || !splitContainerRef.current) return;
    const rect = splitContainerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percentage = (x / rect.width) * 100;
    setSliderPosition(percentage);
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleTouchMove = (e) => {
    if (!splitContainerRef.current || !e.touches[0]) return;
    const rect = splitContainerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.touches[0].clientX - rect.left, rect.width));
    const percentage = (x / rect.width) * 100;
    setSliderPosition(percentage);
  };

  return (
    <div
      className="uncensored-page-wrapper"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <div className="uncensored-top-nav">
        <div className="uncensored-breadcrumb">
          <button
            type="button"
            className="breadcrumb-home-btn"
            onClick={() => navigate('/')}
            title="Home"
          >
            <Home size={13} />
          </button>
          <span className="breadcrumb-sep">&gt;</span>
          <button
            type="button"
            className="breadcrumb-link"
            onClick={() => navigate('/tools/view')}
          >
            Tools
          </button>
          <span className="breadcrumb-sep">&gt;</span>
          <span className="breadcrumb-link">Image Processing</span>
          <span className="breadcrumb-sep">&gt;</span>
          <span className="breadcrumb-current">Face & Image Enhancer</span>
        </div>

        <a
          href="https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API"
          target="_blank"
          rel="noopener noreferrer"
          className="uncensored-doc-btn"
          title="Pixel Matrix Documentation"
        >
          <BookOpen size={13} />
          <span>Documentation</span>
          <ExternalLink size={11} className="doc-ext-icon" />
        </a>
      </div>

      <header className="uncensored-title-section">
        <div className="uncensored-title-left">
          <div className="uncensored-avatar-icon">
            <Layers size={22} />
          </div>
          <div className="uncensored-title-texts">
            <h1 className="uncensored-main-title">Face & Image Enhancer</h1>
            <p className="uncensored-main-desc">
              Restore facial clarity, boost resolution, and balance contrast with high-fidelity pixel matrix filters.
            </p>
          </div>
        </div>

        <div className="uncensored-chips-row">
          <span className="chip-badge chip-qwen">
            <Layers size={12} />
            <span>Neural Clarity</span>
          </span>
          <span className="chip-badge chip-uncensored">
            <Zap size={12} />
            <span>Bilinear Matrix</span>
          </span>
          <span className="chip-badge chip-zerogpu">
            <ShieldCheck size={12} />
            <span>Zero Telemetry</span>
          </span>
        </div>
      </header>

      <main className="uncensored-main-grid">
        <section className="uncensored-left-card">
          <div className="uncensored-tabs-container">
            <button
              type="button"
              className={`uncensored-tab ${mode === 'upload' ? 'active' : ''}`}
              onClick={() => setMode('upload')}
            >
              <Upload size={14} />
              <span>Upload Photo</span>
            </button>
            <button
              type="button"
              className={`uncensored-tab ${mode === 'url' ? 'active' : ''}`}
              onClick={() => setMode('url')}
            >
              <LinkIcon size={14} />
              <span>Image URL</span>
            </button>
          </div>

          {mode === 'upload' ? (
            <div className="uncensored-field-group">
              <div
                className="uncensored-upload-box"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={28} className="upload-arrow-icon" />
                <span className="upload-main-text">Click to choose portrait or photo</span>
                <span className="upload-sub-text">Supports JPG, PNG, WebP (up to 16MB)</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                />
              </div>
            </div>
          ) : (
            <div className="uncensored-field-group">
              <form onSubmit={handleUrlSubmit} className="url-input-container">
                <input
                  type="url"
                  placeholder="Paste direct https:// image URL..."
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="prompt-textarea"
                  style={{ minHeight: '44px', height: '44px', padding: '0 12px' }}
                />
                <button
                  type="submit"
                  disabled={!urlInput.trim()}
                  className="url-load-btn"
                >
                  Load
                </button>
              </form>
              {urlError && <span className="enhancer-error-text">{urlError}</span>}
            </div>
          )}

          <div className="uncensored-field-group">
            <span className="field-label-text">
              <span>Sample Presets</span>
            </span>
            <div className="inspirations-grid">
              {SAMPLE_PRESETS.map((preset) => (
                <button
                  key={preset.text}
                  type="button"
                  className="inspiration-pill"
                  onClick={() => setImageSrc(preset.url)}
                >
                  <span className="pill-text">{preset.text}</span>
                  <span className="pill-plus">+</span>
                </button>
              ))}
            </div>
          </div>

          <div className="uncensored-field-group">
            <div className="field-label-line">
              <span className="field-label-text">
                <span>Enhancement Sliders</span>
              </span>
              <button
                type="button"
                className="enhance-btn"
                onClick={resetFilters}
              >
                <RotateCcw size={11} />
                <span>Reset</span>
              </button>
            </div>

            <div className="enhancer-slider-unit">
              <div className="enhancer-slider-header">
                <span>Sharpness & Micro-Contrast</span>
                <span className="enhancer-val-badge">+{sharpness}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={sharpness}
                onChange={(e) => setSharpness(Number(e.target.value))}
                className="tool-range-input"
              />
            </div>

            <div className="enhancer-slider-unit">
              <div className="enhancer-slider-header">
                <span>Contrast Balance</span>
                <span className="enhancer-val-badge">{contrast > 0 ? `+${contrast}` : contrast}</span>
              </div>
              <input
                type="range"
                min="-20"
                max="60"
                value={contrast}
                onChange={(e) => setContrast(Number(e.target.value))}
                className="tool-range-input"
              />
            </div>

            <div className="enhancer-slider-unit">
              <div className="enhancer-slider-header">
                <span>Vibrance & Skin Tone</span>
                <span className="enhancer-val-badge">+{vibrance}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="60"
                value={vibrance}
                onChange={(e) => setVibrance(Number(e.target.value))}
                className="tool-range-input"
              />
            </div>

            <div className="enhancer-slider-unit">
              <div className="enhancer-slider-header">
                <span>Warmth & Lighting Temp</span>
                <span className="enhancer-val-badge">{warmth > 0 ? `+${warmth}` : warmth}</span>
              </div>
              <input
                type="range"
                min="-30"
                max="40"
                value={warmth}
                onChange={(e) => setWarmth(Number(e.target.value))}
                className="tool-range-input"
              />
            </div>
          </div>

          <button
            type="button"
            className="uncensored-btn-generate"
            onClick={handleDownload}
          >
            <Download size={16} />
            <span>Export Enhanced Image</span>
          </button>
        </section>

        <section className="uncensored-right-card">
          <div className="canvas-header-bar">
            <div className="canvas-title-left">
              <ImageIcon size={16} className="canvas-title-icon" />
              <span>Comparison Canvas</span>
            </div>
            <div className="canvas-actions-right">
              <div className="view-mode-pill">
                <button
                  type="button"
                  className={`view-pill-btn ${viewMode === 'split' ? 'active' : ''}`}
                  onClick={() => setViewMode('split')}
                >
                  Split View
                </button>
                <button
                  type="button"
                  className={`view-pill-btn ${viewMode === 'enhanced' ? 'active' : ''}`}
                  onClick={() => setViewMode('enhanced')}
                >
                  Enhanced
                </button>
                <button
                  type="button"
                  className={`view-pill-btn ${viewMode === 'original' ? 'active' : ''}`}
                  onClick={() => setViewMode('original')}
                >
                  Original
                </button>
              </div>
              <button
                type="button"
                className="canvas-action-btn"
                onClick={handleDownload}
                title="Download enhanced render"
              >
                <Download size={14} />
              </button>
              <button
                type="button"
                className="canvas-action-btn"
                onClick={resetFilters}
                title="Reset sliders"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          <div className="canvas-main-area">
            <div className="enhancer-split-frame" ref={splitContainerRef} onTouchMove={handleTouchMove}>
              <canvas
                ref={originalCanvasRef}
                className="enhancer-canvas original-canvas"
                style={{
                  display: viewMode === 'enhanced' ? 'none' : 'block'
                }}
              />
              <div
                className="enhancer-clipped-layer"
                style={{
                  clipPath: viewMode === 'split'
                    ? `polygon(${sliderPosition}% 0, 100% 0, 100% 100%, ${sliderPosition}% 100%)`
                    : viewMode === 'enhanced'
                    ? 'none'
                    : 'polygon(100% 0, 100% 0, 100% 100%, 100% 100%)'
                }}
              >
                <canvas ref={enhancedCanvasRef} className="enhancer-canvas enhanced-canvas" />
              </div>

              {viewMode === 'split' && (
                <div
                  className="enhancer-splitter-divider"
                  style={{ left: `${sliderPosition}%` }}
                  onMouseDown={handleMouseDown}
                  onTouchStart={handleMouseDown}
                >
                  <div className="enhancer-splitter-handle" />
                </div>
              )}

              {viewMode === 'split' && (
                <>
                  <span className="enhancer-badge-tag before">Before</span>
                  <span className="enhancer-badge-tag after">After</span>
                </>
              )}
            </div>
          </div>

          <div className="recent-generations-bar">
            <div className="recent-bar-header">
              <div className="recent-title-wrap">
                <Clock size={14} className="recent-clock-icon" />
                <span>Recent Photos</span>
              </div>
              <button
                type="button"
                className="view-library-link"
                onClick={() => navigate('/files')}
              >
                <span>View Library</span>
                <ArrowRight size={13} />
              </button>
            </div>

            <div className="recent-thumbs-row">
              {DEFAULT_RECENT_IMAGES.map((item, idx) => (
                <div
                  key={idx}
                  className="recent-thumb-wrapper"
                  onClick={() => setImageSrc(item.url)}
                  title={item.prompt}
                >
                  <img src={item.url} alt={item.prompt} className="recent-thumb-img" />
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default FaceEnhancer;

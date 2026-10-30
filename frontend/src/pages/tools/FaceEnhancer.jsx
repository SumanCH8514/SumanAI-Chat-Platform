import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layers, ArrowLeft, Upload, Link as LinkIcon, Download, RotateCcw,
  Sliders, Eye, Image as ImageIcon, ExternalLink, Check
} from 'lucide-react';
import { isValidImageUrl } from '../../utils/imageUtils';
import './ToolAppShared.css';
import './FaceEnhancer.css';

const SAMPLE_IMAGES = [
  {
    id: 'sample-portrait',
    label: 'Studio Portrait',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'sample-street',
    label: 'Low Light Street',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'sample-arch',
    label: 'Urban Architecture',
    url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80'
  }
];

export const FaceEnhancer = () => {
  const navigate = useNavigate();
  const [imageSrc, setImageSrc] = useState(SAMPLE_IMAGES[0].url);
  const [urlInput, setUrlInput] = useState('');
  const [urlError, setUrlError] = useState('');
  const [sliderPosition, setSliderPosition] = useState(50);
  const [viewMode, setViewMode] = useState('split');
  const [isHoldingOriginal, setIsHoldingOriginal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasProcessed, setHasProcessed] = useState(false);

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
    if (!orig || !enh) return;

    const ctxOrig = orig.getContext('2d');
    const ctxEnh = enh.getContext('2d');
    if (!ctxOrig || !ctxEnh) return;

    const w = orig.width;
    const h = orig.height;
    if (w === 0 || h === 0) return;

    enh.width = w;
    enh.height = h;

    const srcData = ctxOrig.getImageData(0, 0, w, h);
    const dstData = ctxEnh.createImageData(w, h);
    const src = srcData.data;
    const dst = dstData.data;

    const contrastFactor = (259 * (contrast * 1.5 + 255)) / (255 * (259 - contrast * 1.5));
    const satFactor = 1 + (vibrance / 100);
    const warmR = 1 + (warmth * 0.003);
    const warmB = 1 - (warmth * 0.003);

    const sharpWeight = sharpness / 100;
    const kernelCenter = 1 + 4 * sharpWeight;
    const kernelEdge = -sharpWeight;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;

        let r = src[idx];
        let g = src[idx + 1];
        let b = src[idx + 2];
        const a = src[idx + 3];

        if (sharpness > 5 && x > 0 && x < w - 1 && y > 0 && y < h - 1) {
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
    setHasProcessed(true);
    setIsProcessing(false);
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
    img.onerror = () => {
      if (isCancelled) return;
      setIsProcessing(false);
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
      setUrlError('Please enter a valid image URL (jpg, png, webp)');
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
      className="tool-app-wrapper"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
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
          <span className="tool-nav-current">Face & Image Enhancer</span>
        </nav>

        <div className="tool-header-content">
          <div className="tool-title-row">
            <h1 className="tool-app-heading">Face & Image Enhancer</h1>
            <span className="tool-tag-pill">Neural Pixel Matrix</span>
          </div>
          <p className="tool-app-subheading">
            Restore facial clarity, boost resolution, and balance contrast with high-fidelity pixel matrix filters.
          </p>
        </div>
      </header>

      <main className="tool-app-body">
        <section className="tool-config-panel">
          <div className="tool-input-group">
            <label className="tool-label">Source Photo</label>
            <div className="enhancer-source-actions">
              <button
                type="button"
                className="tool-btn-secondary enhancer-upload-btn"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={14} /> Upload Local File
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileUpload}
              />
            </div>

            <form onSubmit={handleUrlSubmit} className="enhancer-url-row">
              <input
                type="url"
                className="tool-input-text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="Or paste an image URL..."
              />
              <button type="submit" className="tool-btn-secondary" title="Load URL">
                <LinkIcon size={14} />
              </button>
            </form>
            {urlError && <span className="enhancer-error-text">{urlError}</span>}
          </div>

          <div className="tool-input-group">
            <label className="tool-label">Quick Sample Images</label>
            <div className="enhancer-sample-row">
              {SAMPLE_IMAGES.map((sample) => (
                <button
                  key={sample.id}
                  type="button"
                  className={`enhancer-sample-pill ${imageSrc === sample.url ? 'active' : ''}`}
                  onClick={() => setImageSrc(sample.url)}
                >
                  {sample.label}
                </button>
              ))}
            </div>
          </div>

          <div className="tool-input-group">
            <div className="tool-label">
              <span>Enhancement Parameters</span>
              <button
                type="button"
                className="tool-enhance-btn"
                onClick={resetFilters}
              >
                <RotateCcw size={12} /> Reset
              </button>
            </div>

            <div className="tool-slider-container">
              <div className="tool-slider-row">
                <span>Super Resolution & Sharpness</span>
                <span>{sharpness}%</span>
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

            <div className="tool-slider-container">
              <div className="tool-slider-row">
                <span>Portrait Contrast & Depth</span>
                <span>{contrast}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={contrast}
                onChange={(e) => setContrast(Number(e.target.value))}
                className="tool-range-input"
              />
            </div>

            <div className="tool-slider-container">
              <div className="tool-slider-row">
                <span>Color Vibrance</span>
                <span>{vibrance}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={vibrance}
                onChange={(e) => setVibrance(Number(e.target.value))}
                className="tool-range-input"
              />
            </div>

            <div className="tool-slider-container">
              <div className="tool-slider-row">
                <span>Skin Warmth & Balance</span>
                <span>{warmth}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={warmth}
                onChange={(e) => setWarmth(Number(e.target.value))}
                className="tool-range-input"
              />
            </div>
          </div>

          <button
            type="button"
            className="tool-btn-primary"
            onClick={applyEnhancements}
            disabled={isProcessing}
          >
            <Layers size={16} /> Apply Filter Matrix
          </button>
        </section>

        <section className="tool-result-panel">
          <div className="tool-result-header">
            <div className="tool-result-title">
              <Sliders size={16} />
              <span>Inspection Viewport</span>
              {hasProcessed && (
                <span className="tool-telemetry-badge">
                  Sharpness {sharpness}% • Contrast {contrast}%
                </span>
              )}
            </div>

            <div className="tool-result-actions">
              <div className="enhancer-view-pills">
                <button
                  type="button"
                  className={`enhancer-view-pill ${viewMode === 'split' ? 'active' : ''}`}
                  onClick={() => setViewMode('split')}
                >
                  Split Compare
                </button>
                <button
                  type="button"
                  className={`enhancer-view-pill ${viewMode === 'side' ? 'active' : ''}`}
                  onClick={() => setViewMode('side')}
                >
                  Side by Side
                </button>
              </div>

              <button
                type="button"
                className="tool-btn-secondary"
                onMouseDown={() => setIsHoldingOriginal(true)}
                onMouseUp={() => setIsHoldingOriginal(false)}
                onTouchStart={() => setIsHoldingOriginal(true)}
                onTouchEnd={() => setIsHoldingOriginal(false)}
                title="Hold to view original photo"
              >
                <Eye size={14} /> Hold Original
              </button>

              <button
                type="button"
                className="tool-btn-secondary"
                onClick={handleDownload}
                disabled={!hasProcessed}
                title="Export Enhanced Image"
              >
                <Download size={14} /> Download
              </button>

              <button
                type="button"
                className="tool-btn-secondary"
                onClick={() => navigate('/tools/bg-remover')}
                title="Isolate background in BG Remover"
              >
                <ExternalLink size={14} /> BG Remover
              </button>
            </div>
          </div>

          <div className="enhancer-canvas-viewport">
            <canvas ref={originalCanvasRef} style={{ display: 'none' }} />

            {viewMode === 'split' ? (
              <div
                ref={splitContainerRef}
                className="enhancer-split-wrapper"
                onTouchMove={handleTouchMove}
              >
                <div className="enhancer-canvas-layer base-layer">
                  <canvas
                    ref={isHoldingOriginal ? originalCanvasRef : enhancedCanvasRef}
                    className="enhancer-display-canvas"
                  />
                  <span className="enhancer-label-tag right">Enhanced</span>
                </div>

                {!isHoldingOriginal && (
                  <div
                    className="enhancer-canvas-layer clip-layer"
                    style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                  >
                    <canvas
                      ref={originalCanvasRef}
                      className="enhancer-display-canvas"
                    />
                    <span className="enhancer-label-tag left">Original</span>
                  </div>
                )}

                {!isHoldingOriginal && (
                  <div
                    className="enhancer-slider-divider"
                    style={{ left: `${sliderPosition}%` }}
                    onMouseDown={handleMouseDown}
                  >
                    <div className="enhancer-slider-handle">
                      <span className="enhancer-handle-arrows">‹ ›</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="enhancer-side-wrapper">
                <div className="enhancer-side-card">
                  <div className="enhancer-side-card-header">Original</div>
                  <div className="enhancer-side-canvas-box">
                    <canvas ref={originalCanvasRef} className="enhancer-display-canvas" />
                  </div>
                </div>
                <div className="enhancer-side-card">
                  <div className="enhancer-side-card-header">Enhanced</div>
                  <div className="enhancer-side-canvas-box">
                    <canvas ref={enhancedCanvasRef} className="enhancer-display-canvas" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default FaceEnhancer;

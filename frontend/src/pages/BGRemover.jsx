import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Home, BookOpen, ExternalLink, Image as ImageIcon,
  Zap, Download, Maximize2, Trash2, CheckCircle2,
  Clock, ArrowRight, X, Upload, Check, Loader2, Eraser,
  Sparkles, Link as LinkIcon, Eye,
  ChevronDown, RotateCcw, ShieldCheck
} from 'lucide-react';
import { removeBackground } from '@imgly/background-removal';
import { isValidImageUrl } from '../utils/imageUtils';
import { downloadImage as triggerImageDownload } from '../utils/downloadUtils';
import { env } from '../config/env';
import './tools/ToolAppShared.css';
import './BGRemover.css';

const APPROPRIATE_SAMPLE_PRESET = {
  id: 'sample-portrait-1',
  title: 'Studio Portrait',
  desc: 'High-res studio photography with fine hair detail',
  thumb: '/assets/tools/bg-remover/sample_portrait.jpg',
  original: '/assets/tools/bg-remover/sample_portrait.jpg',
  filename: 'studio-portrait-sample.jpg',
  size: '1.2 MB',
  format: 'JPG'
};

const BGRemover = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const tickerRef = useRef(null);

  const [mode, setMode] = useState('upload');
  const [originalImage, setOriginalImage] = useState(null);
  const [originalFileName, setOriginalFileName] = useState('');
  const [fileMeta, setFileMeta] = useState('');
  const [fileThumb, setFileThumb] = useState(null);
  const [processedImage, setProcessedImage] = useState(null);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [activeTab, setActiveTab] = useState('cutout');
  const [zoomLevel, setZoomLevel] = useState(100);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState('png');
  const [selectedEngine, setSelectedEngine] = useState('ultra');

  const [tableRows, setTableRows] = useState(() => {
    try {
      const saved = localStorage.getItem('sumanai_bg_cutouts');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
      return [];
    } catch {
      return [];
    }
  });
  const [selectedRowIds, setSelectedRowIds] = useState([]);

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('No file selected');
  const [error, setError] = useState(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const stopTicker = () => {
    if (tickerRef.current) {
      clearInterval(tickerRef.current);
      tickerRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      stopTicker();
    };
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setOriginalImage(url);
      setFileThumb(url);
      setOriginalFileName(file.name);
      setFileMeta(`${(file.size / (1024 * 1024)).toFixed(1)} MB · ${file.type.split('/')[1].toUpperCase()}`);
      setProcessedImage(null);
      setError(null);
    } else {
      setError('Please select a valid image file (PNG, JPG, WebP).');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setOriginalImage(url);
      setFileThumb(url);
      setOriginalFileName(file.name);
      setFileMeta(`${(file.size / (1024 * 1024)).toFixed(1)} MB · ${file.type.split('/')[1].toUpperCase()}`);
      setProcessedImage(null);
      setError(null);
    }
  };

  const handleUrlSubmit = (e) => {
    e.preventDefault();
    if (!imageUrlInput.trim()) return;
    if (!isValidImageUrl(imageUrlInput.trim())) {
      setError('Please enter a valid direct image URL.');
      return;
    }
    const cleanUrl = imageUrlInput.trim();
    setOriginalImage(cleanUrl);
    setFileThumb(cleanUrl);
    setOriginalFileName('Remote_Image.jpg');
    setFileMeta('Online · Image');
    setProcessedImage(null);
    setError(null);
  };

  const handleLoadSamplePreset = () => {
    setOriginalImage(APPROPRIATE_SAMPLE_PRESET.original);
    setFileThumb(APPROPRIATE_SAMPLE_PRESET.thumb);
    setOriginalFileName(APPROPRIATE_SAMPLE_PRESET.filename);
    setFileMeta(`${APPROPRIATE_SAMPLE_PRESET.size} · ${APPROPRIATE_SAMPLE_PRESET.format}`);
    setProcessedImage(null);
    setActiveTab('original');
    setError(null);
    setStatusMessage('Sample preset loaded. Ready to remove background.');
  };

  const processImage = async () => {
    if (!originalImage || isProcessing) return;

    try {
      setIsProcessing(true);
      setProgress(12);
      setStatusMessage('Preparing image buffer...');
      setError(null);

      let fetchUrl = originalImage;
      if (originalImage.startsWith('http://') || originalImage.startsWith('https://')) {
        const workerUrl = env.WORKER_URL ? env.WORKER_URL.replace(/\/+$/, '') : '';
        fetchUrl = `${workerUrl}/api/proxy-image?url=${encodeURIComponent(originalImage)}`;
      }

      let response;
      try {
        response = await fetch(fetchUrl);
      } catch {
        if (originalImage.startsWith('http://') || originalImage.startsWith('https://')) {
          response = await fetch(originalImage).catch(() => null);
        }
      }

      if (!response || !response.ok) {
        throw new Error('Failed to load image. Cross-origin restriction encountered.');
      }

      const blob = await response.blob();

      setProgress(24);
      setStatusMessage('Initializing neural matting pipeline...');

      stopTicker();
      tickerRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 92) return prev;
          if (prev < 65) return Math.min(65, prev + 0.4);
          return Math.min(92, prev + 0.3);
        });
      }, 200);

      const resultBlob = await removeBackground(blob, {
        progress: (key, current, total) => {
          if (typeof key === 'string') {
            if (key.startsWith('fetch:')) {
              if (typeof total === 'number' && total > 0 && typeof current === 'number') {
                const pct = Math.min(100, Math.max(0, Math.round((current / total) * 100)));
                setStatusMessage(pct > 0 ? `Loading model (${pct}%)...` : 'Loading model...');
                const calc = 24 + Math.round((current / total) * 44);
                setProgress((prev) => Math.max(prev, Math.min(68, calc)));
              }
            } else if (key === 'compute:inference') {
              setStatusMessage('Extracting alpha mask...');
              setProgress((prev) => Math.max(prev, 84));
            } else if (key === 'compute:mask') {
              setStatusMessage('Refining edge boundaries...');
              setProgress((prev) => Math.max(prev, 93));
            } else if (key.startsWith('compute:encode')) {
              setStatusMessage('Rendering transparent PNG...');
              setProgress((prev) => Math.max(prev, 97));
            }
          }
        }
      });

      stopTicker();
      const resultUrl = URL.createObjectURL(resultBlob);
      setProcessedImage(resultUrl);
      setActiveTab('cutout');
      setProgress(100);
      setStatusMessage('Background removed successfully!');

      const newRow = {
        id: `row-${Date.now()}`,
        thumb: resultUrl,
        cutout: resultUrl,
        filename: originalFileName.replace(/\.[^/.]+$/, '') + '.png',
        format: selectedFormat.toUpperCase(),
        engine: selectedEngine === 'ultra' ? 'Ultra Matting' : 'Fast Mode',
        status: 'Completed',
        createdAt: 'Just now'
      };
      setTableRows((prev) => [newRow, ...prev]);
    } catch (err) {
      stopTicker();
      setError(err?.message || 'Processing failed. Please ensure WebAssembly is supported.');
    } finally {
      stopTicker();
      setIsProcessing(false);
    }
  };

  const handleDownload = (imgUrl = processedImage) => {
    if (!imgUrl) return;
    const cleanName = (originalFileName || 'Cutout').replace(/\.[^/.]+$/, '');
    triggerImageDownload(imgUrl, `${cleanName}_cutout`, selectedFormat);
  };

  const handleToggleSelectAll = () => {
    if (selectedRowIds.length === tableRows.length) {
      setSelectedRowIds([]);
    } else {
      setSelectedRowIds(tableRows.map((r) => r.id));
    }
  };

  const handleToggleSelectRow = (id) => {
    setSelectedRowIds((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const handleDeleteRow = (id) => {
    setTableRows((prev) => prev.filter((r) => r.id !== id));
    setSelectedRowIds((prev) => prev.filter((rId) => rId !== id));
  };

  useEffect(() => {
    try {
      localStorage.setItem('sumanai_bg_cutouts', JSON.stringify(tableRows));
    } catch {
      void 0;
    }
  }, [tableRows]);

  const clearSelectedFile = () => {
    setOriginalImage(null);
    setFileThumb(null);
    setOriginalFileName('');
    setFileMeta('');
    setProcessedImage(null);
  };

  return (
    <div className="tool-app-wrapper bg-remover-root-wrap">
      <div className="bg-remover-top-header">
        <nav className="bg-remover-breadcrumb">
          <button
            type="button"
            className="breadcrumb-nav-link"
            onClick={() => navigate('/')}
            title="Home"
          >
            <Home size={13} />
          </button>
          <span className="breadcrumb-nav-sep">&gt;</span>
          <button
            type="button"
            className="breadcrumb-nav-link"
            onClick={() => navigate('/tools/view')}
          >
            Tools
          </button>
          <span className="breadcrumb-nav-sep">&gt;</span>
          <span className="breadcrumb-nav-link">Image Processing</span>
          <span className="breadcrumb-nav-sep">&gt;</span>
          <span className="breadcrumb-nav-active">AI Background Remover</span>
        </nav>

        <div className="bg-remover-top-actions">
          <span className="tech-badge badge-neutral">
            <span>ONNX-BirefNet</span>
          </span>
          <span className="tech-badge badge-danger">
            <Zap size={11} />
            <span>Precision Matting</span>
          </span>
          <span className="tech-badge badge-success">
            <CheckCircle2 size={11} />
            <span>Client-Side Privacy</span>
          </span>
          <a
            href="https://github.com/imgly/background-removal-js"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-doc-link-btn"
          >
            <BookOpen size={12} />
            <span>Documentation</span>
            <ExternalLink size={10} />
          </a>
        </div>
      </div>

      <header className="bg-remover-title-block">
        <div className="bg-title-icon-box">
          <ImageIcon size={22} />
        </div>
        <div className="bg-title-texts">
          <h1 className="bg-main-title">AI Background Remover & Neural Matting</h1>
          <p className="bg-main-subtitle">
            Remove backgrounds from portrait, product, and vehicle photography with precision edge matting.
          </p>
        </div>
      </header>

      <div className="bg-workspace-columns">
        <section className="bg-left-controls-card">
          <div className="bg-mode-tabs-wrap">
            <button
              type="button"
              className={`bg-mode-tab ${mode === 'upload' ? 'active' : ''}`}
              onClick={() => setMode('upload')}
            >
              <Upload size={13} />
              <span>Upload Image</span>
            </button>
            <button
              type="button"
              className={`bg-mode-tab ${mode === 'url' ? 'active' : ''}`}
              onClick={() => setMode('url')}
            >
              <LinkIcon size={13} />
              <span>Image URL</span>
            </button>
          </div>

          {mode === 'upload' ? (
            <div className="bg-file-selection-area">
              {originalImage ? (
                <div className="bg-selected-file-strip">
                  <img
                    src={fileThumb || originalImage}
                    alt="Current selection"
                    className="selected-file-thumb"
                  />
                  <div className="selected-file-meta">
                    <span className="file-name-line">{originalFileName}</span>
                    <span className="file-sub-line">{fileMeta}</span>
                  </div>
                  <button
                    type="button"
                    className="strip-close-x-btn"
                    onClick={clearSelectedFile}
                    title="Clear selected file"
                  >
                    <X size={13} />
                  </button>
                </div>
              ) : (
                <div
                  className="bg-dropzone-box"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={24} className="dropzone-arrow" />
                  <span className="dropzone-primary-text">Click or drag image to upload</span>
                  <span className="dropzone-hint-text">PNG, JPG, WebP up to 12MB</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="bg-url-input-area">
              <form onSubmit={handleUrlSubmit} className="bg-url-form">
                <input
                  type="url"
                  placeholder="Paste direct https:// image URL..."
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  className="bg-text-input"
                />
                <button
                  type="submit"
                  disabled={!imageUrlInput.trim()}
                  className="bg-url-submit-btn"
                >
                  Load
                </button>
              </form>
            </div>
          )}

          <div className="bg-section-group">
            <span className="group-title-text">
              <Sparkles size={12} className="sparkle-lead-icon" />
              <span>Sample Preset</span>
            </span>

            <button
              type="button"
              className="bg-sample-preset-card"
              onClick={handleLoadSamplePreset}
              title="Click to load sample studio portrait"
            >
              <img
                src={APPROPRIATE_SAMPLE_PRESET.thumb}
                alt={APPROPRIATE_SAMPLE_PRESET.title}
                className="sample-preset-card-thumb"
              />
              <div className="sample-preset-card-info">
                <div className="sample-preset-card-top">
                  <span className="sample-preset-title">{APPROPRIATE_SAMPLE_PRESET.title}</span>
                  <span className="sample-preset-meta">{APPROPRIATE_SAMPLE_PRESET.size} · {APPROPRIATE_SAMPLE_PRESET.format}</span>
                </div>
                <span className="sample-preset-desc">{APPROPRIATE_SAMPLE_PRESET.desc}</span>
              </div>
              <span className="sample-preset-action-chip">Try Preset</span>
            </button>
          </div>

          <div className="bg-section-group">
            <span className="group-title-text">Output Format</span>
            <div className="bg-pill-options-row">
              <div
                className={`format-option-duo ${selectedFormat === 'png' ? 'active' : ''}`}
                onClick={() => setSelectedFormat('png')}
                role="button"
                tabIndex={0}
              >
                <div className="duo-left-badge">
                  {selectedFormat === 'png' && <Check size={11} />}
                  <span>PNG</span>
                </div>
                <div className="duo-right-badge">Transparent</div>
              </div>

              <div
                className={`format-option-duo ${selectedFormat === 'webp' ? 'active' : ''}`}
                onClick={() => setSelectedFormat('webp')}
                role="button"
                tabIndex={0}
              >
                <div className="duo-left-badge">
                  {selectedFormat === 'webp' && <Check size={11} />}
                  <span>WEBP</span>
                </div>
                <div className="duo-right-badge">Compact</div>
              </div>

              <div
                className={`format-option-duo ${selectedFormat === 'jpeg' ? 'active' : ''}`}
                onClick={() => setSelectedFormat('jpeg')}
                role="button"
                tabIndex={0}
              >
                <div className="duo-left-badge">
                  {selectedFormat === 'jpeg' && <Check size={11} />}
                  <span>JPEG</span>
                </div>
                <div className="duo-right-badge">White BG</div>
              </div>
            </div>
          </div>

          <div className="bg-section-group">
            <span className="group-title-text">Matting Engine</span>
            <div className="bg-pill-options-row matting-engine-options-row">
              <div
                className={`format-option-duo engine-duo ${selectedEngine === 'ultra' ? 'active' : ''}`}
                onClick={() => setSelectedEngine('ultra')}
                role="button"
                tabIndex={0}
              >
                <div className="duo-left-badge">
                  {selectedEngine === 'ultra' && <Check size={11} />}
                  <span>Ultra Matting</span>
                </div>
                <div className="duo-right-badge">Hair & Edges</div>
              </div>

              <div
                className={`format-option-duo engine-duo ${selectedEngine === 'fast' ? 'active' : ''}`}
                onClick={() => setSelectedEngine('fast')}
                role="button"
                tabIndex={0}
              >
                <div className="duo-left-badge">
                  {selectedEngine === 'fast' && <Check size={11} />}
                  <span>Fast Mode</span>
                </div>
                <div className="duo-right-badge">Solid Subjects</div>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-error-msg-banner">
              <span>{error}</span>
            </div>
          )}

          <button
            type="button"
            className="bg-primary-cta-btn"
            disabled={!originalImage || isProcessing}
            onClick={processImage}
          >
            {isProcessing ? (
              <>
                <Loader2 size={16} className="bg-spin-icon" />
                <span>{statusMessage} ({Math.round(progress)}%)</span>
              </>
            ) : (
              <>
                <Eraser size={16} />
                <span>Remove Background</span>
              </>
            )}
          </button>
        </section>

        <section className="bg-right-canvas-card">
          <div className="canvas-top-toolbar">
            <div className="canvas-view-mode-tabs">
              <button
                type="button"
                className={`view-mode-tab-btn ${activeTab === 'cutout' ? 'active' : ''}`}
                disabled={!processedImage}
                onClick={() => setActiveTab('cutout')}
              >
                Cutout
              </button>
              <button
                type="button"
                className={`view-mode-tab-btn ${activeTab === 'original' ? 'active' : ''}`}
                onClick={() => setActiveTab('original')}
              >
                Original
              </button>
            </div>

            <div className="canvas-right-quick-tools">
              <div className="zoom-dropdown-wrap">
                <button
                  type="button"
                  className="canvas-tool-btn zoom-btn"
                  onClick={() => setZoomOpen(!zoomOpen)}
                >
                  <span>🔍 {zoomLevel}%</span>
                  <ChevronDown size={11} />
                </button>
                {zoomOpen && (
                  <div className="zoom-popover-menu">
                    {[75, 100, 125, 150].map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        className={`zoom-opt-btn ${zoomLevel === lvl ? 'active' : ''}`}
                        onClick={() => {
                          setZoomLevel(lvl);
                          setZoomOpen(false);
                        }}
                      >
                        {lvl}%
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                className="canvas-tool-btn"
                disabled={!processedImage}
                onClick={() => setLightboxOpen(true)}
                title="Fullscreen preview"
              >
                <Maximize2 size={13} />
              </button>

              <button
                type="button"
                className="canvas-tool-btn"
                disabled={!processedImage}
                onClick={() => handleDownload()}
                title="Download transparent image"
              >
                <Download size={13} />
              </button>

              <button
                type="button"
                className="canvas-tool-btn"
                disabled={!originalImage && !processedImage}
                onClick={clearSelectedFile}
                title="Clear canvas"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>

          <div className="canvas-checkerboard-display">
            {processedImage || originalImage ? (
              <div
                className="canvas-image-layer"
                style={{ transform: `scale(${zoomLevel / 100})` }}
              >
                <img
                  src={activeTab === 'cutout' && processedImage ? processedImage : originalImage}
                  alt="Processed visual"
                  className="canvas-main-cutout-img"
                  onClick={() => setLightboxOpen(true)}
                />
              </div>
            ) : isProcessing ? (
              <div className="canvas-spinner-stage">
                <Loader2 size={40} className="bg-spin-icon canvas-loader-spin" />
                <span className="stage-title">Neural Edge Matting</span>
                <span className="stage-subtitle">{statusMessage}</span>
                <div className="stage-progress-track">
                  <div
                    className="stage-progress-fill"
                    style={{ width: `${Math.max(8, progress)}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="canvas-blank-placeholder">
                <div className="blank-icon-box">
                  <Eraser size={32} />
                </div>
                <h3 className="blank-title">Ready for Background Removal</h3>
                <p className="blank-desc">
                  Select a photo or sample preset and click "Remove Background" to create your cutout here.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>

      <section className="bg-recent-table-card">
        <div className="recent-table-head-row">
          <div className="recent-head-left">
            <RotateCcw size={15} className="recent-rotate-icon" />
            <span className="recent-head-title">Recent Cutouts</span>
          </div>
          <button
            type="button"
            className="recent-view-library-link"
            onClick={() => navigate('/files')}
          >
            <span>View Library</span>
            <ArrowRight size={13} />
          </button>
        </div>

        <div className="recent-table-scroll-container">
          {tableRows.length === 0 ? (
            <div className="table-empty-wrap standalone">
              <div className="empty-icon-circle">
                <Eraser size={24} className="table-empty-icon" />
              </div>
              <span className="table-empty-title">No recent cutouts yet</span>
              <span className="table-empty-desc">
                Images processed with background removal will automatically appear here.
              </span>
            </div>
          ) : (
            <>
              <table className="bg-cutouts-data-table desktop-only-table">
                <thead>
                  <tr>
                    <th className="th-check">
                      <input
                        type="checkbox"
                        checked={selectedRowIds.length === tableRows.length && tableRows.length > 0}
                        onChange={handleToggleSelectAll}
                      />
                    </th>
                    <th className="th-image">IMAGE</th>
                    <th className="th-name">FILE NAME</th>
                    <th className="th-format">OUTPUT FORMAT</th>
                    <th className="th-engine">ENGINE</th>
                    <th className="th-status">STATUS</th>
                    <th className="th-date">CREATED AT</th>
                    <th className="th-actions">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map((row) => {
                    const isSelected = selectedRowIds.includes(row.id);
                    const isCompleted = row.status === 'Completed';

                    return (
                      <tr key={row.id} className={isSelected ? 'is-selected' : ''}>
                        <td className="td-check">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectRow(row.id)}
                          />
                        </td>
                        <td className="td-image">
                          <img src={row.thumb} alt={row.filename} className="row-thumb-img" />
                        </td>
                        <td className="td-name">
                          <span className="row-filename-text" title={row.filename}>
                            {row.filename}
                          </span>
                        </td>
                        <td className="td-format">
                          <span className="row-format-pill">{row.format}</span>
                        </td>
                        <td className="td-engine">
                          <span className="row-engine-text">{row.engine}</span>
                        </td>
                        <td className="td-status">
                          {isCompleted ? (
                            <span className="row-status-badge completed">
                              <CheckCircle2 size={11} />
                              <span>Completed</span>
                            </span>
                          ) : (
                            <span className="row-status-badge processing">
                              <Loader2 size={11} className="row-spin" />
                              <span>Processing</span>
                            </span>
                          )}
                        </td>
                        <td className="td-date">
                          <span className="row-date-text">{row.createdAt}</span>
                        </td>
                        <td className="td-actions">
                          <div className="row-actions-cluster">
                            <button
                              type="button"
                              className="table-action-btn"
                              onClick={() => {
                                setOriginalImage(row.cutout);
                                setProcessedImage(row.cutout);
                                setOriginalFileName(row.filename);
                                setActiveTab('cutout');
                              }}
                              title="Preview cutout"
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              type="button"
                              className="table-action-btn"
                              onClick={() => handleDownload(row.cutout)}
                              disabled={!isCompleted}
                              title="Download cutout"
                            >
                              <Download size={14} />
                            </button>
                            <button
                              type="button"
                              className="table-action-btn delete-btn"
                              onClick={() => handleDeleteRow(row.id)}
                              title="Delete cutout"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="bg-cutouts-mobile-card-list mobile-only-card-list">
                {tableRows.map((row) => {
                  const isSelected = selectedRowIds.includes(row.id);
                  const isCompleted = row.status === 'Completed';

                  return (
                    <div key={row.id} className={`bg-mobile-cutout-card ${isSelected ? 'is-selected' : ''}`}>
                      <div className="mobile-cutout-card-left">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectRow(row.id)}
                          className="mobile-card-checkbox"
                        />
                        <img src={row.thumb} alt={row.filename} className="mobile-card-thumb" />
                      </div>
                      <div className="mobile-cutout-card-body">
                        <span className="mobile-card-filename" title={row.filename}>
                          {row.filename}
                        </span>
                        <div className="mobile-card-badges">
                          <span className="row-format-pill">{row.format}</span>
                          <span className="mobile-card-engine">{row.engine}</span>
                          {isCompleted ? (
                            <span className="row-status-badge completed">
                              <CheckCircle2 size={10} />
                              <span>Done</span>
                            </span>
                          ) : (
                            <span className="row-status-badge processing">
                              <Loader2 size={10} className="row-spin" />
                              <span>Processing</span>
                            </span>
                          )}
                        </div>
                        <span className="mobile-card-date">{row.createdAt}</span>
                      </div>
                      <div className="mobile-cutout-card-actions">
                        <button
                          type="button"
                          className="table-action-btn"
                          onClick={() => {
                            setOriginalImage(row.cutout);
                            setProcessedImage(row.cutout);
                            setOriginalFileName(row.filename);
                            setActiveTab('cutout');
                          }}
                          title="Preview cutout"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          type="button"
                          className="table-action-btn"
                          onClick={() => handleDownload(row.cutout)}
                          disabled={!isCompleted}
                          title="Download cutout"
                        >
                          <Download size={15} />
                        </button>
                        <button
                          type="button"
                          className="table-action-btn delete-btn"
                          onClick={() => handleDeleteRow(row.id)}
                          title="Delete cutout"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </section>

      {lightboxOpen && processedImage && (
        <div className="bg-lightbox-overlay" onClick={() => setLightboxOpen(false)}>
          <div className="bg-lightbox-card" onClick={(e) => e.stopPropagation()}>
            <img
              src={activeTab === 'cutout' ? processedImage : originalImage}
              alt="Fullscreen cutout"
              className="lightbox-rendered-img"
            />
            <div className="bg-lightbox-toolbar">
              <button
                type="button"
                className="lightbox-action-btn"
                onClick={() => handleDownload()}
              >
                <Download size={14} />
                <span>Download</span>
              </button>
              <button
                type="button"
                className="lightbox-action-btn"
                onClick={() => setLightboxOpen(false)}
              >
                <X size={14} />
                <span>Close</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BGRemover;

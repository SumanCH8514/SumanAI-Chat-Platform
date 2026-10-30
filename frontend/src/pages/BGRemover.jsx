import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { Upload, Image as ImageIcon, Download, Trash2, Loader2, Eraser, CheckCircle2, ArrowLeft } from 'lucide-react';
import { removeBackground } from '@imgly/background-removal';
import { isValidImageUrl } from '../utils/imageUtils';
import { downloadImage as triggerImageDownload } from '../utils/downloadUtils';
import { env } from '../config/env';
import './tools/ToolAppShared.css';
import './BGRemover.css';

const BGRemover = () => {
  const navigate = useNavigate();
  const [originalImage, setOriginalImage] = useState(null);
  const [processedImage, setProcessedImage] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('Removing Background...');
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const tickerRef = useRef(null);

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

  const handleUrlSubmit = (e) => {
    e.preventDefault();
    if (!imageUrl.trim()) return;

    if (!isValidImageUrl(imageUrl)) {
      setError("Please enter a valid image URL.");
      return;
    }

    setOriginalImage(imageUrl);
    setProcessedImage(null);
    setError(null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setOriginalImage(url);
      setProcessedImage(null);
      setError(null);
    } else {
      setError("Please select a valid image file.");
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setOriginalImage(url);
      setProcessedImage(null);
      setError(null);
    }
  };

  const processImage = async () => {
    if (!originalImage) return;

    try {
      setIsProcessing(true);
      setProgress(12);
      setStatusMessage('Preparing image...');
      setError(null);

      let fetchUrl = originalImage;
      if (originalImage.startsWith('http://') || originalImage.startsWith('https://')) {
        const workerUrl = env.WORKER_URL ? env.WORKER_URL.replace(/\/+$/, '') : '';
        fetchUrl = `${workerUrl}/api/proxy-image?url=${encodeURIComponent(originalImage)}`;
      }

      let response;
      try {
        response = await fetch(fetchUrl);
      } catch (proxyErr) {
        void proxyErr;
        if (originalImage.startsWith('http://') || originalImage.startsWith('https://')) {
          response = await fetch(originalImage).catch(() => null);
        }
      }

      if (!response || !response.ok) throw new Error("Failed to download image. The URL might be restricted.");
      const blob = await response.blob();

      setProgress(24);
      setStatusMessage('Initializing AI neural engine...');

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
                    setStatusMessage(pct > 0 ? `Loading AI model (${pct}%)...` : 'Loading AI model...');
                    const calc = 24 + Math.round((current / total) * 44);
                    setProgress((prev) => Math.max(prev, Math.min(68, calc)));
                  } else {
                    setStatusMessage('Loading AI model files...');
                    setProgress((prev) => Math.max(prev, 35));
                  }
                } else if (key === 'compute:decode') {
                  setStatusMessage('Decoding image structure...');
                  setProgress((prev) => Math.max(prev, 72));
                } else if (key === 'compute:inference') {
                  setStatusMessage('Removing background with AI...');
                  setProgress((prev) => Math.max(prev, 82));
                } else if (key === 'compute:mask') {
                  setStatusMessage('Refining edge transparency...');
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
      setProgress(100);
      setStatusMessage('Background removed successfully!');
    } catch (err) {
      console.error("BG Removal Error:", err);
      stopTicker();
      setError("Failed to process image. Make sure you are using a modern browser.");
    } finally {
      stopTicker();
      setIsProcessing(false);
    }
  };

  const downloadImage = () => {
    if (!processedImage) return;
    triggerImageDownload(processedImage, 'SumanAI_BgRemover', 'png');
  };

  const reset = () => {
    stopTicker();
    setOriginalImage(null);
    setProcessedImage(null);
    setProgress(0);
    setStatusMessage('Removing Background...');
    setError(null);
  };

  return (
    <div className="bg-remover-page-wrapper">
      <div className="bg-remover-container">
        <header className="tool-app-header" style={{ margin: 0, paddingBottom: 16 }}>
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
            <span className="tool-nav-current">BG Remover</span>
          </nav>

          <div className="tool-header-content">
            <div className="tool-title-row">
              <h1 className="tool-app-heading">AI Background Remover</h1>
              <span className="tool-tag-pill">Precision Edge Matting</span>
            </div>
            <p className="tool-app-subheading">
              Remove backgrounds from portrait and product photography with precision neural matting.
            </p>
          </div>
        </header>

        {!originalImage ? (
          <div className="upload-section">
            <div
              className="upload-box glass"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="upload-content">
                <div className="upload-icon-circle">
                  <Upload size={32} />
                </div>
                <h2>Drag & drop your image here</h2>
                <p>or click to browse from device</p>
                <span className="upload-hint">Supports JPG, PNG, WebP (Max 5MB)</span>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                style={{ display: 'none' }}
              />
            </div>

            <div className="url-input-section">
              <div className="divider">
                <span>OR</span>
              </div>
              <form className="url-form" onSubmit={handleUrlSubmit}>
                <div className="url-input-wrapper glass">
                  <ImageIcon size={18} className="url-icon" />
                  <input
                    type="text"
                    placeholder="Paste image URL here..."
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                  />
                  <button type="submit" disabled={!imageUrl.trim()} className="load-btn">
                    Load
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          <div className="workbench">
            <div className="comparison-grid">
              <div className="image-panel glass">
                <div className="panel-label">Original</div>
                <div className="image-wrapper">
                  <img src={originalImage} alt="Original" />
                </div>
              </div>

              <div className="image-panel glass result-panel">
                <div className="panel-label">Background Removed</div>
                <div className="image-wrapper transparency-grid">
                  {processedImage ? (
                    <img src={processedImage} alt="Processed" className="fade-in" />
                  ) : isProcessing ? (
                    <div className="processing-overlay">
                      <div className="spinner-aura">
                        <Loader2 className="spinner" size={48} />
                      </div>
                      <div className="progress-info">
                        <span className="status-text">{statusMessage}</span>
                        <div className="progress-bar-bg">
                          <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
                        </div>
                        <span className="progress-pct">{Math.round(progress)}%</span>
                      </div>
                    </div>
                  ) : (
                    <div className="empty-result">
                      <Sparkles size={48} className="sparkle-hint" />
                      <p>Click "Remove Background" to start magic</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="action-bar glass">
              <button className="secondary-btn" onClick={reset} disabled={isProcessing}>
                <Trash2 size={18} /> New Image
              </button>

              {!processedImage ? (
                <button
                  className="primary-btn"
                  onClick={processImage}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <><Loader2 size={18} className="spinner" /> Processing...</>
                  ) : (
                    <><Sparkles size={18} /> Remove Background</>
                  )}
                </button>
              ) : (
                <button className="success-btn" onClick={downloadImage}>
                  <Download size={18} /> Download PNG
                </button>
              )}
            </div>
          </div>
        )}

        {error && typeof document !== 'undefined' && createPortal(
          <div className="error-toast glass" role="alert">
            <p>{error}</p>
          </div>,
          document.body
        )}

        <div className="features-info">
          <div className="feature-item">
            <CheckCircle2 size={16} /> <span>100% Free & Unlimited</span>
          </div>
          <div className="feature-item">
            <CheckCircle2 size={16} /> <span>Private processing</span>
          </div>
          <div className="feature-item">
            <CheckCircle2 size={16} /> <span>High Resolution output</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BGRemover;

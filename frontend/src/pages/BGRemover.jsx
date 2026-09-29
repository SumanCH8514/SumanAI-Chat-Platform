import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Upload, Image as ImageIcon, Download, Trash2, ArrowRight, Loader2, Eraser, Sparkles, CheckCircle2 } from 'lucide-react';
import { removeBackground } from '@imgly/background-removal';
import { isValidImageUrl } from '../utils/imageUtils';
import { downloadImage as triggerImageDownload } from '../utils/downloadUtils';
import './BGRemover.css';

const BGRemover = () => {
  const [originalImage, setOriginalImage] = useState(null);
  const [processedImage, setProcessedImage] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

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
      setProgress(10);
      setError(null);

      let fetchUrl = originalImage;
      if (originalImage.startsWith('http://') || originalImage.startsWith('https://')) {
        fetchUrl = `https://corsproxy.io/?${encodeURIComponent(originalImage)}`;
      }

      const response = await fetch(fetchUrl);
      if (!response.ok) throw new Error("Failed to download image. The URL might be restricted.");
      const blob = await response.blob();
      
      setProgress(30);

      const resultBlob = await removeBackground(blob, {
        progress: (total, current) => {
          if (total > 0 && isFinite(current)) {
            const p = Math.round((current / total) * 100);
            setProgress(30 + (p * 0.6));
          }
        }
      });

      const resultUrl = URL.createObjectURL(resultBlob);
      setProcessedImage(resultUrl);
      setProgress(100);
    } catch (err) {
      console.error("BG Removal Error:", err);
      setError("Failed to process image. Make sure you are using a modern browser.");
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadImage = () => {
    if (!processedImage) return;
    triggerImageDownload(processedImage, 'SumanAI_BgRemover', 'png');
  };

  const reset = () => {
    setOriginalImage(null);
    setProcessedImage(null);
    setProgress(0);
    setError(null);
  };

  return (
    <div className="bg-remover-container">
      <div className="bg-remover-header">
        <div className="header-icon-wrapper">
          <Eraser size={24} />
        </div>
        <div>
          <h1>AI Background Remover</h1>
          <p>Remove backgrounds from images instantly with high precision.</p>
        </div>
      </div>

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
                    <Loader2 className="spinner" size={48} />
                    <div className="progress-info">
                      <span>Removing Background...</span>
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
  );
};

export default BGRemover;

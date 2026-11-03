import React, { useState } from 'react';
import { Download, Share2, Copy, Check, Loader2, Film, Sparkles } from 'lucide-react';
import './GeneratedVideoCard.css';

export const VideoPlaceholderCard = ({ statusText = 'Generating Video...' }) => {
  return (
    <div className="generated-video-card" role="status" aria-live="polite">
      <div className="video-placeholder-container">
        <Loader2 className="video-status-spinner" size={32} />
        <p className="video-status-text">{statusText}</p>
        <p className="video-status-subtext">Rendering frames with LTX-Video. Please Wait...</p>
      </div>
      <div className="video-card-actions">
        <div className="video-actions-left">
          <button type="button" className="video-action-btn disabled" disabled>
            <Download size={14} />
            <span>Download</span>
          </button>
        </div>
        <div className="video-actions-right">
          <span className="video-model-badge">
            <Film size={12} />
            <span>LTX Video 0.9.8</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export const GeneratedVideoCard = ({ src, title, promptText }) => {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const cleanPrompt = promptText || title || 'AI Generated Video';

  const handleDownload = async () => {
    if (!src || downloading) return;
    setDownloading(true);
    try {
      const res = await fetch(src);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `SumanAI_video_${Date.now()}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } catch {
      window.open(src, '_blank');
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: cleanPrompt,
          text: `Check out this AI video generated with SumanAI: "${cleanPrompt}"`,
          url: src
        });
      } catch {
        void 0;
      }
    } else {
      try {
        await navigator.clipboard.writeText(src);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } catch {
        void 0;
      }
    }
  };

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(cleanPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      void 0;
    }
  };

  return (
    <div className="generated-video-card">
      <div className="generated-video-container">
        <video
          className="generated-video-element"
          src={src}
          controls
          playsInline
          preload="metadata"
        />
      </div>
      <div className="video-card-actions">
        <div className="video-actions-left">
          <button
            type="button"
            className="video-action-btn primary"
            onClick={handleDownload}
            disabled={downloading}
            title="Download MP4 video"
          >
            <Download size={14} />
            <span>{downloading ? 'Downloading...' : 'Download'}</span>
          </button>
          <button
            type="button"
            className="video-action-btn"
            onClick={handleShare}
            title="Share video link"
          >
            <Share2 size={14} />
            <span>Share</span>
          </button>
          <button
            type="button"
            className="video-action-btn"
            onClick={handleCopyPrompt}
            title="Copy prompt"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span>{copied ? 'Copied' : 'Prompt'}</span>
          </button>
        </div>
        <div className="video-actions-right">
          <span className="video-model-badge">
            <Film size={12} />
            <span>LTX Video 0.9.8</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default GeneratedVideoCard;


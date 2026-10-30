import React, { useState, useEffect } from 'react';
import { Download, Share2, Palette, Copy, Check, Volume2, VolumeX, RotateCw, X, ZoomIn } from 'lucide-react';
import { downloadImage } from '../utils/downloadUtils';
import { useChatStore } from '../store/useChatStore';
import { DEFAULT_IMAGE_GEN_MODEL } from '../constants/models';
import './GeneratedImageCard.css';

const STYLE_PRESETS = [
  'Oil Painting',
  'Watercolor',
  'Pixel Art',
  'Pencil Sketch',
  'Anime',
  'Pop Art'
];

const GeneratedImageCard = ({ src, alt, promptText }) => {
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);

  const cleanPrompt = promptText || alt || 'Generated AI Image';

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleDownload = () => {
    downloadImage(src, 'SumanAI', 'jpg');
  };

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: cleanPrompt,
          text: `Generated with SumanAI: "${cleanPrompt}"`,
          url: src
        });
        return;
      } catch {
        void 0;
      }
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(src);
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      } catch {
        void 0;
      }
    }
  };

  const handleCopy = async () => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return;
    try {
      if (src.startsWith('data:image/')) {
        const res = await fetch(src);
        const blob = await res.blob();
        await navigator.clipboard.write([
          new ClipboardItem({ [blob.type]: blob })
        ]);
      } else {
        await navigator.clipboard.writeText(src);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      try {
        await navigator.clipboard.writeText(src);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        void 0;
      }
    }
  };

  const handleToggleSpeak = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(cleanPrompt);
    utterance.rate = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleStyleSelect = (style) => {
    const chatStore = useChatStore.getState();
    chatStore.setHasImageGenActive(true);
    const stylePrompt = `Convert this image into a ${style.toLowerCase()} style`;
    chatStore.startChatWithPrompt(stylePrompt, {
      modelId: DEFAULT_IMAGE_GEN_MODEL?.id
    });
  };

  const handleRegenerate = () => {
    const chatStore = useChatStore.getState();
    chatStore.setHasImageGenActive(true);
    chatStore.startChatWithPrompt(cleanPrompt, {
      modelId: DEFAULT_IMAGE_GEN_MODEL?.id
    });
  };

  return (
    <>
      <div className="generated-image-card" role="region" aria-label="Generated AI Image Card">
        <div className="generated-image-container" onClick={() => setIsZoomed(true)}>
          <img
            src={src}
            alt={cleanPrompt}
            className="generated-image-display"
            loading="lazy"
          />
          <div className="image-zoom-overlay">
            <ZoomIn size={16} />
            <span>Click to expand</span>
          </div>
        </div>

        <div className="image-card-primary-actions">
          <button
            type="button"
            className="img-card-action-btn primary"
            onClick={handleDownload}
            title="Download full resolution image"
          >
            <Download size={14} />
            <span>Download</span>
          </button>
          <button
            type="button"
            className="img-card-action-btn"
            onClick={handleShare}
            title="Share image or copy URL"
          >
            <Share2 size={14} />
            <span>{shared ? 'Link Copied!' : 'Share'}</span>
          </button>
        </div>

        <div className="image-card-styles-row">
          <div className="styles-label-icon" title="Suggested artistic styles">
            <Palette size={13} />
          </div>
          <div className="styles-pills-list">
            {STYLE_PRESETS.map((style) => (
              <button
                key={style}
                type="button"
                className="style-pill-btn"
                onClick={() => handleStyleSelect(style)}
                title={`Convert into ${style} style`}
              >
                {style}
              </button>
            ))}
          </div>
        </div>

        <div className="image-card-utility-toolbar">
          <button
            type="button"
            className={`utility-tool-btn ${copied ? 'active' : ''}`}
            onClick={handleCopy}
            title={copied ? 'Copied to clipboard' : 'Copy image link'}
            aria-label="Copy image link"
          >
            {copied ? <Check size={15} /> : <Copy size={15} />}
          </button>

          <button
            type="button"
            className={`utility-tool-btn ${isSpeaking ? 'active' : ''}`}
            onClick={handleToggleSpeak}
            title={isSpeaking ? 'Stop reading' : 'Read prompt aloud'}
            aria-label="Read prompt aloud"
          >
            {isSpeaking ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>

          <button
            type="button"
            className={`utility-tool-btn ${shared ? 'active' : ''}`}
            onClick={handleShare}
            title="Share image"
            aria-label="Share image"
          >
            <Share2 size={15} />
          </button>

          <button
            type="button"
            className="utility-tool-btn"
            onClick={handleRegenerate}
            title="Regenerate this image"
            aria-label="Regenerate this image"
          >
            <RotateCw size={15} />
          </button>
        </div>
      </div>

      {isZoomed && (
        <div className="image-lightbox-backdrop" onClick={() => setIsZoomed(false)}>
          <div className="image-lightbox-wrapper" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="lightbox-close-btn"
              onClick={() => setIsZoomed(false)}
              aria-label="Close preview"
            >
              <X size={20} />
            </button>
            <img src={src} alt={cleanPrompt} className="lightbox-image-preview" />
            <div className="lightbox-footer">
              <span className="lightbox-caption">{cleanPrompt}</span>
              <button type="button" className="lightbox-download-btn" onClick={handleDownload}>
                <Download size={14} />
                <span>Download</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GeneratedImageCard;


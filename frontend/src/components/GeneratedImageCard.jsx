import React, { useState, useEffect } from 'react';
import { Download, Share2, Palette, Volume2, VolumeX, RotateCw, X, ZoomIn, AlertCircle } from 'lucide-react';
import { downloadImage } from '../utils/downloadUtils';
import { useChatStore } from '../store/useChatStore';
import { DEFAULT_IMAGE_GEN_MODEL } from '../constants/models';
import { ttsService } from '../services/ttsService';
import ImageQuotaBadge from './ImageQuotaBadge';
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
  const [shared, setShared] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [quotaState, setQuotaState] = useState(null);
  const [quotaToast, setQuotaToast] = useState(null);

  const cleanPrompt = promptText || alt || 'Generated AI Image';

  useEffect(() => {
    return () => {
      if (isSpeaking) {
        ttsService.stop();
      }
    };
  }, [isSpeaking]);

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

  const handleToggleSpeak = () => {
    if (isSpeaking) {
      ttsService.stop();
      setIsSpeaking(false);
      return;
    }

    ttsService.speak(cleanPrompt, {
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false)
    });
  };

  const handleStyleSelect = (style) => {
    if (quotaState?.isBlocked) {
      const waitNotice = quotaState.resetsInText ? `Next slot unlocks in ${quotaState.resetsInText}.` : 'Please wait 24 hours for limit reset.';
      setQuotaToast(`Daily limit reached (${quotaState.limit}/${quotaState.limit}). ${waitNotice}`);
      setTimeout(() => setQuotaToast(null), 4500);
      return;
    }

    const chatStore = useChatStore.getState();
    chatStore.setHasImageGenActive(true);
    const stylePrompt = `Convert this image into ${style} style`;
    chatStore.startChatWithPrompt(stylePrompt, {
      modelId: DEFAULT_IMAGE_GEN_MODEL?.id,
      isImageGen: true,
      style: style.toLowerCase(),
      originalPrompt: cleanPrompt
    });
  };

  const handleRegenerate = () => {
    if (quotaState?.isBlocked) {
      const waitNotice = quotaState.resetsInText ? `Next slot unlocks in ${quotaState.resetsInText}.` : 'Please wait 24 hours for limit reset.';
      setQuotaToast(`Daily limit reached (${quotaState.limit}/${quotaState.limit}). ${waitNotice}`);
      setTimeout(() => setQuotaToast(null), 4500);
      return;
    }

    const chatStore = useChatStore.getState();
    chatStore.setHasImageGenActive(true);
    chatStore.startChatWithPrompt(cleanPrompt, {
      modelId: DEFAULT_IMAGE_GEN_MODEL?.id,
      isImageGen: true
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
          <div className="img-card-actions-left">
            <button
              type="button"
              className="img-card-action-btn primary"
              onClick={handleDownload}
              title="Download full resolution image"
            >
              <Download size={14} />
              <span>Download</span>
            </button>
          </div>

          <div className="img-card-actions-right">
            <ImageQuotaBadge onQuotaChange={setQuotaState} />
          </div>
        </div>

        {quotaToast && (
          <div className="image-card-quota-toast" role="alert">
            <AlertCircle size={14} />
            <span>{quotaToast}</span>
          </div>
        )}

        <div className="image-card-styles-row">
          <div className="styles-label-icon" title="Suggested artistic styles">
            <Palette size={13} />
          </div>
          <div className="styles-pills-list">
            {STYLE_PRESETS.map((style) => (
              <button
                key={style}
                type="button"
                className={`style-pill-btn ${quotaState?.isBlocked ? 'disabled' : ''}`}
                onClick={() => handleStyleSelect(style)}
                disabled={Boolean(quotaState?.isBlocked)}
                title={quotaState?.isBlocked ? `Daily limit reached. Wait ${quotaState.resetsInText || '24h'} for reset.` : `Convert into ${style} style`}
              >
                {style}
              </button>
            ))}
          </div>
        </div>

        <div className="image-card-utility-toolbar">
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
            title={shared ? 'Link copied to clipboard' : 'Share image'}
            aria-label="Share image"
          >
            <Share2 size={15} />
          </button>

          <button
            type="button"
            className={`utility-tool-btn ${quotaState?.isBlocked ? 'disabled' : ''}`}
            onClick={handleRegenerate}
            disabled={Boolean(quotaState?.isBlocked)}
            title={quotaState?.isBlocked ? `Daily limit reached. Wait ${quotaState.resetsInText || '24h'} for reset.` : 'Regenerate this image'}
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
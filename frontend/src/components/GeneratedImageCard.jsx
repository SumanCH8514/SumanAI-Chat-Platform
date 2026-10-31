import React, { useState, useEffect } from 'react';
import { Download, Share2, Palette, Volume2, VolumeX, RotateCw, X, ZoomIn, AlertCircle, Loader2, Zap } from 'lucide-react';
import { downloadImage } from '../utils/downloadUtils';
import { applySumanAIWatermark } from '../utils/watermarkUtils';
import { env } from '../config/env';
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

export const ImagePlaceholderCard = ({ status = 'generating' }) => {
  const isRendering = status === 'rendering';

  return (
    <div className="generated-image-card image-placeholder-mode" role="status" aria-live="polite">
      <div className="generated-image-container placeholder-container">
        <div className="image-generation-status-box">
          <div className="generation-spinner-wrapper">
            <Loader2 className="generation-spin-icon" size={30} />
          </div>
          <p className="generation-status-text">
            {isRendering ? 'Rendering image...' : 'Generating image...'}
          </p>
          <span className="generation-status-subtext">
            {isRendering ? 'Applying SumanAI watermark' : 'Synthesizing with Flux AI'}
          </span>
        </div>
      </div>

      <div className="image-card-primary-actions">
        <div className="img-card-actions-left">
          <button type="button" className="img-card-action-btn primary disabled" disabled>
            <Download size={14} />
            <span>Download</span>
          </button>
        </div>
        <div className="img-card-actions-right">
          <div className="image-quota-badge pro-unlimited-pill">
            <Zap size={13} />
            <span>Pro Unlimited</span>
          </div>
        </div>
      </div>

      <div className="image-card-styles-row">
        <div className="styles-label-icon" title="Suggested artistic styles">
          <Palette size={13} />
        </div>
        <div className="styles-pills-list">
          {STYLE_PRESETS.map((style) => (
            <span key={style} className="style-pill-btn disabled">
              {style}
            </span>
          ))}
        </div>
      </div>

      <div className="image-card-utility-toolbar">
        <button type="button" className="utility-tool-btn disabled" disabled>
          <Volume2 size={15} />
        </button>
        <button type="button" className="utility-tool-btn disabled" disabled>
          <Share2 size={15} />
        </button>
        <button type="button" className="utility-tool-btn disabled" disabled>
          <RotateCw size={15} />
        </button>
      </div>
    </div>
  );
};

const GeneratedImageCard = ({ src, alt, promptText }) => {
  const [shared, setShared] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [quotaState, setQuotaState] = useState(null);
  const [quotaToast, setQuotaToast] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const isPermanentR2Url = typeof src === 'string' && (
    src.includes('cdn.sumanai.r2.sumanonline.com') ||
    src.includes('/generated-images/') ||
    src.includes('sumanai_watermarked=1')
  );

  const [watermarkedSrc, setWatermarkedSrc] = useState(null);
  const [isRendering, setIsRendering] = useState(() => {
    if (!src || typeof src !== 'string' || !src.trim()) return false;
    if (isPermanentR2Url) return false;
    return true;
  });

  const cleanPrompt = promptText || alt || 'Generated AI Image';
  const activeSrc = watermarkedSrc || src;

  useEffect(() => {
    let isMounted = true;
    if (!src || typeof src !== 'string' || !src.trim() || isPermanentR2Url) {
      return;
    }

    applySumanAIWatermark(src)
      .then(async (res) => {
        if (!isMounted) return;

        if (res && res.startsWith('data:image/')) {
          setWatermarkedSrc(res);

          try {
            const baseUrl = (env?.WORKER_URL || '').replace(/\/+$/, '');
            let r2Key = '';
            if (src.includes('cdn.sumanai.r2.sumanonline.com/generated-images/')) {
              r2Key = src.split('cdn.sumanai.r2.sumanonline.com/')[1]?.split('?')[0];
            }

            const uploadRes = await fetch(`${baseUrl}/api/upload-watermarked-image`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ key: r2Key, imageBase64: res })
            });

            if (uploadRes.ok) {
              const uploadData = await uploadRes.json();
              const permanentUrl = uploadData?.url || (uploadData?.key ? `https://cdn.sumanai.r2.sumanonline.com/${uploadData.key}` : null);
              if (permanentUrl && isMounted) {
                const chatStore = useChatStore.getState();
                if (typeof chatStore.replaceImageUrl === 'function') {
                  chatStore.replaceImageUrl(src, permanentUrl);
                }

                try {
                  const raw = localStorage.getItem('sumanai_uploaded_files');
                  const list = raw ? JSON.parse(raw) : [];
                  const cleanTitle = cleanPrompt
                    .replace(/[^a-zA-Z0-9_\-\s]/g, '')
                    .trim()
                    .replace(/\s+/g, '_')
                    .slice(0, 32) || 'SumanAI_Artwork';
                  const newFile = {
                    id: `gen-img-${Date.now()}`,
                    name: `${cleanTitle}.jpg`,
                    type: 'image',
                    subtype: 'generated',
                    url: permanentUrl,
                    size: '480 KB',
                    chatTitle: cleanPrompt,
                    createdAt: Date.now()
                  };
                  localStorage.setItem(
                    'sumanai_uploaded_files',
                    JSON.stringify([newFile, ...list.filter((item) => item.url !== permanentUrl && item.url !== src)])
                  );
                } catch {
                  void 0;
                }
              }
            }
          } catch {
            void 0;
          }
        }

        if (isMounted) {
          setIsRendering(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setIsRendering(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [src, cleanPrompt, isPermanentR2Url]);

  useEffect(() => {
    return () => {
      if (isSpeaking) {
        ttsService.stop();
      }
    };
  }, [isSpeaking]);

  const handleDownload = () => {
    downloadImage(activeSrc, 'SumanAI', 'jpg');
  };

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: cleanPrompt,
          text: `Generated with SumanAI: "${cleanPrompt}"`,
          url: activeSrc
        });
        return;
      } catch {
        void 0;
      }
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(activeSrc);
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

  if (isRendering) {
    return <ImagePlaceholderCard status="rendering" />;
  }

  return (
    <>
      <div className="generated-image-card" role="region" aria-label="Generated AI Image Card">
        <div className="generated-image-container">
          {(loadError || !src || typeof src !== 'string' || !src.trim()) ? (
            <div className="image-load-error-state">
              <AlertCircle size={24} className="image-error-icon" />
              <p className="image-error-title">Unable to preview image</p>
              <p className="image-error-subtitle">The image link may be invalid or expired</p>
              <button
                type="button"
                className="image-error-retry-btn"
                onClick={handleRegenerate}
              >
                <RotateCw size={13} />
                <span>Regenerate with Flux</span>
              </button>
            </div>
          ) : (
            <div className="image-zoom-trigger" onClick={() => setIsZoomed(true)}>
              <img
                src={activeSrc}
                alt={cleanPrompt}
                className="generated-image-display"
                loading="lazy"
                onError={() => setLoadError(true)}
              />
              <div className="image-zoom-overlay">
                <ZoomIn size={16} />
                <span>Click to expand</span>
              </div>
            </div>
          )}
        </div>

        <div className="image-card-primary-actions">
          <div className="img-card-actions-left">
            {!loadError && (
              <button
                type="button"
                className="img-card-action-btn primary"
                onClick={handleDownload}
                title="Download full resolution image"
              >
                <Download size={14} />
                <span>Download</span>
              </button>
            )}
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
            <img src={activeSrc} alt={cleanPrompt} className="lightbox-image-preview" />
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

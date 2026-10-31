import { env } from '../config/env.js';

export const WATERMARK_TEXT = 'SumanAI';
export const WATERMARK_PRIMARY_TEXT = 'SumanAI';

export const calculateWatermarkLayout = (width, height) => {
  if (!width || !height || width <= 0 || height <= 0) {
    return null;
  }

  const dimension = Math.min(width, height);
  const scale = Math.max(0.6, Math.min(3.0, dimension / 800));

  const fontSize = Math.max(14, Math.round(18 * scale));
  const rightMargin = Math.max(14, Math.round(20 * scale));
  const bottomMargin = Math.max(12, Math.round(18 * scale));

  const anchorX = width - rightMargin;
  const anchorY = height - bottomMargin;

  const shadowBlur = Math.max(2, Math.round(4 * scale));
  const shadowOffset = Math.max(1, Math.round(1.5 * scale));

  return {
    text: WATERMARK_TEXT,
    primaryText: WATERMARK_TEXT,
    fontSize,
    primaryFontSize: fontSize,
    rightMargin,
    bottomMargin,
    anchorX,
    anchorY,
    shadowBlur,
    shadowOffset,
    scale,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
  };
};

export const renderWatermarkOnCanvas = (canvas, ctx, width, height) => {
  const layout = calculateWatermarkLayout(width, height);
  if (!layout) return false;

  ctx.save();

  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';

  ctx.shadowColor = 'rgba(0, 0, 0, 0.72)';
  ctx.shadowBlur = layout.shadowBlur;
  ctx.shadowOffsetX = layout.shadowOffset;
  ctx.shadowOffsetY = layout.shadowOffset;

  ctx.font = `600 ${layout.fontSize}px ${layout.fontFamily}`;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.78)';
  ctx.fillText(layout.text, layout.anchorX, layout.anchorY);

  ctx.restore();
  return true;
};

export const applySumanAIWatermark = (imageSource, options = {}) => {
  return new Promise((resolve) => {
    if (!imageSource || typeof imageSource !== 'string') {
      return resolve(imageSource);
    }

    if (
      imageSource.includes('sumanai_watermarked=1') ||
      imageSource.includes('cdn.sumanai.r2.sumanonline.com') ||
      imageSource.includes('/generated-images/')
    ) {
      return resolve(imageSource);
    }

    if (typeof document === 'undefined') {
      return resolve(imageSource);
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    const processLoadedImage = () => {
      try {
        const width = img.naturalWidth || img.width;
        const height = img.naturalHeight || img.height;

        if (!width || !height) {
          return resolve(imageSource);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(imageSource);
        }

        ctx.drawImage(img, 0, 0, width, height);
        renderWatermarkOnCanvas(canvas, ctx, width, height);

        const quality = options.quality || 0.94;
        const watermarkedDataUrl = canvas.toDataURL('image/jpeg', quality);

        resolve(watermarkedDataUrl);
      } catch {
        resolve(imageSource);
      }
    };

    img.onload = processLoadedImage;

    img.onerror = async () => {
      if (imageSource.startsWith('http')) {
        try {
          const baseUrl = (env?.WORKER_URL || '').replace(/\/+$/, '');
          const proxyUrl = `${baseUrl}/api/proxy-image?url=${encodeURIComponent(imageSource)}`;
          const response = await fetch(proxyUrl);
          if (response.ok) {
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            const fallbackImg = new Image();
            fallbackImg.onload = () => {
              try {
                const width = fallbackImg.naturalWidth || fallbackImg.width;
                const height = fallbackImg.naturalHeight || fallbackImg.height;
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                  ctx.drawImage(fallbackImg, 0, 0, width, height);
                  renderWatermarkOnCanvas(canvas, ctx, width, height);
                  const dataUrl = canvas.toDataURL('image/jpeg', 0.94);
                  URL.revokeObjectURL(blobUrl);
                  return resolve(dataUrl);
                }
              } catch {
                void 0;
              }
              URL.revokeObjectURL(blobUrl);
              resolve(imageSource);
            };
            fallbackImg.onerror = () => {
              URL.revokeObjectURL(blobUrl);
              resolve(imageSource);
            };
            fallbackImg.src = blobUrl;
            return;
          }
        } catch {
          void 0;
        }
      }
      resolve(imageSource);
    };

    img.src = imageSource;
  });
};

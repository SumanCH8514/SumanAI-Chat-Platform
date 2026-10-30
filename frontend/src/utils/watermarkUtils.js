export const applyWatermarkToImage = (imageSource) => {
  return new Promise((resolve) => {
    if (!imageSource || typeof imageSource !== 'string') {
      return resolve(imageSource);
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
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

        const scale = Math.max(0.65, Math.min(2.4, width / 1024));

        const logoImg = new Image();
        logoImg.crossOrigin = 'anonymous';

        const drawWatermark = (hasLogo) => {
          const text = 'SumanAI';
          const fontSize = Math.round(13 * scale);
          ctx.font = `600 ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
          const textMetrics = ctx.measureText(text);
          const textWidth = textMetrics.width;

          const iconSize = Math.round(15 * scale);
          const iconPadding = Math.round(7 * scale);
          const pillPaddingX = Math.round(9 * scale);
          const pillPaddingY = Math.round(6 * scale);

          const pillWidth = hasLogo 
            ? pillPaddingX + iconSize + iconPadding + textWidth + pillPaddingX
            : pillPaddingX + textWidth + pillPaddingX;
          const pillHeight = Math.max(iconSize, fontSize) + pillPaddingY * 2;

          const marginRight = Math.round(16 * scale);
          const marginBottom = Math.round(16 * scale);
          const pillX = width - pillWidth - marginRight;
          const pillY = height - pillHeight - marginBottom;
          const radius = Math.round(6 * scale);

          ctx.save();

          ctx.fillStyle = 'rgba(10, 15, 29, 0.78)';
          ctx.beginPath();
          if (typeof ctx.roundRect === 'function') {
            ctx.roundRect(pillX, pillY, pillWidth, pillHeight, radius);
          } else {
            ctx.rect(pillX, pillY, pillWidth, pillHeight);
          }
          ctx.fill();

          ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
          ctx.lineWidth = Math.max(1, Math.round(1 * scale));
          ctx.stroke();

          let contentStartX = pillX + pillPaddingX;

          if (hasLogo) {
            const iconY = pillY + (pillHeight - iconSize) / 2;
            try {
              ctx.drawImage(logoImg, contentStartX, iconY, iconSize, iconSize);
            } catch {
              void 0;
            }
            contentStartX += iconSize + iconPadding;
          }

          ctx.fillStyle = '#ffffff';
          ctx.textBaseline = 'middle';
          const textY = pillY + pillHeight / 2;
          ctx.fillText(text, contentStartX, textY);

          ctx.restore();

          try {
            const outputType = imageSource.startsWith('data:image/png') ? 'image/png' : 'image/jpeg';
            const dataUrl = canvas.toDataURL(outputType, 0.94);
            resolve(dataUrl);
          } catch {
            resolve(imageSource);
          }
        };

        logoImg.onload = () => drawWatermark(true);
        logoImg.onerror = () => drawWatermark(false);
        logoImg.src = '/sumanAI-logo1.png';
      } catch {
        resolve(imageSource);
      }
    };

    img.onerror = () => resolve(imageSource);
    img.src = imageSource;
  });
};


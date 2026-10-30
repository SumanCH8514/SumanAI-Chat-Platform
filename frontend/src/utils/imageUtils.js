export const compressImage = (dataUrl, maxWidth = 1024, maxHeight = 1024, quality = 0.8) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = dataUrl;
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return resolve(dataUrl);
      }

      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };

    img.onerror = (err) => {
      console.error('Image compression failed:', err);
      resolve(dataUrl);
    };
  });
};

export const isValidImageUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  return Boolean(
    url.match(/\.(jpeg|jpg|gif|png|webp|svg)/i) || 
    url.startsWith('data:image')
  );
};

export const isImageGenerationIntent = (text) => {
  if (!text || typeof text !== 'string') return false;
  const clean = text.trim().replace(/\s+/g, ' ');
  if (clean.length < 3) return false;

  const codeOrExplanationRegex = /^(?:how\s+(?:to|do|can)|why\s+(?:does|is|are)|what\s+(?:is|are)|explain|describe\s+how|write\s+(?:a\s+)?(?:code|script|program|function|shader|algorithm|test)|implement\s+(?:a|an)?|in\s+(?:python|javascript|typescript|c\+\+|java|rust|html|css|php))\b/i;
  if (codeOrExplanationRegex.test(clean)) return false;

  const programmingContextRegex = /\b(?:python|javascript|typescript|code\s+snippet|npm\s+install|pip\s+install|github|stack\s*overflow|api\s+endpoint|ffmpeg|opencv|canvas\s+api|three\.js|webgl)\b/i;
  if (programmingContextRegex.test(clean)) return false;

  const nonVisualFigureOfSpeech = /\b(?:draw\s+(?:a\s+)?(?:comparison|conclusion|parallel|distinction)|paint\s+(?:a\s+)?picture\s+of\s+how|make\s+(?:a\s+)?(?:point|list|table|plan|schedule|summary|call|decision))\b/i;
  if (nonVisualFigureOfSpeech.test(clean)) return false;

  const explicitGenVerbRegex = /^(?:please\s+)?(?:can\s+you\s+)?(?:could\s+you\s+)?(?:please\s+)?(?:i\s+(?:want|need|would\s+like)\s+)?(?:give\s+me\s+)?(?:generate|create|draw|make|render|produce|paint|design|illustrate|synthesize)\s+(?:a|an|the|me\s+a|me\s+an|some)?\s*(?:[a-zA-Z0-9_,-]+\s+){0,8}?(?:image|picture|photo|photograph|portrait|illustration|artwork|drawing|painting|render|visual|graphic|wallpaper|avatar|sketch|poster|banner|concept\s+art|digital\s+art)\b/i;
  if (explicitGenVerbRegex.test(clean)) return true;

  const directNounPrefixRegex = /^(?:a|an|the)?\s*(?:[a-zA-Z0-9_-]+\s+){0,4}?(?:image|picture|photo|photograph|portrait|wallpaper|artwork|illustration|drawing|painting|render|concept\s+art)\s+(?:of|showing|depicting|with|featuring|in)\b/i;
  if (directNounPrefixRegex.test(clean)) return true;

  const wantImageRegex = /\b(?:i\s+want|i\s+need|give\s+me|show\s+me)\s+(?:a|an)?\s*(?:[a-zA-Z0-9_,-]+\s+){0,4}?(?:image|picture|photo|portrait|illustration|drawing|painting|artwork|render|wallpaper)\s+(?:of|with|for)\b/i;
  if (wantImageRegex.test(clean)) return true;

  const shortCommandRegex = /^(?:draw|paint|illustrate|sketch)\s+(?:a|an|the|me)?\s+/i;
  if (shortCommandRegex.test(clean) && !/\b(?:code|diagram|flowchart|chart|graph|wireframe|architecture|conclusion|summary|table)\b/i.test(clean)) return true;

  const styleConversionRegex = /\b(?:convert|remix|transform|change|turn)\s+this\s+image\s+(?:in|into|to)\b/i;
  if (styleConversionRegex.test(clean)) return true;

  return false;
};

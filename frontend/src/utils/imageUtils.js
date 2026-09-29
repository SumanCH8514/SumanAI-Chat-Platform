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

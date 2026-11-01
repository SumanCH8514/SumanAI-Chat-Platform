import { applySumanAIWatermark } from './watermarkUtils.js';
import { env } from '../config/env.js';

export const base64ToBlob = (dataUrl) => {
  const parts = dataUrl.split(';base64,');
  const contentType = parts[0].split(':')[1] || 'image/jpeg';
  const binary = atob(parts[1]);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: contentType });
};

export const downloadFile = (url, filename) => {
  if (!url) return;
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const downloadImage = async (urlOrDataUrl, prefix = 'SumanAI', extension = 'jpg') => {
  if (!urlOrDataUrl) return;
  const now = new Date();
  const pad = (num) => num.toString().padStart(2, '0');
  const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const filename = `${prefix}_${timestamp}.${extension}`;

  const triggerBlobDownload = (blob) => {
    const objectUrl = URL.createObjectURL(blob);
    downloadFile(objectUrl, filename);
    setTimeout(() => URL.revokeObjectURL(objectUrl), 3000);
  };

  let targetUrl = urlOrDataUrl;
  try {
    targetUrl = await applySumanAIWatermark(urlOrDataUrl, { quality: 1.0 });
  } catch {
    targetUrl = urlOrDataUrl;
  }

  if (typeof targetUrl === 'string' && targetUrl.startsWith('data:')) {
    try {
      const blob = base64ToBlob(targetUrl);
      triggerBlobDownload(blob);
      return;
    } catch {
      void 0;
    }
  }

  if (typeof targetUrl === 'string' && targetUrl.startsWith('http')) {
    try {
      const response = await fetch(targetUrl, { mode: 'cors' });
      if (response.ok) {
        const blob = await response.blob();
        triggerBlobDownload(blob);
        return;
      }
    } catch {
      void 0;
    }

    try {
      const baseUrl = (env?.WORKER_URL || '').replace(/\/+$/, '');
      if (baseUrl) {
        const proxyUrl = `${baseUrl}/api/proxy-image?url=${encodeURIComponent(targetUrl)}`;
        const proxyRes = await fetch(proxyUrl);
        if (proxyRes.ok) {
          const blob = await proxyRes.blob();
          triggerBlobDownload(blob);
          return;
        }
      }
    } catch {
      void 0;
    }

    try {
      const downloadedViaCanvas = await new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth || img.width;
            canvas.height = img.naturalHeight || img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) return resolve(false);
            ctx.drawImage(img, 0, 0);
            canvas.toBlob((blob) => {
              if (blob) {
                triggerBlobDownload(blob);
                resolve(true);
              } else {
                resolve(false);
              }
            }, 'image/jpeg', 1.0);
          } catch {
            resolve(false);
          }
        };
        img.onerror = () => resolve(false);
        img.src = targetUrl;
      });
      if (downloadedViaCanvas) return;
    } catch {
      void 0;
    }
  }

  downloadFile(targetUrl, filename);
};

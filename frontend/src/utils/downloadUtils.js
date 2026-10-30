import { applyWatermarkToImage } from './watermarkUtils';

export const downloadFile = (url, filename) => {
  if (!url) return;
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
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

  let targetUrl = urlOrDataUrl;
  try {
    targetUrl = await applyWatermarkToImage(urlOrDataUrl);
  } catch {
    targetUrl = urlOrDataUrl;
  }

  if (typeof targetUrl === 'string' && targetUrl.startsWith('http')) {
    try {
      const response = await fetch(targetUrl, { mode: 'cors' });
      if (!response.ok) throw new Error('Fetch failed');
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      downloadFile(objectUrl, filename);
      setTimeout(() => URL.revokeObjectURL(objectUrl), 2000);
      return;
    } catch {
      downloadFile(targetUrl, filename);
      return;
    }
  }

  downloadFile(targetUrl, filename);
};

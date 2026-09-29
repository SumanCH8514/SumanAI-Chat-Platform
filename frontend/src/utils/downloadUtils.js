export const downloadFile = (url, filename) => {
  if (!url) return;
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const downloadImage = (urlOrDataUrl, prefix = 'SumanAI', extension = 'png') => {
  const now = new Date();
  const pad = (num) => num.toString().padStart(2, '0');
  const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  
  const filename = `${prefix}_${timestamp}.${extension}`;
  downloadFile(urlOrDataUrl, filename);
};

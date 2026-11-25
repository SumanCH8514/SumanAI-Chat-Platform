export const normalizeFileKey = (file) => {
  if (!file) return '';
  const url = file.url;
  if (typeof url === 'string' && url.length > 0) {
    const cleanUrl = url.split('?')[0].split('#')[0].trim().toLowerCase();
    const r2Match = cleanUrl.match(/(?:generated-images\/|generated-videos\/|uncensored\/|img_|vid_|uncensored_)([a-z0-9_-]+(?:\.[a-z0-9]+)?)/i);
    if (r2Match) {
      return `r2:${r2Match[1]}`;
    }
    if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
      return `url:${cleanUrl}`;
    }
    if (cleanUrl.startsWith('data:image/')) {
      return `${cleanUrl.slice(0, 128)}:${cleanUrl.length}`;
    }
  }
  if (file.content && typeof file.content === 'string') {
    return `code:${file.name || ''}:${file.content.slice(0, 60)}:${file.content.length}`;
  }
  return file.id ? `id:${file.id}` : '';
};

export const isFileDeleted = (file, deletedFileIds = []) => {
  if (!file) return true;
  const deletedSet = deletedFileIds instanceof Set ? deletedFileIds : new Set(deletedFileIds);
  if (file.id && deletedSet.has(file.id)) return true;
  if (file.url && typeof file.url === 'string') {
    if (deletedSet.has(file.url)) return true;
    const clean = file.url.split('?')[0].split('#')[0];
    if (deletedSet.has(clean)) return true;
  }
  return false;
};

export const getFileTimestamp = (f) => {
  if (!f) return 0;
  if (typeof f.createdAt === 'number' && f.createdAt > 0) return f.createdAt;
  if (typeof f.timestamp === 'number' && f.timestamp > 0) return f.timestamp;
  if (f.date) {
    const t = new Date(f.date).getTime();
    if (!isNaN(t) && t > 0) return t;
  }
  if (typeof f.id === 'string') {
    const m = f.id.match(/(\d{10,13})/);
    if (m) return parseInt(m[1], 10);
  }
  if (typeof f.url === 'string') {
    const m = f.url.match(/(?:img_|vid_|uncensored_)?(\d{10,13})/);
    if (m) return parseInt(m[1], 10);
  }
  if (typeof f.name === 'string') {
    const m = f.name.match(/(\d{10,13})/);
    if (m) return parseInt(m[1], 10);
  }
  return 0;
};

export const deduplicateWorkspaceFiles = (chatFiles = [], customFiles = [], deletedFileIds = []) => {
  const deletedSet = deletedFileIds instanceof Set ? deletedFileIds : new Set(deletedFileIds || []);
  const seen = new Set();
  const result = [];
  const candidates = [...(chatFiles || []), ...(customFiles || [])];

  for (const file of candidates) {
    if (isFileDeleted(file, deletedSet)) continue;
    const key = normalizeFileKey(file);
    if (key) {
      if (seen.has(key)) continue;
      seen.add(key);
    }
    const isImg = file.type === 'image' || (typeof file.type === 'string' && file.type.startsWith('image/')) || (typeof file.url === 'string' && (file.url.includes('/generated-images/') || file.url.includes('/uncensored/') || file.url.match(/\.(png|jpe?g|webp|gif|svg)($|\?)/i)));
    const isVid = file.type === 'video' || (typeof file.type === 'string' && file.type.startsWith('video/')) || (typeof file.url === 'string' && (file.url.includes('/generated-videos/') || file.url.match(/\.(mp4|webm)($|\?)/i)));
    const normalizedType = isVid ? 'video' : (isImg ? 'image' : (file.type || 'code'));
    const createdAt = getFileTimestamp(file) || Date.now();

    result.push({
      ...file,
      id: file?.id || (file?.url ? `url-file-${file.url.slice(-16)}` : `file-${Math.random().toString(36).substring(2, 9)}`),
      type: normalizedType,
      createdAt
    });
  }

  return result.sort((a, b) => {
    const timeA = getFileTimestamp(a);
    const timeB = getFileTimestamp(b);
    return timeB - timeA;
  });
};

export const findRedundantCustomFiles = (customFiles = [], chatFiles = []) => {
  if (!Array.isArray(customFiles) || customFiles.length === 0) return [];
  if (!Array.isArray(chatFiles) || chatFiles.length === 0) return [];

  const chatKeys = new Set();
  chatFiles.forEach((cf) => {
    const key = normalizeFileKey(cf);
    if (key) chatKeys.add(key);
    if (cf.url && typeof cf.url === 'string') {
      chatKeys.add(cf.url);
      chatKeys.add(cf.url.split('?')[0].split('#')[0]);
    }
  });

  return customFiles.filter((cf) => {
    const key = normalizeFileKey(cf);
    if (key && chatKeys.has(key)) return true;
    if (cf.url && typeof cf.url === 'string') {
      if (chatKeys.has(cf.url) || chatKeys.has(cf.url.split('?')[0].split('#')[0])) return true;
    }
    return false;
  });
};

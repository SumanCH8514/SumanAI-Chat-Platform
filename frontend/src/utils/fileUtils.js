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
    result.push({
      ...file,
      id: file?.id || (file?.url ? `url-file-${file.url.slice(-16)}` : `file-${Math.random().toString(36).substring(2, 9)}`)
    });
  }

  return result.sort((a, b) => {
    const timeA = typeof a.createdAt === 'number' ? a.createdAt : new Date(a.createdAt || 0).getTime();
    const timeB = typeof b.createdAt === 'number' ? b.createdAt : new Date(b.createdAt || 0).getTime();
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

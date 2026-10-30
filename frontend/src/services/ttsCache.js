class TTSMemoryCache {
  constructor(maxSize = 60) {
    this.maxSize = maxSize;
    this.cache = new Map();
  }

  createKey(text, model, referenceId, format = 'mp3') {
    const normalized = (text || '').trim().toLowerCase().slice(0, 500);
    return `${normalized}|${model || 'default'}|${referenceId || 'default'}|${format}`;
  }

  get(key) {
    if (!this.cache.has(key)) return null;
    const item = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, item);
    return item;
  }

  set(key, buffer) {
    if (!key || !buffer) return;
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
    this.cache.set(key, buffer);
  }

  has(key) {
    return this.cache.has(key);
  }

  clear() {
    this.cache.clear();
  }

  size() {
    return this.cache.size;
  }
}

export const ttsCache = new TTSMemoryCache(60);


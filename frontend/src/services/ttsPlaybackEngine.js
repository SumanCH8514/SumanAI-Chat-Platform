import { ttsCache } from './ttsCache.js';
import { env } from '../config/env.js';

export class TTSPlaybackEngine {
  constructor() {
    this.state = 'idle';
    this.subscribers = new Set();
    this.currentSessionId = 0;
    this.activeControllersMap = new Map();
    this.audioCtx = null;
    this.currentSourceNode = null;
    this.htmlAudio = null;
    this.synthUtterance = null;
    this.chunks = [];
    this.currentPlayingIndex = 0;
    this.decodedBufferMap = new Map();
    this.fetchStatusMap = new Map();
    this.maxConcurrentFetches = 2;
    this.isPaused = false;
    this.pauseOffset = 0;
    this.chunkStartTime = 0;
    this.activeFetchCount = 0;
    this.options = {};
  }

  getAudioContext() {
    if (typeof window === 'undefined') return null;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!this.audioCtx || this.audioCtx.state === 'closed') {
      this.audioCtx = new AudioContextClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  setState(newState, payload = {}) {
    this.state = newState;
    this.notifySubscribers({ state: newState, ...payload });
  }

  subscribe(callback) {
    if (typeof callback !== 'function') return () => {};
    this.subscribers.add(callback);
    callback({ state: this.state });
    return () => {
      this.subscribers.delete(callback);
    };
  }

  notifySubscribers(data) {
    for (const sub of this.subscribers) {
      try {
        sub(data);
      } catch {
        void 0;
      }
    }
  }

  getState() {
    return this.state;
  }

  isSpeaking() {
    return this.state === 'generating_first_chunk' || this.state === 'playing' || this.state === 'buffering';
  }

  async start(chunks, options = {}) {
    this.stop();

    if (!Array.isArray(chunks) || chunks.length === 0) {
      this.setState('idle');
      return;
    }

    const sessionId = ++this.currentSessionId;
    this.chunks = chunks;
    this.options = options;
    this.currentPlayingIndex = 0;
    this.decodedBufferMap.clear();
    this.fetchStatusMap.clear();
    this.activeFetchCount = 0;
    this.isPaused = false;
    this.pauseOffset = 0;
    this.activeControllersMap.clear();

    this.getAudioContext();

    this.setState('generating_first_chunk', { chunkIndex: 0, totalChunks: chunks.length });

    this.scheduleNextFetches(sessionId);

    this.monitorFirstChunkReady(sessionId);
  }

  scheduleNextFetches(sessionId) {
    if (sessionId !== this.currentSessionId) return;

    for (let i = 0; i < this.chunks.length; i++) {
      if (this.activeFetchCount >= this.maxConcurrentFetches) break;

      const isCurrentOrUpcoming = i >= this.currentPlayingIndex && i <= this.currentPlayingIndex + 2;
      if (!isCurrentOrUpcoming) continue;

      const status = this.fetchStatusMap.get(i);
      if (!status) {
        this.fetchStatusMap.set(i, 'pending');
        this.fetchChunkAudio(i, sessionId);
      }
    }
  }

  async fetchChunkAudio(index, sessionId) {
    if (sessionId !== this.currentSessionId) return;

    const chunk = this.chunks[index];
    if (!chunk) return;

    this.activeFetchCount++;
    const { referenceId = '9a9cf47702da476aa4629e2506d4a857', model = 's2.1-pro-free', format = 'mp3' } = this.options;
    const cacheKey = ttsCache.createKey(chunk.text, model, referenceId, format);
    const controller = new AbortController();
    this.activeControllersMap.set(index, controller);
    const timeoutId = setTimeout(() => {
      try {
        controller.abort();
      } catch {
        void 0;
      }
    }, 40000);

    try {
      let arrayBuffer = ttsCache.get(cacheKey);

      if (!arrayBuffer) {
        const baseUrl = (env.WORKER_URL || '').replace(/\/+$/, '');
        if (!baseUrl) throw new Error('Backend URL not configured');

        const res = await fetch(`${baseUrl}/api/tts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            text: chunk.text,
            reference_id: referenceId,
            model,
            format,
            latency: 'balanced'
          }),
          signal: controller.signal
        });

        if (sessionId !== this.currentSessionId) return;

        if (!res.ok) {
          throw new Error(`TTS server responded with ${res.status}`);
        }

        arrayBuffer = await res.arrayBuffer();
        if (sessionId !== this.currentSessionId) return;

        if (arrayBuffer && arrayBuffer.byteLength > 100) {
          ttsCache.set(cacheKey, arrayBuffer);
        } else {
          throw new Error('Received empty audio buffer');
        }
      }

      const ctx = this.getAudioContext();
      let decoded = null;
      if (ctx && ctx.state !== 'closed') {
        try {
          decoded = await ctx.decodeAudioData(arrayBuffer.slice(0));
        } catch {
          decoded = null;
        }
      }
      if (sessionId !== this.currentSessionId) return;
      this.decodedBufferMap.set(index, decoded || arrayBuffer);
      this.fetchStatusMap.set(index, 'ready');
    } catch (err) {
      if (sessionId !== this.currentSessionId) return;
      if (err.name === 'AbortError') return;

      this.fetchStatusMap.set(index, 'error');

      if (index === 0 && this.chunks.length === 1) {
        this.fallbackNativeSpeech(chunk.text, sessionId);
        return;
      }
    } finally {
      clearTimeout(timeoutId);
      this.activeControllersMap.delete(index);
      this.activeFetchCount--;
      if (sessionId === this.currentSessionId) {
        this.scheduleNextFetches(sessionId);
        this.checkPlaybackProgress(sessionId);
      }
    }
  }

  monitorFirstChunkReady(sessionId) {
    const checkReady = () => {
      if (sessionId !== this.currentSessionId) return;

      const firstStatus = this.fetchStatusMap.get(0);
      if (firstStatus === 'ready' && this.decodedBufferMap.has(0)) {
        this.playChunk(0, sessionId);
      } else if (firstStatus === 'error') {
        this.fallbackNativeSpeech(this.chunks.map(c => c.text).join(' '), sessionId);
      } else {
        setTimeout(checkReady, 50);
      }
    };
    checkReady();
  }

  checkPlaybackProgress(sessionId) {
    if (sessionId !== this.currentSessionId) return;

    if (this.state === 'buffering') {
      const targetStatus = this.fetchStatusMap.get(this.currentPlayingIndex);
      if (targetStatus === 'ready' && this.decodedBufferMap.has(this.currentPlayingIndex)) {
        this.playChunk(this.currentPlayingIndex, sessionId);
      } else if (targetStatus === 'error') {
        this.currentPlayingIndex++;
        if (this.currentPlayingIndex < this.chunks.length) {
          this.checkPlaybackProgress(sessionId);
        } else {
          this.setState('completed');
        }
      }
    }
  }

  playChunk(index, sessionId, offset = 0) {
    if (sessionId !== this.currentSessionId) return;

    if (index >= this.chunks.length) {
      this.setState('completed');
      this.stop();
      if (typeof this.options.onEnd === 'function') {
        this.options.onEnd();
      }
      return;
    }

    this.currentPlayingIndex = index;
    const buffer = this.decodedBufferMap.get(index);

    if (!buffer) {
      const status = this.fetchStatusMap.get(index);
      if (status === 'error') {
        this.playChunk(index + 1, sessionId);
        return;
      }
      this.setState('buffering', { chunkIndex: index, totalChunks: this.chunks.length });
      this.scheduleNextFetches(sessionId);
      return;
    }

    const ctx = this.getAudioContext();

    if (ctx && buffer instanceof AudioBuffer) {
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      if (this.currentSourceNode) {
        try {
          this.currentSourceNode.stop();
          this.currentSourceNode.disconnect();
        } catch {
          void 0;
        }
        this.currentSourceNode = null;
      }

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      this.currentSourceNode = source;

      this.chunkStartTime = ctx.currentTime - offset;

      source.onended = () => {
        if (sessionId !== this.currentSessionId) return;
        if (this.isPaused) return;

        this.currentSourceNode = null;
        this.playChunk(index + 1, sessionId);
      };

      source.start(0, offset);
      this.setState('playing', { chunkIndex: index, totalChunks: this.chunks.length });

      if (index === 0 && offset === 0 && typeof this.options.onStart === 'function') {
        this.options.onStart();
      }

      this.scheduleNextFetches(sessionId);
    } else {
      this.playHtmlAudioChunk(buffer, index, sessionId);
    }
  }

  playHtmlAudioChunk(arrayBuffer, index, sessionId) {
    if (sessionId !== this.currentSessionId) return;

    try {
      const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      this.htmlAudio = audio;

      audio.onended = () => {
        URL.revokeObjectURL(url);
        if (this.htmlAudio === audio) this.htmlAudio = null;
        if (sessionId !== this.currentSessionId) return;
        this.playChunk(index + 1, sessionId);
      };

      audio.onerror = () => {
        URL.revokeObjectURL(url);
        if (this.htmlAudio === audio) this.htmlAudio = null;
        if (sessionId !== this.currentSessionId) return;
        this.playChunk(index + 1, sessionId);
      };

      audio.play().then(() => {
        if (sessionId !== this.currentSessionId) return;
        this.setState('playing', { chunkIndex: index, totalChunks: this.chunks.length });
        if (index === 0 && typeof this.options.onStart === 'function') {
          this.options.onStart();
        }
        this.scheduleNextFetches(sessionId);
      }).catch(() => {
        this.fallbackNativeSpeech(this.chunks.slice(index).map(c => c.text).join(' '), sessionId);
      });
    } catch {
      this.fallbackNativeSpeech(this.chunks.slice(index).map(c => c.text).join(' '), sessionId);
    }
  }

  pause() {
    if (this.state !== 'playing') return;

    const ctx = this.audioCtx;
    if (ctx && this.currentSourceNode) {
      const elapsed = ctx.currentTime - this.chunkStartTime;
      this.pauseOffset = Math.max(0, elapsed);
      try {
        this.currentSourceNode.stop();
        this.currentSourceNode.disconnect();
      } catch {
        void 0;
      }
      this.currentSourceNode = null;
    } else if (this.htmlAudio) {
      try {
        this.htmlAudio.pause();
      } catch {
        void 0;
      }
    }

    this.isPaused = true;
    this.setState('paused', { chunkIndex: this.currentPlayingIndex, totalChunks: this.chunks.length });
  }

  resume() {
    if (this.state !== 'paused') return;

    this.isPaused = false;
    const ctx = this.getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    if (this.htmlAudio) {
      this.htmlAudio.play().then(() => {
        this.setState('playing', { chunkIndex: this.currentPlayingIndex, totalChunks: this.chunks.length });
      }).catch(() => {
        this.playChunk(this.currentPlayingIndex, this.currentSessionId, this.pauseOffset);
      });
    } else {
      this.playChunk(this.currentPlayingIndex, this.currentSessionId, this.pauseOffset);
    }
    this.pauseOffset = 0;
  }

  stop() {
    this.currentSessionId++;
    this.isPaused = false;
    this.pauseOffset = 0;

    for (const ctrl of this.activeControllersMap.values()) {
      try {
        ctrl.abort();
      } catch {
        void 0;
      }
    }
    this.activeControllersMap.clear();

    if (this.currentSourceNode) {
      try {
        this.currentSourceNode.stop();
        this.currentSourceNode.disconnect();
      } catch {
        void 0;
      }
      this.currentSourceNode = null;
    }

    if (this.htmlAudio) {
      try {
        this.htmlAudio.pause();
        this.htmlAudio.currentTime = 0;
      } catch {
        void 0;
      }
      this.htmlAudio = null;
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        void 0;
      }
      this.synthUtterance = null;
    }

    this.decodedBufferMap.clear();
    this.fetchStatusMap.clear();
    this.chunks = [];
    this.currentPlayingIndex = 0;
    this.activeFetchCount = 0;

    this.setState('idle');
  }

  fallbackNativeSpeech(text, sessionId) {
    if (sessionId !== this.currentSessionId) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      this.setState('error', { error: new Error('Speech synthesis unsupported') });
      if (typeof this.options.onError === 'function') {
        this.options.onError(new Error('Speech synthesis unsupported'));
      }
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      this.synthUtterance = utterance;

      utterance.onstart = () => {
        if (sessionId !== this.currentSessionId) return;
        this.setState('playing', { isNative: true });
        if (typeof this.options.onStart === 'function') {
          this.options.onStart();
        }
      };

      utterance.onend = () => {
        if (this.synthUtterance === utterance) this.synthUtterance = null;
        if (sessionId !== this.currentSessionId) return;
        this.setState('completed');
        this.stop();
        if (typeof this.options.onEnd === 'function') {
          this.options.onEnd();
        }
      };

      utterance.onerror = (e) => {
        if (this.synthUtterance === utterance) this.synthUtterance = null;
        if (sessionId !== this.currentSessionId) return;
        this.setState('error', { error: e });
        if (typeof this.options.onError === 'function') {
          this.options.onError(e);
        }
      };

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      this.setState('error', { error: e });
      if (typeof this.options.onError === 'function') {
        this.options.onError(e);
      }
    }
  }
}

export const ttsPlaybackEngine = new TTSPlaybackEngine();

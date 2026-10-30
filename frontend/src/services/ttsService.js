import { chunkTextForStreamingTTS } from '../utils/textChunker.js';
import { ttsPlaybackEngine } from './ttsPlaybackEngine.js';

export const ttsService = {
  speak: (text, options = {}) => {
    if (!text || typeof text !== 'string') return;
    const cleanText = text.trim();
    if (!cleanText) return;

    const chunks = chunkTextForStreamingTTS(cleanText, {
      initialChunkTarget: 65,
      subsequentChunkTarget: 240,
      maxChunkLimit: 360
    });

    if (chunks.length === 0) return;

    ttsPlaybackEngine.start(chunks, options);
  },

  pause: () => {
    ttsPlaybackEngine.pause();
  },

  resume: () => {
    ttsPlaybackEngine.resume();
  },

  stop: () => {
    ttsPlaybackEngine.stop();
  },

  isSpeaking: () => {
    return ttsPlaybackEngine.isSpeaking();
  },

  getState: () => {
    return ttsPlaybackEngine.getState();
  },

  subscribe: (callback) => {
    return ttsPlaybackEngine.subscribe(callback);
  }
};

export default ttsService;

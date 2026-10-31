import { chunkTextForStreamingTTS } from '../utils/textChunker.js';
import { ttsPlaybackEngine } from './ttsPlaybackEngine.js';
import { DEFAULT_VOICE_ID } from '../constants/voices.js';

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

    let savedVoiceId = null;
    try {
      savedVoiceId = typeof window !== 'undefined' ? localStorage.getItem('sumanai_selected_voice_id') : null;
    } catch {
      savedVoiceId = null;
    }

    const mergedOptions = {
      referenceId: options.referenceId || savedVoiceId || DEFAULT_VOICE_ID,
      ...options
    };

    ttsPlaybackEngine.start(chunks, mergedOptions);
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

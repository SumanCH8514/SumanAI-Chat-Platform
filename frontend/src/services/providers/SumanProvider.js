import { env } from '../../config/env';
import { getFirebaseAuth } from '../firebase';

export const SumanProvider = async (modelId, messages, onChunk, options = {}) => {
  const WORKER_URL = env.WORKER_URL;

  const trimmedMessages = messages.map((msg, idx) => {
    if (idx < messages.length - 2 && msg.attachments) {
      const { attachments: _attachments, ...rest } = msg;
      return { ...rest, content: msg.content + " (Image omitted from history to save space)" };
    }
    return msg;
  });

  const headers = { 'Content-Type': 'application/json' };
  let isGoogleUser = false;

  try {
    const currentUser = getFirebaseAuth()?.currentUser;
    if (currentUser) {
      isGoogleUser = !currentUser.isAnonymous;
      const token = await currentUser.getIdToken(false).catch(() => null);
      if (token) headers['Authorization'] = `Bearer ${token}`;
    }
  } catch (err) {
    void err;
  }

  const customEnabled = localStorage.getItem('sumanai_custom_enabled') !== 'false';
  const customAbout = customEnabled ? (localStorage.getItem('sumanai_custom_about') || '') : '';
  const customStyle = customEnabled ? (localStorage.getItem('sumanai_custom_style') || '') : '';

  const enrichedOptions = {
    ...options,
    customAbout,
    customStyle
  };

  const effectiveModelId = isGoogleUser ? modelId : 'qwen/qwen3.8-27b';

  try {
    const response = await fetch(WORKER_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({ modelId: effectiveModelId, messages: trimmedMessages, options: enrichedOptions }),
      signal: options.signal
    });

    if (!response.ok) {
      let errorMessage = `Server Error: ${response.status}`;
      try {
        const errData = await response.json();
        errorMessage = errData.error || errorMessage;
      } catch (err) {
        void err;
        const text = await response.text().catch(() => "");
        if (text) errorMessage = text.slice(0, 200);
      }
      throw new Error(errorMessage);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = "";
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n');
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const jsonStr = line.replace(/^data: /, '').trim();
        if (!jsonStr) continue;

        try {
          const chunkData = JSON.parse(jsonStr);
          if (chunkData.candidates && chunkData.candidates[0].content) {
            const piece = chunkData.candidates[0].content.parts[0].text;
            if (piece) {
              fullText += piece;
              if (onChunk) onChunk(fullText);
            }
          }
        } catch (e) {
          void e;
        }
      }
    }

    return fullText;
  } catch (err) {
    const msg = err.message || '';

    if (err.name === 'AbortError' || msg.toLowerCase().includes('aborted')) {
      throw err;
    }

    if (msg.includes("busy") || msg.includes("try another model") || msg.includes("Server Busy")) {
      throw new Error(`❌ ${msg}`);
    }

    throw new Error(`❌ Error: ${msg}. Please check your connection or try another model.`);
  }
};

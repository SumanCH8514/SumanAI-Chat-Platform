import { env } from '../../config/env';
import { getFirebaseAuth } from '../firebase';

let cachedLimits = null;
let lastLimitsFetch = 0;

const fetchEnvPanelLimits = async () => {
  const now = Date.now();
  if (cachedLimits && now - lastLimitsFetch < 300000) {
    return cachedLimits;
  }

  try {
    const local = localStorage.getItem('sumanai_system_limits');
    if (local) {
      cachedLimits = JSON.parse(local);
    }
  } catch {
    void 0;
  }

  try {
    const localGov = localStorage.getItem('sumanai_governance_config');
    if (localGov) {
      const parsedGov = JSON.parse(localGov);
      if (parsedGov?.systemLimits) {
        cachedLimits = { ...cachedLimits, ...parsedGov.systemLimits };
      }
    }
  } catch {
    void 0;
  }

  try {
    const baseUrl = (env.WORKER_URL || '').replace(/\/+$/, '');
    const res = await fetch(`${baseUrl}/api/config`);
    if (res.ok) {
      const data = await res.json();
      if (data?.limits) {
        cachedLimits = { ...cachedLimits, ...data.limits };
        lastLimitsFetch = now;
        try {
          localStorage.setItem('sumanai_system_limits', JSON.stringify(cachedLimits));
        } catch {
          void 0;
        }
        return cachedLimits;
      }
    }
  } catch {
    void 0;
  }

  return cachedLimits || { maxConversationMessages: 100, slidingContextWindow: 50 };
};

export const SumanProvider = async (modelId, messages, onChunk, options = {}) => {
  const WORKER_URL = env.WORKER_URL;

  const limits = await fetchEnvPanelLimits();
  const slidingWindow = limits?.slidingContextWindow || 50;

  const validMessages = messages.filter((m, idx) => {
    if (m.role === 'assistant' && !m.content?.trim() && idx === messages.length - 1) {
      return false;
    }
    return true;
  });

  const trimmedMessages = validMessages.map((msg, idx) => {
    if (idx < validMessages.length - 2 && msg.attachments) {
      const { attachments: _attachments, ...rest } = msg;
      return { ...rest, content: msg.content + " (Image omitted from history to save space)" };
    }
    return msg;
  });

  const contextMessages = trimmedMessages.length > slidingWindow
    ? trimmedMessages.slice(-slidingWindow)
    : trimmedMessages;

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
    customStyle,
    systemLimits: limits
  };

  const effectiveModelId = isGoogleUser ? modelId : 'qwen/qwen3.8-27b';

  try {
    const response = await fetch(WORKER_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({ modelId: effectiveModelId, messages: contextMessages, options: enrichedOptions }),
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
          let piece = "";
          if (chunkData.candidates?.[0]?.content?.parts?.[0]?.text) {
            piece = chunkData.candidates[0].content.parts[0].text;
          } else if (typeof chunkData.response === 'string') {
            piece = chunkData.response;
          } else if (typeof chunkData.choices?.[0]?.delta?.content === 'string') {
            piece = chunkData.choices[0].delta.content;
          }
          if (piece) {
            fullText += piece;
            if (onChunk) onChunk(fullText);
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

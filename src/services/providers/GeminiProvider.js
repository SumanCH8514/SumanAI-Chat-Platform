/**
 * Google Gemini API Provider
 * Connects directly to Google's Generative AI API.
 */
export const GeminiProvider = async (modelId, messages, onChunk, options = {}) => {
  // Use Worker URL from env or fallback to local wrangler dev default
  const WORKER_URL = import.meta.env.VITE_WORKER_URL || 'http://localhost:8787';
  try {
    const response = await fetch(WORKER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ modelId, messages, options }),
      signal: options.signal // Allow cancellation
    });

    if (!response.ok) {
      let errorMessage = `Server Error: ${response.status}`;
      try {
        const errData = await response.json();
        errorMessage = errData.error || errorMessage;
      } catch {
        // Not a JSON error, maybe get text
        const text = await response.text().catch(() => "");
        if (text) errorMessage = text.slice(0, 200);
      }
      throw new Error(errorMessage);
    }

    // Real-time Stream Parsing (SSE)
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = "";
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // SSE lines look like "data: {...}\n\n"
      const lines = buffer.split('\n');
      buffer = lines.pop() || ""; // Keep the last incomplete line in the buffer

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
          console.warn("Error parsing stream chunk", e);
        }
      }
    }

    return fullText;
  } catch (err) {
    console.error("Gemini/Worker Error:", err);
    let msg = err.message;
    if (msg.includes("Server Busy")) {
      return `❌ ${msg}`;
    }
    return `❌ Error: ${msg}. Make sure the Cloudflare Worker is running.`;
  }
};

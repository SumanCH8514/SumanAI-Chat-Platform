const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60000;
const MAX_REQUESTS_PER_WINDOW = 60;

function isRateLimited(ip) {
  const now = Date.now();
  const record = rateLimitMap.get(ip) || { count: 0, resetTime: now + RATE_LIMIT_WINDOW_MS };
  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + RATE_LIMIT_WINDOW_MS;
    rateLimitMap.set(ip, record);
    return false;
  }
  record.count += 1;
  rateLimitMap.set(ip, record);

  if (rateLimitMap.size > 5000) {
    for (const [k, v] of rateLimitMap.entries()) {
      if (now > v.resetTime) rateLimitMap.delete(k);
    }
  }
  return record.count > MAX_REQUESTS_PER_WINDOW;
}

const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};

function getCorsHeaders(request) {
  const origin = request.headers.get("Origin") || "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
    "Access-Control-Max-Age": "86400",
    ...SECURITY_HEADERS,
  };
}

function isGoogleAuthenticated(request) {
  const authHeader = request.headers.get("Authorization") || "";
  if (!authHeader.startsWith("Bearer ")) return false;
  const token = authHeader.slice(7).trim();
  try {
    const parts = token.split('.');
    if (parts.length < 2) return false;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(base64);
    const payload = JSON.parse(json);
    const provider = payload?.firebase?.sign_in_provider;
    return provider === 'google.com';
  } catch {
    return false;
  }
}

async function fetchWithRetry(url, options = {}, maxRetries = 3, initialDelay = 1000) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      const signal = options.signal && typeof AbortSignal.any === 'function'
        ? AbortSignal.any([options.signal, controller.signal])
        : controller.signal;

      const response = await fetch(url, { ...options, signal });
      clearTimeout(timeoutId);

      if (response.ok) return response;

      if ([429, 500, 502, 503, 504].includes(response.status) && attempt < maxRetries && !options.signal?.aborted) {
        const delay = initialDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      return response;
    } catch (err) {
      if (options.signal?.aborted) throw err;
      if ((err.name === 'AbortError' || err.message?.includes('timeout')) && attempt < maxRetries) {
        const delay = initialDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      if (attempt === maxRetries) throw err;
    }
  }
}

export default {
  async fetch(request, env) {
    const corsHeaders = getCorsHeaders(request);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const clientIp = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || "unknown";
    if (isRateLimited(clientIp)) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Please wait a moment before sending more requests." }), {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": "60",
          ...corsHeaders
        }
      });
    }

    const url = new URL(request.url);

    if (request.method === "GET") {
      if (url.pathname === "/api/config" || url.pathname === "/config") {
        const firebaseConfig = {
          apiKey: env.FIREBASE_API_KEY || "",
          authDomain: env.FIREBASE_AUTH_DOMAIN || "sumanai-sumanonline.firebaseapp.com",
          projectId: env.FIREBASE_PROJECT_ID || "sumanai-sumanonline",
          storageBucket: env.FIREBASE_STORAGE_BUCKET || "sumanai-sumanonline.firebasestorage.app",
          messagingSenderId: env.FIREBASE_MESSAGING_SENDER_ID || "105425138849",
          appId: env.FIREBASE_APP_ID || "1:105425138849:web:c4d525230ab81f45ef2ce0"
        };

        return new Response(JSON.stringify({ firebase: firebaseConfig }), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "public, max-age=3600",
            ...corsHeaders
          }
        });
      }

      if (url.pathname === "/" || url.pathname === "/health" || url.pathname === "/api/health") {
        return new Response(JSON.stringify({ status: "ok", service: "sumanai-backend" }), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders
          }
        });
      }

      return new Response(JSON.stringify({ error: "Endpoint not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    const contentLength = parseInt(request.headers.get("content-length") || "0", 10);
    if (contentLength > 15 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: "Payload too large. Maximum size is 15MB." }), {
        status: 413,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    try {
      let body;
      try {
        body = await request.json();
      } catch (jsonErr) {
        void jsonErr;
        return new Response(JSON.stringify({ error: "Invalid JSON in request body" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }

      const { modelId, messages, options = {} } = body;
      const { smartSearch } = options;

      if (!Array.isArray(messages) || messages.length === 0) {
        return new Response(JSON.stringify({ error: "Invalid request: messages array is required and must not be empty" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }

      if (messages.length > 100) {
        return new Response(JSON.stringify({ error: "Conversation history exceeds maximum allowed limit (100 messages)" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }

      const groqSupportedModels = new Set([
        'openai/gpt-oss-120b',
        'openai/gpt-oss-20b',
        'qwen/qwen3.8-27b',
        'canopylabs/orpheus-v1-english',
        'canopylabs/orpheus-arabic-saudi'
      ]);

      const nvidiaSupportedModels = new Set([
        'z-ai/glm-5.3',
        'z-ai/glm-5.3-flash',
        'moonshotai/kimi-k3',
        'google/gemma-4-31b-it',
        'google/diffusiongemma-26b-a4b-it',
        'meta/muse-glimmer-30b',
        'meta/llama-3.2-11b-vision-instruct'
      ]);

      const isGoogle = isGoogleAuthenticated(request);
      let targetModel = typeof modelId === 'string' ? modelId : (isGoogle ? 'openai/gpt-oss-120b' : 'qwen/qwen3.8-27b');

      if (!isGoogle && targetModel !== 'qwen/qwen3.8-27b') {
        return new Response(JSON.stringify({ 
          error: "This model is locked. Please sign in with Google to unlock all models." 
        }), {
          status: 403,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }

      let provider = 'groq';

      if (targetModel.startsWith('gemini')) {
        targetModel = 'meta/llama-3.2-11b-vision-instruct';
        provider = 'nvidia';
      } else if (nvidiaSupportedModels.has(targetModel)) {
        provider = 'nvidia';
      } else if (groqSupportedModels.has(targetModel)) {
        provider = 'groq';
      } else {
        targetModel = isGoogle ? 'openai/gpt-oss-120b' : 'qwen/qwen3.8-27b';
        provider = 'groq';
      }

      let API_KEY = env.GROQ_API_KEY;
      if (provider === 'google') {
        API_KEY = env.GEMINI_API_KEY;
      } else if (provider === 'nvidia') {
        API_KEY = env.NVIDIA_API_KEY;
      }

      if (!API_KEY) {
        const keyName = provider === 'nvidia' ? 'NVIDIA_API_KEY' : (provider === 'google' ? 'GEMINI_API_KEY' : 'GROQ_API_KEY');
        throw new Error(`${keyName} not configured. Please add it to your Cloudflare Worker Runtime variables and secrets.`);
      }

      const { customAbout, customStyle } = options;
      let personalizationPrompt = '';
      if (customAbout && typeof customAbout === 'string' && customAbout.trim()) {
        personalizationPrompt += `\nUser Profile & Background: ${customAbout.trim().slice(0, 1000)}`;
      }
      if (customStyle && typeof customStyle === 'string' && customStyle.trim()) {
        personalizationPrompt += `\nResponse Style Instructions: ${customStyle.trim().slice(0, 1000)}`;
      }

      const modelDisplayName = targetModel.split('/').pop().replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      const systemInstruction = `You are SumanAI - Model: ${modelDisplayName}. You are a helpful, minimalist AI assistant. Always get straight to the point. When asked who you are, introduce yourself as "SumanAI - Model: ${modelDisplayName}".${personalizationPrompt}`;

      if (provider === 'groq' || provider === 'nvidia') {
        const isNvidia = provider === 'nvidia';
        const apiUrl = isNvidia
          ? "https://integrate.api.nvidia.com/v1/chat/completions"
          : "https://api.groq.com/openai/v1/chat/completions";

        const supportsVision = targetModel === 'meta/llama-3.2-11b-vision-instruct';

        const openAiMessages = messages.map((m, index) => {
          let textContent = (m.content || '').trim();

          if (index === 0 && (m.role === 'user' || !m.role)) {
            textContent = `${systemInstruction}\n\n${textContent}`;
          }

          if (m.attachments && m.attachments.length > 0) {
            if (supportsVision) {
              const contentParts = [];
              if (textContent) {
                contentParts.push({ type: "text", text: textContent });
              }
              m.attachments.forEach(att => {
                contentParts.push({
                  type: "image_url",
                  image_url: { url: `data:${att.type};base64,${att.data}` }
                });
              });
              return { role: m.role || 'user', content: contentParts };
            } else {
              const omitted = m.attachments.map(a => a.name || 'image').join(', ');
              textContent = `${textContent}\n[Attachments: ${omitted}]`.trim();
            }
          }

          return { role: m.role || 'user', content: textContent || " " };
        });

        const requestPayload = {
          model: targetModel,
          messages: openAiMessages,
          temperature: options.deepThinking ? 0.6 : 0.7,
          stream: true
        };

        if (isNvidia) {
          requestPayload.max_tokens = 4096;
        } else {
          requestPayload.max_completion_tokens = targetModel.includes('70b') ? 32768 : 8192;
        }

        const response = await fetchWithRetry(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`,
            'Accept': 'text/event-stream'
          },
          body: JSON.stringify(requestPayload),
          signal: request.signal
        });

        if (!response.ok) {
          const errTxt = await response.text();
          const label = isNvidia ? 'NVIDIA' : 'Groq';
          throw new Error(`${label} Error (${response.status}): ${errTxt.slice(0, 150)}`);
        }

        const { readable, writable } = new TransformStream();
        const writer = writable.getWriter();
        const encoder = new TextEncoder();
        const decoder = new TextDecoder();

        (async () => {
          const reader = response.body.getReader();
          let buffer = "";

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              buffer = lines.pop() || "";

              for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || !trimmed.startsWith('data:')) continue;
                if (trimmed === 'data: [DONE]') {
                  await writer.write(encoder.encode('data: [DONE]\n\n'));
                  continue;
                }

                try {
                  const data = JSON.parse(trimmed.slice(5).trim());
                  const delta = data.choices?.[0]?.delta?.content || "";

                  if (delta) {
                    const chunk = {
                      candidates: [{
                        content: {
                          parts: [{ text: delta }]
                        }
                      }]
                    };
                    await writer.write(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
                  }
                } catch (parseErr) {
                  void parseErr;
                }
              }
            }
          } catch (streamErr) {
            void streamErr;
          } finally {
            writer.close();
          }
        })();

        return new Response(readable, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            ...corsHeaders
          },
        });

      } else {
        const contents = [
          { role: 'user', parts: [{ text: systemInstruction }] },
          { role: 'model', parts: [{ text: "Understood." }] },
          ...messages.map(msg => {
            const parts = [{ text: msg.content || '' }];
            if (msg.attachments && msg.attachments.length > 0) {
              msg.attachments.forEach(att => {
                parts.push({
                  inline_data: {
                    mime_type: att.type,
                    data: att.data
                  }
                });
              });
            }
            return {
              role: msg.role === 'assistant' ? 'model' : 'user',
              parts
            };
          })
        ];

        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel || 'gemini-1.5-flash'}:streamGenerateContent?alt=sse&key=${API_KEY}`;
        const response = await fetchWithRetry(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents, tools: smartSearch ? [{ google_search: {} }] : [] }),
          signal: request.signal
        });

        if (!response.ok) {
          const errTxt = await response.text();
          throw new Error(`Gemini Error (${response.status}): ${errTxt.slice(0, 150)}`);
        }

        return new Response(response.body, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            ...corsHeaders
          },
        });
      }
    } catch (err) {
      const isTimeout = err.name === 'AbortError' ||
        err.message?.toLowerCase().includes('timeout') ||
        err.message?.toLowerCase().includes('aborted');

      const message = isTimeout ? "Server Busy! Try again later." : (err?.message || "Unknown error occurred");

      return new Response(JSON.stringify({ error: message }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    }
  },
};

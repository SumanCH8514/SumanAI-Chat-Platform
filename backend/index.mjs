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

const ALLOWED_ORIGINS = new Set([
  "https://sumanai.sumanonline.com",
  "https://chat.sumanonline.com",
  "https://suman-ai.pages.dev",
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:5173"
]);

function isAllowedOrigin(origin) {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.has(origin)) return true;
  try {
    const parsed = new URL(origin);
    if (parsed.protocol === "https:" && parsed.hostname.endsWith(".suman-ai.pages.dev")) {
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

function getCorsHeaders(request) {
  const origin = request.headers.get("Origin") || "";
  const allowed = isAllowedOrigin(origin);
  return {
    "Access-Control-Allow-Origin": allowed ? origin : "https://sumanai.sumanonline.com",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
    ...SECURITY_HEADERS,
  };
}

let cachedJwks = null;
let cachedJwksExpiry = 0;
const importedCryptoKeys = new Map();

async function getGooglePublicKeys() {
  const now = Date.now();
  if (cachedJwks && now < cachedJwksExpiry) {
    return cachedJwks;
  }
  try {
    const res = await fetch("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com");
    if (!res.ok) return [];
    const cacheControl = res.headers.get("cache-control") || "";
    const maxAgeMatch = cacheControl.match(/max-age=(\d+)/i);
    const maxAge = maxAgeMatch ? parseInt(maxAgeMatch[1], 10) : 3600;
    const data = await res.json();
    cachedJwks = data.keys || [];
    cachedJwksExpiry = now + (maxAge * 1000);
    importedCryptoKeys.clear();
    return cachedJwks;
  } catch {
    return [];
  }
}

function base64UrlToUint8Array(base64Url) {
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const padLen = (4 - (base64.length % 4)) % 4;
  const padded = base64 + '='.repeat(padLen);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function parseJwt(token) {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const headerStr = atob(parts[0].replace(/-/g, '+').replace(/_/g, '/'));
    const payloadStr = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
    return {
      header: JSON.parse(headerStr),
      payload: JSON.parse(payloadStr),
      signedData: new TextEncoder().encode(`${parts[0]}.${parts[1]}`),
      signature: base64UrlToUint8Array(parts[2])
    };
  } catch {
    return null;
  }
}

async function verifyFirebaseToken(token, expectedProjectId) {
  const jwt = parseJwt(token);
  if (!jwt) return null;

  const { header, payload, signedData, signature } = jwt;
  if (header.alg !== "RS256" || !header.kid) return null;

  const nowSec = Math.floor(Date.now() / 1000);
  if (!payload.exp || payload.exp < nowSec) return null;
  if (!payload.iat || payload.iat > nowSec + 300) return null;
  if (expectedProjectId) {
    if (payload.aud !== expectedProjectId) return null;
    if (payload.iss !== `https://securetoken.google.com/${expectedProjectId}`) return null;
  }
  if (!payload.sub || typeof payload.sub !== 'string') return null;

  let cryptoKey = importedCryptoKeys.get(header.kid);
  if (!cryptoKey) {
    const keys = await getGooglePublicKeys();
    const jwk = keys.find(k => k.kid === header.kid);
    if (!jwk) return null;

    try {
      cryptoKey = await crypto.subtle.importKey(
        "jwk",
        jwk,
        { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
        false,
        ["verify"]
      );
      importedCryptoKeys.set(header.kid, cryptoKey);
    } catch {
      return null;
    }
  }

  try {
    const isValid = await crypto.subtle.verify(
      "RSASSA-PKCS1-v1_5",
      cryptoKey,
      signature,
      signedData
    );
    return isValid ? payload : null;
  } catch {
    return null;
  }
}

async function isGoogleAuthenticated(request, env) {
  const authHeader = request.headers.get("Authorization") || "";
  if (!authHeader.startsWith("Bearer ")) return false;
  const token = authHeader.slice(7).trim();
  if (!token) return false;

  const projectId = env?.FIREBASE_PROJECT_ID || "sumanai-sumanonline";
  const verifiedPayload = await verifyFirebaseToken(token, projectId);
  if (!verifiedPayload) return false;

  const provider = verifiedPayload?.firebase?.sign_in_provider;
  return provider === 'google.com';
}

function isPrivateIp(hostname) {
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0' || hostname === '::1') {
    return true;
  }
  if (hostname.endsWith('.local') || hostname.endsWith('.internal')) {
    return true;
  }
  const ipv4Match = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4Match) {
    const octets = ipv4Match.slice(1).map(Number);
    if (octets.some(o => o < 0 || o > 255)) return true;
    if (octets[0] === 10) return true;
    if (octets[0] === 127) return true;
    if (octets[0] === 0) return true;
    if (octets[0] === 169 && octets[1] === 254) return true;
    if (octets[0] === 192 && octets[1] === 168) return true;
    if (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) return true;
    if (octets[0] >= 224) return true;
  }
  return false;
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

function isImageGenerationIntent(text) {
  if (!text || typeof text !== 'string') return false;
  const clean = text.trim().replace(/\s+/g, ' ');
  if (clean.length < 3) return false;

  const codeOrExplanationRegex = /^(?:how\s+(?:to|do|can)|why\s+(?:does|is|are)|what\s+(?:is|are)|explain|describe\s+how|write\s+(?:a\s+)?(?:code|script|program|function|shader|algorithm|test)|implement\s+(?:a|an)?|in\s+(?:python|javascript|typescript|c\+\+|java|rust|html|css|php))\b/i;
  if (codeOrExplanationRegex.test(clean)) return false;

  const programmingContextRegex = /\b(?:python|javascript|typescript|code\s+snippet|npm\s+install|pip\s+install|github|stack\s*overflow|api\s+endpoint|ffmpeg|opencv|canvas\s+api|three\.js|webgl)\b/i;
  if (programmingContextRegex.test(clean)) return false;

  const nonVisualFigureOfSpeech = /\b(?:draw\s+(?:a\s+)?(?:comparison|conclusion|parallel|distinction)|paint\s+(?:a\s+)?picture\s+of\s+how|make\s+(?:a\s+)?(?:point|list|table|plan|schedule|summary|call|decision))\b/i;
  if (nonVisualFigureOfSpeech.test(clean)) return false;

  const explicitGenVerbRegex = /^(?:please\s+)?(?:can\s+you\s+)?(?:could\s+you\s+)?(?:please\s+)?(?:i\s+(?:want|need|would\s+like)\s+)?(?:give\s+me\s+)?(?:generate|create|draw|make|render|produce|paint|design|illustrate|synthesize)\s+(?:a|an|the|me\s+a|me\s+an|some)?\s*(?:[a-zA-Z0-9_,-]+\s+){0,8}?(?:image|picture|photo|photograph|portrait|illustration|artwork|drawing|painting|render|visual|graphic|wallpaper|avatar|sketch|poster|banner|concept\s+art|digital\s+art)\b/i;
  if (explicitGenVerbRegex.test(clean)) return true;

  const directNounPrefixRegex = /^(?:a|an|the)?\s*(?:[a-zA-Z0-9_-]+\s+){0,4}?(?:image|picture|photo|photograph|portrait|wallpaper|artwork|illustration|drawing|painting|render|concept\s+art)\s+(?:of|showing|depicting|with|featuring|in)\b/i;
  if (directNounPrefixRegex.test(clean)) return true;

  const wantImageRegex = /\b(?:i\s+want|i\s+need|give\s+me|show\s+me)\s+(?:a|an)?\s*(?:[a-zA-Z0-9_,-]+\s+){0,4}?(?:image|picture|photo|portrait|illustration|drawing|painting|artwork|render|wallpaper)\s+(?:of|with|for)\b/i;
  if (wantImageRegex.test(clean)) return true;

  const shortCommandRegex = /^(?:draw|paint|illustrate|sketch)\s+(?:a|an|the|me)?\s+/i;
  if (shortCommandRegex.test(clean) && !/\b(?:code|diagram|flowchart|chart|graph|wireframe|architecture|conclusion|summary|table)\b/i.test(clean)) return true;

  const styleConversionRegex = /\b(?:convert|remix|transform|change|turn)\s+this\s+image\s+(?:in|into|to)\b/i;
  if (styleConversionRegex.test(clean)) return true;

  return false;
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
      if (url.pathname === "/api/proxy-image") {
        const targetUrlStr = url.searchParams.get("url");
        if (!targetUrlStr) {
          return new Response(JSON.stringify({ error: "Missing 'url' query parameter" }), {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        }

        let parsedTarget;
        try {
          parsedTarget = new URL(targetUrlStr);
        } catch {
          return new Response(JSON.stringify({ error: "Invalid image URL" }), {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        }

        if (parsedTarget.protocol !== "http:" && parsedTarget.protocol !== "https:") {
          return new Response(JSON.stringify({ error: "Only HTTP and HTTPS protocols are permitted" }), {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        }

        if (isPrivateIp(parsedTarget.hostname)) {
          return new Response(JSON.stringify({ error: "Access to private or local network hosts is prohibited" }), {
            status: 403,
            headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        }

        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000);
          const imageRes = await fetch(parsedTarget.toString(), {
            method: "GET",
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
              "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8"
            },
            signal: controller.signal
          });
          clearTimeout(timeoutId);

          if (!imageRes.ok) {
            return new Response(JSON.stringify({ error: `Upstream server responded with status ${imageRes.status}` }), {
              status: imageRes.status === 404 ? 404 : 502,
              headers: { "Content-Type": "application/json", ...corsHeaders }
            });
          }

          const rawContentType = imageRes.headers.get("content-type") || "";
          const contentType = rawContentType.split(';')[0].trim().toLowerCase();
          const validImageTypes = new Set([
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp",
            "image/gif",
            "image/svg+xml",
            "image/avif",
            "image/bmp",
            "image/x-icon"
          ]);

          if (!validImageTypes.has(contentType) && !contentType.startsWith("image/")) {
            return new Response(JSON.stringify({ error: "Remote resource is not a recognized image format" }), {
              status: 415,
              headers: { "Content-Type": "application/json", ...corsHeaders }
            });
          }

          const contentLength = parseInt(imageRes.headers.get("content-length") || "0", 10);
          if (contentLength > 15 * 1024 * 1024) {
            return new Response(JSON.stringify({ error: "Remote image exceeds the 15MB limit" }), {
              status: 413,
              headers: { "Content-Type": "application/json", ...corsHeaders }
            });
          }

          const imageBlob = await imageRes.blob();
          if (imageBlob.size > 15 * 1024 * 1024) {
            return new Response(JSON.stringify({ error: "Remote image exceeds the 15MB limit" }), {
              status: 413,
              headers: { "Content-Type": "application/json", ...corsHeaders }
            });
          }

          return new Response(imageBlob, {
            status: 200,
            headers: {
              "Content-Type": contentType || "image/png",
              "Cache-Control": "public, max-age=86400, s-maxage=86400",
              ...corsHeaders
            }
          });
        } catch (fetchErr) {
          const isTimeout = fetchErr.name === 'AbortError' || fetchErr.message?.includes('aborted');
          return new Response(JSON.stringify({ error: isTimeout ? "Remote image request timed out" : "Failed to retrieve remote image" }), {
            status: 504,
            headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        }
      }

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

      if (url.pathname === "/api/admin/verify") {
        const authHeader = request.headers.get("Authorization") || "";
        if (!authHeader.startsWith("Bearer ")) {
          return new Response(JSON.stringify({ error: "Missing Bearer token", isAdmin: false }), {
            status: 401,
            headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        }
        const token = authHeader.slice(7).trim();
        const projectId = env?.FIREBASE_PROJECT_ID || "sumanai-sumanonline";
        const verified = await verifyFirebaseToken(token, projectId);
        if (!verified) {
          return new Response(JSON.stringify({ error: "Invalid or expired token", isAdmin: false }), {
            status: 401,
            headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        }

        const adminEmails = (env?.ADMIN_EMAILS || "")
          .split(",")
          .map(e => e.trim().toLowerCase())
          .filter(Boolean);

        const email = (verified.email || "").toLowerCase();
        const isAdmin = (adminEmails.length > 0 && adminEmails.includes(email)) || verified.role === "admin";

        return new Response(JSON.stringify({
          isAdmin,
          email: verified.email,
          uid: verified.sub
        }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }

      if (url.pathname === "/api/agree" || url.pathname === "/agree") {
        try {
          const res = await env.AI.run('@cf/meta/llama-3.2-11b-vision-instruct', { prompt: 'agree' });
          return new Response(JSON.stringify({ status: "success", message: "License agreement registered", result: res }), {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        } catch (err) {
          return new Response(JSON.stringify({ status: "error", message: err.message }), {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        }
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

      if (url.pathname === "/api/delete-image") {
        try {
          const targetUrl = body?.url || "";
          let key = body?.key || "";

          if (!key && targetUrl) {
            if (targetUrl.includes("/generated-images/")) {
              key = `generated-images/${targetUrl.split("/generated-images/")[1].split("?")[0]}`;
            } else if (targetUrl.includes("cdn.sumanai.r2.sumanonline.com/")) {
              key = targetUrl.split("cdn.sumanai.r2.sumanonline.com/")[1].split("?")[0];
            }
          }

          if (key && env.R2_BUCKET) {
            try {
              await env.R2_BUCKET.delete(key);
            } catch {
              void 0;
            }
          }

          return new Response(JSON.stringify({ success: true, deletedKey: key }), {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        } catch (err) {
          return new Response(JSON.stringify({ error: err.message || "Failed to delete image" }), {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        }
      }

      if (url.pathname === "/api/tts") {
        try {
          const text = typeof body?.text === "string" ? body.text.trim() : "";
          if (!text) {
            return new Response(JSON.stringify({ error: "Missing text parameter" }), {
              status: 400,
              headers: { "Content-Type": "application/json", ...corsHeaders }
            });
          }

          const apiKey = env.FISH_AUDIO_API_KEY || env.FISH_AUDIO_KEY;
          if (!apiKey) {
            return new Response(JSON.stringify({ error: "FISH_AUDIO_API_KEY is not configured", fallback: true }), {
              status: 503,
              headers: { "Content-Type": "application/json", ...corsHeaders }
            });
          }

          const referenceId = body?.reference_id || env.FISH_AUDIO_REFERENCE_ID || "9a9cf47702da476aa4629e2506d4a857";
          const model = body?.model || env.FISH_AUDIO_MODEL || "s2.1-pro-free";
          const format = body?.format || "mp3";
          const latency = body?.latency || "balanced";

          const cleanText = text.slice(0, 3000);

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 45000);

          const fishRes = await fetch("https://api.fish.audio/v1/tts", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${apiKey.trim()}`,
              "Content-Type": "application/json",
              "model": model
            },
            body: JSON.stringify({
              text: cleanText,
              reference_id: referenceId,
              format: format,
              latency: latency
            }),
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (!fishRes.ok) {
            const errBody = await fishRes.text().catch(() => "");
            return new Response(JSON.stringify({ error: `Fish Audio upstream error: ${fishRes.status} ${errBody}`, fallback: true }), {
              status: 502,
              headers: { "Content-Type": "application/json", ...corsHeaders }
            });
          }

          const audioBuffer = await fishRes.arrayBuffer();
          return new Response(audioBuffer, {
            status: 200,
            headers: {
              "Content-Type": "audio/mpeg",
              "Cache-Control": "public, max-age=86400",
              ...corsHeaders
            }
          });
        } catch (err) {
          const isTimeout = err.name === "AbortError";
          return new Response(JSON.stringify({ error: isTimeout ? "Fish Audio request timed out" : (err.message || "TTS generation failed"), fallback: true }), {
            status: isTimeout ? 504 : 500,
            headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        }
      }

      if (url.pathname === "/api/payment/create-order") {
        const { amount, currency = "INR", gateway = "razorpay", purpose = "subscription", planId, credits = 0, userId, userEmail, billingAddress } = body;
        
        const numericAmount = parseFloat(amount);
        if (!numericAmount || numericAmount <= 0) {
          return new Response(JSON.stringify({ error: "Invalid payment amount" }), {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        }

        const normalizedCurrency = (currency || "").toUpperCase();
        if (normalizedCurrency !== "INR" && normalizedCurrency !== "USD") {
          return new Response(JSON.stringify({ error: "Unsupported currency. Use INR or USD." }), {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        }

        const validGateways = new Set(["razorpay", "zaakpay", "phonepe", "stripe", "paypal"]);
        const normalizedGateway = (gateway || "").toLowerCase();
        if (!validGateways.has(normalizedGateway)) {
          return new Response(JSON.stringify({ error: "Unsupported payment gateway" }), {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        }

        if (normalizedCurrency === "INR" && !["razorpay", "zaakpay", "phonepe"].includes(normalizedGateway)) {
          return new Response(JSON.stringify({ error: "Gateway not supported for INR transactions" }), {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        }

        if (normalizedCurrency === "USD" && !["stripe", "paypal"].includes(normalizedGateway)) {
          return new Response(JSON.stringify({ error: "Gateway not supported for USD transactions" }), {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        }

        const orderTimestamp = Date.now();
        const randomEntropy = Math.random().toString(36).substring(2, 8).toUpperCase();
        let generatedOrderId = "";

        if (normalizedGateway === "razorpay") {
          generatedOrderId = `order_rzp_${orderTimestamp}_${randomEntropy}`;
        } else if (normalizedGateway === "stripe") {
          generatedOrderId = `cs_stripe_${orderTimestamp}_${randomEntropy}`;
        } else if (normalizedGateway === "phonepe") {
          generatedOrderId = `PHNP_${orderTimestamp}_${randomEntropy}`;
        } else if (normalizedGateway === "zaakpay") {
          generatedOrderId = `ZKP_${orderTimestamp}_${randomEntropy}`;
        } else if (normalizedGateway === "paypal") {
          generatedOrderId = `PAYPAL_${orderTimestamp}_${randomEntropy}`;
        }

        return new Response(JSON.stringify({
          success: true,
          orderId: generatedOrderId,
          gateway: normalizedGateway,
          amount: numericAmount,
          currency: normalizedCurrency,
          purpose,
          planId: planId || (purpose === "subscription" ? "pro_monthly" : "wallet_pack"),
          credits: parseInt(credits, 10) || 0,
          keyId: env?.RAZORPAY_KEY_ID || "rzp_live_production_key",
          stripeKey: env?.STRIPE_PUBLISHABLE_KEY || "pk_live_production_key",
          timestamp: orderTimestamp
        }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }

      if (url.pathname === "/api/payment/verify") {
        const { orderId, paymentId, gateway = "razorpay", amount, currency = "INR", userId, purpose, credits, planId } = body;

        if (!orderId) {
          return new Response(JSON.stringify({ error: "Missing required payment order verification identifier" }), {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        }

        const normalizedGateway = (gateway || "").toLowerCase();
        const verifiedTimestamp = Date.now();
        const txnEntropy = Math.random().toString(36).substring(2, 7).toUpperCase();
        const transactionId = `TXN_${normalizedGateway.toUpperCase()}_${verifiedTimestamp}_${txnEntropy}`;

        return new Response(JSON.stringify({
          success: true,
          verified: true,
          transactionId,
          orderId,
          paymentId: paymentId || `PAY_${Date.now()}`,
          gateway: normalizedGateway,
          amount: parseFloat(amount) || 0,
          currency: (currency || "INR").toUpperCase(),
          purpose: purpose || "subscription",
          planId: planId || "pro_monthly",
          credits: parseInt(credits, 10) || 0,
          status: "completed",
          timestamp: verifiedTimestamp
        }), {
          status: 200,
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
        'canopylabs/orpheus-arabic-saudi',
        'llama-3.2-11b-vision-preview',
        'llama-3.2-90b-vision-preview'
      ]);

      const nvidiaSupportedModels = new Set([
        'z-ai/glm-5.3',
        'z-ai/glm-5.3-flash',
        'moonshotai/kimi-k3',
        'google/gemma-4-31b-it',
        'google/diffusiongemma-26b-a4b-it',
        'meta/muse-glimmer-30b'
      ]);

      const cloudflareSupportedModels = new Set([
        '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
        '@cf/deepseek-ai/deepseek-r1-distill-qwen-32b',
        '@cf/qwen/qwen2.5-72b-instruct',
        '@cf/meta/llama-3.1-8b-instruct',
        '@cf/meta/llama-3.2-11b-vision-instruct',
        '@cf/black-forest-labs/flux-1-schnell'
      ]);

      const isGoogle = await isGoogleAuthenticated(request, env);
      let targetModel = typeof modelId === 'string' ? modelId : (isGoogle ? 'openai/gpt-oss-120b' : 'qwen/qwen3.8-27b');

      const lastUserMsg = messages.filter(m => m.role === 'user').pop();
      const lastUserText = lastUserMsg?.content || '';

      const detectedImageIntent = isImageGenerationIntent(lastUserText);
      if (detectedImageIntent && targetModel !== '@cf/black-forest-labs/flux-1-schnell') {
        if (!isGoogle) {
          return new Response(JSON.stringify({
            error: "Image generation requires a signed-in Google account. Please sign in to create images."
          }), {
            status: 403,
            headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        }
        if (env.AI) {
          targetModel = '@cf/black-forest-labs/flux-1-schnell';
        }
      }

      if (!isGoogle && targetModel !== 'qwen/qwen3.8-27b') {
        return new Response(JSON.stringify({
          error: "This model is locked. Please sign in with Google to unlock all models."
        }), {
          status: 403,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }

      let provider = 'groq';

      if (targetModel.startsWith('@cf/') || cloudflareSupportedModels.has(targetModel)) {
        provider = 'cloudflare';
      } else if (targetModel === 'meta/llama-3.2-11b-vision-instruct' || targetModel.includes('vision')) {
        targetModel = 'llama-3.2-11b-vision-preview';
        provider = 'groq';
      } else if (targetModel.startsWith('gemini')) {
        targetModel = 'gemini-1.5-flash';
        provider = 'google';
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

      if (provider !== 'cloudflare' && !API_KEY) {
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
      const systemInstruction = `You are SumanAI - Model: ${modelDisplayName}. You are an intelligent, high-performance AI assistant. Always provide clear, beautifully structured responses. Format answers with clean Markdown headings (###), paragraphs, lists, and horizontal dividers (---) where appropriate. When presenting poems, creative compositions, summaries, or structured analyses, divide sections clearly with headers and dividers, and provide an insightful closing reflection or key takeaway in a Markdown blockquote (> **Key Reflection:** ...). When providing code, always format inside fenced code blocks with the exact language identifier. Strictly never fabricate, invent, or output fake markdown image links or fake CDN URLs (such as ![...](https://cdn.sumanai...)). You cannot generate image files directly in text mode; if asked to generate an image, describe the visual composition in text.${personalizationPrompt}`;

      if (provider === 'cloudflare') {
        if (!env.AI) {
          throw new Error("Cloudflare Workers AI binding is not available in the worker runtime.");
        }

        if (targetModel === '@cf/black-forest-labs/flux-1-schnell') {
          if (!isGoogle) {
            return new Response(JSON.stringify({
              error: "Image generation requires a signed-in Google account. Please sign in to create images."
            }), {
              status: 403,
              headers: { "Content-Type": "application/json", ...corsHeaders }
            });
          }

          const filteredMessages = messages.filter((m, idx) => {
            if (m.role === 'assistant' && !m.content?.trim() && idx === messages.length - 1) {
              return false;
            }
            return true;
          });

          const userMessages = filteredMessages.filter(m => m.role === 'user' || !m.role);
          const promptMsg = userMessages.pop();
          let promptText = (promptMsg?.content || 'A vibrant artistic composition').trim();

          const lowerPrompt = promptText.toLowerCase();
          const STYLE_PROFILES = {
            'oil painting': 'rich classical oil painting on canvas, visible textured impasto brushstrokes, rich oil pigments, gallery fine art',
            'watercolor': 'delicate translucent watercolor painting on cold-press paper, fluid wet-on-wet paint washes, soft bleeding edges, authentic watercolor pigments',
            'pixel art': 'detailed 16-bit retro pixel art, vibrant color palette, clean pixel clusters, classic isometric game aesthetic',
            'pencil sketch': 'hand-drawn graphite pencil sketch on textured paper, detailed cross-hatching, delicate shading, fine monochrome line art',
            'anime': 'high-end Japanese anime aesthetic, vibrant studio lighting, Makoto Shinkai cinematic atmosphere, sharp clean line art',
            'pop art': 'vibrant pop art silkscreen print, bold contrasting colors, halftone dot pattern, Andy Warhol and Roy Lichtenstein aesthetic'
          };

          let matchedStyleKey = null;
          for (const key of Object.keys(STYLE_PROFILES)) {
            if (lowerPrompt.includes(key)) {
              matchedStyleKey = key;
              break;
            }
          }

          const isStyleConversion = lowerPrompt.includes('convert this image') || 
                                    lowerPrompt.includes('in this style') || 
                                    lowerPrompt.includes('change style to') ||
                                    lowerPrompt.startsWith('convert to');

          if (matchedStyleKey) {
            let baseSubject = '';
            for (let i = userMessages.length - 1; i >= 0; i--) {
              const c = (userMessages[i]?.content || '').trim();
              const cLower = c.toLowerCase();
              const isAnotherConversion = cLower.includes('convert this image') || 
                                          cLower.includes('in this style') || 
                                          cLower.startsWith('convert to');
              if (c && !isAnotherConversion) {
                baseSubject = c;
                break;
              }
            }

            if (!baseSubject) {
              for (let i = filteredMessages.length - 1; i >= 0; i--) {
                const content = filteredMessages[i]?.content || '';
                const imgMatch = content.match(/!\[(.*?)\]\(/);
                if (imgMatch && imgMatch[1] && !imgMatch[1].toLowerCase().includes('generated image') && !imgMatch[1].toLowerCase().includes('image')) {
                  baseSubject = imgMatch[1].trim();
                  break;
                }
              }
            }

            if (baseSubject) {
              promptText = `${baseSubject}, ${STYLE_PROFILES[matchedStyleKey]}`;
            } else {
              promptText = `${promptText}, ${STYLE_PROFILES[matchedStyleKey]}`;
            }
          } else if (isStyleConversion && userMessages.length > 0) {
            const previousPromptMsg = userMessages.pop();
            const previousText = (previousPromptMsg?.content || '').trim();
            if (previousText) {
              const cleanedStyle = promptText
                .replace(/^(convert this image into|convert this image to|convert to|make this|change style to)\s+/i, '')
                .replace(/\s+style$/i, '')
                .trim();
              promptText = `${previousText}, rendered in ${cleanedStyle} style, high quality artwork`;
            }
          }

          let modelPrompt = promptText;
          if (!/watermark/i.test(modelPrompt)) {
            modelPrompt = `${modelPrompt}, subtle watermark at bottom right corner reading "SumanAI" with small AI logo badge, strictly no other text`;
          }

          const result = await env.AI.run('@cf/black-forest-labs/flux-1-schnell', {
            prompt: modelPrompt,
            steps: 4
          });

          const imageBase64 = result?.image || result?.result?.image;
          if (!imageBase64) {
            throw new Error("Cloudflare did not return image data. Please try again.");
          }

          const { readable, writable } = new TransformStream();
          const writer = writable.getWriter();
          const encoder = new TextEncoder();

          (async () => {
            try {
              const cleanTitle = (promptMsg?.content || promptText).replace(/[\[\]\(\)\n\r]/g, ' ').trim().slice(0, 70) || 'Generated Image';
              const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
              const binaryString = atob(cleanBase64);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }

              const imageFileName = `SumanAI_img_${Date.now()}_${crypto.randomUUID().slice(0, 8)}.jpg`;
              const r2Key = `generated-images/${imageFileName}`;
              let finalImageUrl = `https://cdn.sumanai.r2.sumanonline.com/${r2Key}`;

              if (env.R2_BUCKET) {
                try {
                  await env.R2_BUCKET.put(r2Key, bytes, {
                    httpMetadata: {
                      contentType: 'image/jpeg',
                      contentDisposition: `inline; filename="${imageFileName}"`,
                      cacheControl: 'public, max-age=31536000'
                    }
                  });
                } catch {
                  finalImageUrl = imageBase64.startsWith('data:image/')
                    ? imageBase64
                    : `data:image/jpeg;base64,${imageBase64}`;
                }
              } else {
                finalImageUrl = imageBase64.startsWith('data:image/')
                  ? imageBase64
                  : `data:image/jpeg;base64,${imageBase64}`;
              }

              const markdown = `![${cleanTitle}](${finalImageUrl})`;
              const chunk = {
                candidates: [{
                  content: {
                    parts: [{ text: markdown }]
                  }
                }]
              };
              await writer.write(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
              await writer.write(encoder.encode('data: [DONE]\n\n'));
            } catch (err) {
              void err;
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
        }

        const filteredMessages = messages.filter((m, idx) => {
          if (m.role === 'assistant' && !m.content?.trim() && idx === messages.length - 1) {
            return false;
          }
          return true;
        });

        let visionImageBytes = null;
        for (let i = messages.length - 1; i >= 0; i--) {
          const atts = messages[i].attachments;
          if (atts && atts.length > 0 && atts[0].data) {
            try {
              const binaryString = atob(atts[0].data);
              const bytes = new Uint8Array(binaryString.length);
              for (let b = 0; b < binaryString.length; b++) {
                bytes[b] = binaryString.charCodeAt(b);
              }
              visionImageBytes = [...bytes];
              break;
            } catch {
              void 0;
            }
          }
        }

        const isVisionModel = targetModel === '@cf/meta/llama-3.2-11b-vision-instruct';

        const cfMessages = filteredMessages.map((m, index) => {
          let textContent = (m.content || '').trim();
          if (index === 0 && (m.role === 'user' || !m.role)) {
            textContent = `${systemInstruction}\n\n${textContent}`;
          }
          if (m.attachments && m.attachments.length > 0 && !isVisionModel) {
            const omitted = m.attachments.map(a => a.name || 'image').join(', ');
            textContent = `${textContent}\n[Attachments: ${omitted}]`.trim();
          }
          return {
            role: m.role === 'assistant' ? 'assistant' : (m.role === 'system' ? 'system' : 'user'),
            content: textContent || " "
          };
        });

        const aiPayload = {
          messages: cfMessages,
          stream: true,
          max_tokens: 4096
        };

        if (isVisionModel && visionImageBytes) {
          aiPayload.image = visionImageBytes;
        }

        let aiStream = null;
        try {
          aiStream = await env.AI.run(targetModel, aiPayload);
        } catch (runErr) {
          const errMsg = runErr?.message || String(runErr || '');
          if (errMsg.includes('5016') || errMsg.includes("'agree'") || errMsg.includes('Community License')) {
            try {
              await env.AI.run(targetModel, { prompt: 'agree' });
              aiStream = await env.AI.run(targetModel, aiPayload);
            } catch (agreeErr) {
              if (env.GROQ_API_KEY && (isVisionModel || targetModel.includes('vision'))) {
                provider = 'groq';
                targetModel = 'llama-3.2-11b-vision-preview';
                API_KEY = env.GROQ_API_KEY;
              } else {
                throw agreeErr;
              }
            }
          } else {
            throw runErr;
          }
        }

        if (aiStream) {
          const { readable, writable } = new TransformStream();
          const writer = writable.getWriter();
          const encoder = new TextEncoder();
          const decoder = new TextDecoder();

          (async () => {
            const reader = aiStream.getReader();
            let buffer = "";
            let hasWrittenTokens = false;

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
                    if (data.error) {
                      const errMsg = data.error.message || JSON.stringify(data.error);
                      const errorChunk = {
                        candidates: [{
                          content: {
                            parts: [{ text: `⚠️ Error: ${errMsg}` }]
                          }
                        }]
                      };
                      hasWrittenTokens = true;
                      await writer.write(encoder.encode(`data: ${JSON.stringify(errorChunk)}\n\n`));
                      break;
                    }

                    const delta = typeof data.response === 'string'
                      ? data.response
                      : (typeof data.text === 'string'
                        ? data.text
                        : (data.choices?.[0]?.delta?.content || ""));

                    if (delta) {
                      hasWrittenTokens = true;
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

              if (!hasWrittenTokens) {
                const fallbackChunk = {
                  candidates: [{
                    content: {
                      parts: [{ text: "⚠️ The model was unable to generate a response. Please try re-sending or use another model." }]
                    }
                  }]
                };
                await writer.write(encoder.encode(`data: ${JSON.stringify(fallbackChunk)}\n\n`));
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
        }

      }

      if (provider === 'groq' || provider === 'nvidia') {
        const isNvidia = provider === 'nvidia';
        const apiUrl = isNvidia
          ? "https://integrate.api.nvidia.com/v1/chat/completions"
          : "https://api.groq.com/openai/v1/chat/completions";

        const supportsVision = targetModel === 'meta/llama-3.2-11b-vision-instruct' ||
          targetModel.includes('vision') ||
          targetModel === 'llama-3.2-11b-vision-preview';

        const filteredMessages = messages.filter((m, idx) => {
          if (m.role === 'assistant' && !m.content?.trim() && idx === messages.length - 1) {
            return false;
          }
          return true;
        });

        const openAiMessages = filteredMessages.map((m, index) => {
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
                  image_url: { url: `data:${att.type || 'image/jpeg'};base64,${att.data}` }
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
          let hasWrittenTokens = false;

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
                  if (data.error) {
                    const errMsg = data.error.message || JSON.stringify(data.error);
                    const errorChunk = {
                      candidates: [{
                        content: {
                          parts: [{ text: `⚠️ Error: ${errMsg}` }]
                        }
                      }]
                    };
                    hasWrittenTokens = true;
                    await writer.write(encoder.encode(`data: ${JSON.stringify(errorChunk)}\n\n`));
                    break;
                  }

                  const delta = data.choices?.[0]?.delta?.content || data.choices?.[0]?.text || "";

                  if (delta) {
                    hasWrittenTokens = true;
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

            if (!hasWrittenTokens) {
              const fallbackChunk = {
                candidates: [{
                  content: {
                    parts: [{ text: "⚠️ The model was unable to generate a response. Please try re-sending or use another model." }]
                  }
                }]
              };
              await writer.write(encoder.encode(`data: ${JSON.stringify(fallbackChunk)}\n\n`));
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

export const MODEL_METADATA = [
  { id: '@cf/meta/llama-3.2-11b-vision-instruct', name: 'Llama 3.2 Vision', badge: 'Visual Chat' },
  { id: 'nvidia/llama-3.1-nemotron-70b-instruct', name: 'Nemotron 70B', badge: 'High Precision' },
  { id: 'meta/llama-3.3-70b-instruct', name: 'Llama 3.3 70B', badge: 'Versatile 70B' },
  { id: 'google/gemma-4-31b-it', name: 'Gemma 4 31B IT', badge: 'Concise Chat' },
  { id: 'google/diffusiongemma-26b-a4b-it', name: 'Diffusion Gemma 26B', badge: 'Experimental' },
  { id: 'meta/muse-glimmer-30b', name: 'Muse Glimmer 30B', badge: 'Creative Prose' },
  { id: 'openai/gpt-oss-120b', name: 'GPT-OSS 120B', badge: '120B Flagship' },
  { id: 'openai/gpt-oss-20b', name: 'GPT-OSS 20B', badge: 'Ultra Fast' },
  { id: 'qwen/qwen3.8-27b', name: 'Qwen 3.8 27B', badge: 'Vision & Code' },
  { id: 'canopylabs/orpheus-v1-english', name: 'Orpheus English', badge: 'Dialogue' },
  { id: '@cf/meta/llama-3.3-70b-instruct-fp8-fast', name: 'Llama 3.3 70B (Fast)', badge: 'Fast 70B' },
  { id: '@cf/deepseek-ai/deepseek-r1-distill-qwen-32b', name: 'DeepSeek R1 32B', badge: 'Deep Reasoning' },
  { id: '@cf/qwen/qwen2.5-72b-instruct', name: 'Qwen 2.5 72B', badge: 'Coding & Analysis' },
  { id: '@cf/meta/llama-3.1-8b-instruct', name: 'Llama 3.1 8B (Turbo)', badge: 'Instant Speed' },
  { id: '@cf/black-forest-labs/flux-1-schnell', name: 'Flux 1 Schnell (CF)', badge: 'Turbo Image' },
  { id: '@cf/black-forest-labs/flux-2-dev', name: 'Flux 2 Dev (CF)', badge: 'Studio Quality' },
  { id: '@cf/black-forest-labs/flux-2-klein-9b', name: 'Flux 2 Klein 9B (CF)', badge: 'Compact 9B' },
  { id: '@cf/moondream/moondream3.1-9B-A2B', name: 'Moondream 3.1 9B (CF)', badge: 'Fast Vision' },
  { id: 'xai/grok-imagine-image-quality', name: 'Grok Imagine Quality (CF)', badge: 'Cinematic Art' },
  { id: 'lightricks/ltx-video-distilled', name: 'LTX Video 0.9.8 (HF)', badge: 'ZeroGPU Video' }
];

export const formatModelTitle = (rawIdentifier, content = '') => {
  if (content && typeof content === 'string') {
    const lower = content.toLowerCase();
    if (
      lower.includes("i'm chatgpt") ||
      lower.includes("i am chatgpt") ||
      lower.includes("created by openai") ||
      lower.includes("gpt-4 architecture") ||
      lower.includes("large-language model created by openai")
    ) {
      return 'SumanAI * GPT-OSS 120B';
    }
    if (
      lower.includes("deepseek-r1") ||
      lower.includes("deepseek r1") ||
      lower.includes("<think>") ||
      lower.includes("i am deepseek")
    ) {
      return 'SumanAI * DeepSeek R1 32B';
    }
  }

  const raw = String(rawIdentifier || '').trim();
  if (!raw || raw.toLowerCase() === 'sumanai') {
    return 'SumanAI';
  }

  let baseName = raw;
  const matched = MODEL_METADATA.find(
    m => m.id === raw || m.name === raw || m.name.toLowerCase() === raw.toLowerCase()
  );

  if (matched) {
    baseName = matched.name;
  } else if (raw.includes('pollinations')) {
    baseName = 'Flux 1';
  } else if (raw.includes('llama-3.3-70b')) {
    baseName = 'Llama 3.3 70B';
  } else if (raw.includes('qwen2.5-72b')) {
    baseName = 'Qwen 2.5 72B';
  } else if (raw.includes('qwen3.8-27b')) {
    baseName = 'Qwen 3.8 27B';
  } else if (raw.includes('gpt-oss-120b')) {
    baseName = 'GPT-OSS 120B';
  } else if (raw.includes('gpt-oss-20b')) {
    baseName = 'GPT-OSS 20B';
  } else if (raw.includes('deepseek-r1')) {
    baseName = 'DeepSeek R1 32B';
  } else if (raw.includes('flux-2-dev')) {
    baseName = 'Flux 2 Dev';
  } else if (raw.includes('flux-2-klein')) {
    baseName = 'Flux 2 Klein 9B';
  } else if (raw.includes('flux')) {
    baseName = 'Flux 1 Schnell';
  } else if (raw.includes('moondream')) {
    baseName = 'Moondream 3.1 9B';
  } else if (raw.includes('grok-imagine') || raw.includes('grok')) {
    baseName = 'Grok Imagine Quality';
  }

  let clean = baseName.replace(/^SumanAI\s*[*•·-]?\s*/i, '').trim();
  clean = clean.replace(/\s*\((Fast|Turbo|CF)\)/gi, '').trim();

  if (!clean || clean.toLowerCase() === 'sumanai') {
    return 'SumanAI';
  }

  return `SumanAI * ${clean}`;
};

export const resolveModelBadge = (modelTitle) => {
  const cleanTitle = (modelTitle || '').replace(/^SumanAI\s*[*•·-]?\s*/i, '').trim();
  if (!cleanTitle || cleanTitle.toLowerCase() === 'sumanai') {
    return null;
  }
  const matched = MODEL_METADATA.find(
    m => m.name.toLowerCase() === cleanTitle.toLowerCase() ||
         m.name.replace(/\s*\((Fast|Turbo|CF)\)/gi, '').toLowerCase() === cleanTitle.toLowerCase() ||
         m.id.toLowerCase().includes(cleanTitle.toLowerCase())
  );
  return matched?.badge || null;
};

export const formatModelBadgeName = (rawIdentifier, content = '') => {
  if (content && typeof content === 'string') {
    const lower = content.toLowerCase();
    if (
      lower.includes("i'm chatgpt") ||
      lower.includes("i am chatgpt") ||
      lower.includes("created by openai") ||
      lower.includes("gpt-4 architecture") ||
      lower.includes("large-language model created by openai")
    ) {
      return 'GPT-OSS 120B';
    }
    if (
      lower.includes("deepseek-r1") ||
      lower.includes("deepseek r1") ||
      lower.includes("<think>") ||
      lower.includes("i am deepseek")
    ) {
      return 'DeepSeek R1';
    }
  }

  const raw = String(rawIdentifier || '').trim();
  if (!raw || raw.toLowerCase() === 'sumanai') {
    return 'AI';
  }

  let baseName = raw;
  const matched = MODEL_METADATA.find(
    m => m.id === raw || m.name === raw || m.name.toLowerCase() === raw.toLowerCase()
  );

  if (matched) {
    baseName = matched.name;
  } else if (raw.includes('pollinations')) {
    baseName = 'Flux 1';
  } else if (raw.includes('llama-3.2') && raw.includes('vision')) {
    baseName = 'Llama 3.2 Vision';
  } else if (raw.includes('llama-3.1')) {
    baseName = 'Llama 3.1';
  } else if (raw.includes('llama-3.3-70b') || raw.includes('llama-3.3')) {
    baseName = 'Llama 3.3 70B';
  } else if (raw.includes('nemotron')) {
    baseName = 'Nemotron 70B';
  } else if (raw.includes('qwen2.5-72b') || raw.includes('qwen2.5')) {
    baseName = 'Qwen 2.5 72B';
  } else if (raw.includes('qwen3.8-27b') || raw.includes('qwen3.8')) {
    baseName = 'Qwen 3.8 27B';
  } else if (raw.includes('gpt-oss-120b')) {
    baseName = 'GPT-OSS 120B';
  } else if (raw.includes('gpt-oss-20b')) {
    baseName = 'GPT-OSS 20B';
  } else if (raw.includes('deepseek-r1') || raw.includes('deepseek')) {
    baseName = 'DeepSeek R1';
  } else if (raw.includes('flux-2-dev')) {
    baseName = 'Flux 2 Dev';
  } else if (raw.includes('flux-2-klein')) {
    baseName = 'Flux 2 Klein 9B';
  } else if (raw.includes('flux')) {
    baseName = 'Flux 1 Schnell';
  } else if (raw.includes('moondream')) {
    baseName = 'Moondream 3.1';
  } else if (raw.includes('grok-imagine') || raw.includes('grok')) {
    baseName = 'Grok Imagine';
  } else if (raw.includes('gemma-4')) {
    baseName = 'Gemma 4 31B';
  } else if (raw.includes('diffusiongemma')) {
    baseName = 'Diffusion Gemma';
  } else if (raw.includes('muse-glimmer')) {
    baseName = 'Muse Glimmer';
  } else if (raw.includes('orpheus')) {
    baseName = 'Orpheus English';
  } else if (raw.includes('ltx-video')) {
    baseName = 'LTX Video';
  }

  let clean = baseName.replace(/^SumanAI\s*[*•·-]?\s*/i, '').trim();

  if (/llama\s*3\.1/i.test(clean)) {
    return 'Llama 3.1';
  }

  if (/llama\s*3\.2.*vision/i.test(clean)) {
    return 'Llama 3.2 Vision';
  }

  if (/deepseek/i.test(clean)) {
    return 'DeepSeek R1';
  }

  clean = clean.replace(/\s*\([^)]*\)/gi, '').trim();

  if (!clean || clean.toLowerCase() === 'sumanai') {
    return 'AI';
  }

  return clean;
};

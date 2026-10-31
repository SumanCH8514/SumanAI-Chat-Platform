export const MODEL_METADATA = [
  { id: '@cf/meta/llama-3.2-11b-vision-instruct', name: 'Llama 3.2 Vision', badge: 'Vision' },
  { id: 'nvidia/llama-3.1-nemotron-70b-instruct', name: 'Nemotron 70B', badge: 'NVIDIA' },
  { id: 'meta/llama-3.3-70b-instruct', name: 'Llama 3.3 70B', badge: 'NVIDIA' },
  { id: 'google/gemma-4-31b-it', name: 'Gemma 4 31B IT', badge: 'Google' },
  { id: 'google/diffusiongemma-26b-a4b-it', name: 'Diffusion Gemma 26B', badge: 'Google' },
  { id: 'meta/muse-glimmer-30b', name: 'Muse Glimmer 30B', badge: 'Meta' },
  { id: 'openai/gpt-oss-120b', name: 'GPT-OSS 120B', badge: 'Default' },
  { id: 'openai/gpt-oss-20b', name: 'GPT-OSS 20B', badge: 'Fast' },
  { id: 'qwen/qwen3.8-27b', name: 'Qwen 3.8 27B', badge: 'Qwen' },
  { id: 'canopylabs/orpheus-v1-english', name: 'Orpheus English', badge: 'Canopy' },
  { id: '@cf/meta/llama-3.3-70b-instruct-fp8-fast', name: 'Llama 3.3 70B (Fast)', badge: 'CF 70B' },
  { id: '@cf/deepseek-ai/deepseek-r1-distill-qwen-32b', name: 'DeepSeek R1 32B', badge: 'Reasoning' },
  { id: '@cf/qwen/qwen2.5-72b-instruct', name: 'Qwen 2.5 72B', badge: 'Flagship' },
  { id: '@cf/meta/llama-3.1-8b-instruct', name: 'Llama 3.1 8B (Turbo)', badge: 'Max Limit' },
  { id: '@cf/black-forest-labs/flux-1-schnell', name: 'Flux 1 Schnell (CF)', badge: 'Image Gen' }
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
  } else if (raw.includes('flux')) {
    baseName = 'Flux 1 Schnell';
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

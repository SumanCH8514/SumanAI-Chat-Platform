import {
  IconOpenAI,
  IconGroq,
  IconGemini,
  IconMeta,
  IconNvidia,
  IconCloudflare,
  IconDeepSeek,
  IconXAI
} from './ModelIcons.jsx';

export const MODEL_LIST = [
  { id: '@cf/meta/llama-3.2-11b-vision-instruct', name: 'Llama 3.2 Vision', locked: false, badge: 'Visual Chat', icon: IconMeta, supportsVision: true, supportsImageGen: false, tier: 'free' },
  { id: 'nvidia/llama-3.1-nemotron-70b-instruct', name: 'Nemotron 70B', locked: false, badge: 'High Precision', icon: IconNvidia, supportsVision: false, supportsImageGen: false, tier: 'free' },
  { id: 'meta/llama-3.3-70b-instruct', name: 'Llama 3.3 70B', locked: false, badge: 'Versatile 70B', icon: IconMeta, supportsVision: false, supportsImageGen: false, tier: 'free' },
  { id: 'google/gemma-4-31b-it', name: 'Gemma 4 31B IT', locked: false, badge: 'Concise Chat', icon: IconGemini, supportsVision: false, supportsImageGen: false, tier: 'free' },
  { id: 'google/diffusiongemma-26b-a4b-it', name: 'Diffusion Gemma 26B', locked: false, badge: 'Experimental', icon: IconGemini, supportsVision: false, supportsImageGen: false, tier: 'free' },
  { id: 'meta/muse-glimmer-30b', name: 'Muse Glimmer 30B', locked: false, badge: 'Creative Prose', icon: IconMeta, supportsVision: false, supportsImageGen: false, tier: 'free' },
  { id: 'openai/gpt-oss-120b', name: 'GPT-OSS 120B', locked: false, badge: '120B Flagship', icon: IconOpenAI, supportsVision: false, supportsImageGen: false, tier: 'free' },
  { id: 'openai/gpt-oss-20b', name: 'GPT-OSS 20B', locked: false, badge: 'Ultra Fast', icon: IconOpenAI, supportsVision: false, supportsImageGen: false, tier: 'free' },
  { id: 'qwen/qwen3.8-27b', name: 'Qwen 3.8 27B', locked: false, badge: 'Vision & Code', icon: IconGroq, supportsVision: true, supportsImageGen: false, tier: 'free' },
  { id: 'canopylabs/orpheus-v1-english', name: 'Orpheus English', locked: false, badge: 'Dialogue', icon: IconGroq, supportsVision: false, supportsImageGen: false, tier: 'free' },
  { id: '@cf/meta/llama-3.3-70b-instruct-fp8-fast', name: 'Llama 3.3 70B (Fast)', locked: false, badge: 'Fast 70B', icon: IconMeta, supportsVision: false, supportsImageGen: false, tier: 'premium' },
  { id: '@cf/deepseek-ai/deepseek-r1-distill-qwen-32b', name: 'DeepSeek R1 32B', locked: false, badge: 'Deep Reasoning', icon: IconDeepSeek, supportsVision: false, supportsImageGen: false, tier: 'premium' },
  { id: '@cf/qwen/qwen2.5-72b-instruct', name: 'Qwen 2.5 72B', locked: false, badge: 'Coding & Analysis', icon: IconCloudflare, supportsVision: false, supportsImageGen: false, tier: 'premium' },
  { id: '@cf/meta/llama-3.1-8b-instruct', name: 'Llama 3.1 8B (Turbo)', locked: false, badge: 'Instant Speed', icon: IconCloudflare, supportsVision: false, supportsImageGen: false, tier: 'premium' },
  { id: '@cf/black-forest-labs/flux-1-schnell', name: 'Flux 1 Schnell (CF)', locked: false, badge: 'Turbo Image', icon: IconCloudflare, supportsVision: false, supportsImageGen: true, tier: 'premium' },
  { id: '@cf/black-forest-labs/flux-2-dev', name: 'Flux 2 Dev (CF)', locked: false, badge: 'Studio Quality', icon: IconCloudflare, supportsVision: false, supportsImageGen: true, tier: 'premium' },
  { id: '@cf/black-forest-labs/flux-2-klein-9b', name: 'Flux 2 Klein 9B (CF)', locked: false, badge: 'Compact 9B', icon: IconCloudflare, supportsVision: false, supportsImageGen: true, tier: 'premium' },
  { id: '@cf/moondream/moondream3.1-9B-A2B', name: 'Moondream 3.1 9B (CF)', locked: false, badge: 'Fast Vision', icon: IconCloudflare, supportsVision: true, supportsImageGen: false, tier: 'free' },
  { id: 'xai/grok-imagine-image-quality', name: 'Grok Imagine Quality (CF)', locked: false, badge: 'Cinematic Art', icon: IconCloudflare, supportsVision: false, supportsImageGen: true, tier: 'premium' }
];

export const DEFAULT_VISION_MODEL = MODEL_LIST.find(m => m.id === '@cf/meta/llama-3.2-11b-vision-instruct') || MODEL_LIST.find(m => m.supportsVision);
export const DEFAULT_IMAGE_GEN_MODEL = MODEL_LIST.find(m => m.id === '@cf/black-forest-labs/flux-1-schnell') || MODEL_LIST.find(m => m.supportsImageGen);

export { formatModelTitle, resolveModelBadge } from '../utils/modelUtils.js';

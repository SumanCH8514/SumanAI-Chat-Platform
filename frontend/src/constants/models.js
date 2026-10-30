import { 
  IconOpenAI,
  IconGroq, 
  IconGemini,
  IconMeta,
  IconMoonshot,
  IconZai,
  IconCloudflare,
  IconDeepSeek
} from './ModelIcons.jsx';

export const MODEL_LIST = [
  { id: 'meta/llama-3.2-11b-vision-instruct',        name: 'Llama 3.2 Vision',      locked: false, badge: 'Vision',    icon: IconMeta,       supportsVision: true,  supportsImageGen: false, tier: 'free' },
  { id: 'z-ai/glm-5.3',                             name: 'GLM 5.3',              locked: false, badge: 'Z-AI',      icon: IconZai,        supportsVision: false, supportsImageGen: false, tier: 'free' },
  { id: 'z-ai/glm-5.3-flash',                       name: 'GLM 5.3 Flash',        locked: false, badge: 'Fast',      icon: IconZai,        supportsVision: false, supportsImageGen: false, tier: 'free' },
  { id: 'moonshotai/kimi-k3',                       name: 'Kimi K3',              locked: false, badge: 'Moonshot',  icon: IconMoonshot,   supportsVision: false, supportsImageGen: false, tier: 'free' },
  { id: 'google/gemma-4-31b-it',                    name: 'Gemma 4 31B IT',       locked: false, badge: 'Google',    icon: IconGemini,     supportsVision: false, supportsImageGen: false, tier: 'free' },
  { id: 'google/diffusiongemma-26b-a4b-it',         name: 'Diffusion Gemma 26B',  locked: false, badge: 'Google',    icon: IconGemini,     supportsVision: false, supportsImageGen: false, tier: 'free' },
  { id: 'meta/muse-glimmer-30b',                    name: 'Muse Glimmer 30B',     locked: false, badge: 'Meta',      icon: IconMeta,       supportsVision: false, supportsImageGen: false, tier: 'free' },
  { id: 'openai/gpt-oss-120b',                      name: 'GPT-OSS 120B',         locked: false, badge: 'Default',   icon: IconOpenAI,     supportsVision: false, supportsImageGen: false, tier: 'free' },
  { id: 'openai/gpt-oss-20b',                       name: 'GPT-OSS 20B',          locked: false, badge: 'Fast',      icon: IconOpenAI,     supportsVision: false, supportsImageGen: false, tier: 'free' },
  { id: 'qwen/qwen3.8-27b',                         name: 'Qwen 3.8 27B',         locked: false, badge: 'Qwen',      icon: IconGroq,       supportsVision: false, supportsImageGen: false, tier: 'free' },
  { id: 'canopylabs/orpheus-v1-english',             name: 'Orpheus English',      locked: false, badge: 'Canopy',    icon: IconGroq,       supportsVision: false, supportsImageGen: false, tier: 'free' },
  { id: '@cf/meta/llama-3.3-70b-instruct-fp8-fast',  name: 'Llama 3.3 70B (Fast)', locked: false, badge: 'CF 70B',    icon: IconMeta,       supportsVision: false, supportsImageGen: false, tier: 'premium' },
  { id: '@cf/deepseek-ai/deepseek-r1-distill-qwen-32b', name: 'DeepSeek R1 32B',   locked: false, badge: 'Reasoning', icon: IconDeepSeek,   supportsVision: false, supportsImageGen: false, tier: 'premium' },
  { id: '@cf/qwen/qwen2.5-72b-instruct',            name: 'Qwen 2.5 72B',         locked: false, badge: 'Flagship',  icon: IconCloudflare, supportsVision: false, supportsImageGen: false, tier: 'premium' },
  { id: '@cf/meta/llama-3.1-8b-instruct',            name: 'Llama 3.1 8B (Turbo)', locked: false, badge: 'Max Limit', icon: IconCloudflare, supportsVision: false, supportsImageGen: false, tier: 'premium' },
  { id: '@cf/meta/llama-3.2-11b-vision-instruct',   name: 'Llama 3.2 Vision (CF)', locked: false, badge: 'CF Vision', icon: IconMeta,       supportsVision: true,  supportsImageGen: false, tier: 'premium' },
  { id: '@cf/black-forest-labs/flux-1-schnell',     name: 'Flux 1 Schnell (CF)',  locked: false, badge: 'Image Gen', icon: IconCloudflare, supportsVision: false, supportsImageGen: true,  tier: 'premium' }
];

export const DEFAULT_VISION_MODEL = MODEL_LIST.find(m => m.id === '@cf/meta/llama-3.2-11b-vision-instruct') || MODEL_LIST.find(m => m.supportsVision);
export const DEFAULT_IMAGE_GEN_MODEL = MODEL_LIST.find(m => m.id === '@cf/black-forest-labs/flux-1-schnell') || MODEL_LIST.find(m => m.supportsImageGen);

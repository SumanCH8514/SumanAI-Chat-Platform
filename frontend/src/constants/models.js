import { 
  IconOpenAI,
  IconGroq, 
  IconGemini,
  IconMeta,
  IconMoonshot,
  IconZai
} from './ModelIcons.jsx';

export const MODEL_LIST = [
  { id: 'meta/llama-3.2-11b-vision-instruct',  name: 'Llama 3.2 Vision',      locked: false, badge: 'Vision',   icon: IconMeta,     supportsVision: true,  supportsImageGen: false },
  { id: 'z-ai/glm-5.3',                       name: 'GLM 5.3',              locked: false, badge: 'Z-AI',     icon: IconZai,      supportsVision: false, supportsImageGen: false },
  { id: 'z-ai/glm-5.3-flash',                 name: 'GLM 5.3 Flash',        locked: false, badge: 'Fast',     icon: IconZai,      supportsVision: false, supportsImageGen: false },
  { id: 'moonshotai/kimi-k3',                 name: 'Kimi K3',              locked: false, badge: 'Moonshot', icon: IconMoonshot, supportsVision: false, supportsImageGen: false },
  { id: 'google/gemma-4-31b-it',              name: 'Gemma 4 31B IT',       locked: false, badge: 'Google',   icon: IconGemini,   supportsVision: false, supportsImageGen: false },
  { id: 'google/diffusiongemma-26b-a4b-it',   name: 'Diffusion Gemma 26B',  locked: false, badge: 'Google',   icon: IconGemini,   supportsVision: false, supportsImageGen: false },
  { id: 'meta/muse-glimmer-30b',              name: 'Muse Glimmer 30B',     locked: false, badge: 'Meta',     icon: IconMeta,     supportsVision: false, supportsImageGen: false },
  { id: 'openai/gpt-oss-120b',                name: 'GPT-OSS 120B',         locked: false, badge: 'Default',  icon: IconOpenAI,   supportsVision: false, supportsImageGen: false },
  { id: 'openai/gpt-oss-20b',                 name: 'GPT-OSS 20B',          locked: false, badge: 'Fast',     icon: IconOpenAI,   supportsVision: false, supportsImageGen: false },
  { id: 'qwen/qwen3.8-27b',                   name: 'Qwen 3.8 27B',         locked: false, badge: 'Qwen',     icon: IconGroq,     supportsVision: false, supportsImageGen: false },
  { id: 'canopylabs/orpheus-v1-english',       name: 'Orpheus English',      locked: false, badge: 'Canopy',   icon: IconGroq,     supportsVision: false, supportsImageGen: false }
];

export const DEFAULT_VISION_MODEL = MODEL_LIST.find(m => m.supportsVision);
export const DEFAULT_IMAGE_GEN_MODEL = MODEL_LIST.find(m => m.supportsImageGen);
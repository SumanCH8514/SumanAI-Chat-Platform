import { IconGemini, IconSonar, IconOpenAI, IconClaude, IconNemotron } from './ModelIcons.jsx';

export const MODEL_LIST = [
  { id: 'gemma-3-27b-it', name: 'Gemma 3 (NVIDIA)', locked: false, badge: 'New', icon: IconNemotron },
  { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite', locked: false, badge: 'New', icon: IconGemini },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', locked: false, badge: null, icon: IconGemini },
  { id: 'gemini-3.1-flash', name: 'Gemini 3.1 Flash', locked: false, badge: 'Pro', icon: IconGemini },
  { id: 'sonar', name: 'Sonar', locked: true, badge: null, icon: IconSonar },
  { id: 'gpt-5.4', name: 'GPT-5.4', locked: true, badge: null, icon: IconOpenAI },
  { id: 'gemini-3.1-pro', name: 'Gemini 3.1 Pro', locked: false, badge: null, icon: IconGemini },
  { id: 'claude-sonnet', name: 'Claude Sonnet 4.6', locked: true, badge: null, icon: IconClaude },
  { id: 'claude-opus', name: 'Claude Opus 4.6', locked: true, badge: 'Max', icon: IconClaude },
  { id: 'nemotron', name: 'Nemotron 3 Super', locked: false, badge: null, icon: IconNemotron },
  { id: 'minimax-m2.7', name: 'Minimax-M2.7 (NVIDIA)', locked: false, badge: 'Ultra', icon: IconNemotron },
  { id: 'deepseek-v3.2', name: 'DeepSeek-V3.2 (NVIDIA)', locked: false, badge: 'Reason', icon: IconNemotron },
];
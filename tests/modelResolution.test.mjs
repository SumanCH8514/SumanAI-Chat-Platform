import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { formatModelTitle, resolveModelBadge } from '../frontend/src/utils/modelUtils.js';

describe('Real Model Resolution & SumanAI Formatting Pipeline', () => {
  it('formats model name in user-specified format: SumanAI * Llama 3.3 70B', () => {
    assert.strictEqual(formatModelTitle('Llama 3.3 70B (Fast)'), 'SumanAI * Llama 3.3 70B');
    assert.strictEqual(formatModelTitle('meta/llama-3.3-70b-instruct'), 'SumanAI * Llama 3.3 70B');
    assert.strictEqual(formatModelTitle('@cf/meta/llama-3.3-70b-instruct-fp8-fast'), 'SumanAI * Llama 3.3 70B');
  });

  it('formats model name in user-specified format: SumanAI * Qwen 2.5 72B', () => {
    assert.strictEqual(formatModelTitle('Qwen 2.5 72B'), 'SumanAI * Qwen 2.5 72B');
    assert.strictEqual(formatModelTitle('@cf/qwen/qwen2.5-72b-instruct'), 'SumanAI * Qwen 2.5 72B');
  });

  it('formats other production models with exact prefix pattern', () => {
    assert.strictEqual(formatModelTitle('openai/gpt-oss-120b'), 'SumanAI * GPT-OSS 120B');
    assert.strictEqual(formatModelTitle('qwen/qwen3.8-27b'), 'SumanAI * Qwen 3.8 27B');
    assert.strictEqual(formatModelTitle('@cf/deepseek-ai/deepseek-r1-distill-qwen-32b'), 'SumanAI * DeepSeek R1 32B');
    assert.strictEqual(formatModelTitle('@cf/black-forest-labs/flux-1-schnell'), 'SumanAI * Flux 1 Schnell');
    assert.strictEqual(formatModelTitle('pollinations/flux'), 'SumanAI * Flux 1');
  });

  it('prevents redundant nested prefixes when already prefixed', () => {
    assert.strictEqual(formatModelTitle('SumanAI * Llama 3.3 70B'), 'SumanAI * Llama 3.3 70B');
    assert.strictEqual(formatModelTitle('SumanAI * Qwen 2.5 72B'), 'SumanAI * Qwen 2.5 72B');
    assert.strictEqual(formatModelTitle('SumanAI'), 'SumanAI');
    assert.strictEqual(formatModelTitle(''), 'SumanAI');
  });

  it('intelligently detects real responding model from ChatGPT content when CF fails over', () => {
    const chatGptContent = "I'm ChatGPT, a large-language model created by OpenAI. I'm based on the GPT-4 architecture...";
    const result = formatModelTitle('Llama 3.3 70B (Fast)', chatGptContent);
    assert.strictEqual(result, 'SumanAI * GPT-OSS 120B');
  });

  it('intelligently detects DeepSeek R1 from thinking tokens or self-identification', () => {
    const deepSeekContent = "<think>\nAnalyzing problem...\n</think>\nHere is the answer.";
    const result = formatModelTitle('SumanAI', deepSeekContent);
    assert.strictEqual(result, 'SumanAI * DeepSeek R1 32B');
  });

  it('resolves correct badge for formatted titles', () => {
    assert.strictEqual(resolveModelBadge('SumanAI * Llama 3.3 70B'), 'NVIDIA');
    assert.strictEqual(resolveModelBadge('SumanAI * Qwen 2.5 72B'), 'Flagship');
    assert.strictEqual(resolveModelBadge('SumanAI * DeepSeek R1 32B'), 'Reasoning');
    assert.strictEqual(resolveModelBadge('SumanAI * GPT-OSS 120B'), 'Default');
    assert.strictEqual(resolveModelBadge('SumanAI'), null);
  });
});

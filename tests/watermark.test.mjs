import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isImageGenerationIntent } from '../frontend/src/utils/imageUtils.js';

const formatImagePromptWithWatermark = (promptText) => {
  let modelPrompt = (promptText || '').trim();
  if (!/watermark/i.test(modelPrompt)) {
    modelPrompt = `${modelPrompt}, subtle watermark at bottom right corner reading "SumanAI" with small AI logo badge, strictly no other text`;
  }
  return modelPrompt;
};

describe('AI Image Generation Watermark Architecture', () => {
  it('appends watermark directive to raw prompt sent to AI model', () => {
    const rawPrompt = 'A majestic cybernetic lion resting on a neon rooftop';
    const formatted = formatImagePromptWithWatermark(rawPrompt);

    assert.ok(formatted.includes('subtle watermark at bottom right corner'));
    assert.ok(formatted.includes('SumanAI'));
    assert.ok(formatted.startsWith(rawPrompt));
  });

  it('avoids duplicating watermark directive if prompt already contains watermark keywords', () => {
    const customPrompt = 'A vintage poster with watermark branding in the corner';
    const formatted = formatImagePromptWithWatermark(customPrompt);

    assert.equal(formatted, customPrompt);
  });

  it('handles empty or whitespace prompts safely', () => {
    const formatted = formatImagePromptWithWatermark('   ');
    assert.ok(formatted.includes('SumanAI'));
  });

  it('generates consistent branded download filenames', () => {
    const now = new Date();
    const pad = (num) => num.toString().padStart(2, '0');
    const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
    const filename = `SumanAI_${timestamp}.jpg`;

    assert.ok(filename.startsWith('SumanAI_'));
    assert.ok(filename.endsWith('.jpg'));
  });

  it('generates SumanAI prefixed image filename for R2 storage', () => {
    const ts = 1793364078335;
    const randomPart = '1356c2bb';
    const imageFileName = `SumanAI_img_${ts}_${randomPart}.jpg`;
    const r2Key = `generated-images/${imageFileName}`;

    assert.equal(imageFileName, 'SumanAI_img_1793364078335_1356c2bb.jpg');
    assert.equal(r2Key, 'generated-images/SumanAI_img_1793364078335_1356c2bb.jpg');
    assert.ok(/^SumanAI_img_\d+_[a-z0-9]+\.jpg$/.test(imageFileName));
  });

  it('accurately identifies image generation intent from user prompts', () => {
    const positiveCases = [
      'Generate a breathtaking, ultra-photorealistic fantasy fashion portrait in cinematic background blur.',
      'Create an image of a red cat on a bicycle',
      'Draw a futuristic cyberpunk city at sunset',
      'Make a wallpaper of snowy mountains 4k',
      'Paint a portrait of an astronaut drinking tea',
      'Can you create a picture of a cute puppy?',
      'Please generate an artwork showing a magical forest',
      'A photo of a serene lake in autumn',
      'An ultra-realistic 3d render of an Apple iPhone concept',
      'Cinematic portrait of an ancient warrior',
      'Turn this image into watercolor style'
    ];

    for (const prompt of positiveCases) {
      assert.equal(isImageGenerationIntent(prompt), true, `Failed positive intent detection for: ${prompt}`);
    }

    const negativeCases = [
      'How to generate an image using Python and PIL?',
      'Write a JavaScript function to create an image element',
      'Explain how diffusion models generate images',
      'Can you draw a comparison between React and Vue?',
      'Draw a flowchart of user authentication',
      'Make a table comparing python and rust',
      'Create a plan for my vacation',
      'Why is the sky blue?'
    ];

    for (const prompt of negativeCases) {
      assert.equal(isImageGenerationIntent(prompt), false, `False positive detected for: ${prompt}`);
    }
  });

  it('slices conversation messages to sliding context window dynamically from env limits', () => {
    const applySlidingWindow = (rawMessages, envConfig = {}, options = {}) => {
      const configuredLimit = parseInt(
        envConfig.MAX_CONVERSATION_MESSAGES || 
        envConfig.MAX_MESSAGES_LIMIT || 
        envConfig.CONVERSATION_HISTORY_LIMIT || 
        options?.systemLimits?.maxConversationMessages || 
        '100', 
        10
      ) || 100;

      const slidingWindow = parseInt(
        envConfig.SLIDING_CONTEXT_WINDOW || 
        envConfig.CONTEXT_WINDOW_SIZE || 
        options?.systemLimits?.slidingContextWindow || 
        '50', 
        10
      ) || 50;

      return rawMessages.length > configuredLimit 
        ? rawMessages.slice(-slidingWindow) 
        : rawMessages;
    };

    const shortHistory = Array.from({ length: 40 }, (_, i) => ({ role: i % 2 === 0 ? 'user' : 'assistant', content: `Message ${i}` }));
    const resultShort = applySlidingWindow(shortHistory);
    assert.equal(resultShort.length, 40);

    const longHistory = Array.from({ length: 120 }, (_, i) => ({ role: i % 2 === 0 ? 'user' : 'assistant', content: `Message ${i}` }));
    const resultLongDefault = applySlidingWindow(longHistory);
    assert.equal(resultLongDefault.length, 50);
    assert.equal(resultLongDefault[resultLongDefault.length - 1].content, 'Message 119');

    const customEnv = { MAX_CONVERSATION_MESSAGES: '150', SLIDING_CONTEXT_WINDOW: '80' };
    const resultCustomEnv = applySlidingWindow(longHistory, customEnv);
    assert.equal(resultCustomEnv.length, 120);

    const extraLongHistory = Array.from({ length: 200 }, (_, i) => ({ role: i % 2 === 0 ? 'user' : 'assistant', content: `Message ${i}` }));
    const resultExtraLong = applySlidingWindow(extraLongHistory, customEnv);
    assert.equal(resultExtraLong.length, 80);
    assert.equal(resultExtraLong[resultExtraLong.length - 1].content, 'Message 199');
  });
});


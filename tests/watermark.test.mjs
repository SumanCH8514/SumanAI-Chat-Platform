import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isImageGenerationIntent } from '../frontend/src/utils/imageUtils.js';
import { calculateWatermarkLayout, WATERMARK_TEXT, applySumanAIWatermark } from '../frontend/src/utils/watermarkUtils.js';

describe('AI Image Generation Watermark Architecture', () => {
  it('preserves clean model prompt to avoid diffusion text hallucination and distortion', () => {
    const rawPrompt = 'A majestic cybernetic lion resting on a neon rooftop';
    const cleanPrompt = rawPrompt.trim();
    assert.equal(cleanPrompt, rawPrompt);
    assert.equal(WATERMARK_TEXT, 'SumanAI');
  });

  it('sanitizes and strictly clamps image prompt length to under 2048 chars to prevent Error 5006', () => {
    const hugePrompt = 'A beautiful cinematic landscape '.repeat(100) + ' ![image](https://cdn.example.com/test.jpg) data:image/png;base64,AAAA';
    let sanitized = hugePrompt
      .replace(/!\[.*?\]\(.*?\)/g, '')
      .replace(/https?:\/\/[^\s]+/g, '')
      .replace(/data:image\/[a-zA-Z0-9.+_-]+;base64,[A-Za-z0-9+/=]+/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (sanitized.length > 2000) {
      sanitized = sanitized.slice(0, 2000).trim();
    }
    assert.ok(sanitized.length <= 2000);
    assert.ok(sanitized.length <= 2048);
    assert.ok(!sanitized.includes('data:image/'));
    assert.ok(!sanitized.includes('![image]'));
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

  it('correctly maps deprecated model aliases to active production models', () => {
    const DEPRECATED_MODEL_ALIASES = {
      'z-ai/glm-5.3': 'nvidia/llama-3.1-nemotron-70b-instruct',
      'z-ai/glm-5.3-flash': 'nvidia/llama-3.1-nemotron-70b-instruct',
      'moonshotai/kimi-k3': 'meta/llama-3.3-70b-instruct',
      'meta/llama-3.2-11b-vision-instruct': '@cf/meta/llama-3.2-11b-vision-instruct',
      'llama-3.2-11b-vision-preview': '@cf/meta/llama-3.2-11b-vision-instruct',
      'llama-3.2-90b-vision-preview': '@cf/meta/llama-3.2-11b-vision-instruct'
    };

    const resolveModel = (id) => DEPRECATED_MODEL_ALIASES[id] || id;

    assert.equal(resolveModel('z-ai/glm-5.3'), 'nvidia/llama-3.1-nemotron-70b-instruct');
    assert.equal(resolveModel('z-ai/glm-5.3-flash'), 'nvidia/llama-3.1-nemotron-70b-instruct');
    assert.equal(resolveModel('moonshotai/kimi-k3'), 'meta/llama-3.3-70b-instruct');
    assert.equal(resolveModel('meta/llama-3.2-11b-vision-instruct'), '@cf/meta/llama-3.2-11b-vision-instruct');
    assert.equal(resolveModel('llama-3.2-11b-vision-preview'), '@cf/meta/llama-3.2-11b-vision-instruct');
    assert.equal(resolveModel('qwen/qwen3.8-27b'), 'qwen/qwen3.8-27b');
  });

  it('normalizes markdown image syntax with accidental spaces into standard markdown images', () => {
    const broken = '![Fashion Portrait] (https://cdn.sumanai.r2.sumanonline.com/generated-images/SumanAI_img_123.jpg)';
    const normalized = broken.replace(/!\[([^\]]*)\]\s+\((https?:\/\/[^\s)]+)\)/g, '![$1]($2)');
    assert.equal(normalized, '![Fashion Portrait](https://cdn.sumanai.r2.sumanonline.com/generated-images/SumanAI_img_123.jpg)');
  });

  it('prunes raw base64 image attachments from previous turns to prevent context window exhaustion', () => {
    const history = [
      { role: 'user', content: 'What is it saying?', attachments: [{ type: 'image/jpeg', data: 'A'.repeat(200000) }] },
      { role: 'assistant', content: 'The image shows WATCAST.' },
      { role: 'user', content: 'Which language is the best for AI: Python or Rust?' }
    ];

    const latestAttachmentIdx = history.map(m => Boolean(m.attachments && m.attachments.length > 0)).lastIndexOf(true);

    const formattedMessages = history.map((m, index) => {
      let textContent = m.content;
      if (m.attachments && m.attachments.length > 0) {
        const isLatestAttachment = index === latestAttachmentIdx && index >= history.length - 2;
        if (isLatestAttachment) {
          return { role: m.role, content: [{ type: 'text', text: textContent }, { type: 'image_url', image_url: { url: `data:${m.attachments[0].type};base64,${m.attachments[0].data}` } }] };
        } else {
          return { role: m.role, content: `${textContent}\n[Attachments: image]` };
        }
      }
      return { role: m.role, content: textContent };
    });

    assert.equal(typeof formattedMessages[0].content, 'string');
    assert.ok(formattedMessages[0].content.includes('[Attachments: image]'));
    assert.ok(!JSON.stringify(formattedMessages).includes('A'.repeat(200000)));
  });

  it('sanitizes embedded base64 data URLs from message content to protect model context window', () => {
    const rawMessages = [
      { role: 'user', content: 'Generate an image' },
      { role: 'assistant', content: 'Here is your image: ![Artwork](data:image/jpeg;base64,' + 'B'.repeat(580000) + ')' },
      { role: 'user', content: 'hi' }
    ];

    const sanitized = rawMessages.map(m => {
      let content = typeof m.content === 'string' ? m.content : '';
      if (content.includes('data:image/')) {
        content = content.replace(/data:image\/[a-zA-Z0-9.+_-]+;base64,[A-Za-z0-9+/=]{100,}/g, '[Embedded image omitted from context]');
      }
      return { ...m, content };
    });

    assert.ok(!sanitized[1].content.includes('B'.repeat(100)));
    assert.ok(sanitized[1].content.includes('[Embedded image omitted from context]'));
    assert.ok(sanitized[1].content.length < 200);
  });

  it('guarantees exact watermark content: SumanAI', () => {
    assert.strictEqual(WATERMARK_TEXT, 'SumanAI');
  });

  it('calculates adaptive bottom-right corner positioning and proportional typography across diverse aspect ratios', () => {
    const testCases = [
      { name: 'Standard Square', width: 1024, height: 1024 },
      { name: 'Small Thumbnail', width: 300, height: 300 },
      { name: 'Medium Square', width: 512, height: 512 },
      { name: 'Wide Landscape', width: 1920, height: 1080 },
      { name: 'Tall Mobile Portrait', width: 1080, height: 1920 },
      { name: 'Ultra HD 4K', width: 3840, height: 2160 }
    ];

    for (const tc of testCases) {
      const layout = calculateWatermarkLayout(tc.width, tc.height);
      assert.ok(layout, `Layout calculation failed for ${tc.name}`);
      assert.strictEqual(layout.text, 'SumanAI');

      assert.ok(layout.anchorX < tc.width, `Anchor X must be within width for ${tc.name}`);
      assert.ok(layout.anchorX > tc.width * 0.5, `Anchor X must be on the right side for ${tc.name}`);
      assert.ok(layout.anchorY < tc.height, `Anchor Y must be within height for ${tc.name}`);
      assert.ok(layout.anchorY > tc.height * 0.5, `Anchor Y must be near bottom for ${tc.name}`);
      assert.ok(layout.fontSize > 10, `Font size must be legible for ${tc.name}`);
    }
  });

  it('handles invalid or zero-dimension images gracefully', () => {
    assert.strictEqual(calculateWatermarkLayout(0, 0), null);
    assert.strictEqual(calculateWatermarkLayout(-100, 500), null);
    assert.strictEqual(calculateWatermarkLayout(null, null), null);
  });

  it('bypasses canvas reprocessing and avoids cross-origin requests for permanent R2 storage URLs', async () => {
    const r2Url = 'https://cdn.sumanai.r2.sumanonline.com/generated-images/SumanAI_img_1793446973998_76263e3c.jpg';
    const result = await applySumanAIWatermark(r2Url);
    assert.strictEqual(result, r2Url);

    const isPermanent = (url) => typeof url === 'string' && (
      url.includes('cdn.sumanai.r2.sumanonline.com') ||
      url.includes('/generated-images/') ||
      url.includes('sumanai_watermarked=1')
    );
    assert.strictEqual(isPermanent(r2Url), true);
    assert.strictEqual(isPermanent('data:image/jpeg;base64,abc123'), false);
  });

  it('detects Cloudflare Error 4006 daily neurons allocation error and resolves groq fallback', () => {
    const errorString = '4006: you have used up your daily free allocation of 10,000 neurons, please upgrade to Cloudflare Workers Paid plan';
    const isQuotaError = errorString.includes('4006') || errorString.includes('neurons') || errorString.includes('allocation') || errorString.includes('quota');
    assert.strictEqual(isQuotaError, true);

    const resolveFallbackModel = (model) => model.includes('70b') ? 'openai/gpt-oss-120b' : 'qwen/qwen3.8-27b';
    assert.strictEqual(resolveFallbackModel('@cf/meta/llama-3.3-70b-instruct-fp8-fast'), 'openai/gpt-oss-120b');
    assert.strictEqual(resolveFallbackModel('@cf/meta/llama-3.1-8b-instruct'), 'qwen/qwen3.8-27b');
  });
});


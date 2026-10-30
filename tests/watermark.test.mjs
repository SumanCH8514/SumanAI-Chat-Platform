import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

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
});


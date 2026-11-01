import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

const formatSnippet = (content) => {
  if (!content || typeof content !== 'string') return 'No text recorded in this session';
  let text = content;
  text = text.replace(/!\[(.*?)\]\([^)]+\)/g, (_, alt) => {
    const label = alt ? alt.trim() : 'Generated image';
    return `[Image: ${label}]`;
  });
  text = text.replace(/```[\s\S]*?```/g, '[Code snippet]');
  text = text.replace(/`([^`]+)`/g, '$1');
  text = text.replace(/[*_#~>]/g, '');
  text = text.replace(/\s+/g, ' ').trim();
  return text || 'No text recorded in this session';
};

describe('History Session Card - Snippet Sanitizer', () => {
  it('converts markdown image syntax with long URLs into clean text labels', () => {
    const raw = '![generate me a image of Prime Minister Modi drinking tea with adani](https://cdn.sumanai.r2.sumanonline.com/generated_images/test.jpg)';
    const clean = formatSnippet(raw);
    assert.equal(clean, '[Image: generate me a image of Prime Minister Modi drinking tea with adani]');
  });

  it('handles markdown images with empty alt tags', () => {
    const raw = '![](https://cdn.sumanai.r2.sumanonline.com/generated_images/test.jpg)';
    const clean = formatSnippet(raw);
    assert.equal(clean, '[Image: Generated image]');
  });

  it('replaces multiline code blocks with clean tag', () => {
    const raw = 'Here is the implementation:\n```javascript\nfunction test() { return true; }\n```\nEnjoy!';
    const clean = formatSnippet(raw);
    assert.equal(clean, 'Here is the implementation: [Code snippet] Enjoy!');
  });

  it('removes markdown formatting artifacts like headers and bolding', () => {
    const raw = '### Heading Title\n**Important Note**: This is _italic_ text.';
    const clean = formatSnippet(raw);
    assert.equal(clean, 'Heading Title Important Note: This is italic text.');
  });

  it('gracefully handles null, undefined, empty string, or whitespace', () => {
    assert.equal(formatSnippet(null), 'No text recorded in this session');
    assert.equal(formatSnippet(undefined), 'No text recorded in this session');
    assert.equal(formatSnippet('   '), 'No text recorded in this session');
    assert.equal(formatSnippet(''), 'No text recorded in this session');
  });
});


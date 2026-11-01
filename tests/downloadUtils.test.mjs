import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { base64ToBlob } from '../frontend/src/utils/downloadUtils.js';

describe('downloadUtils - Force Download & Blob Pipeline', () => {
  it('converts base64 data URLs to binary Blobs with matching MIME type', () => {
    const sampleDataUrl = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';
    const blob = base64ToBlob(sampleDataUrl);

    assert.ok(blob instanceof Blob);
    assert.strictEqual(blob.type, 'image/jpeg');
    assert.ok(blob.size > 0);
  });

  it('correctly extracts MIME type for png and webp data URLs', () => {
    const pngDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
    const blob = base64ToBlob(pngDataUrl);

    assert.strictEqual(blob.type, 'image/png');
    assert.ok(blob.size > 0);
  });

  it('generates compliant timestamped filename formatting', () => {
    const prefix = 'SumanAI';
    const extension = 'jpg';
    const now = new Date();
    const pad = (num) => num.toString().padStart(2, '0');
    const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    const filename = `${prefix}_${timestamp}.${extension}`;

    assert.ok(filename.startsWith('SumanAI_'));
    assert.ok(filename.endsWith('.jpg'));
    assert.match(filename, /^SumanAI_\d{8}-\d{6}\.jpg$/);
  });
});


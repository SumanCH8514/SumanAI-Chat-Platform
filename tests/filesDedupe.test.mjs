import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeFileKey,
  isFileDeleted,
  deduplicateWorkspaceFiles,
  findRedundantCustomFiles
} from '../frontend/src/utils/fileUtils.js';

describe('fileUtils - Workspace Files Deduplication and Deletion', () => {
  it('normalizes file key for R2 generated images regardless of query parameters', () => {
    const rawUrl = 'https://cdn.sumanai.r2.sumanonline.com/generated-images/img_1793555587864_doremon.jpg';
    const watermarkedUrl = 'https://cdn.sumanai.r2.sumanonline.com/generated-images/img_1793555587864_doremon.jpg?sumanai_watermarked=1';

    const key1 = normalizeFileKey({ url: rawUrl });
    const key2 = normalizeFileKey({ url: watermarkedUrl });

    assert.equal(key1, 'r2:img_1793555587864_doremon.jpg');
    assert.equal(key2, 'r2:img_1793555587864_doremon.jpg');
    assert.equal(key1, key2);
  });

  it('normalizes file key for custom uploads and data URLs', () => {
    const uploadFile = { id: 'upload-12345', name: 'my_doc.png', url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=' };
    const codeFile = { id: 'code-1', name: 'Artifact_python.py', content: 'def hello():\n    return "world"\n' };

    assert.ok(normalizeFileKey(uploadFile).startsWith('data:image/png;base64,'));
    assert.ok(normalizeFileKey(codeFile).startsWith('code:Artifact_python.py:'));
  });

  it('deduplicates duplicate generated image entries favoring chatFiles with chat context', () => {
    const r2Url = 'https://cdn.sumanai.r2.sumanonline.com/generated-images/img_1793555587864_doremon.jpg';

    const chatFiles = [
      {
        id: 'gen-img-chat-1-2-0',
        chatId: 'chat-1',
        messageIdx: 2,
        name: 'Generate_an_image_of_Doremon_Nob.jpg',
        type: 'image',
        subtype: 'generated',
        url: r2Url,
        size: '420 KB',
        chatTitle: 'image generation chat',
        createdAt: 1000
      }
    ];

    const customFiles = [
      {
        id: 'gen-img-1793555589000',
        name: 'Generate_an_image_of_Doremon_Nob.jpg',
        type: 'image',
        subtype: 'generated',
        url: `${r2Url}?sumanai_watermarked=1`,
        size: '480 KB',
        chatTitle: 'Generate an image of Dorem...',
        createdAt: 2000
      }
    ];

    const combined = deduplicateWorkspaceFiles(chatFiles, customFiles, []);

    assert.equal(combined.length, 1);
    assert.equal(combined[0].chatId, 'chat-1');
    assert.equal(combined[0].chatTitle, 'image generation chat');
    assert.equal(combined[0].size, '420 KB');
  });

  it('finds redundant custom files when they exist in chatFiles', () => {
    const r2Url = 'https://cdn.sumanai.r2.sumanonline.com/generated-images/img_1793555587864_doremon.jpg';

    const chatFiles = [
      {
        id: 'gen-img-chat-1-2-0',
        chatId: 'chat-1',
        url: r2Url,
        name: 'Doremon.jpg'
      }
    ];

    const customFiles = [
      {
        id: 'gen-img-legacy-1',
        url: `${r2Url}?sumanai_watermarked=1`,
        name: 'Doremon.jpg'
      },
      {
        id: 'upload-user-photo',
        url: 'data:image/jpeg;base64,abc12345',
        name: 'MyPhoto.jpg'
      }
    ];

    const redundant = findRedundantCustomFiles(customFiles, chatFiles);
    assert.equal(redundant.length, 1);
    assert.equal(redundant[0].id, 'gen-img-legacy-1');
  });

  it('filters out deleted files by id, full url, or query-stripped url', () => {
    const deletedUrl = 'https://cdn.sumanai.r2.sumanonline.com/generated-images/img_deleted_123.jpg';

    const files = [
      { id: 'file-1', url: `${deletedUrl}?sumanai_watermarked=1` },
      { id: 'file-2', url: 'https://cdn.sumanai.r2.sumanonline.com/generated-images/img_active_456.jpg' }
    ];

    assert.equal(isFileDeleted(files[0], [deletedUrl]), true);
    assert.equal(isFileDeleted(files[1], [deletedUrl]), false);

    const result = deduplicateWorkspaceFiles(files, [], [deletedUrl]);
    assert.equal(result.length, 1);
    assert.equal(result[0].id, 'file-2');
  });

  it('preserves standalone tool outputs and direct uploads when not duplicated in chat', () => {
    const chatFiles = [];
    const customFiles = [
      {
        id: 'gen-t2i-999',
        name: 'Studio_Render.jpg',
        url: 'https://cdn.sumanai.r2.sumanonline.com/generated-images/img_t2i_999.jpg',
        chatTitle: 'Text to Image Studio',
        createdAt: 5000
      },
      {
        id: 'upload-123',
        name: 'User_Upload.png',
        url: 'data:image/png;base64,xxxx',
        chatTitle: 'Direct Upload',
        createdAt: 6000
      }
    ];

    const result = deduplicateWorkspaceFiles(chatFiles, customFiles, []);
    assert.equal(result.length, 2);
    assert.equal(result[0].id, 'upload-123');
    assert.equal(result[1].id, 'gen-t2i-999');
  });
});


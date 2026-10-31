import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { chunkTextForStreamingTTS, cleanTextForSpeech } from '../frontend/src/utils/textChunker.js';
import { ttsCache } from '../frontend/src/services/ttsCache.js';
import { TTSPlaybackEngine } from '../frontend/src/services/ttsPlaybackEngine.js';
import { AI_VOICE_GROUPS, DEFAULT_VOICE_ID, ALL_VOICES, getVoiceById } from '../frontend/src/constants/voices.js';

describe('Text-to-Speech Smart Text Chunker', () => {
  it('cleans markdown artifacts while keeping speech-friendly words', () => {
    const raw = '# Welcome!\n\nHere is a `console.log("hello")` test and a [link](https://example.com).\n\n```js\nconst x = 10;\n```\n\n![Image](https://example.com/img.png)\n*italic* and **bold** text.';
    const cleaned = cleanTextForSpeech(raw);

    assert.ok(!cleaned.includes('```'));
    assert.ok(!cleaned.includes('![Image]'));
    assert.ok(!cleaned.includes('# '));
    assert.ok(!cleaned.includes('**'));
    assert.ok(!cleaned.includes('*italic*'));
    assert.ok(cleaned.includes('console.log("hello")'));
    assert.ok(cleaned.includes('link'));
    assert.ok(cleaned.includes('Code block omitted.'));
  });

  it('preserves decimal numbers and does not split on periods inside numbers', () => {
    const text = 'The version is 3.14 and ratio is 99.9% accurate. Next sentence starts here.';
    const chunks = chunkTextForStreamingTTS(text);

    assert.ok(chunks.length >= 1);
    const combined = chunks.map(c => c.text).join(' ');
    assert.ok(combined.includes('3.14'));
    assert.ok(combined.includes('99.9%'));
    assert.ok(!chunks.some(c => c.text.startsWith('14') || c.text.endsWith('3.')));
  });

  it('preserves common abbreviations without splitting', () => {
    const text = 'Dr. Smith met with Prof. Davis at approx. 5 p.m. vs. the usual time. They discussed a new paper.';
    const chunks = chunkTextForStreamingTTS(text);

    const combined = chunks.map(c => c.text).join(' ');
    assert.ok(combined.includes('Dr. Smith'));
    assert.ok(combined.includes('Prof. Davis'));
    assert.ok(combined.includes('approx. 5'));
  });

  it('implements adaptive sizing: initial chunk is fast and concise, subsequent chunks are balanced', () => {
    const longText = 'The ocean remains our planet greatest paradox. Fiercely untamed and powerful, yet peaceful and nurturing to all life on Earth. Its depths conceal endless ancient secrets. Beneath the surface, leviathans glide in midnight cold. No clocks may tick within this sapphire cradle.';
    const chunks = chunkTextForStreamingTTS(longText, {
      initialChunkTarget: 90,
      subsequentChunkTarget: 220
    });

    assert.ok(chunks.length >= 2);
    assert.ok(chunks[0].text.length <= 150);
    assert.ok(chunks[0].text.includes('paradox'));
  });

  it('supports multilingual text including Hindi danda and Chinese full stops', () => {
    const hindi = 'यह एक सुंदर दिन है। हम आज नई तकनीक सीख रहे हैं।';
    const hindiChunks = chunkTextForStreamingTTS(hindi);
    assert.ok(hindiChunks.length >= 1);

    const chinese = '这是第一句话。这是第二句话。';
    const chineseChunks = chunkTextForStreamingTTS(chinese);
    assert.ok(chineseChunks.length >= 1);
  });

  it('splits exceptionally long sentences exceeding maximum character limit', () => {
    const longSentence = 'In a sprawling architectural complex nestled deep within the snow-covered alpine mountains, where glass walls reflect the sunset, an endless horizon extends beyond the towering peaks, while gentle warmth emanates from interior living spaces, creating a luxurious sanctuary against the freezing wilderness outside.';
    const chunks = chunkTextForStreamingTTS(longSentence, { maxChunkLimit: 120 });

    assert.ok(chunks.length >= 2);
    for (const chunk of chunks) {
      assert.ok(chunk.text.length <= 150);
    }
  });

  it('handles empty and whitespace-only text gracefully', () => {
    assert.deepEqual(chunkTextForStreamingTTS(''), []);
    assert.deepEqual(chunkTextForStreamingTTS('   \n\n\t  '), []);
    assert.deepEqual(chunkTextForStreamingTTS(null), []);
    assert.deepEqual(chunkTextForStreamingTTS(undefined), []);
  });
});

describe('TTS In-Memory Cache', () => {
  it('stores and retrieves audio buffers accurately with normalized keys', () => {
    ttsCache.clear();
    const key = ttsCache.createKey('Hello world', 's2.1-pro-free', 'voice1', 'mp3');
    const mockBuffer = new Uint8Array([1, 2, 3, 4]).buffer;

    ttsCache.set(key, mockBuffer);
    assert.ok(ttsCache.has(key));

    const retrieved = ttsCache.get(key);
    assert.deepEqual(new Uint8Array(retrieved), new Uint8Array([1, 2, 3, 4]));
  });

  it('evicts oldest items when exceeding max cache capacity', () => {
    ttsCache.clear();
    for (let i = 0; i < 70; i++) {
      const key = ttsCache.createKey(`Text chunk ${i}`, 'model', 'ref', 'mp3');
      ttsCache.set(key, new ArrayBuffer(8));
    }

    assert.ok(ttsCache.size() <= 60);
    const key0 = ttsCache.createKey('Text chunk 0', 'model', 'ref', 'mp3');
    assert.equal(ttsCache.has(key0), false);
    const key69 = ttsCache.createKey('Text chunk 69', 'model', 'ref', 'mp3');
    assert.equal(ttsCache.has(key69), true);
  });
});

describe('TTS Playback Engine Lifecycle & Session Management', () => {
  it('initializes in idle state and transitions through state subscriptions', () => {
    const engine = new TTSPlaybackEngine();
    assert.equal(engine.getState(), 'idle');
    assert.equal(engine.isSpeaking(), false);

    const states = [];
    const unsubscribe = engine.subscribe((evt) => {
      states.push(evt.state);
    });

    assert.ok(states.includes('idle'));
    unsubscribe();
  });

  it('increments session ID on stop and invalidates previous sessions', () => {
    const engine = new TTSPlaybackEngine();
    const initialSession = engine.currentSessionId;
    engine.stop();
    assert.equal(engine.currentSessionId, initialSession + 1);
    assert.equal(engine.getState(), 'idle');
    assert.equal(engine.decodedBufferMap.size, 0);
  });

  it('handles pause and resume state transitions', () => {
    const engine = new TTSPlaybackEngine();
    engine.state = 'playing';
    engine.pause();
    assert.equal(engine.getState(), 'paused');
    assert.equal(engine.isPaused, true);
    engine.resume();
    engine.stop();
    assert.equal(engine.getState(), 'idle');
    assert.equal(engine.isPaused, false);
  });

  it('maintains strict sequential FIFO chunk ordering regardless of arrival sequence', async () => {
    const engine = new TTSPlaybackEngine();
    const chunks = [
      { id: 'chunk_0', index: 0, text: 'First sentence' },
      { id: 'chunk_1', index: 1, text: 'Second sentence' },
      { id: 'chunk_2', index: 2, text: 'Third sentence' }
    ];

    engine.chunks = chunks;
    engine.currentSessionId = 42;

    const mockBuffer0 = new ArrayBuffer(120);
    const mockBuffer1 = new ArrayBuffer(120);
    const mockBuffer2 = new ArrayBuffer(120);

    engine.decodedBufferMap.set(2, mockBuffer2);
    engine.fetchStatusMap.set(2, 'ready');

    engine.decodedBufferMap.set(0, mockBuffer0);
    engine.fetchStatusMap.set(0, 'ready');

    engine.decodedBufferMap.set(1, mockBuffer1);
    engine.fetchStatusMap.set(1, 'ready');

    assert.equal(engine.fetchStatusMap.get(0), 'ready');
    assert.equal(engine.fetchStatusMap.get(1), 'ready');
    assert.equal(engine.fetchStatusMap.get(2), 'ready');
    assert.equal(engine.decodedBufferMap.has(0), true);
    assert.equal(engine.decodedBufferMap.has(1), true);
    assert.equal(engine.decodedBufferMap.has(2), true);
  });
});

describe('AI Assistant Voice Registry & Selection', () => {
  it('correctly registers all 19 voice models across celebrity, politician, anime/cartoon, and normal AI categories', () => {
    assert.equal(AI_VOICE_GROUPS.length, 4);
    assert.equal(ALL_VOICES.length, 19);

    const celebGroup = AI_VOICE_GROUPS.find(g => g.category === 'Celebrities Voice');
    assert.ok(celebGroup);
    assert.equal(celebGroup.voices.length, 4);

    const polGroup = AI_VOICE_GROUPS.find(g => g.category === 'Politicians');
    assert.ok(polGroup);
    assert.equal(polGroup.voices.length, 4);

    const animeGroup = AI_VOICE_GROUPS.find(g => g.category === 'Anime and Cartoon');
    assert.ok(animeGroup);
    assert.equal(animeGroup.voices.length, 4);

    const normalGroup = AI_VOICE_GROUPS.find(g => g.category === 'Normal AI voice');
    assert.ok(normalGroup);
    assert.equal(normalGroup.voices.length, 7);
  });

  it('maps each celebrity voice to its exact reference ID and defaults to Peter Parker', () => {
    const celebMap = {
      'SRK': '2029912836a045079bf2539751f5db10',
      'Akshay Kumar': '7b2a94a1708d41218d11c7fb051e3eb8',
      'Peter Parker (Default)': 'f3436e1952784a9d9e348fedb15adde9',
      'Tony Stark': '9cc81fcf04534a7abc1e8c2a9d88eeec'
    };

    assert.equal(DEFAULT_VOICE_ID, 'f3436e1952784a9d9e348fedb15adde9');

    for (const [name, refId] of Object.entries(celebMap)) {
      const voice = ALL_VOICES.find(v => v.name === name);
      assert.ok(voice, `Missing voice for ${name}`);
      assert.equal(voice.id, refId);
    }
  });

  it('maps each politician voice to its exact reference ID', () => {
    const polMap = {
      'Narendra Modi': '8b734220ba20480aa95b5e6329730003',
      'Mamta Banerjee': 'c411173d43764b838e3fe02cf749433b',
      'Rahul Gandhi': '2cecab01bc0648d490f5783b5b3be32f',
      'Mahatma Gandhi': 'a17fceae5f3b492da2d46cfc52b09140'
    };

    for (const [name, refId] of Object.entries(polMap)) {
      const voice = ALL_VOICES.find(v => v.name === name);
      assert.ok(voice, `Missing voice for ${name}`);
      assert.equal(voice.id, refId);
    }
  });

  it('maps each anime and cartoon voice to its exact reference ID', () => {
    const animeMap = {
      'Doraemon': 'a32f14ad4d66457193d68abb997ed6c1',
      'Nobita': 'e42bc2b9f99a4e79ac8f0a3e30142ce2',
      'Shinchan': 'a1edc95b8d554d1192ac989e5d292689',
      'Ash Ketchum': '58c31ee9e7d5415da6b809b9db89a55f'
    };

    for (const [name, refId] of Object.entries(animeMap)) {
      const voice = ALL_VOICES.find(v => v.name === name);
      assert.ok(voice, `Missing voice for ${name}`);
      assert.equal(voice.id, refId);
    }
  });

  it('maps each normal AI voice to its exact reference ID', () => {
    const normalMap = {
      'Hannah': '9a9cf47702da476aa4629e2506d4a857',
      'Adrian': 'bf322df2096a46f18c579d0baa36f41d',
      'Sarah': '933563129e564b19a115bedd57b7406a',
      'Ethan': '536d3a5e000945adb7038665781a4aca',
      'Laura': 'e3cd384158934cc9a01029cd7d278634',
      'Jordan': '79d0bd3e4e5444b18f7b6d89b5927bf1',
      'Selene': 'b347db033a6549378b48d00acb0d06cd'
    };

    for (const [name, refId] of Object.entries(normalMap)) {
      const voice = ALL_VOICES.find(v => v.name === name);
      assert.ok(voice, `Missing voice for ${name}`);
      assert.equal(voice.id, refId);
    }
  });

  it('retrieves voice by ID safely and falls back to default on unknown IDs', () => {
    const srk = getVoiceById('2029912836a045079bf2539751f5db10');
    assert.equal(srk.name, 'SRK');

    const modi = getVoiceById('8b734220ba20480aa95b5e6329730003');
    assert.equal(modi.name, 'Narendra Modi');

    const unknown = getVoiceById('non-existent-id');
    assert.equal(unknown.id, DEFAULT_VOICE_ID);
    assert.ok(unknown.name.includes('Peter Parker'));
  });
});

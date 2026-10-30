const ABBREVIATIONS = new Set([
  'mr', 'mrs', 'ms', 'dr', 'prof', 'sr', 'jr', 'vs', 'etc', 'eg', 'ie',
  'approx', 'dept', 'est', 'gen', 'gov', 'inc', 'ltd', 'corp', 'co',
  'st', 'ave', 'blvd', 'rd', 'no', 'vol', 'jan', 'feb', 'mar', 'apr',
  'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'
]);

export function cleanTextForSpeech(rawText) {
  if (!rawText || typeof rawText !== 'string') return '';
  return rawText
    .replace(/```[\s\S]*?```/g, 'Code block omitted.')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^[#>-]+\s*/gm, '')
    .replace(/[*_~]/g, '')
    .replace(/\r\n/g, '\n')
    .trim();
}

function isPunctuationSentenceEnd(char) {
  return char === '.' || char === '!' || char === '?' || char === '。' || char === '！' || char === '？' || char === '।';
}

function isSafeSentenceBreak(text, index) {
  const char = text[index];
  if (!isPunctuationSentenceEnd(char)) return false;

  const nextChar = text[index + 1];
  if (!nextChar) return true;

  if (char === '.') {
    const prevChar = index > 0 ? text[index - 1] : '';
    if (/\d/.test(prevChar) && /\d/.test(nextChar)) {
      return false;
    }

    if (/[a-zA-Z]/.test(prevChar) && /[a-zA-Z]/.test(nextChar)) {
      return false;
    }

    let wordStart = index - 1;
    while (wordStart >= 0 && /[a-zA-Z]/.test(text[wordStart])) {
      wordStart--;
    }
    const wordBefore = text.slice(wordStart + 1, index).toLowerCase();
    if (ABBREVIATIONS.has(wordBefore)) {
      return false;
    }

    if (wordBefore.length === 1 && wordStart >= 1 && text[wordStart] === '.') {
      return false;
    }
  }

  return /\s/.test(nextChar);
}

function splitIntoRawSentences(text) {
  const sentences = [];
  let current = '';

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    current += char;

    if (char === '\n') {
      const nextChar = text[i + 1];
      if (nextChar === '\n' || current.trim().length > 30) {
        const trimmed = current.trim();
        if (trimmed) sentences.push(trimmed);
        current = '';
        continue;
      }
    }

    if (isSafeSentenceBreak(text, i)) {
      let lookAhead = i + 1;
      while (lookAhead < text.length && isPunctuationSentenceEnd(text[lookAhead])) {
        current += text[lookAhead];
        i = lookAhead;
        lookAhead++;
      }

      while (lookAhead < text.length && (text[lookAhead] === '"' || text[lookAhead] === "'" || text[lookAhead] === ')' || text[lookAhead] === '”' || text[lookAhead] === '’')) {
        current += text[lookAhead];
        i = lookAhead;
        lookAhead++;
      }

      const trimmed = current.trim();
      if (trimmed) sentences.push(trimmed);
      current = '';
    }
  }

  const remainder = current.trim();
  if (remainder) {
    sentences.push(remainder);
  }

  return sentences;
}

function splitLongSentence(sentence, maxLen = 350) {
  if (sentence.length <= maxLen) return [sentence];

  const subChunks = [];
  const clausePunctuation = /([,;:—–\-/]\s+|\s+-\s+)/;
  const parts = sentence.split(clausePunctuation);

  let buffer = '';
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (!part) continue;

    if ((buffer + part).length <= maxLen) {
      buffer += part;
    } else {
      if (buffer.trim()) {
        subChunks.push(buffer.trim());
      }
      if (part.length > maxLen) {
        const words = part.split(/\s+/);
        let wordBuffer = '';
        for (const w of words) {
          if ((wordBuffer + ' ' + w).trim().length <= maxLen) {
            wordBuffer = (wordBuffer + ' ' + w).trim();
          } else {
            if (wordBuffer) subChunks.push(wordBuffer);
            wordBuffer = w;
          }
        }
        buffer = wordBuffer;
      } else {
        buffer = part;
      }
    }
  }

  if (buffer.trim()) {
    subChunks.push(buffer.trim());
  }

  return subChunks.length > 0 ? subChunks : [sentence];
}

export function chunkTextForStreamingTTS(rawText, options = {}) {
  const {
    initialChunkTarget = 65,
    subsequentChunkTarget = 240,
    maxChunkLimit = 360
  } = options;

  const cleaned = cleanTextForSpeech(rawText);
  if (!cleaned) return [];

  const rawSentences = splitIntoRawSentences(cleaned);
  if (rawSentences.length === 0) return [];

  const expandedSentences = [];
  for (const s of rawSentences) {
    if (s.length > maxChunkLimit) {
      expandedSentences.push(...splitLongSentence(s, maxChunkLimit));
    } else {
      expandedSentences.push(s);
    }
  }

  if (expandedSentences.length === 0) return [];

  const chunks = [];
  let currentBuffer = '';
  const effectiveInitialTarget = Math.min(initialChunkTarget, maxChunkLimit);
  const effectiveSubsequentTarget = Math.min(subsequentChunkTarget, maxChunkLimit);

  for (let i = 0; i < expandedSentences.length; i++) {
    const sentence = expandedSentences[i];
    const isFirstChunk = chunks.length === 0;
    const targetLimit = isFirstChunk ? effectiveInitialTarget : effectiveSubsequentTarget;

    if (!currentBuffer) {
      currentBuffer = sentence;
      if (isFirstChunk && currentBuffer.length >= effectiveInitialTarget * 0.7) {
        chunks.push(currentBuffer.trim());
        currentBuffer = '';
      }
    } else {
      const combined = currentBuffer + ' ' + sentence;
      if (combined.length <= targetLimit && combined.length <= maxChunkLimit) {
        currentBuffer = combined;
      } else {
        chunks.push(currentBuffer.trim());
        currentBuffer = sentence;
      }
    }
  }

  if (currentBuffer.trim()) {
    chunks.push(currentBuffer.trim());
  }

  return chunks.map((text, idx) => ({
    id: `chunk_${idx}`,
    index: idx,
    text,
    charCount: text.length
  }));
}

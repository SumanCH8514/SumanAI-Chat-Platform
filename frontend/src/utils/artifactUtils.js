function sanitizeLanguage(raw) {
  if (!raw) return '';
  const clean = raw.toLowerCase().trim();
  const fileMatch = clean.match(/(?:^|[:\s(])([a-zA-Z0-9_\-.]+\.(html|htm|css|js|jsx|ts|tsx|json|svg))(?:\)|$|\s)/);
  if (fileMatch) {
    const ext = fileMatch[2];
    if (ext === 'html' || ext === 'htm') return { lang: 'html', filename: fileMatch[1] };
    if (ext === 'css') return { lang: 'css', filename: fileMatch[1] };
    if (ext === 'js' || ext === 'jsx' || ext === 'ts' || ext === 'tsx') return { lang: 'javascript', filename: fileMatch[1] };
    return { lang: ext, filename: fileMatch[1] };
  }

  const token = clean.split(/[\s:(]+/)[0].replace(/[^a-zA-Z0-9_\-+]/g, '');
  if (['html', 'htm', 'xml', 'svg'].includes(token)) return { lang: 'html', filename: 'index.html' };
  if (['css', 'scss', 'sass', 'less', 'style', 'styles', 'stylesheet', 'postcss'].includes(token)) return { lang: 'css', filename: 'styles.css' };
  if (['javascript', 'js', 'jsx', 'ts', 'typescript'].includes(token)) return { lang: 'javascript', filename: 'script.js' };
  return { lang: token, filename: '' };
}

export function parseArtifact(text) {
  if (!text) return null;

  const fenceRegex = /(?:^|\n)[ \t]*(`{3,}|~{3,})([^\n]*)\n([\s\S]*?)(?:\n[ \t]*\1|$)/g;
  const blocks = [];
  let match;

  while ((match = fenceRegex.exec(text)) !== null) {
    const rawInfo = (match[2] || '').trim();
    const content = match[3].trim();
    if (!content) continue;

    const parsedInfo = sanitizeLanguage(rawInfo);
    let lang = parsedInfo.lang;
    let filename = parsedInfo.filename;

    if (!lang) {
      if (content.startsWith('<!DOCTYPE') || content.includes('<html') || content.includes('<body') || content.includes('<div') || content.includes('<main') || content.includes('<section')) {
        lang = 'html';
        filename = filename || 'index.html';
      } else if (/(?:^|\n)\s*([.#a-zA-Z*@:][^{}]*)\s*\{[^}]*\}/.test(content) && !content.includes('import ') && !content.includes('function ') && !content.includes('def ')) {
        lang = 'css';
        filename = filename || 'styles.css';
      } else if (content.includes('function ') || content.includes('const ') || content.includes('let ') || content.includes('var ') || content.includes('=>')) {
        lang = 'javascript';
        filename = filename || 'script.js';
      }
    }

    blocks.push({
      language: lang || 'text',
      filename: filename || '',
      content
    });
  }

  if (blocks.length === 0) return null;

  const htmlBlocks = blocks.filter(b => 
    ['html', 'htm', 'xml', 'svg'].includes(b.language) || 
    b.content.includes('<html') || 
    b.content.includes('<!DOCTYPE') || 
    b.content.includes('<body') || 
    b.content.includes('<div') ||
    b.content.includes('<main') ||
    b.content.includes('<section')
  );

  const cssBlocks = blocks.filter(b => 
    ['css', 'scss', 'sass', 'less', 'style', 'styles', 'stylesheet', 'postcss'].includes(b.language) ||
    (b.filename && b.filename.endsWith('.css'))
  );

  const jsBlocks = blocks.filter(b => 
    ['javascript', 'js', 'jsx', 'ts', 'typescript'].includes(b.language) && 
    !htmlBlocks.includes(b)
  );

  const hasWebArtifact = htmlBlocks.length > 0 || cssBlocks.length > 0 || jsBlocks.length > 0;

  if (!hasWebArtifact) {
    const primary = blocks[0];
    return {
      isWeb: false,
      language: primary.language || 'code',
      content: primary.content,
      previewHtml: '',
      files: [{ name: primary.filename || `code.${primary.language || 'txt'}`, language: primary.language, content: primary.content }]
    };
  }

  let baseHtml = htmlBlocks.length > 0 ? htmlBlocks[0].content : '';
  const combinedCss = cssBlocks.map(b => b.content).join('\n\n');
  const combinedJs = jsBlocks.map(b => b.content).join('\n\n');

  if (!baseHtml) {
    baseHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview</title>
</head>
<body>
  <div style="font-family: system-ui, -apple-system, sans-serif; padding: 2rem; max-width: 600px; margin: 0 auto; text-align: center;">
    <h1>Styled Preview</h1>
    <p>CSS styling active</p>
  </div>
</body>
</html>`;
  }

  let bundled = baseHtml;

  if (combinedCss.trim()) {
    const styleTag = `<style>\n${combinedCss}\n</style>`;
    bundled = bundled.replace(/<link\s+[^>]*href=["'](?!https?:\/\/|\/\/|data:)[^"']*\.css["'][^>]*\/?>/gi, '');
    bundled = bundled.replace(/<link\s+[^>]*rel=["']stylesheet["'][^>]*href=["'](?!https?:\/\/|\/\/|data:)[^"']*\.css["'][^>]*\/?>/gi, '');

    if (bundled.includes('</head>')) {
      bundled = bundled.replace('</head>', `${styleTag}\n</head>`);
    } else if (bundled.includes('<body')) {
      bundled = bundled.replace('<body', `${styleTag}\n<body`);
    } else if (bundled.includes('<html')) {
      bundled = bundled.replace(/<html[^>]*>/i, `$&<head>${styleTag}</head>`);
    } else {
      bundled = `${styleTag}\n${bundled}`;
    }
  }

  if (combinedJs.trim()) {
    const scriptTag = `<script>\n${combinedJs}\n</script>`;
    bundled = bundled.replace(/<script\s+[^>]*src=["'](?!https?:\/\/|\/\/|data:)[^"']*\.js["'][^>]*>\s*<\/script>/gi, '');
    if (bundled.includes('</body>')) {
      bundled = bundled.replace('</body>', `${scriptTag}\n</body>`);
    } else {
      bundled = `${bundled}\n${scriptTag}`;
    }
  }

  if (!bundled.includes('<!DOCTYPE') && !bundled.includes('<html')) {
    bundled = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview</title>
  ${combinedCss ? `<style>\n${combinedCss}\n</style>` : ''}
</head>
<body>
  ${baseHtml}
  ${combinedJs ? `<script>\n${combinedJs}\n</script>` : ''}
</body>
</html>`;
  } else if (!bundled.includes('<!DOCTYPE')) {
    bundled = `<!DOCTYPE html>\n${bundled}`;
  }

  const files = [];
  if (htmlBlocks.length > 0) {
    const name = htmlBlocks[0].filename || 'index.html';
    files.push({ name, language: 'html', content: htmlBlocks[0].content });
  }
  if (combinedCss.trim()) {
    const name = (cssBlocks[0] && cssBlocks[0].filename) || 'styles.css';
    files.push({ name, language: 'css', content: combinedCss });
  }
  if (combinedJs.trim()) {
    const name = (jsBlocks[0] && jsBlocks[0].filename) || 'script.js';
    files.push({ name, language: 'javascript', content: combinedJs });
  }
  blocks.forEach((b, i) => {
    if (!htmlBlocks.includes(b) && !cssBlocks.includes(b) && !jsBlocks.includes(b)) {
      const name = b.filename || `file-${i + 1}.${b.language || 'txt'}`;
      files.push({ name, language: b.language, content: b.content });
    }
  });

  return {
    isWeb: true,
    language: 'html',
    content: bundled,
    previewHtml: bundled,
    files
  };
}

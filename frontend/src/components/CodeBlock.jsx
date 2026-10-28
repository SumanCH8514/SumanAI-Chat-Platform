import React, { useState, useMemo } from 'react';
import { Copy, Check, Download, Eye } from 'lucide-react';
import Prism from 'prismjs';
import { useChatStore } from '../store/useChatStore';
import { parseArtifact } from '../utils/artifactUtils';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-csharp';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-docker';
import './CodeBlock.css';

const EXTENSIONS = {
  python: 'py',
  py: 'py',
  javascript: 'js',
  js: 'js',
  typescript: 'ts',
  ts: 'ts',
  jsx: 'jsx',
  tsx: 'tsx',
  html: 'html',
  css: 'css',
  json: 'json',
  bash: 'sh',
  sh: 'sh',
  shell: 'sh',
  zsh: 'sh',
  sql: 'sql',
  markdown: 'md',
  md: 'md',
  c: 'c',
  cpp: 'cpp',
  'c++': 'cpp',
  csharp: 'cs',
  'c#': 'cs',
  java: 'java',
  go: 'go',
  rust: 'rs',
  rs: 'rs',
  yaml: 'yaml',
  yml: 'yaml',
  dockerfile: 'dockerfile',
  docker: 'dockerfile'
};

const LANGUAGE_NAMES = {
  python: 'Python',
  py: 'Python',
  javascript: 'JavaScript',
  js: 'JavaScript',
  typescript: 'TypeScript',
  ts: 'TypeScript',
  jsx: 'React JSX',
  tsx: 'React TSX',
  html: 'HTML',
  css: 'CSS',
  json: 'JSON',
  bash: 'Bash',
  sh: 'Shell',
  shell: 'Shell',
  zsh: 'Zsh',
  sql: 'SQL',
  markdown: 'Markdown',
  md: 'Markdown',
  c: 'C',
  cpp: 'C++',
  'c++': 'C++',
  csharp: 'C#',
  'c#': 'C#',
  java: 'Java',
  go: 'Go',
  rust: 'Rust',
  rs: 'Rust',
  yaml: 'YAML',
  yml: 'YAML',
  dockerfile: 'Dockerfile',
  docker: 'Dockerfile'
};

const getGrammar = (lang) => {
  if (!lang) return null;
  const normalized = lang.toLowerCase().trim();
  const map = {
    py: 'python',
    js: 'javascript',
    ts: 'typescript',
    sh: 'bash',
    shell: 'bash',
    zsh: 'bash',
    yml: 'yaml',
    'c++': 'cpp',
    'c#': 'csharp',
    docker: 'docker'
  };
  const key = map[normalized] || normalized;
  return Prism.languages[key] || null;
};

const renderToken = (token, key) => {
  if (typeof token === 'string') {
    return token;
  }
  const className = `token ${token.type}${token.alias ? ` ${token.alias}` : ''}`;
  const content = Array.isArray(token.content)
    ? token.content.map((item, idx) => renderToken(item, `${key}-${idx}`))
    : typeof token.content === 'object' && token.content !== null
    ? renderToken(token.content, `${key}-sub`)
    : token.content;

  return (
    <span key={key} className={className}>
      {content}
    </span>
  );
};

const CodeBlock = ({ language = '', code = '', fullMessageContent = '' }) => {
  const [copied, setCopied] = useState(false);

  const cleanLang = (language || '').toLowerCase().trim();
  const displayName = LANGUAGE_NAMES[cleanLang] || (cleanLang ? cleanLang.charAt(0).toUpperCase() + cleanLang.slice(1) : 'Code');

  const tokens = useMemo(() => {
    const grammar = getGrammar(cleanLang);
    if (!grammar) return null;
    try {
      return Prism.tokenize(code, grammar);
    } catch {
      return null;
    }
  }, [code, cleanLang]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      void 0;
    }
  };

  const handleDownload = () => {
    const ext = EXTENSIONS[cleanLang] || 'txt';
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `code.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="code-block-card">
      <div className="code-block-header">
        <span className="code-block-lang">{displayName}</span>
        <div className="code-block-actions">
          {['html', 'htm', 'xml', 'svg', 'css', 'javascript', 'js'].includes(cleanLang) && (
            <button
              type="button"
              className="code-block-action-btn"
              onClick={() => {
                const textToParse = fullMessageContent || `\`\`\`${cleanLang}\n${code}\n\`\`\``;
                const artifact = parseArtifact(textToParse);
                if (artifact) {
                  useChatStore.getState().setCanvasState({
                    isOpen: true,
                    content: artifact.content,
                    previewHtml: artifact.previewHtml,
                    files: artifact.files,
                    language: 'html',
                    title: "Generated Artifact"
                  });
                }
              }}
              title="Preview in Artifact"
              aria-label="Preview in Artifact"
            >
              <Eye size={15} />
            </button>
          )}
          <button
            type="button"
            className="code-block-action-btn"
            onClick={handleDownload}
            title="Download code"
            aria-label="Download code"
          >
            <Download size={15} />
          </button>
          <button
            type="button"
            className="code-block-action-btn"
            onClick={handleCopy}
            title={copied ? "Copied!" : "Copy code"}
            aria-label={copied ? "Copied!" : "Copy code"}
          >
            {copied ? <Check size={15} color="#4ade80" /> : <Copy size={15} />}
          </button>
        </div>
      </div>
      <pre className="code-block-pre">
        <code className={`code-block-code language-${cleanLang || 'none'}`}>
          {tokens ? tokens.map((token, idx) => renderToken(token, idx)) : code}
        </code>
      </pre>
    </div>
  );
};

export default CodeBlock;

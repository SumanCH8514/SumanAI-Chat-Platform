import React, { useState, useRef } from 'react';
import {
  X, Code, Eye, Copy, Check, RefreshCw,
  Download, Maximize2, Minimize2
} from 'lucide-react';
import { useChatStore } from '../store/useChatStore';
import CodeBlock from './CodeBlock';
import './Canvas.css';

const Canvas = () => {
  const { canvas, setCanvasState } = useChatStore();
  const [activeTab, setActiveTab] = useState('preview');
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const iframeRef = useRef(null);

  const files = canvas.files && canvas.files.length > 0 ? canvas.files : [
    {
      name: canvas.language === 'html' ? 'index.html' : `artifact.${canvas.language || 'txt'}`,
      language: canvas.language || 'html',
      content: canvas.content
    }
  ];

  const safeIndex = selectedFileIndex < files.length ? selectedFileIndex : 0;
  const activeFile = files[safeIndex] || files[0] || { name: 'code', language: canvas.language, content: canvas.content };

  const handleClose = () => {
    setCanvasState({ isOpen: false });
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    if (iframeRef.current) {
      const currentSrc = iframeRef.current.srcdoc;
      iframeRef.current.srcdoc = '';
      setTimeout(() => {
        if (iframeRef.current) {
          iframeRef.current.srcdoc = currentSrc;
        }
        setIsRefreshing(false);
    }, 400);
  }
};

  const handleCopy = async () => {
    const textToCopy = activeTab === 'preview'
      ? (canvas.previewHtml || canvas.content)
      : activeFile.content;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      void 0;
    }
  };

  const handleDownload = () => {
    let content = '';
    let filename = 'index.html';

    if (activeTab === 'preview') {
      content = canvas.previewHtml || canvas.content;
      filename = 'index.html';
    } else {
      content = activeFile.content;
      filename = activeFile.name;
    }

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
      <div className={`canvas-container glass ${isExpanded ? 'expanded' : ''}`}>
        <header className="canvas-header">
          <div className="canvas-info">
            <div className="canvas-title">
              <span className="canvas-status-dot"></span>
              {canvas.title || 'Generated Artifact'}
            </div>
            <div className="canvas-lang-tag">
              {canvas.language ? canvas.language.toUpperCase() : 'HTML'}
            </div>
          </div>

          <div className="canvas-actions">
              <button
                type="button"
                onClick={handleCopy}
                title={copied ? "Copied!" : "Copy code"}
                aria-label="Copy code"
              >
                {copied ? <Check size={16} color="#4ade80" /> : <Copy size={16} />}
              </button>
              <button
                type="button"
                onClick={handleRefresh}
                title="Refresh Preview"
                className={isRefreshing ? 'spinning' : ''}
                aria-label="Refresh preview"
              >
                <RefreshCw size={16} />
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="canvas-close-btn"
                title="Close artifact"
                aria-label="Close artifact"
              >
                <X size={20} />
              </button>
          </div>
        </header>

          <nav className="canvas-nav" aria-label="Artifact View Selection">
            <button
              type="button"
              className={`canvas-tab ${activeTab === 'preview' ? 'active' : ''}`}
              onClick={() => setActiveTab('preview')}
            >
              <Eye size={16} />
              <span>Preview</span>
            </button>
            <button
              type="button"
              className={`canvas-tab ${activeTab === 'code' ? 'active' : ''}`}
              onClick={() => setActiveTab('code')}
            >
              <Code size={16} />
              <span>Code</span>
              {files.length > 1 && (
                <span className="canvas-badge">{files.length} files</span>
              )}
            </button>
          </nav>

          <main className="canvas-viewport">
            {activeTab === 'preview' ? (
              <div className="preview-container">
                <iframe
                  key={`${canvas.lastUpdated || 0}-${(canvas.previewHtml || canvas.content || '').length}`}
                  ref={iframeRef}
                  title="SumanAI Canvas Preview"
                  sandbox="allow-scripts allow-modals allow-forms"
                  srcDoc={canvas.previewHtml || canvas.content}
                  className="preview-iframe"
                />
              </div>
            ) : (
          <div className="canvas-code-wrapper">
            {files.length > 1 && (
              <div className="canvas-file-bar">
                {files.map((file, idx) => (
                  <button
                    key={file.name}
                    type="button"
                    className={`canvas-file-tab ${safeIndex === idx ? 'active' : ''}`}
                    onClick={() => setSelectedFileIndex(idx)}
                  >
                    {file.name}
                  </button>
                ))}
              </div>
            )}
            <div className="canvas-code-body">
              <CodeBlock 
                key={activeFile.name} 
                language={activeFile.language} 
                code={activeFile.content} 
              />
            </div>
          </div>
        )}
      </main>

      <footer className="canvas-footer">
        <span>
          Last updated {canvas.lastUpdated ? new Date(canvas.lastUpdated).toLocaleTimeString() : 'now'}
        </span>
        <div className="footer-links">
          <button 
            type="button" 
            className="footer-download-btn" 
            onClick={handleDownload}
            title={`Download ${activeTab === 'preview' ? 'bundled index.html' : activeFile.name}`}
            aria-label="Download file"
          >
            <Download size={14} />
            <span>Download</span>
          </button>
          <button 
            type="button" 
            className="footer-icon-btn" 
            onClick={() => setIsExpanded(v => !v)}
            title={isExpanded ? "Collapse panel" : "Maximize panel"}
            aria-label={isExpanded ? "Collapse panel" : "Maximize panel"}
          >
            {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </footer>
    </div>
          );
};

          export default Canvas;

import React, { useState, useRef } from 'react';
import { 
  X, Code, Eye, Copy, RefreshCw, 
  Download, Maximize2 
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useChatStore } from '../store/useChatStore';
import './Canvas.css';

const Canvas = () => {
  const { canvas, setCanvasState } = useChatStore();
  const [activeTab, setActiveTab] = useState('preview');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const iframeRef = useRef(null);

  const handleClose = () => {
    setCanvasState({ isOpen: false });
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    if (iframeRef.current) {
      const currentSrc = iframeRef.current.srcdoc;
      iframeRef.current.srcdoc = '';
      setTimeout(() => {
        iframeRef.current.srcdoc = currentSrc;
        setIsRefreshing(false);
      }, 500);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(canvas.content);
  };

  return (
    <div className="canvas-container glass">
      <header className="canvas-header">
        <div className="canvas-info">
          <div className="canvas-title">
            <span className="canvas-status-dot"></span>
            {canvas.title || 'Artifact Preview'}
          </div>
          <div className="canvas-lang-tag">{canvas.language || 'web'}</div>
        </div>

        <div className="canvas-actions">
          <button onClick={handleCopy} title="Copy Code"><Copy size={16} /></button>
          <button onClick={handleRefresh} title="Refresh Preview" className={isRefreshing ? 'spinning' : ''}>
            <RefreshCw size={16} />
          </button>
          <button onClick={handleClose} className="canvas-close-btn"><X size={20} /></button>
        </div>
      </header>

      <nav className="canvas-nav">
        <button 
          className={`canvas-tab ${activeTab === 'preview' ? 'active' : ''}`}
          onClick={() => setActiveTab('preview')}
        >
          <Eye size={16} />
          Preview
        </button>
        <button 
          className={`canvas-tab ${activeTab === 'code' ? 'active' : ''}`}
          onClick={() => setActiveTab('code')}
        >
          <Code size={16} />
          Code
        </button>
      </nav>

      <main className="canvas-viewport">
        {activeTab === 'preview' ? (
          <div className="preview-container">
            <iframe
              ref={iframeRef}
              title="SumanAI Canvas Preview"
              sandbox="allow-scripts"
              srcDoc={canvas.content}
              className="preview-iframe"
            />
          </div>
        ) : (
          <div className="code-container">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {`\`\`\`${canvas.language}\n${canvas.content}\n\`\`\``}
            </ReactMarkdown>
          </div>
        )}
      </main>

      <footer className="canvas-footer">
         <span>Last updated {canvas.lastUpdated ? new Date(canvas.lastUpdated).toLocaleTimeString() : 'now'}</span>
         <div className="footer-links">
           <button><Download size={14} /> Download</button>
           <button><Maximize2 size={14} /></button>
         </div>
      </footer>
    </div>
  );
};

export default Canvas;

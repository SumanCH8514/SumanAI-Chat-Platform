import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Image as ImageIcon, ArrowLeft, Download, Copy, Check, RefreshCw,
  Maximize2, X, ExternalLink, Sparkles, SlidersHorizontal
} from 'lucide-react';
import { chatService } from '../../services/ChatService';
import './ToolAppShared.css';
import './ImageGenerator.css';

const STYLES = [
  { id: 'vector', label: 'Vector Illustration', suffix: ', flat vector graphic, clean SVG aesthetic, minimalist shapes, Behance trending, high-contrast flat colors, no gradients' },
  { id: 'icon3d', label: '3D Isometric', suffix: ', isometric 3D render, smooth matte clay texture, soft studio lighting, Cinema 4D, clean geometric edges' },
  { id: 'lineart', label: 'Minimal Line Art', suffix: ', ultra clean monoline illustration, continuous line art, architectural drafting precision, white and black ink' },
  { id: 'digital-painting', label: 'Digital Concept Art', suffix: ', high fantasy digital concept art, matte painting, ArtStation featured, 8k resolution, dramatic rim lighting' },
  { id: 'pixel-art', label: 'Pixel Art', suffix: ', crisp 32-bit pixel art, nostalgic arcade aesthetic, sharp pixels, vibrant color palette' },
  { id: 'editorial', label: 'Editorial Watercolor', suffix: ', modern editorial watercolor illustration, textured paper grain, loose wet ink washes, magazine layout style' }
];

const PALETTES = [
  { id: 'tech', label: 'Modern Tech', suffix: ', electric cyan, deep navy, clean white palette' },
  { id: 'monochrome', label: 'Monochrome', suffix: ', grayscale, high contrast charcoal and bright white' },
  { id: 'warm', label: 'Warm Ember', suffix: ', terracotta, burnt orange, golden amber tones' },
  { id: 'forest', label: 'Alpine Emerald', suffix: ', deep forest green, sage, off-white accents' },
  { id: 'pastel', label: 'Clean Pastel', suffix: ', muted soft tones, Scandinavian palette, desaturated pastel' }
];

const RESOLUTIONS = [
  { id: '1024x1024', label: 'Square (1024×1024)', width: 1024, height: 1024 },
  { id: '1280x720', label: 'Landscape (1280×720)', width: 1280, height: 720 },
  { id: '720x1280', label: 'Portrait (720×1280)', width: 720, height: 1280 },
  { id: '800x600', label: 'Card (800×600)', width: 800, height: 600 }
];

export const ImageGenerator = () => {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('An isometric smart home robotic assistant hub hovering above a wooden desk');
  const [negativePrompt, setNegativePrompt] = useState('blurry, photorealistic skin, low resolution, watermark, bad anatomy');
  const [selectedStyle, setSelectedStyle] = useState('vector');
  const [selectedPalette, setSelectedPalette] = useState('tech');
  const [resolution, setResolution] = useState('1024x1024');
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 888888));
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState(null);
  const [copied, setCopied] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const handleRandomSeed = () => {
    setSeed(Math.floor(Math.random() * 888888));
  };

  const handleEnhancePrompt = async () => {
    if (!prompt.trim() || isEnhancing) return;
    setIsEnhancing(true);
    try {
      let enriched = '';
      await chatService.generateResponse(
        'qwen/qwen3.8-27b',
        [
          {
            role: 'system',
            content: 'You are an expert illustrator and visual designer. Transform the user input into a concise, vivid prompt optimized for graphic design and illustration generators. Output ONLY the refined prompt without markdown formatting, quotes, or conversational filler.'
          },
          { role: 'user', content: prompt.trim() }
        ],
        (chunk) => { enriched += chunk; }
      );
      if (enriched.trim()) {
        setPrompt(enriched.trim().replace(/^["']|["']$/g, ''));
      }
    } catch {
      void 0;
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleGenerate = () => {
    if (!prompt.trim() || isGenerating) return;
    setIsGenerating(true);

    const resObj = RESOLUTIONS.find((r) => r.id === resolution) || RESOLUTIONS[0];
    const styleObj = STYLES.find((s) => s.id === selectedStyle);
    const paletteObj = PALETTES.find((p) => p.id === selectedPalette);

    const fullPrompt = `${prompt.trim()}${styleObj?.suffix || ''}${paletteObj?.suffix || ''}`;
    const encoded = encodeURIComponent(fullPrompt);
    const url = `https://image.pollinations.ai/prompt/${encoded}?width=${resObj.width}&height=${resObj.height}&seed=${seed}&nologo=true`;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = url;
    img.onload = () => {
      setGeneratedImageUrl(url);
      setIsGenerating(false);
      try {
        const raw = localStorage.getItem('sumanai_uploaded_files');
        const list = raw ? JSON.parse(raw) : [];
        const cleanPrompt = prompt.trim().replace(/[^a-zA-Z0-9_\-\s]/g, '').trim().replace(/\s+/g, '_').slice(0, 32) || 'Illustration';
        const newFile = {
          id: `gen-ig-${Date.now()}`,
          name: `${cleanPrompt}.jpg`,
          type: 'image',
          subtype: 'generated',
          url,
          size: '512 KB',
          chatTitle: 'AI Graphic Generator',
          createdAt: Date.now()
        };
        localStorage.setItem('sumanai_uploaded_files', JSON.stringify([newFile, ...list.filter(item => item.url !== url)]));
      } catch {
        void 0;
      }
    };
    img.onerror = () => {
      setGeneratedImageUrl(url);
      setIsGenerating(false);
    };
  };

  const handleDownload = async () => {
    if (!generatedImageUrl) return;
    try {
      const response = await fetch(generatedImageUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `SumanAI_Artwork_${seed}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(generatedImageUrl, '_blank');
    }
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="tool-app-wrapper">
      <header className="tool-app-header">
        <nav className="tool-nav-breadcrumb">
          <button
            type="button"
            className="tool-nav-back-btn"
            onClick={() => navigate('/tools/view')}
          >
            <ArrowLeft size={13} />
            <span>Utilities</span>
          </button>
          <span className="tool-nav-sep">/</span>
          <span className="tool-nav-current">AI Image Generator</span>
        </nav>

        <div className="tool-header-content">
          <div className="tool-title-row">
            <h1 className="tool-app-heading">AI Image Generator</h1>
            <span className="tool-tag-pill">Vector & Concept Studio</span>
          </div>
          <p className="tool-app-subheading">
            Synthesize custom vector art, 3D icons, and digital illustrations with fine-tuned design palettes.
          </p>
        </div>
      </header>

      <main className="tool-app-body">
        <section className="tool-config-panel">
          <div className="tool-input-group">
            <div className="tool-label">
              <span>Illustration Concept</span>
              <button
                type="button"
                className="tool-enhance-btn"
                onClick={handleEnhancePrompt}
                disabled={isEnhancing || !prompt.trim()}
              >
                <Sparkles size={12} className={isEnhancing ? 'tool-loading-spinner' : ''} />
                {isEnhancing ? 'Refining...' : 'Enrich with AI'}
              </button>
            </div>
            <textarea
              className="tool-textarea"
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the subject, perspective, and composition..."
            />
          </div>

          <div className="tool-input-group">
            <label className="tool-label">Visual Style</label>
            <div className="tool-grid-options">
              {STYLES.map((style) => (
                <button
                  key={style.id}
                  type="button"
                  className={`tool-option-card ${selectedStyle === style.id ? 'active' : ''}`}
                  onClick={() => setSelectedStyle(style.id)}
                >
                  <span>{style.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="tool-input-group">
            <label className="tool-label">Color Palette</label>
            <div className="tool-palette-pills">
              {PALETTES.map((palette) => (
                <button
                  key={palette.id}
                  type="button"
                  className={`tool-palette-pill ${selectedPalette === palette.id ? 'active' : ''}`}
                  onClick={() => setSelectedPalette(palette.id)}
                >
                  {palette.label}
                </button>
              ))}
            </div>
          </div>

          <div className="tool-row-two-col">
            <div className="tool-input-group">
              <label className="tool-label">Aspect & Size</label>
              <select
                className="tool-select"
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
              >
                {RESOLUTIONS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="tool-input-group">
              <label className="tool-label">Seed Number</label>
              <div className="tool-seed-row">
                <input
                  type="number"
                  className="tool-input-text tool-seed-input"
                  value={seed}
                  onChange={(e) => setSeed(Number(e.target.value))}
                />
                <button
                  type="button"
                  className="tool-btn-secondary tool-seed-btn"
                  onClick={handleRandomSeed}
                  title="Randomize Seed"
                >
                  <RefreshCw size={14} />
                </button>
              </div>
            </div>
          </div>

          <div className="tool-input-group">
            <label className="tool-label">
              <span>Exclude Elements</span>
              <span className="tool-label-hint">Negative Prompt</span>
            </label>
            <input
              type="text"
              className="tool-input-text"
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              placeholder="e.g. blurry, text, low detail"
            />
          </div>

          <button
            type="button"
            className="tool-btn-primary"
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
          >
            {isGenerating ? (
              <>
                <RefreshCw size={16} className="tool-loading-spinner" />
                Rendering Illustration...
              </>
            ) : (
              <>
                <ImageIcon size={16} />
                Generate Artwork
              </>
            )}
          </button>
        </section>

        <section className="tool-result-panel">
          <div className="tool-result-header">
            <div className="tool-result-title">
              <SlidersHorizontal size={16} />
              <span>Canvas Output</span>
              {generatedImageUrl && (
                <span className="tool-telemetry-badge">
                  Seed #{seed} • {resolution}
                </span>
              )}
            </div>

            {generatedImageUrl && (
              <div className="tool-result-actions">
                <button
                  type="button"
                  className="tool-btn-secondary"
                  onClick={handleCopyPrompt}
                  title="Copy Prompt"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  type="button"
                  className="tool-btn-secondary"
                  onClick={() => setLightboxOpen(true)}
                  title="Fullscreen Preview"
                >
                  <Maximize2 size={14} />
                  <span>Preview</span>
                </button>
                <button
                  type="button"
                  className="tool-btn-secondary"
                  onClick={handleDownload}
                  title="Download File"
                >
                  <Download size={14} />
                  <span>Download</span>
                </button>
                <button
                  type="button"
                  className="tool-btn-secondary"
                  onClick={() => navigate('/tools/bg-remover')}
                  title="Remove background from this image"
                >
                  <ExternalLink size={14} />
                  <span>Matte BG</span>
                </button>
              </div>
            )}
          </div>

          <div className="tool-canvas-container">
            {isGenerating ? (
              <div className="tool-generating-state">
                <div className="tool-generating-visualizer">
                  <RefreshCw size={36} className="tool-loading-spinner" />
                </div>
                <h3 className="tool-generating-title">Synthesizing Visual Layers</h3>
                <p className="tool-generating-desc">
                  Applying "{STYLES.find((s) => s.id === selectedStyle)?.label}" stylization with seed #{seed}
                </p>
              </div>
            ) : generatedImageUrl ? (
              <div className="tool-image-display-frame">
                <img
                  src={generatedImageUrl}
                  alt={prompt}
                  className="tool-rendered-artwork"
                />
              </div>
            ) : (
              <div className="tool-empty-display">
                <div className="tool-empty-icon-box">
                  <ImageIcon size={28} />
                </div>
                <p className="tool-empty-text">No Artwork Generated Yet</p>
                <p className="tool-empty-subtext">
                  Choose a style and palette on the left panel, then hit Generate Artwork to render high-resolution designs.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>

      {lightboxOpen && generatedImageUrl && (
        <div className="tool-lightbox-overlay" onClick={() => setLightboxOpen(false)}>
          <div className="tool-lightbox-modal" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="tool-lightbox-close"
              onClick={() => setLightboxOpen(false)}
            >
              <X size={20} />
            </button>
            <img
              src={generatedImageUrl}
              alt={prompt}
              className="tool-lightbox-img"
            />
            <div className="tool-lightbox-bar">
              <span className="tool-lightbox-prompt">{prompt}</span>
              <button
                type="button"
                className="tool-btn-secondary"
                onClick={handleDownload}
              >
                <Download size={14} /> Download Image
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageGenerator;


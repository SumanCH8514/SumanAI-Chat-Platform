import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Home, BookOpen, ExternalLink, Image as ImageIcon,
  Download, Copy, Check, RefreshCw, Maximize2, X,
  Sparkles, Layers, ShieldCheck, Zap, Clock,
  ArrowRight, Loader2, Trash2, Palette
} from 'lucide-react';
import { chatService } from '../../services/ChatService';
import { downloadImage } from '../../utils/downloadUtils';
import { applySumanAIWatermark } from '../../utils/watermarkUtils';
import './ToolAppShared.css';
import './ImageGenerator.css';

const STYLES = [
  { id: 'vector', label: 'Vector Art', suffix: ', flat vector graphic, clean SVG aesthetic, minimalist shapes, Behance trending, high-contrast flat colors, no gradients' },
  { id: 'icon3d', label: '3D Isometric', suffix: ', isometric 3D render, smooth matte clay texture, soft studio lighting, Cinema 4D, clean geometric edges' },
  { id: 'lineart', label: 'Minimal Line', suffix: ', ultra clean monoline illustration, continuous line art, architectural drafting precision, white and black ink' },
  { id: 'digital-painting', label: 'Concept Art', suffix: ', high fantasy digital concept art, matte painting, ArtStation featured, 8k resolution, dramatic rim lighting' },
  { id: 'pixel-art', label: 'Pixel Art', suffix: ', crisp 32-bit pixel art, nostalgic arcade aesthetic, sharp pixels, vibrant color palette' },
  { id: 'editorial', label: 'Watercolor', suffix: ', modern editorial watercolor illustration, textured paper grain, loose wet ink washes, magazine layout style' }
];

const ENGINES = [
  { id: 'flux', label: 'Flux 1 Schnell', modelParam: 'flux' },
  { id: 'grok', label: 'Grok Imagine Quality (xAI)', modelParam: 'grok-imagine' }
];

const PALETTES = [
  { id: 'tech', label: 'Modern Tech', suffix: ', electric cyan, deep navy, clean white palette' },
  { id: 'monochrome', label: 'Monochrome', suffix: ', grayscale, high contrast charcoal and bright white' },
  { id: 'warm', label: 'Warm Ember', suffix: ', terracotta, burnt orange, golden amber tones' },
  { id: 'forest', label: 'Alpine Emerald', suffix: ', deep forest green, sage, off-white accents' }
];

const RESOLUTIONS = [
  { id: '1024x1024', label: 'Square (1:1)', width: 1024, height: 1024 },
  { id: '1280x720', label: 'Landscape (16:9)', width: 1280, height: 720 },
  { id: '720x1280', label: 'Portrait (9:16)', width: 720, height: 1280 },
  { id: '800x600', label: 'Card (4:3)', width: 800, height: 600 }
];

const INSPIRATION_PILLS = [
  { text: 'Isometric smart home hub', prompt: 'An isometric smart home robotic assistant hub hovering above a modern oak wooden desk with holographic interface' },
  { text: 'Cyberpunk ramen shop', prompt: 'A cozy cyberpunk ramen noodle bar with neon lanterns and steam rising into the misty rainy night' },
  { text: 'Futuristic electric supercar', prompt: 'An elegant retro-futuristic electric supercar speeding across a desert canyon at sunset' },
  { text: 'Minimalist forest cabin', prompt: 'A minimalist geometric A-frame cabin in a dense pine forest surrounded by calm mist and warm hearth glow' }
];

const DEFAULT_RECENT_IMAGES = [
  { url: 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=300&q=80', prompt: 'Isometric tech hub' },
  { url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=300&q=80', prompt: 'Cyberpunk ramen' },
  { url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=300&q=80', prompt: 'A-frame cabin' },
  { url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=300&q=80', prompt: 'Mountain lake' }
];

export const ImageGenerator = () => {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('An isometric smart home robotic assistant hub hovering above a modern desk');
  const [negativePrompt, setNegativePrompt] = useState('blurry, photorealistic skin, low resolution, bad anatomy');
  const [selectedStyle, setSelectedStyle] = useState('vector');
  const [selectedEngine, setSelectedEngine] = useState('flux');
  const [selectedPalette, setSelectedPalette] = useState('tech');
  const [resolution, setResolution] = useState('1024x1024');
  const [seed, setSeed] = useState(619283);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState(null);
  const [copied, setCopied] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [recentGallery, setRecentGallery] = useState(DEFAULT_RECENT_IMAGES);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('sumanai_uploaded_files');
      if (raw) {
        const list = JSON.parse(raw);
        const imagesOnly = list.filter((f) => f?.type?.startsWith('image/') || f?.url?.includes('/generated-images/'));
        if (imagesOnly.length > 0) {
          const mapped = imagesOnly.slice(0, 8).map((f) => ({
            url: f.url,
            prompt: f.name || 'Generated vector art'
          }));
          setRecentGallery([...mapped, ...DEFAULT_RECENT_IMAGES].slice(0, 8));
        }
      }
    } catch {
      void 0;
    }
  }, [generatedImageUrl]);

  const handleRandomSeed = () => {
    setSeed(Math.floor(Math.random() * 999999));
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
    const engObj = ENGINES.find((e) => e.id === selectedEngine) || ENGINES[0];

    const fullPrompt = `${prompt.trim()}${styleObj?.suffix || ''}${paletteObj?.suffix || ''}`;
    const encoded = encodeURIComponent(fullPrompt);
    const url = `https://image.pollinations.ai/prompt/${encoded}?width=${resObj.width}&height=${resObj.height}&seed=${seed}&nologo=true&model=${engObj.modelParam}`;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = url;
    img.onload = () => {
      applySumanAIWatermark(url)
        .then((watermarked) => {
          const finalUrl = watermarked || url;
          setGeneratedImageUrl(finalUrl);
          setIsGenerating(false);
          try {
            const raw = localStorage.getItem('sumanai_uploaded_files');
            const list = raw ? JSON.parse(raw) : [];
            const cleanPrompt = prompt.trim().replace(/[^a-zA-Z0-9_\-\s]/g, '').trim().replace(/\s+/g, '_').slice(0, 32) || 'Artwork';
            const newFile = {
              id: `gen-art-${Date.now()}`,
              name: `${cleanPrompt}.jpg`,
              type: 'image',
              subtype: 'generated',
              url: finalUrl,
              size: '480 KB',
              chatTitle: 'AI Image Generator',
              createdAt: Date.now()
            };
            localStorage.setItem('sumanai_uploaded_files', JSON.stringify([newFile, ...list.filter(item => item.url !== finalUrl)].slice(0, 100)));
          } catch {
            void 0;
          }
        })
        .catch(() => {
          setGeneratedImageUrl(url);
          setIsGenerating(false);
        });
    };
    img.onerror = () => {
      setGeneratedImageUrl(url);
      setIsGenerating(false);
    };
  };

  const handleDownload = () => {
    if (!generatedImageUrl) return;
    downloadImage(generatedImageUrl, `SumanAI_Artwork_${seed}`, 'jpg');
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const reset = () => {
    setGeneratedImageUrl(null);
  };

  return (
    <div className="uncensored-page-wrapper">
      <div className="uncensored-top-nav">
        <div className="uncensored-breadcrumb">
          <button
            type="button"
            className="breadcrumb-home-btn"
            onClick={() => navigate('/')}
            title="Home"
          >
            <Home size={13} />
          </button>
          <span className="breadcrumb-sep">&gt;</span>
          <button
            type="button"
            className="breadcrumb-link"
            onClick={() => navigate('/tools/view')}
          >
            Tools
          </button>
          <span className="breadcrumb-sep">&gt;</span>
          <span className="breadcrumb-link">Image Processing</span>
          <span className="breadcrumb-sep">&gt;</span>
          <span className="breadcrumb-current">AI Image Generator</span>
        </div>

        <a
          href="https://github.com/black-forest-labs/flux"
          target="_blank"
          rel="noopener noreferrer"
          className="uncensored-doc-btn"
          title="Vector & Concept Documentation"
        >
          <BookOpen size={13} />
          <span>Documentation</span>
          <ExternalLink size={11} className="doc-ext-icon" />
        </a>
      </div>

      <header className="uncensored-title-section">
        <div className="uncensored-title-left">
          <div className="uncensored-avatar-icon">
            <ImageIcon size={22} />
          </div>
          <div className="uncensored-title-texts">
            <h1 className="uncensored-main-title">AI Image Generator</h1>
            <p className="uncensored-main-desc">
              Synthesize custom vector art, 3D icons, and digital illustrations with fine-tuned design palettes.
            </p>
          </div>
        </div>

        <div className="uncensored-chips-row">
          <span className="chip-badge chip-qwen">
            <Layers size={12} />
            <span>Vector & Concept</span>
          </span>
          <span className="chip-badge chip-uncensored">
            <Palette size={12} />
            <span>Palette Tuner</span>
          </span>
          <span className="chip-badge chip-zerogpu">
            <ShieldCheck size={12} />
            <span>Flux Pipeline</span>
          </span>
        </div>
      </header>

      <main className="uncensored-main-grid">
        <section className="uncensored-left-card">
          <div className="uncensored-field-group">
            <div className="field-label-line">
              <span className="field-label-text">
                <span>Illustration Concept</span>
              </span>
              <button
                type="button"
                className="enhance-btn"
                onClick={handleEnhancePrompt}
                disabled={isEnhancing}
              >
                <Sparkles size={12} />
                <span>{isEnhancing ? 'Refining...' : 'Enrich with AI'}</span>
              </button>
            </div>
            <div className="prompt-textarea-wrapper">
              <textarea
                className="prompt-textarea"
                rows={3}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the subject, perspective, and composition..."
              />
              <span className="prompt-char-count">{prompt.length} / 2000</span>
            </div>
          </div>

          <div className="uncensored-field-group">
            <span className="field-label-text">
              <span>Sample Inspirations</span>
            </span>
            <div className="inspirations-grid">
              {INSPIRATION_PILLS.map((pill) => (
                <button
                  key={pill.text}
                  type="button"
                  className="inspiration-pill"
                  onClick={() => setPrompt(pill.prompt)}
                >
                  <span className="pill-text">{pill.text}</span>
                  <span className="pill-plus">+</span>
                </button>
              ))}
            </div>
          </div>

          <div className="uncensored-field-group">
            <span className="field-label-text">
              <span>Visual Style</span>
            </span>
            <div className="ratios-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              {STYLES.map((st) => (
                <button
                  key={st.id}
                  type="button"
                  className={`ratio-btn ${selectedStyle === st.id ? 'active' : ''}`}
                  onClick={() => setSelectedStyle(st.id)}
                >
                  <div className="ratio-top-line">
                    <div className="ratio-check-box">
                      {selectedStyle === st.id && <Check size={11} />}
                    </div>
                  </div>
                  <span className="ratio-name-tag" style={{ marginTop: '2px' }}>{st.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="uncensored-field-group">
            <span className="field-label-text">
              <span>Color Palette</span>
            </span>
            <div className="ratios-row" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
              {PALETTES.map((pal) => (
                <button
                  key={pal.id}
                  type="button"
                  className={`ratio-btn ${selectedPalette === pal.id ? 'active' : ''}`}
                  onClick={() => setSelectedPalette(pal.id)}
                >
                  <div className="ratio-top-line">
                    <div className="ratio-check-box">
                      {selectedPalette === pal.id && <Check size={11} />}
                    </div>
                    <span className="ratio-id-tag">{pal.label.split(' ')[0]}</span>
                  </div>
                  <span className="ratio-name-tag">{pal.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="uncensored-field-group">
            <span className="field-label-text">
              <span>AI Engine</span>
            </span>
            <div className="ratios-row" style={{ gridTemplateColumns: '1fr 1fr' }}>
              {ENGINES.map((eng) => (
                <button
                  key={eng.id}
                  type="button"
                  className={`ratio-btn ${selectedEngine === eng.id ? 'active' : ''}`}
                  onClick={() => setSelectedEngine(eng.id)}
                >
                  <div className="ratio-top-line">
                    <div className="ratio-check-box">
                      {selectedEngine === eng.id && <Check size={11} />}
                    </div>
                    <span className="ratio-id-tag">{eng.label.split(' ')[0]}</span>
                  </div>
                  <span className="ratio-name-tag">{eng.label.split(' ').slice(1).join(' ')}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="uncensored-field-group">
            <span className="field-label-text">
              <span>Exclude Elements (Negative Prompt)</span>
            </span>
            <input
              type="text"
              className="prompt-textarea"
              style={{ minHeight: '40px', height: '40px', padding: '0 12px' }}
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              placeholder="Artifacts to suppress..."
            />
          </div>

          <div className="uncensored-field-group">
            <span className="field-label-text">
              <span>Aspect & Resolution</span>
            </span>
            <div className="ratios-row" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
              {RESOLUTIONS.map((res) => (
                <button
                  key={res.id}
                  type="button"
                  className={`ratio-btn ${resolution === res.id ? 'active' : ''}`}
                  onClick={() => setResolution(res.id)}
                >
                  <div className="ratio-top-line">
                    <div className="ratio-check-box">
                      {resolution === res.id && <Check size={11} />}
                    </div>
                    <span className="ratio-id-tag">{res.id}</span>
                  </div>
                  <span className="ratio-name-tag">{res.label.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="uncensored-field-group">
            <div className="field-label-line">
              <span className="field-label-text">
                <span>Generation Seed</span>
              </span>
              <button
                type="button"
                className="enhance-btn"
                onClick={handleRandomSeed}
              >
                <RefreshCw size={11} />
                <span>Randomize</span>
              </button>
            </div>
            <input
              type="number"
              className="prompt-textarea"
              style={{ minHeight: '40px', height: '40px', padding: '0 12px' }}
              value={seed}
              onChange={(e) => setSeed(parseInt(e.target.value, 10) || 1)}
            />
          </div>

          <button
            type="button"
            className="uncensored-btn-generate"
            disabled={isGenerating || !prompt.trim()}
            onClick={handleGenerate}
          >
            {isGenerating ? (
              <>
                <Loader2 size={16} className="button-spin" />
                <span>Rendering Illustration...</span>
              </>
            ) : (
              <>
                <Sparkles size={16} />
                <span>Generate Artwork</span>
              </>
            )}
          </button>
        </section>

        <section className="uncensored-right-card">
          <div className="canvas-header-bar">
            <div className="canvas-title-left">
              <ImageIcon size={16} className="canvas-title-icon" />
              <span>Canvas Output</span>
            </div>
            <div className="canvas-actions-right">
              <button
                type="button"
                className="canvas-action-btn"
                disabled={!generatedImageUrl}
                onClick={handleCopyPrompt}
                title="Copy prompt"
              >
                {copied ? <Check size={13} color="#22c55e" /> : <Copy size={13} />}
              </button>
              <button
                type="button"
                className="canvas-action-btn"
                disabled={!generatedImageUrl}
                onClick={handleDownload}
                title="Download artwork"
              >
                <Download size={14} />
              </button>
              <button
                type="button"
                className="canvas-action-btn"
                disabled={!generatedImageUrl}
                onClick={() => setLightboxOpen(true)}
                title="Fullscreen preview"
              >
                <Maximize2 size={14} />
              </button>
              <button
                type="button"
                className="canvas-action-btn"
                disabled={!generatedImageUrl}
                onClick={reset}
                title="Clear canvas"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          <div className="canvas-main-area">
            {isGenerating ? (
              <div className="canvas-generating-state">
                <Loader2 size={44} className="canvas-spin-icon" />
                <span className="generating-title">Rendering Vector Concept</span>
                <span className="generating-subtitle">Applying vector curves, isometric lighting, and palette rules...</span>
              </div>
            ) : generatedImageUrl ? (
              <div className="result-image-box">
                <img
                  src={generatedImageUrl}
                  alt={prompt}
                  className="rendered-ai-image"
                  onClick={() => setLightboxOpen(true)}
                />
              </div>
            ) : (
              <div className="canvas-empty-state">
                <div className="empty-illustration-box">
                  <ImageIcon size={36} className="empty-cloud-icon" />
                </div>
                <h3 className="empty-state-title">Ready for Design Synthesis</h3>
                <p className="empty-state-desc">
                  Select a style, palette, and enter an illustration concept to generate your vector art here.
                </p>

                <div className="empty-features-grid">
                  <div className="feature-pill-card">
                    <Zap size={14} className="feature-card-icon" />
                    <div className="feature-card-text">
                      <span className="feature-card-title">Vector Cleanliness</span>
                      <span className="feature-card-desc">Crisp shapes and iconic forms</span>
                    </div>
                  </div>
                  <div className="feature-pill-card">
                    <Palette size={14} className="feature-card-icon" />
                    <div className="feature-card-text">
                      <span className="feature-card-title">Palette Control</span>
                      <span className="feature-card-desc">Curated brand color sets</span>
                    </div>
                  </div>
                  <div className="feature-pill-card">
                    <ShieldCheck size={14} className="feature-card-icon" />
                    <div className="feature-card-text">
                      <span className="feature-card-title">ZeroGPU Speed</span>
                      <span className="feature-card-desc">High performance rendering</span>
                    </div>
                  </div>
                  <div className="feature-pill-card">
                    <Clock size={14} className="feature-card-icon" />
                    <div className="feature-card-text">
                      <span className="feature-card-title">Direct Export</span>
                      <span className="feature-card-desc">High resolution JPEG/PNG</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="recent-generations-bar">
            <div className="recent-bar-header">
              <div className="recent-title-wrap">
                <Clock size={14} className="recent-clock-icon" />
                <span>Recent Creations</span>
              </div>
              <button
                type="button"
                className="view-library-link"
                onClick={() => navigate('/files')}
              >
                <span>View Library</span>
                <ArrowRight size={13} />
              </button>
            </div>

            <div className="recent-thumbs-row">
              {recentGallery.map((item, idx) => (
                <div
                  key={idx}
                  className="recent-thumb-wrapper"
                  onClick={() => {
                    setPrompt(item.prompt);
                    setGeneratedImageUrl(item.url);
                  }}
                  title={item.prompt}
                >
                  <img src={item.url} alt={item.prompt} className="recent-thumb-img" />
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {lightboxOpen && generatedImageUrl && (
        <div className="lightbox-backdrop" onClick={() => setLightboxOpen(false)}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <img
              src={generatedImageUrl}
              alt={prompt}
              className="lightbox-img"
            />
            <div className="lightbox-actions">
              <button
                type="button"
                className="lightbox-btn"
                onClick={handleDownload}
              >
                <Download size={14} />
                <span>Download</span>
              </button>
              <button
                type="button"
                className="lightbox-btn"
                onClick={() => setLightboxOpen(false)}
              >
                <X size={14} />
                <span>Close</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageGenerator;

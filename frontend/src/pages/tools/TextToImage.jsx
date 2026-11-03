import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Home, BookOpen, ExternalLink, Image as ImageIcon,
  Download, Copy, Check, RefreshCw, Maximize2, X,
  Wand2, Sparkles, Layers, ShieldCheck, Zap, Clock,
  ArrowRight, Loader2, Trash2
} from 'lucide-react';
import { chatService } from '../../services/ChatService';
import { downloadImage } from '../../utils/downloadUtils';
import { applySumanAIWatermark } from '../../utils/watermarkUtils';
import './ToolAppShared.css';
import './TextToImage.css';

const STYLES = [
  { id: 'photorealistic', label: 'Photorealistic', promptSuffix: ', 8k resolution, highly detailed, photorealistic, studio lighting, canon eos r5' },
  { id: 'cinematic', label: 'Cinematic', promptSuffix: ', cinematic lighting, 35mm film photograph, dramatic atmosphere, anamorphic' },
  { id: 'anime', label: 'Anime / Manga', promptSuffix: ', anime visual style, makoto shinkai aesthetic, clean linework, vibrant vibrant colors' },
  { id: 'digital-art', label: 'Digital Art', promptSuffix: ', trending on artstation, digital painting, concept art, smooth gradients' },
  { id: '3d-render', label: '3D Render', promptSuffix: ', octane render, unreal engine 5, ray tracing, 3D blender aesthetic' },
  { id: 'cyberpunk', label: 'Cyberpunk', promptSuffix: ', neon lighting, cyberpunk city aesthetic, high tech, dark rainy reflections' }
];

const ENGINES = [
  { id: 'flux', label: 'Flux 1 Schnell', modelParam: 'flux' },
  { id: 'grok', label: 'Grok Imagine Quality (xAI)', modelParam: 'grok-imagine' }
];

const ASPECT_RATIOS = [
  { id: '1:1', label: 'Square (1:1)', width: 1024, height: 1024, iconClass: 'ratio-1-1' },
  { id: '16:9', label: 'Landscape (16:9)', width: 1280, height: 720, iconClass: 'ratio-16-9' },
  { id: '9:16', label: 'Portrait (9:16)', width: 720, height: 1280, iconClass: 'ratio-9-16' },
  { id: '4:3', label: 'Standard (4:3)', width: 1024, height: 768, iconClass: 'ratio-4-3' }
];

const INSPIRATION_PILLS = [
  { text: 'Cyberpunk metropolis', prompt: 'A glowing cyberpunk metropolis in the pouring rain with flying vehicles and towering holographic advertisements' },
  { text: 'Cozy fantasy library', prompt: 'A cozy medieval fantasy library with high arched wooden bookshelves, stained glass windows, and floating candles' },
  { text: 'Alpine glass villa', prompt: 'A sleek architectural modern villa in the alpine mountains at twilight with warm lighting and infinity pool' },
  { text: 'Sci-fi orbital station', prompt: 'An intricate orbital space station orbiting Saturn with visible rings and solar reflections in 8k cinematic lighting' }
];

const DEFAULT_RECENT_IMAGES = [
  { url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=300&q=80', prompt: 'Cyberpunk portrait' },
  { url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=300&q=80', prompt: 'Fantasy cottage' },
  { url: 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=300&q=80', prompt: 'Supercar neon' },
  { url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=300&q=80', prompt: 'Alpine valley' }
];

export const TextToImage = () => {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('A sleek architectural modern villa in the alpine mountains at twilight with warm interior lighting');
  const [negativePrompt, setNegativePrompt] = useState('blurry, low quality, distorted, extra limbs');
  const [selectedStyle, setSelectedStyle] = useState('photorealistic');
  const [selectedEngine, setSelectedEngine] = useState('flux');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [seed, setSeed] = useState(482910);
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
            prompt: f.name || 'Generated visual'
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
            content: 'You are an expert AI prompt engineer for diffusion models. Enhance the user prompt into a high-detail, vivid visual prompt. Output ONLY the refined prompt text without greetings, explanations, or quotes.'
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

    const ratio = ASPECT_RATIOS.find((r) => r.id === aspectRatio) || ASPECT_RATIOS[0];
    const styleObj = STYLES.find((s) => s.id === selectedStyle);
    const engObj = ENGINES.find((e) => e.id === selectedEngine) || ENGINES[0];
    const fullPrompt = `${prompt.trim()}${styleObj?.promptSuffix || ''}`;
    const encoded = encodeURIComponent(fullPrompt);
    const url = `https://image.pollinations.ai/prompt/${encoded}?width=${ratio.width}&height=${ratio.height}&seed=${seed}&nologo=true&model=${engObj.modelParam}`;

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
            const cleanPrompt = prompt.trim().replace(/[^a-zA-Z0-9_\-\s]/g, '').trim().replace(/\s+/g, '_').slice(0, 32) || 'TextToImage';
            const newFile = {
              id: `gen-t2i-${Date.now()}`,
              name: `${cleanPrompt}.jpg`,
              type: 'image',
              subtype: 'generated',
              url: finalUrl,
              size: '512 KB',
              chatTitle: 'Text to Image Studio',
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
    downloadImage(generatedImageUrl, `SumanAI_Diffusion_${seed}`, 'jpg');
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
          <span className="breadcrumb-current">Text to Image</span>
        </div>

        <a
          href="https://github.com/black-forest-labs/flux"
          target="_blank"
          rel="noopener noreferrer"
          className="uncensored-doc-btn"
          title="Diffusion Engine Documentation"
        >
          <BookOpen size={13} />
          <span>Documentation</span>
          <ExternalLink size={11} className="doc-ext-icon" />
        </a>
      </div>

      <header className="uncensored-title-section">
        <div className="uncensored-title-left">
          <div className="uncensored-avatar-icon">
            <Wand2 size={22} />
          </div>
          <div className="uncensored-title-texts">
            <h1 className="uncensored-main-title">Text to Image Studio</h1>
            <p className="uncensored-main-desc">
              Render photorealistic concepts, illustrations, and digital scenes with neural diffusion prompts.
            </p>
          </div>
        </div>

        <div className="uncensored-chips-row">
          <span className="chip-badge chip-qwen">
            <Layers size={12} />
            <span>Flux-1-Schnell</span>
          </span>
          <span className="chip-badge chip-uncensored">
            <Zap size={12} />
            <span>Diffusion Pipeline</span>
          </span>
          <span className="chip-badge chip-zerogpu">
            <ShieldCheck size={12} />
            <span>ZeroGPU</span>
          </span>
        </div>
      </header>

      <main className="uncensored-main-grid">
        <section className="uncensored-left-card">
          <div className="uncensored-field-group">
            <div className="field-label-line">
              <span className="field-label-text">
                <span>Image Prompt</span>
              </span>
              <button
                type="button"
                className="enhance-btn"
                onClick={handleEnhancePrompt}
                disabled={isEnhancing}
              >
                <Sparkles size={12} />
                <span>{isEnhancing ? 'Enhancing...' : 'Enhance Prompt'}</span>
              </button>
            </div>
            <div className="prompt-textarea-wrapper">
              <textarea
                className="prompt-textarea"
                rows={3}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your visual concept in detail..."
              />
              <span className="prompt-char-count">{prompt.length} / 2000</span>
            </div>
          </div>

          <div className="uncensored-field-group">
            <span className="field-label-text">
              <span>Inspirations</span>
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
              <span>Output Aspect Ratio</span>
            </span>
            <div className="ratios-row" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
              {ASPECT_RATIOS.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className={`ratio-btn ${aspectRatio === r.id ? 'active' : ''}`}
                  onClick={() => setAspectRatio(r.id)}
                >
                  <div className="ratio-top-line">
                    <div className="ratio-check-box">
                      {aspectRatio === r.id && <Check size={11} />}
                    </div>
                    <span className="ratio-id-tag">{r.id}</span>
                  </div>
                  <span className="ratio-name-tag">{r.label.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="uncensored-field-group">
            <span className="field-label-text">
              <span>Artistic Style</span>
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
              <span>Diffusion Engine</span>
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
              placeholder="Artifacts to suppress (e.g. blurry, low quality)..."
            />
          </div>

          <div className="uncensored-field-group">
            <div className="field-label-line">
              <span className="field-label-text">
                <span>Seed</span>
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
                <span>Synthesizing Canvas...</span>
              </>
            ) : (
              <>
                <Wand2 size={16} />
                <span>Generate Artwork</span>
              </>
            )}
          </button>
        </section>

        <section className="uncensored-right-card">
          <div className="canvas-header-bar">
            <div className="canvas-title-left">
              <ImageIcon size={16} className="canvas-title-icon" />
              <span>Output Canvas</span>
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
                <span className="generating-title">Synthesizing Diffusion Concept</span>
                <span className="generating-subtitle">Rendering neural layers, ray-traced shadows, and textures...</span>
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
                  <Wand2 size={36} className="empty-cloud-icon" />
                </div>
                <h3 className="empty-state-title">Ready for Image Synthesis</h3>
                <p className="empty-state-desc">
                  Enter a prompt or select an inspiration preset and click "Generate Artwork" to create your image here.
                </p>

                <div className="empty-features-grid">
                  <div className="feature-pill-card">
                    <Zap size={14} className="feature-card-icon" />
                    <div className="feature-card-text">
                      <span className="feature-card-title">High Quality</span>
                      <span className="feature-card-desc">Detailed and sharp results</span>
                    </div>
                  </div>
                  <div className="feature-pill-card">
                    <Layers size={14} className="feature-card-icon" />
                    <div className="feature-card-text">
                      <span className="feature-card-title">Flexible Control</span>
                      <span className="feature-card-desc">Styles, ratios, and seed</span>
                    </div>
                  </div>
                  <div className="feature-pill-card">
                    <ShieldCheck size={14} className="feature-card-icon" />
                    <div className="feature-card-text">
                      <span className="feature-card-title">Prompt Guidance</span>
                      <span className="feature-card-desc">AI assisted prompt enrichment</span>
                    </div>
                  </div>
                  <div className="feature-pill-card">
                    <Clock size={14} className="feature-card-icon" />
                    <div className="feature-card-text">
                      <span className="feature-card-title">Fast Generation</span>
                      <span className="feature-card-desc">Optimized for speed</span>
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
                <span>Recent Generations</span>
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

export default TextToImage;

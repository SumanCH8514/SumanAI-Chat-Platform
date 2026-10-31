import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Download, Copy, Check, RefreshCw,
  Sliders, Image as ImageIcon, ExternalLink, Maximize2, X
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

const ASPECT_RATIOS = [
  { id: '1:1', label: 'Square (1:1)', width: 1024, height: 1024 },
  { id: '16:9', label: 'Landscape (16:9)', width: 1280, height: 720 },
  { id: '9:16', label: 'Portrait (9:16)', width: 720, height: 1280 },
  { id: '4:3', label: 'Standard (4:3)', width: 1024, height: 768 }
];

export const TextToImage = () => {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('A sleek architectural modern villa in the mountains at twilight with floor-to-ceiling glass windows and warm interior lighting');
  const [negativePrompt, setNegativePrompt] = useState('blurry, low quality, distorted, extra limbs');
  const [selectedStyle, setSelectedStyle] = useState('photorealistic');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 999999));
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState(null);
  const [copied, setCopied] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

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
    const fullPrompt = `${prompt.trim()}${styleObj?.promptSuffix || ''}`;
    const encoded = encodeURIComponent(fullPrompt);
    const url = `https://image.pollinations.ai/prompt/${encoded}?width=${ratio.width}&height=${ratio.height}&seed=${seed}&nologo=true`;

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
            localStorage.setItem('sumanai_uploaded_files', JSON.stringify([newFile, ...list.filter(item => item.url !== finalUrl)]));
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
          <span className="tool-nav-current">Text to Image</span>
        </nav>

        <div className="tool-header-content">
          <div className="tool-title-row">
            <h1 className="tool-app-heading">Text to Image Studio</h1>
            <span className="tool-tag-pill">Diffusion Engine</span>
          </div>
          <p className="tool-app-subheading">
            Render photorealistic concepts, illustrations, and digital scenes with neural diffusion prompts.
          </p>
        </div>
      </header>

      <div className="tool-app-body">
        <div className="tool-config-panel">
          <div className="tool-input-group">
            <div className="tool-label-row">
              <label className="tool-input-label">Prompt Description</label>
              <button
                type="button"
                className="tool-helper-action"
                onClick={handleEnhancePrompt}
                disabled={isEnhancing}
                title="Automatically expand and enrich prompt with professional lighting and texture details"
              >
                <RefreshCw size={12} className={isEnhancing ? 'tool-spin' : ''} />
                <span>{isEnhancing ? 'Optimizing...' : 'Enrich Prompt'}</span>
              </button>
            </div>
            <textarea
              className="tool-textarea"
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your scene in detail..."
            />
          </div>

          <div className="tool-input-group">
            <label className="tool-input-label">Artistic Style Preset</label>
            <div className="tool-options-grid">
              {STYLES.map((st) => (
                <button
                  key={st.id}
                  type="button"
                  className={`tool-option-chip ${selectedStyle === st.id ? 'active' : ''}`}
                  onClick={() => setSelectedStyle(st.id)}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          <div className="tool-input-group">
            <label className="tool-input-label">Aspect Ratio & Canvas Dimensions</label>
            <div className="tool-options-grid">
              {ASPECT_RATIOS.map((ar) => (
                <button
                  key={ar.id}
                  type="button"
                  className={`tool-option-chip ${aspectRatio === ar.id ? 'active' : ''}`}
                  onClick={() => setAspectRatio(ar.id)}
                >
                  {ar.label}
                </button>
              ))}
            </div>
          </div>

          <div className="tool-input-group">
            <div className="tool-label-row">
              <label className="tool-input-label">Negative Prompt (Avoid)</label>
            </div>
            <input
              type="text"
              className="tool-text-input"
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              placeholder="Artifacts to suppress (e.g. low quality, distorted)"
            />
          </div>

          <div className="tool-input-group">
            <div className="tool-label-row">
              <label className="tool-input-label">Generation Seed</label>
              <button
                type="button"
                className="tool-helper-action"
                onClick={handleRandomSeed}
              >
                <RefreshCw size={12} />
                <span>Randomize</span>
              </button>
            </div>
            <input
              type="number"
              className="tool-text-input"
              value={seed}
              onChange={(e) => setSeed(parseInt(e.target.value, 10) || 1)}
            />
          </div>

          <button
            type="button"
            className="tool-primary-submit-btn"
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
          >
            {isGenerating ? (
              <>
                <RefreshCw size={15} className="tool-spin" />
                <span>Synthesizing Canvas...</span>
              </>
            ) : (
              <>
                <ImageIcon size={15} />
                <span>Generate Artwork</span>
              </>
            )}
          </button>
        </div>

        <div className="tool-result-panel">
          <div className="tool-result-card">
            <div className="tool-result-header">
              <span className="tool-result-tag">Generated Canvas</span>
              {generatedImageUrl && (
                <div className="tool-result-actions">
                  <button
                    type="button"
                    className="tool-mini-btn"
                    onClick={handleCopyPrompt}
                    title="Copy Prompt"
                  >
                    {copied ? <Check size={13} /> : <Copy size={13} />}
                    <span>{copied ? 'Copied' : 'Prompt'}</span>
                  </button>
                  <button
                    type="button"
                    className="tool-mini-btn"
                    onClick={() => setLightboxOpen(true)}
                    title="Full View"
                  >
                    <Maximize2 size={13} />
                  </button>
                  <button
                    type="button"
                    className="tool-mini-btn primary"
                    onClick={handleDownload}
                    title="Download Render"
                  >
                    <Download size={13} />
                    <span>Download</span>
                  </button>
                </div>
              )}
            </div>

            <div className="tool-result-viewport">
              {isGenerating ? (
                <div className="tool-loading-placeholder">
                  <div className="tool-loading-pulse-ring" />
                  <p className="tool-loading-title">Synthesizing Diffusion Concept</p>
                  <span className="tool-loading-desc">Rendering neural layers, ray-traced shadows, and texture detail...</span>
                </div>
              ) : generatedImageUrl ? (
                <div className="tool-image-display-frame">
                  <img
                    src={generatedImageUrl}
                    alt={prompt}
                    className="tool-rendered-image"
                    onClick={() => setLightboxOpen(true)}
                  />
                </div>
              ) : (
                <div className="tool-empty-placeholder">
                  <ImageIcon size={38} className="tool-empty-icon" />
                  <p className="tool-empty-title">Ready for Generation</p>
                  <span className="tool-empty-desc">
                    Enter a creative description on the left and select your preferred aesthetic to synthesize imagery.
                  </span>
                </div>
              )}
            </div>

            {generatedImageUrl && (
              <div className="tool-result-footer">
                <button
                  type="button"
                  className="tool-workflow-link"
                  onClick={() => navigate('/tools/bg-remover')}
                >
                  <span>Remove background from this render</span>
                  <ExternalLink size={12} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {lightboxOpen && generatedImageUrl && (
        <div className="tool-lightbox-overlay" onClick={() => setLightboxOpen(false)}>
          <button
            type="button"
            className="tool-lightbox-close"
            onClick={() => setLightboxOpen(false)}
          >
            <X size={18} />
          </button>
          <img
            src={generatedImageUrl}
            alt={prompt}
            className="tool-lightbox-image"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default TextToImage;


import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Home, BookOpen, ExternalLink, Image as ImageIcon,
  Flame, Zap, Sparkles, Wand2, Info, Dices,
  Download, Maximize2, Trash2, ShieldCheck, Layers,
  Clock, ArrowRight, X, Upload, Check, Cpu, RefreshCw, Copy
} from 'lucide-react';
import { auth } from '../../config/firebase';
import { env } from '../../config/env';
import { chatService } from '../../services/ChatService';
import { downloadImage } from '../../utils/downloadUtils';
import './ToolAppShared.css';
import './UncensoredImage.css';

const ASPECT_RATIOS = [
  { id: '1024x1024 (1:1)', ratioId: '1:1', label: 'Square', iconClass: 'ratio-1-1' },
  { id: '1344x768 (16:9)', ratioId: '16:9', label: 'Landscape', iconClass: 'ratio-16-9' },
  { id: '768x1344 (9:16)', ratioId: '9:16', label: 'Portrait', iconClass: 'ratio-9-16' },
  { id: '1184x864 (4:3)', ratioId: '4:3', label: 'Standard', iconClass: 'ratio-4-3' },
  { id: '864x1184 (3:4)', ratioId: '3:4', label: 'Vertical', iconClass: 'ratio-3-4' }
];

const INSPIRATION_PILLS = [
  { text: 'Cyberpunk samurai', prompt: 'A neon-lit cyberpunk samurai standing on a skyscraper rooftop in heavy rain with glowing katana' },
  { text: 'Mystical forest fairy', prompt: 'A mystical forest fairy surrounded by glowing ethereal orbs and ancient bioluminescent flora' },
  { text: 'Hyperrealistic portrait', prompt: 'Hyperrealistic portrait of an astronaut exploring a vibrant alien crystal cavern with ambient volumetric lighting' },
  { text: 'Futuristic sports car', prompt: 'An elegant retro-futuristic sports car speeding across a desert highway at golden hour with motion blur' }
];

const DEFAULT_RECENT_IMAGES = [
  { url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=300&q=80', prompt: 'Cyberpunk portrait' },
  { url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=300&q=80', prompt: 'Cozy fantasy cottage' },
  { url: 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=300&q=80', prompt: 'Purple neon supercar' },
  { url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=300&q=80', prompt: 'Mountain valley landscape' },
  { url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=300&q=80', prompt: 'Photorealistic cat portrait' },
  { url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=300&q=80', prompt: 'Alpine castle under stars' },
  { url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=300&q=80', prompt: 'Warm studio workspace' }
];

export const UncensoredImage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [mode, setMode] = useState('generate');
  const [prompt, setPrompt] = useState('A sleek futuristic android woman with glowing porcelain cybernetic lines and luminous amber eyes');
  const [sourceImage, setSourceImage] = useState(null);
  const [sourceFileName, setSourceFileName] = useState('');
  const [selectedRatio, setSelectedRatio] = useState('1024x1024 (1:1)');
  const [steps, setSteps] = useState(28);
  const [loraScale, setLoraScale] = useState(1.0);
  const [seed, setSeed] = useState(384720);
  const [randomizeSeed, setRandomizeSeed] = useState(true);

  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [generatedImageUrl, setGeneratedImageUrl] = useState(null);
  const [usedSeed, setUsedSeed] = useState(null);
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
          const mapped = imagesOnly.slice(0, 10).map((f) => ({
            url: f.url,
            prompt: f.name || 'Generated image'
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

  const handleFileSelect = (file) => {
    if (!file || !file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }
    setErrorMessage('');
    setSourceFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      setSourceImage(e.target.result);
      if (mode !== 'edit') {
        setMode('edit');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleIterateInEdit = async () => {
    if (!generatedImageUrl) return;
    setErrorMessage('');
    setSourceFileName(`Edited_${Date.now()}.png`);
    setMode('edit');

    if (generatedImageUrl.startsWith('data:')) {
      setSourceImage(generatedImageUrl);
      return;
    }

    try {
      const res = await fetch(generatedImageUrl);
      if (res.ok) {
        const blob = await res.blob();
        const reader = new FileReader();
        reader.onload = (e) => {
          setSourceImage(e.target.result);
        };
        reader.readAsDataURL(blob);
        return;
      }
    } catch {
      void 0;
    }

    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = generatedImageUrl;
      await new Promise((resolve, reject) => {
        if (img.complete) return resolve();
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Cross-origin load failed'));
      });
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const dataUrl = canvas.toDataURL('image/png');
      setSourceImage(dataUrl);
    } catch {
      setSourceImage(generatedImageUrl);
    }
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

  const handleInspirationClick = (text, fullPrompt) => {
    setPrompt(fullPrompt || text);
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;
    if (mode === 'edit' && !sourceImage) {
      setErrorMessage('Please upload or drag-and-drop a source image to edit.');
      return;
    }

    setIsGenerating(true);
    setErrorMessage('');
    setStatusText(mode === 'edit' ? 'Uploading source & modifying with Qwen 2.1...' : 'Synthesizing with Qwen-Image-2.1 on ZeroGPU...');

    try {
      const token = auth.currentUser ? await auth.currentUser.getIdToken() : '';
      if (!token) {
        throw new Error('Please sign in with Google to generate or edit images.');
      }

      const activeSeed = randomizeSeed ? Math.floor(Math.random() * 999999) : seed;
      if (randomizeSeed) {
        setSeed(activeSeed);
      }

      const baseUrl = (env.WORKER_URL || '').replace(/\/+$/, '');
      const response = await fetch(`${baseUrl}/api/generate-uncensored-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          mode,
          prompt: prompt.trim(),
          size: selectedRatio,
          steps: Number(steps),
          seed: Number(activeSeed),
          randomizeSeed,
          loraScale: Number(loraScale),
          image: mode === 'edit' ? sourceImage : undefined
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `Synthesis failed (HTTP ${response.status})`);
      }

      if (data.imageUrl) {
        setGeneratedImageUrl(data.imageUrl);
        setUsedSeed(data.seed);

        try {
          const raw = localStorage.getItem('sumanai_uploaded_files');
          const list = raw ? JSON.parse(raw) : [];
          list.unshift({
            id: `upload-uncensored-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            name: `Qwen_Uncensored_${Date.now()}.png`,
            size: '2.4 MB',
            type: 'image/png',
            url: data.imageUrl,
            subtype: 'generated',
            chatTitle: 'Uncensored Image Gen',
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          });
          localStorage.setItem('sumanai_uploaded_files', JSON.stringify(list.slice(0, 50)));
        } catch {
          void 0;
        }
      } else {
        throw new Error('No image URL returned from engine.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Image generation failed. Please try again.');
    } finally {
      setIsGenerating(false);
      setStatusText('');
    }
  };

  const handleCopy = () => {
    if (!generatedImageUrl) return;
    navigator.clipboard.writeText(generatedImageUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClearCanvas = () => {
    setGeneratedImageUrl(null);
    setUsedSeed(null);
  };

  return (
    <div className="tool-app-wrapper uncensored-page-wrapper">
      <div className="uncensored-top-nav">
        <div className="uncensored-breadcrumb">
          <button type="button" className="breadcrumb-home-btn" onClick={() => navigate('/')}>
            <Home size={14} />
          </button>
          <span className="breadcrumb-sep">&gt;</span>
          <button type="button" className="breadcrumb-link" onClick={() => navigate('/tools/view')}>
            Tools
          </button>
          <span className="breadcrumb-sep breadcrumb-hide-mobile">&gt;</span>
          <button type="button" className="breadcrumb-link breadcrumb-hide-mobile" onClick={() => navigate('/tools/view')}>
            Image Processing
          </button>
          <span className="breadcrumb-sep">&gt;</span>
          <span className="breadcrumb-current">Uncensored Image Generation</span>
        </div>

        <a
          href="https://huggingface.co/spaces/a-test-user-in-the-wrold/qwen-image-21-uncensored"
          target="_blank"
          rel="noopener noreferrer"
          className="uncensored-doc-btn"
        >
          <BookOpen size={14} />
          <span className="doc-btn-text">Documentation</span>
          <span className="doc-btn-short">Docs</span>
          <ExternalLink size={12} className="doc-ext-icon" />
        </a>
      </div>

      <div className="uncensored-title-section">
        <div className="uncensored-title-left">
          <div className="uncensored-avatar-icon">
            <ImageIcon size={22} />
          </div>
          <div className="uncensored-title-texts">
            <h1 className="uncensored-main-title">Uncensored Image Generation & Editing</h1>
            <p className="uncensored-main-desc">
              Generate unrestricted visual concepts or upload photos to modify with natural language instruction prompts.
            </p>
          </div>
        </div>

        <div className="uncensored-chips-row">
          <span className="chip-badge chip-qwen">
            <Cpu size={12} />
            <span>Qwen-Image-2.1</span>
          </span>
          <span className="chip-badge chip-uncensored">
            <Flame size={12} />
            <span>Uncensored LoRA</span>
          </span>
          <span className="chip-badge chip-zerogpu">
            <Zap size={12} />
            <span>ZeroGPU</span>
          </span>
        </div>
      </div>

      <div className="uncensored-main-grid">
        <div className="uncensored-left-card">
          <div className="uncensored-tabs-container">
            <button
              type="button"
              className={`uncensored-tab ${mode === 'generate' ? 'active' : ''}`}
              onClick={() => setMode('generate')}
            >
              <Sparkles size={14} />
              <span>Text to Image</span>
            </button>
            <button
              type="button"
              className={`uncensored-tab ${mode === 'edit' ? 'active' : ''}`}
              onClick={() => setMode('edit')}
            >
              <ImageIcon size={14} />
              <span className="tab-label-full">Image to Image (Edit)</span>
              <span className="tab-label-short">Image to Image</span>
            </button>
          </div>

          {mode === 'edit' && (
            <div className="uncensored-field-group">
              <div className="field-label-line">
                <span className="field-label-text">
                  Source Image
                  <Info size={12} className="info-icon" />
                </span>
                {sourceImage && (
                  <button
                    type="button"
                    className="enhance-btn"
                    onClick={() => { setSourceImage(null); setSourceFileName(''); }}
                  >
                    <X size={12} />
                    <span>Clear</span>
                  </button>
                )}
              </div>

              {!sourceImage ? (
                <div
                  className="uncensored-upload-box"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  role="button"
                  tabIndex={0}
                >
                  <Upload size={22} className="upload-arrow-icon" />
                  <span className="upload-main-text">Click or drag image here to edit</span>
                  <span className="upload-sub-text">PNG, JPG, or WEBP up to 20MB</span>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  />
                </div>
              ) : (
                <div className="source-image-strip">
                  <img src={sourceImage} alt="Input source" className="strip-thumb" />
                  <div className="strip-info">
                    <span className="strip-filename">{sourceFileName || 'Uploaded image'}</span>
                    <button
                      type="button"
                      className="strip-replace-btn"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Replace photo
                    </button>
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  />
                </div>
              )}
            </div>
          )}

          <div className="uncensored-field-group">
            <div className="field-label-line">
              <span className="field-label-text">
                Image Prompt
                <Info size={12} className="info-icon" />
              </span>
              <button
                type="button"
                className="enhance-btn"
                onClick={handleEnhancePrompt}
                disabled={isEnhancing || !prompt.trim()}
              >
                <Sparkles size={12} />
                <span>{isEnhancing ? 'Enhancing...' : 'Enhance Prompt'}</span>
              </button>
            </div>

            <div className="prompt-textarea-wrapper">
              <textarea
                className="prompt-textarea"
                rows={4}
                maxLength={2000}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={mode === 'edit' ? 'Describe modifications to make to the image...' : 'A sleek futuristic android woman with glowing porcelain cybernetic lines...'}
              />
              <span className="prompt-char-count">{prompt.length} / 2000</span>
            </div>
          </div>

          <div className="uncensored-field-group">
            <span className="field-label-text">Inspirations</span>
            <div className="inspirations-grid">
              {INSPIRATION_PILLS.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="inspiration-pill"
                  onClick={() => handleInspirationClick(item.text, item.prompt)}
                >
                  <Wand2 size={12} className="pill-wand-icon" />
                  <span className="pill-text">{item.text}</span>
                  <span className="pill-plus">+</span>
                </button>
              ))}
            </div>
          </div>

          <div className="uncensored-field-group">
            <span className="field-label-text">Output Aspect Ratio</span>
            <div className="ratios-row">
              {ASPECT_RATIOS.map((item) => {
                const isSelected = selectedRatio === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`ratio-btn ${isSelected ? 'active' : ''}`}
                    onClick={() => setSelectedRatio(item.id)}
                  >
                    <div className="ratio-btn-left">
                      <span className={`ratio-box-icon ${item.iconClass}`} />
                      <div className="ratio-labels">
                        <span className="ratio-title">{item.ratioId}</span>
                        <span className="ratio-sub">{item.label}</span>
                      </div>
                    </div>
                    {isSelected && (
                      <span className="ratio-check-circle">
                        <Check size={10} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="uncensored-two-col-sliders">
            <div className="slider-group">
              <div className="slider-header-line">
                <span className="slider-title">
                  Sampling Steps
                  <Info size={12} className="info-icon" />
                </span>
                <span className="slider-badge">{steps}</span>
              </div>
              <input
                type="range"
                min={8}
                max={50}
                value={steps}
                onChange={(e) => setSteps(Number(e.target.value))}
                className="blue-range-slider"
              />
            </div>

            <div className="slider-group">
              <div className="slider-header-line">
                <span className="slider-title">
                  LoRA Scale
                  <Info size={12} className="info-icon" />
                </span>
                <span className="slider-badge">{Number(loraScale).toFixed(1)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={1.5}
                step={0.1}
                value={loraScale}
                onChange={(e) => setLoraScale(Number(e.target.value))}
                className="blue-range-slider"
              />
            </div>
          </div>

          <div className="uncensored-field-group">
            <span className="field-label-text">
              Seed
              <Info size={12} className="info-icon" />
            </span>
            <div className="seed-controls-line">
              <div className="seed-input-row">
                <input
                  type="number"
                  className="seed-num-input"
                  value={seed}
                  disabled={randomizeSeed}
                  onChange={(e) => setSeed(Number(e.target.value))}
                />
                <button
                  type="button"
                  className="seed-dice-btn"
                  onClick={handleRandomSeed}
                  title="Randomize Seed"
                >
                  <Dices size={16} />
                </button>
              </div>
              <label className="seed-checkbox-item">
                <input
                  type="checkbox"
                  checked={randomizeSeed}
                  onChange={(e) => setRandomizeSeed(e.target.checked)}
                />
                <span>Randomize each run</span>
              </label>
            </div>
          </div>

          {errorMessage && (
            <div className="uncensored-error-banner" role="alert">
              <span>{errorMessage}</span>
            </div>
          )}

          <button
            type="button"
            className="uncensored-submit-btn"
            disabled={isGenerating || !prompt.trim() || (mode === 'edit' && !sourceImage)}
            onClick={handleGenerate}
          >
            {isGenerating ? (
              <>
                <RefreshCw size={16} className="spin-animation" />
                <span>{statusText || 'Synthesizing on Qwen 2.1...'}</span>
              </>
            ) : (
              <>
                <Sparkles size={16} />
                <span>{mode === 'edit' ? 'Modify Image with LoRA' : 'Generate Uncensored Image'}</span>
              </>
            )}
          </button>
        </div>

        <div className="uncensored-right-col">
          <div className="uncensored-output-card">
            <div className="output-card-header" title={usedSeed !== null ? `Seed: ${usedSeed}` : undefined}>
              <div className="output-header-title">
                <ImageIcon size={16} className="output-icon" />
                <span>Output Canvas</span>
              </div>
              <div className="output-actions-cluster">
                <button
                  type="button"
                  className="output-action-icon-btn"
                  onClick={() => generatedImageUrl && downloadImage(generatedImageUrl, `Qwen_${Date.now()}.png`)}
                  disabled={!generatedImageUrl || isGenerating}
                  title="Download Image"
                >
                  <Download size={15} />
                </button>
                <button
                  type="button"
                  className="output-action-icon-btn"
                  onClick={() => generatedImageUrl && setLightboxOpen(true)}
                  disabled={!generatedImageUrl || isGenerating}
                  title="Fullscreen Preview"
                >
                  <Maximize2 size={15} />
                </button>
                <button
                  type="button"
                  className="output-action-icon-btn"
                  onClick={handleClearCanvas}
                  disabled={!generatedImageUrl || isGenerating}
                  title="Clear Output"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>

            <div className="output-card-viewport">
              {isGenerating ? (
                <div className="output-loading-view">
                  <div className="loading-spinner-circle" />
                  <span className="loading-head">Qwen-Image-2.1 Diffusion Active</span>
                  <span className="loading-sub">{statusText || 'Generating high-fidelity frames with uncensored LoRA...'}</span>
                </div>
              ) : generatedImageUrl ? (
                <div className="output-image-view">
                  <img
                    src={generatedImageUrl}
                    alt="Synthesized visual result"
                    className="output-rendered-img"
                    onClick={() => setLightboxOpen(true)}
                  />
                  <div className="output-floating-bar">
                    <button type="button" className="floating-btn" onClick={handleCopy}>
                      {copied ? <Check size={13} /> : <Copy size={13} />}
                      <span>{copied ? 'Copied' : 'Copy CDN'}</span>
                    </button>
                    <button
                      type="button"
                      className="floating-btn"
                      onClick={handleIterateInEdit}
                    >
                      <ArrowRight size={13} />
                      <span>Iterate in Edit</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="output-empty-view">
                  <div className="empty-stacked-art">
                    <div className="art-card art-card-back" />
                    <div className="art-card art-card-front">
                      <div className="art-sun" />
                      <div className="art-mountains" />
                    </div>
                    <Sparkles size={16} className="art-sparkle-1" />
                    <Sparkles size={12} className="art-sparkle-2" />
                  </div>
                  <h3 className="empty-heading">Ready for Image Synthesis</h3>
                  <p className="empty-paragraph">
                    Enter a prompt and click "Generate Uncensored Image" to create your image here.
                  </p>
                </div>
              )}
            </div>

            <div className="output-features-bar">
              <div className="feature-item">
                <div className="feature-icon-circle blue-tint">
                  <Zap size={14} />
                </div>
                <div className="feature-texts">
                  <span className="feature-title">High Quality</span>
                  <span className="feature-desc">Detailed and sharp results</span>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-icon-circle blue-tint">
                  <Layers size={14} />
                </div>
                <div className="feature-texts">
                  <span className="feature-title">Flexible Control</span>
                  <span className="feature-desc">Steps, LoRA, and seed</span>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-icon-circle blue-tint">
                  <ShieldCheck size={14} />
                </div>
                <div className="feature-texts">
                  <span className="feature-title">Uncensored</span>
                  <span className="feature-desc">Creative freedom</span>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-icon-circle blue-tint">
                  <Clock size={14} />
                </div>
                <div className="feature-texts">
                  <span className="feature-title">Fast Generation</span>
                  <span className="feature-desc">Optimized for speed</span>
                </div>
              </div>
            </div>
          </div>

          <div className="recent-generations-card">
            <div className="recent-header-line">
              <div className="recent-title-wrap">
                <Clock size={15} className="recent-clock-icon" />
                <span className="recent-title-text">Recent Generations</span>
              </div>
              <button
                type="button"
                className="view-library-btn"
                onClick={() => navigate('/files')}
              >
                <span>View Library</span>
                <ArrowRight size={13} />
              </button>
            </div>

            <div className="recent-thumbnails-row">
              {recentGallery.map((item, idx) => (
                <div
                  key={idx}
                  className="recent-thumb-item"
                  onClick={() => {
                    setGeneratedImageUrl(item.url);
                    if (item.prompt) setPrompt(item.prompt);
                  }}
                  title={item.prompt || 'View generated image'}
                >
                  <img src={item.url} alt={item.prompt || 'Thumbnail'} className="recent-thumb-img" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {lightboxOpen && generatedImageUrl && (
        <div className="uncensored-lightbox-overlay" onClick={() => setLightboxOpen(false)}>
          <div className="uncensored-lightbox-content" onClick={(e) => e.stopPropagation()}>
            <img src={generatedImageUrl} alt="Full resolution preview" className="lightbox-img" />
            <button
              type="button"
              className="lightbox-close-btn"
              onClick={() => setLightboxOpen(false)}
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UncensoredImage;

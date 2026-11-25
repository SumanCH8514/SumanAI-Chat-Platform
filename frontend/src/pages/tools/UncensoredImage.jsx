import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Home, BookOpen, ExternalLink, Image as ImageIcon,
  Flame, Zap, Sparkles, Wand2, Info, Dices,
  Download, Maximize2, Trash2, ShieldCheck, Layers,
  Clock, ArrowRight, X, Upload, Check, Cpu, RefreshCw, Copy, ChevronDown,
  Sliders, MoreVertical
} from 'lucide-react';
import { auth } from '../../config/firebase';
import { env } from '../../config/env';
import { useAuthStore } from '../../store/useAuthStore';
import { chatService } from '../../services/ChatService';
import { firestoreService } from '../../services/firestoreService';
import Skeleton from '../../components/Skeleton';
import { downloadImage } from '../../utils/downloadUtils';
import './ToolAppShared.css';
import './UncensoredImage.css';

const ASPECT_RATIOS = [
  { id: '1024x1024 (1:1)', ratioId: '1:1', label: 'Square', mobileLabel: 'Square', iconClass: 'ratio-1-1' },
  { id: '1344x768 (16:9)', ratioId: '16:9', label: 'Landscape', mobileLabel: 'Widescreen', iconClass: 'ratio-16-9' },
  { id: '768x1344 (9:16)', ratioId: '9:16', label: 'Portrait', mobileLabel: 'Portrait', iconClass: 'ratio-9-16' },
  { id: '1184x864 (4:3)', ratioId: '4:3', label: 'Standard', mobileLabel: 'Standard', iconClass: 'ratio-4-3' },
  { id: '864x1184 (3:4)', ratioId: '3:4', label: 'Vertical', mobileLabel: 'Vertical', iconClass: 'ratio-3-4' }
];

const INSPIRATION_PILLS = [
  { text: 'Cyberpunk samurai', prompt: 'A neon-lit cyberpunk samurai standing on a skyscraper rooftop in heavy rain with glowing katana' },
  { text: 'Mystical forest fairy', prompt: 'A mystical forest fairy surrounded by glowing ethereal orbs and ancient bioluminescent flora' },
  { text: 'Hyperrealistic portrait', prompt: 'Hyperrealistic portrait of an astronaut exploring a vibrant alien crystal cavern with ambient volumetric lighting' },
  { text: 'Futuristic sports car', prompt: 'An elegant retro-futuristic sports car speeding across a desert highway at golden hour with motion blur' }
];

export const UncensoredImage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const { user, openAuthModal } = useAuthStore();
  const isGoogleUser = Boolean(
    user &&
    !user.isAnonymous &&
    (user.providerData?.some((p) => p.providerId === 'google.com') || Boolean(user.email))
  );

  const [mode, setMode] = useState('generate');
  const [prompt, setPrompt] = useState('A sleek futuristic android woman with glowing porcelain cybernetic lines and luminous amber eyes');
  const [sourceImage, setSourceImage] = useState(null);
  const [sourceFileName, setSourceFileName] = useState('');
  const [selectedRatio, setSelectedRatio] = useState('1024x1024 (1:1)');
  const [steps, setSteps] = useState(28);
  const [inspirationsOpen, setInspirationsOpen] = useState(false);
  const [aspectRatioOpen, setAspectRatioOpen] = useState(true);
  const [configOpen, setConfigOpen] = useState(false);
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
  const [recentGallery, setRecentGallery] = useState([]);
  const [isGalleryLoading, setIsGalleryLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    if (!user?.uid) {
      setRecentGallery([]);
      setIsGalleryLoading(false);
      return;
    }

    setIsGalleryLoading(true);
    firestoreService.getUserGenerations(user.uid, 12)
      .then((list) => {
        if (isMounted) {
          setRecentGallery(Array.isArray(list) ? list : []);
          setIsGalleryLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setRecentGallery([]);
          setIsGalleryLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [user?.uid]);

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
      const response = await chatService.generateResponse(
        'qwen/qwen3.8-27b',
        [
          {
            role: 'system',
            content: 'You are an expert AI prompt engineer for diffusion models. Enhance the user prompt into a high-detail, vivid visual prompt. Output ONLY the refined prompt text without greetings, explanations, or quotes.'
          },
          { role: 'user', content: prompt.trim() }
        ],
        (chunk) => { enriched = chunk; }
      );
      const finalText = (response || enriched || '').trim().replace(/^["']|["']$/g, '');
      if (finalText) {
        setPrompt(finalText);
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
    if (!isGoogleUser) {
      setErrorMessage('Please sign in with Google to use Uncensored Image Gen.');
      if (openAuthModal) openAuthModal();
      return;
    }
    if (mode === 'edit' && !sourceImage) {
      setErrorMessage('Please upload a source image to edit.');
      return;
    }

    setIsGenerating(true);
    setErrorMessage('');
    setStatusText('Connecting to Qwen 2.1 Studio...');

    try {
      const activeSeed = randomizeSeed ? Math.floor(Math.random() * 999999) : seed;
      if (randomizeSeed) {
        setSeed(activeSeed);
      }

      let mappedAspectRatio = 'Square · 1:1 (1024x1024)';
      if (selectedRatio.includes('16:9')) {
        mappedAspectRatio = 'Landscape · 16:9 (1344x768)';
      } else if (selectedRatio.includes('9:16')) {
        mappedAspectRatio = 'Portrait · 9:16 (768x1344)';
      } else if (selectedRatio.includes('4:3')) {
        mappedAspectRatio = 'Landscape · 4:3 (1152x864)';
      } else if (selectedRatio.includes('3:4')) {
        mappedAspectRatio = 'Portrait · 3:4 (864x1152)';
      }

      let finalImageUrl = null;
      let finalSeed = activeSeed;

      try {
        const { Client, handle_file } = await import('@gradio/client');
        let imageBlob = null;
        if (mode === 'edit' && sourceImage) {
          const res = await fetch(sourceImage);
          imageBlob = await res.blob();
        } else {
          const blankPngB64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
          const res = await fetch(`data:image/png;base64,${blankPngB64}`);
          imageBlob = await res.blob();
        }

        setStatusText('Allocating ZeroGPU cluster...');
        const client = await Client.connect('https://devsuman-sumanonline-qwen-image-2-1-uncensored.hf.space');

        setStatusText(mode === 'edit' ? 'Modifying image with AI...' : 'Generating image on Qwen 2.1...');
        const result = await client.predict('/edit', {
          image: handle_file(imageBlob),
          prompt: prompt.trim(),
          lora_adapter: 'None (Base Uncensored)',
          lora_strength: Number(loraScale) || 1.0,
          custom_repo: '',
          custom_file: '',
          aspect_ratio: mappedAspectRatio,
          steps: Math.min(Math.max(Number(steps), 8), 35),
          seed: Number(activeSeed),
          randomize_seed: Boolean(randomizeSeed)
        });

        if (result?.data?.[0]) {
          const item = result.data[0];
          finalImageUrl = item.url || (item.path ? `https://devsuman-sumanonline-qwen-image-2-1-uncensored.hf.space/gradio_api/file=${item.path}` : null);
          if (result.data[1]) {
            try {
              const meta = typeof result.data[1] === 'string' ? JSON.parse(result.data[1]) : result.data[1];
              if (meta?.seed !== undefined) finalSeed = Number(meta.seed);
            } catch {
              void 0;
            }
          }
        }
      } catch (clientErr) {
        setStatusText('Connecting to backup cluster...');
        const token = auth.currentUser ? await auth.currentUser.getIdToken() : '';
        const baseUrl = (env.WORKER_URL || '').replace(/\/+$/, '');
        const payload = {
          mode,
          prompt: prompt.trim(),
          size: selectedRatio,
          steps: Number(steps),
          seed: Number(activeSeed),
          randomizeSeed,
          loraScale: Number(loraScale),
          image: mode === 'edit' ? sourceImage : undefined
        };

        const res = await fetch(`${baseUrl}/api/generate-uncensored-image`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          const errMsg = errData.error || clientErr.message || 'Image generation failed';
          if (errMsg.toLowerCase().includes('zerogpu') || errMsg.toLowerCase().includes('quota')) {
            throw new Error('ZeroGPU compute quota is temporarily busy on Hugging Face. Please retry in a few moments.');
          }
          throw new Error(errMsg);
        }

        const data = await res.json();
        if (data.imageUrl) {
          finalImageUrl = data.imageUrl;
          if (data.seed !== undefined) finalSeed = Number(data.seed);
        } else {
          throw new Error('No image URL returned from engine.');
        }
      }

      if (finalImageUrl) {
        setGeneratedImageUrl(finalImageUrl);
        setUsedSeed(finalSeed);

        const cleanPrompt = prompt.trim().replace(/[^a-zA-Z0-9_\-\s]/g, '').trim().replace(/\s+/g, '_').slice(0, 36) || 'Qwen_Uncensored';
        const now = Date.now();
        const newGenItem = {
          id: `gen-uncensored-${now}-${Math.random().toString(36).substring(2, 7)}`,
          name: `${cleanPrompt}.png`,
          size: '2.4 MB',
          type: 'image',
          subtype: 'generated',
          url: finalImageUrl,
          prompt: prompt.trim(),
          mode,
          sizeMode: selectedRatio,
          seed: Number(finalSeed),
          createdAt: now,
          chatTitle: 'Uncensored Image Gen',
          date: new Date(now).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        };

        if (user?.uid) {
          firestoreService.saveUserGeneration(user.uid, newGenItem).catch(() => {});
        }

        setRecentGallery((prev) => [newGenItem, ...prev.filter((item) => item?.url !== finalImageUrl)].slice(0, 12));

        try {
          const userFilesKey = user?.uid ? `sumanai_files_${user.uid}` : 'sumanai_uploaded_files';
          const raw = localStorage.getItem(userFilesKey);
          const list = raw ? JSON.parse(raw) : [];
          const updated = [newGenItem, ...list.filter((item) => item?.url !== finalImageUrl)].slice(0, 100);
          localStorage.setItem(userFilesKey, JSON.stringify(updated));
          window.dispatchEvent(new Event('sumanai_files_updated'));
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
          href="https://huggingface.co/spaces/devSuman/sumanonline-qwen-image-2.1-uncensored"
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
            <h1 className="uncensored-main-title">
              <span className="desktop-title-text">Image Generation & Editing</span>
              <span className="mobile-title-text">Image Generation & Editing</span>
            </h1>
            <p className="uncensored-main-desc">
              <span className="desktop-desc-text">Create Uncensored images from text or edit existing images with AI.</span>
              <span className="mobile-desc-text">Create Uncensored images from text or edit existing images with AI.</span>
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
              onClick={() => { setMode('generate'); setErrorMessage(''); }}
            >
              <Sparkles size={14} />
              <span>Text to Image</span>
            </button>
            <button
              type="button"
              className={`uncensored-tab ${mode === 'edit' ? 'active' : ''}`}
              onClick={() => { setMode('edit'); setErrorMessage(''); }}
            >
              <ImageIcon size={14} />
              <span className="tab-label-full">Image to Image (Edit)</span>
              <span className="tab-label-short">Image to Image</span>
            </button>
          </div>

          {mode === 'edit' && (
            <div className="uncensored-field-group uncensored-upload-section">
              <div className="field-label-line">
                <span className="field-label-text">
                  Source Image
                  <Info size={13} className="info-icon" />
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
                  onDrop={(e) => handleDrop(e)}
                  onClick={() => fileInputRef.current?.click()}
                  role="button"
                  tabIndex={0}
                >
                  <Upload size={24} className="upload-arrow-icon" />
                  <span className="upload-main-text">Click or drag image here to edit</span>
                  <span className="upload-sub-text">PNG, JPG, or WEBP up to 20MB</span>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        handleFileSelect(e.target.files[0]);
                      }
                    }}
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
                Prompt <span className="prompt-required-star">*</span>
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
                placeholder={mode === 'edit' ? 'Describe modifications to make to the image...' : 'Describe the image you want to generate...'}
              />
              <span className="prompt-char-count">
                <span className="desktop-field-text">{prompt.length} / 2000</span>
                <span className="mobile-field-text">{prompt.length} / 1000</span>
              </span>
            </div>
          </div>

          <div className="uncensored-field-group inspirations-section-group">
            <button
              type="button"
              className="collapsible-section-toggle"
              onClick={() => setInspirationsOpen((prev) => !prev)}
              aria-expanded={inspirationsOpen}
            >
              <span className="field-label-text">Inspirations</span>
              <ChevronDown
                size={15}
                className={`collapsible-chevron ${inspirationsOpen ? 'open' : ''}`}
              />
            </button>
            {inspirationsOpen && (
              <div className="inspirations-grid collapsible-content-fade">
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
            )}
          </div>

          <div className="uncensored-field-group">
            <button
              type="button"
              className="collapsible-section-toggle"
              onClick={() => setAspectRatioOpen((prev) => !prev)}
              aria-expanded={aspectRatioOpen}
            >
              <div className="collapsible-title-left">
                <span className="field-label-text">
                  <span className="desktop-field-text">Output Aspect Ratio</span>
                  <span className="mobile-field-text">Aspect Ratio</span>
                </span>
                {!aspectRatioOpen && (
                  <span className="collapsible-selected-summary">
                    {ASPECT_RATIOS.find((r) => r.id === selectedRatio)?.ratioId || '1:1'}
                  </span>
                )}
              </div>
              <ChevronDown
                size={15}
                className={`collapsible-chevron ${aspectRatioOpen ? 'open' : ''}`}
              />
            </button>
            {aspectRatioOpen && (
              <div className="ratios-row collapsible-content-fade">
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
                          <span className="ratio-sub">
                            <span className="desktop-ratio-label">{item.label}</span>
                            <span className="mobile-ratio-label">{item.mobileLabel || item.label}</span>
                          </span>
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
            )}
          </div>

          <div className="uncensored-field-group">
            <button
              type="button"
              className="collapsible-section-toggle"
              onClick={() => setConfigOpen((prev) => !prev)}
              aria-expanded={configOpen}
            >
              <div className="collapsible-title-left">
                <span className="field-label-text">
                  <span className="desktop-field-text">Configuration</span>
                  <span className="mobile-field-text mobile-advanced-toggle-title">
                    <Sliders size={15} className="mobile-sliders-icon" />
                    <span>Advanced Options</span>
                  </span>
                </span>
                {!configOpen && (
                  <span className="collapsible-selected-summary desktop-field-text">
                    Steps: {steps} • LoRA: {Number(loraScale).toFixed(1)}
                  </span>
                )}
              </div>
              <ChevronDown
                size={15}
                className={`collapsible-chevron ${configOpen ? 'open' : ''}`}
              />
            </button>
            {configOpen && (
              <div className="collapsible-content-fade uncensored-config-body">
                <div className="mobile-model-selector-row">
                  <span className="mobile-model-label">Model</span>
                  <div className="mobile-model-pill">
                    <span>High Quality (Default)</span>
                    <ChevronDown size={14} />
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
              </div>
            )}
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
                <span>{statusText || 'Generating...'}</span>
              </>
            ) : (
              <>
                <Sparkles size={16} />
                <span>Generate Image</span>
              </>
            )}
          </button>
        </div>

        <div className="uncensored-right-col">
          <div className="uncensored-output-card">
            <div className="output-card-header" title={usedSeed !== null ? `Seed: ${usedSeed}` : undefined}>
              <div className="output-header-title">
                <ImageIcon size={16} className="output-icon" />
                <span className="desktop-title-text">Output Canvas</span>
                <span className="mobile-title-text">Generation Results</span>
              </div>
              <div className="output-actions-cluster desktop-only-actions">
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
              <div className="output-actions-mobile">
                <button
                  type="button"
                  className="mobile-header-icon-btn"
                  onClick={() => navigate('/files')}
                  title="History"
                >
                  <Clock size={16} />
                </button>
                <button
                  type="button"
                  className="mobile-header-icon-btn"
                  onClick={() => {}}
                  title="More"
                >
                  <MoreVertical size={16} />
                </button>
              </div>
            </div>

            <div className="output-card-viewport">
              {isGenerating ? (
                <div className="output-loading-view">
                  <div className="loading-spinner-circle" />
                  <span className="loading-head">Generating Image</span>
                  <span className="loading-sub">{statusText || (mode === 'edit' ? 'Modifying with AI...' : 'Generating...')}</span>
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
                  <h3 className="empty-heading">
                    <span className="desktop-empty-text">Ready for Image Synthesis</span>
                    <span className="mobile-empty-text">Ready to generate an image?</span>
                  </h3>
                  <p className="empty-paragraph">
                    <span className="desktop-empty-text">Enter a prompt and click "Generate Uncensored Image" to create your image here.</span>
                    <span className="mobile-empty-text">Enter a prompt, choose your settings, and click “Generate Image” to get started.</span>
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

            {isGalleryLoading ? (
              <div className="recent-thumbnails-row">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="recent-thumb-skeleton">
                    <Skeleton width="74px" height="74px" borderRadius="8px" />
                  </div>
                ))}
              </div>
            ) : recentGallery.length > 0 ? (
              <div className="recent-thumbnails-row">
                {recentGallery.map((item, idx) => (
                  <div
                    key={item.id || idx}
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
            ) : (
              <div className="recent-gallery-empty">
                <div className="recent-empty-icon-wrap">
                  <ImageIcon size={18} />
                </div>
                <div className="recent-empty-text-wrap">
                  <span className="recent-empty-title">No recent generations yet</span>
                  <span className="recent-empty-sub">Images you generate are securely saved to your personal cloud library.</span>
                </div>
              </div>
            )}
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

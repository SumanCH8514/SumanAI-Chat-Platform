import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Video, ArrowLeft, Copy, Check, Download, Trash2,
  RefreshCw, Sparkles, Film, Clock, Monitor, Camera, Music, Type
} from 'lucide-react';
import { chatService } from '../../services/ChatService';
import './ToolAppShared.css';
import './VideoStoryboard.css';

const DURATIONS = [
  { id: '15s', label: '15 Seconds', desc: 'Short-form hooks, TikTok / Shorts' },
  { id: '30s', label: '30 Seconds', desc: 'Social commercial, targeted ads' },
  { id: '60s', label: '60 Seconds', desc: 'Product explainer, high retention' },
  { id: '90s', label: '90 Seconds', desc: 'Enterprise overview, brand story' }
];

const RATIOS = [
  { id: '16:9', label: '16:9 Landscape', desc: 'Desktop, YouTube, TV' },
  { id: '9:16', label: '9:16 Vertical', desc: 'Reels, TikTok, Shorts' },
  { id: '1:1', label: '1:1 Square', desc: 'Social feed & LinkedIn' }
];

const STYLES = [
  { id: 'cinematic', label: 'Cinematic 35mm', suffix: 'cinematic 35mm film still, dramatic warm lighting, anamorphic' },
  { id: 'minimal-tech', label: 'Modern Tech Commercial', suffix: 'clean modern tech commercial, minimalist studio, architectural lighting' },
  { id: 'animation3d', label: '3D Motion Graphics', suffix: 'vibrant 3D motion design render, octane render, clean geometry' },
  { id: 'documentary', label: 'Authentic Documentary', suffix: 'handheld documentary cinematography, natural lighting, candid' }
];

export const VideoStoryboard = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('Autonomous AI Agent Workspace Launch');
  const [objective, setObjective] = useState('Introduce SumanAI 2.0 autonomous agent workflows that execute engineering and design tasks without manual oversight.');
  const [duration, setDuration] = useState('30s');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [visualStyle, setVisualStyle] = useState('minimal-tech');
  const [storyboard, setStoryboard] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!title.trim() || isGenerating) return;
    setIsGenerating(true);
    setStoryboard('');

    const durObj = DURATIONS.find((d) => d.id === duration);
    const ratObj = RATIOS.find((r) => r.id === aspectRatio);
    const styObj = STYLES.find((s) => s.id === visualStyle);

    const systemPrompt = `You are an award-winning creative commercial director and storyboard artist.
Generate a scene-by-scene video pre-production storyboard breakdown.
Format:
- Video Duration: ${durObj?.label} (${durObj?.desc})
- Aspect Ratio: ${ratObj?.label}
- Visual Style: ${styObj?.label}

Produce 4 to 6 numbered scenes formatted consistently:
### Scene [Number] ([Timecode, e.g. 00:00 - 00:05])
- **Visual Description:** [Concrete visual description of subjects and environment]
- **Camera Movement:** [e.g. Slow tracking pan, aerial drone push-in, macro close-up]
- **Voiceover / Dialogue:** "[Spoken voiceover script]"
- **Sound Design & Music:** [Audio cues, foley, background soundtrack mood]
- **On-Screen Text:** "[Lower-third text or graphical callout]"

Rules:
- Be cinematic, visually evocative, and practical to produce.
- Do NOT provide conversational introductory notes.`;

    const userPrompt = `PROJECT TITLE: ${title.trim()}\nOBJECTIVE & CORE MESSAGE: ${objective.trim()}`;

    try {
      await chatService.generateResponse(
        'qwen/qwen3.8-27b',
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        (chunk) => {
          setStoryboard((prev) => prev + chunk);
        }
      );
    } catch {
      setStoryboard('Storyboard generation failed. Please check your network connection.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!storyboard) return;
    navigator.clipboard.writeText(storyboard);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!storyboard) return;
    const blob = new Blob([storyboard], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SumanAI_Storyboard_${duration}_${aspectRatio.replace(':', 'x')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
          <span className="tool-nav-current">Video Storyboard Generator</span>
        </nav>

        <div className="tool-header-content">
          <div className="tool-title-row">
            <h1 className="tool-app-heading">Video Storyboard Generator</h1>
            <span className="tool-tag-pill">Production Pre-Flight</span>
          </div>
          <p className="tool-app-subheading">
            Compose shot-by-shot shooting schedules with camera directions, voiceover timings, and audio design cues.
          </p>
        </div>
      </header>

      <main className="tool-app-body">
        <section className="tool-config-panel">
          <div className="tool-input-group">
            <label className="tool-label">Video Concept & Title</label>
            <input
              type="text"
              className="tool-input-text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Next-Gen Cloud Platform Brand Commercial"
            />
          </div>

          <div className="tool-input-group">
            <label className="tool-label">Objective & Storyline Hook</label>
            <textarea
              className="tool-textarea storyboard-textarea"
              rows={4}
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder="What core message, emotional reaction, or conversion action should this video achieve?"
            />
          </div>

          <div className="tool-input-group">
            <label className="tool-label">Duration & Target Pacing</label>
            <div className="tool-grid-options">
              {DURATIONS.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  className={`tool-option-card ${duration === d.id ? 'active' : ''}`}
                  onClick={() => setDuration(d.id)}
                >
                  <span>{d.label}</span>
                  <span className="tool-option-desc">{d.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="tool-row-two-col">
            <div className="tool-input-group">
              <label className="tool-label">Aspect Ratio</label>
              <select
                className="tool-select"
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value)}
              >
                {RATIOS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="tool-input-group">
              <label className="tool-label">Cinematic Style</label>
              <select
                className="tool-select"
                value={visualStyle}
                onChange={(e) => setVisualStyle(e.target.value)}
              >
                {STYLES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="button"
            className="tool-btn-primary"
            onClick={handleGenerate}
            disabled={isGenerating || !title.trim()}
          >
            {isGenerating ? (
              <>
                <RefreshCw size={16} className="tool-loading-spinner" />
                Directing Storyboard Scenes...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Generate Production Storyboard
              </>
            )}
          </button>
        </section>

        <section className="tool-result-panel">
          <div className="tool-result-header">
            <div className="tool-result-title">
              <Film size={16} />
              <span>Production Shooting Schedule</span>
              {storyboard && (
                <span className="tool-telemetry-badge">
                  {duration} • {aspectRatio}
                </span>
              )}
            </div>

            {storyboard && (
              <div className="tool-result-actions">
                <button
                  type="button"
                  className="tool-btn-secondary"
                  onClick={handleCopy}
                  title="Copy storyboard script"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  type="button"
                  className="tool-btn-secondary"
                  onClick={handleDownload}
                  title="Download Script Markdown"
                >
                  <Download size={14} />
                  <span>Download .MD</span>
                </button>
                <button
                  type="button"
                  className="tool-btn-secondary"
                  onClick={() => setStoryboard('')}
                  title="Clear Storyboard"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </div>

          <div className="storyboard-result-container">
            {isGenerating && !storyboard ? (
              <div className="storyboard-loading-state">
                <RefreshCw size={34} className="tool-loading-spinner" />
                <p className="storyboard-loading-title">
                  Composing Shot List & Timing Cue Cards...
                </p>
                <p className="storyboard-loading-desc">
                  Balancing visual pacing, camera movement, and voiceover duration for {duration}.
                </p>
              </div>
            ) : storyboard ? (
              <div className="storyboard-rendered-content">
                {storyboard.split(/(?=### Scene)/).map((sceneBlock, idx) => {
                  if (!sceneBlock.trim()) return null;
                  const lines = sceneBlock.trim().split('\n');
                  const heading = lines[0] || '';
                  const bodyLines = lines.slice(1);

                  return (
                    <div key={idx} className="storyboard-scene-card">
                      <div className="storyboard-scene-header">
                        <Film size={14} />
                        <span>{heading.replace(/^###\s*/, '')}</span>
                      </div>
                      <div className="storyboard-scene-body">
                        {bodyLines.map((line, lIdx) => {
                          if (!line.trim()) return null;
                          return (
                            <div key={lIdx} className="storyboard-scene-row">
                              <span className="storyboard-bullet">•</span>
                              <span className="storyboard-line-text">{line.replace(/^-\s*/, '')}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="tool-empty-display">
                <div className="tool-empty-icon-box">
                  <Film size={28} />
                </div>
                <p className="tool-empty-text">Storyboard Director Ready</p>
                <p className="tool-empty-subtext">
                  Set your video objective, duration, and visual aesthetic on the left to synthesize scene directions and voiceover cues.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default VideoStoryboard;


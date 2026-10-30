import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Languages, ArrowLeft, ArrowLeftRight, Volume2, Copy,
  Check, Download, Trash2, RefreshCw, Sparkles
} from 'lucide-react';
import { chatService } from '../../services/ChatService';
import './ToolAppShared.css';
import './Translator.css';

const LANGUAGES = [
  { code: 'auto', name: 'Auto Detect', voiceLang: 'en-US' },
  { code: 'en', name: 'English (US)', voiceLang: 'en-US' },
  { code: 'es', name: 'Spanish (Español)', voiceLang: 'es-ES' },
  { code: 'fr', name: 'French (Français)', voiceLang: 'fr-FR' },
  { code: 'de', name: 'German (Deutsch)', voiceLang: 'de-DE' },
  { code: 'ja', name: 'Japanese (日本語)', voiceLang: 'ja-JP' },
  { code: 'zh', name: 'Chinese (中文)', voiceLang: 'zh-CN' },
  { code: 'hi', name: 'Hindi (हिन्दी)', voiceLang: 'hi-IN' },
  { code: 'ar', name: 'Arabic (العربية)', voiceLang: 'ar-SA' },
  { code: 'ru', name: 'Russian (Русский)', voiceLang: 'ru-RU' },
  { code: 'pt', name: 'Portuguese (Português)', voiceLang: 'pt-BR' },
  { code: 'it', name: 'Italian (Italiano)', voiceLang: 'it-IT' },
  { code: 'nl', name: 'Dutch (Nederlands)', voiceLang: 'nl-NL' },
  { code: 'ko', name: 'Korean (한국어)', voiceLang: 'ko-KR' },
  { code: 'pl', name: 'Polish (Polski)', voiceLang: 'pl-PL' },
  { code: 'tr', name: 'Turkish (Türkçe)', voiceLang: 'tr-TR' },
  { code: 'sv', name: 'Swedish (Svenska)', voiceLang: 'sv-SE' },
  { code: 'vi', name: 'Vietnamese (Tiếng Việt)', voiceLang: 'vi-VN' },
  { code: 'id', name: 'Indonesian (Bahasa)', voiceLang: 'id-ID' },
  { code: 'el', name: 'Greek (Ελληνικά)', voiceLang: 'el-GR' }
];

const REGISTERS = [
  { id: 'business', label: 'Corporate & Formal', desc: 'Precise professional vocabulary for executive communications' },
  { id: 'conversational', label: 'Conversational & Fluent', desc: 'Natural idiomatic phrasing for day-to-day dialogue' },
  { id: 'technical', label: 'Technical & Engineering', desc: 'Preserves exact technical terms, acronyms, and specs' },
  { id: 'creative', label: 'Literary & Nuanced', desc: 'Transfers stylistic flair, cadence, and cultural imagery' }
];

export const Translator = () => {
  const navigate = useNavigate();
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState('es');
  const [register, setRegister] = useState('business');
  const [sourceText, setSourceText] = useState('Our distributed data pipeline guarantees five-nines uptime and seamless failover across all multi-region clusters.');
  const [translatedText, setTranslatedText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const handleSwap = () => {
    if (sourceLang === 'auto') return;
    const tempLang = sourceLang;
    setSourceLang(targetLang);
    setTargetLang(tempLang);

    const tempText = sourceText;
    setSourceText(translatedText);
    setTranslatedText(tempText);
  };

  const handleTranslate = async () => {
    if (!sourceText.trim() || isTranslating) return;
    setIsTranslating(true);
    setTranslatedText('');

    const targetObj = LANGUAGES.find((l) => l.code === targetLang);
    const sourceObj = LANGUAGES.find((l) => l.code === sourceLang);
    const registerObj = REGISTERS.find((r) => r.id === register);

    const systemPrompt = `You are a world-class translation engine specializing in nuanced, culturally authentic, and contextually exact cross-lingual translation.
Target Language: ${targetObj?.name}
Source Language: ${sourceObj?.name || 'Auto-detect'}
Register/Tone: ${registerObj?.label} (${registerObj?.desc})
Rules:
- Output ONLY the translated text without commentary, pronunciation guides, notes, or quotes.
- Preserve brand names, technical variables, and punctuation conventions appropriate to the target language.`;

    try {
      await chatService.generateResponse(
        'qwen/qwen3.8-27b',
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: sourceText }
        ],
        (chunk) => {
          setTranslatedText((prev) => prev + chunk);
        }
      );
    } catch {
      setTranslatedText('Translation failed. Please verify your connection.');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSpeech = (text, langCode) => {
    if (!('speechSynthesis' in window) || !text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const langObj = LANGUAGES.find((l) => l.code === langCode);
    if (langObj?.voiceLang) {
      utterance.lang = langObj.voiceLang;
    }
    utterance.onstart = () => setIsPlayingAudio(true);
    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);
    window.speechSynthesis.speak(utterance);
  };

  const handleCopy = () => {
    if (!translatedText) return;
    navigator.clipboard.writeText(translatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!translatedText) return;
    const blob = new Blob([translatedText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SumanAI_Translation_${targetLang}.txt`;
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
          <span className="tool-nav-current">Multi-Lingual Translator</span>
        </nav>

        <div className="tool-header-content">
          <div className="tool-title-row">
            <h1 className="tool-app-heading">Multi-Lingual Translator</h1>
            <span className="tool-tag-pill">Neural Cross-Lingual</span>
          </div>
          <p className="tool-app-subheading">
            Translate across 30+ global dialects with native cultural nuance and tone register preservation.
          </p>
        </div>
      </header>

      <main className="tool-app-body translator-grid-layout">
        <section className="tool-config-panel translator-pane">
          <div className="translator-bar">
            <div className="translator-select-box">
              <select
                className="tool-select translator-dropdown"
                value={sourceLang}
                onChange={(e) => setSourceLang(e.target.value)}
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              className="translator-swap-btn"
              onClick={handleSwap}
              disabled={sourceLang === 'auto'}
              title="Swap Languages"
            >
              <ArrowLeftRight size={15} />
            </button>

            <div className="translator-select-box">
              <select
                className="tool-select translator-dropdown"
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
              >
                {LANGUAGES.filter((l) => l.code !== 'auto').map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="tool-input-group">
            <label className="tool-label">Context & Register</label>
            <div className="translator-register-row">
              {REGISTERS.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className={`translator-register-pill ${register === r.id ? 'active' : ''}`}
                  onClick={() => setRegister(r.id)}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div className="tool-input-group translator-textarea-group">
            <div className="tool-label">
              <span>Source Text</span>
              <span className="tool-label-hint">{sourceText.length} characters</span>
            </div>
            <textarea
              className="tool-textarea translator-textarea"
              rows={8}
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              placeholder="Type or paste sentences in any language..."
            />
          </div>

          <div className="translator-source-actions">
            <button
              type="button"
              className="tool-btn-secondary"
              onClick={() => handleSpeech(sourceText, sourceLang)}
              disabled={!sourceText.trim() || isPlayingAudio}
              title="Listen to original"
            >
              <Volume2 size={14} /> Listen
            </button>
            <button
              type="button"
              className="tool-btn-secondary"
              onClick={() => setSourceText('')}
              title="Clear source text"
            >
              <Trash2 size={14} /> Clear
            </button>
            <button
              type="button"
              className="tool-btn-primary translator-action-btn"
              onClick={handleTranslate}
              disabled={isTranslating || !sourceText.trim()}
            >
              {isTranslating ? (
                <>
                  <RefreshCw size={15} className="tool-loading-spinner" />
                  Translating...
                </>
              ) : (
                <>
                  <Sparkles size={15} />
                  Translate Now
                </>
              )}
            </button>
          </div>
        </section>

        <section className="tool-result-panel translator-pane">
          <div className="tool-result-header">
            <div className="tool-result-title">
              <Languages size={16} />
              <span>Translation ({LANGUAGES.find((l) => l.code === targetLang)?.name})</span>
            </div>

            {translatedText && (
              <div className="tool-result-actions">
                <button
                  type="button"
                  className="tool-btn-secondary"
                  onClick={() => handleSpeech(translatedText, targetLang)}
                  disabled={isPlayingAudio}
                  title="Listen to pronunciation"
                >
                  <Volume2 size={14} /> Listen
                </button>
                <button
                  type="button"
                  className="tool-btn-secondary"
                  onClick={handleCopy}
                  title="Copy to clipboard"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  type="button"
                  className="tool-btn-secondary"
                  onClick={handleDownload}
                  title="Download Text File"
                >
                  <Download size={14} />
                  <span>Download</span>
                </button>
              </div>
            )}
          </div>

          <div className="translator-result-box">
            {isTranslating && !translatedText ? (
              <div className="translator-loading-state">
                <RefreshCw size={32} className="tool-loading-spinner" />
                <p className="translator-loading-text">
                  Transferring linguistic context into {LANGUAGES.find((l) => l.code === targetLang)?.name}...
                </p>
              </div>
            ) : translatedText ? (
              <div className="translator-content-text">
                {translatedText}
              </div>
            ) : (
              <div className="tool-empty-display">
                <div className="tool-empty-icon-box">
                  <Languages size={28} />
                </div>
                <p className="tool-empty-text">Awaiting Translation Request</p>
                <p className="tool-empty-subtext">
                  Select your target language and initiate translation to preview natural cross-lingual phrasing.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Translator;


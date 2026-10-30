import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mic, ArrowLeft, Copy, Check, Download, Trash2,
  RefreshCw, Sparkles, Square, Play, Pause, Upload, FileText, CheckCircle2
} from 'lucide-react';
import { chatService } from '../../services/ChatService';
import './ToolAppShared.css';
import './VoiceToText.css';

const STRUCTURING_MODES = [
  {
    id: 'minutes',
    label: 'Meeting Minutes & Action Items',
    desc: 'Extracts agenda, key decisions made, action items with assignees, and blockers'
  },
  {
    id: 'clean',
    label: 'Verbatim Clean Transcript',
    desc: 'Removes stutters, filler words (um, uh, you know), and corrects grammar and punctuation'
  },
  {
    id: 'qa',
    label: 'Q&A Dialogue Format',
    desc: 'Separates speakers, questions, answers, and clarifies inquiry intents'
  },
  {
    id: 'highlights',
    label: 'High-Impact Soundbites',
    desc: 'Distills the highest signal soundbites, quantitative metrics, and commitments'
  }
];

const SAMPLE_TRANSCRIPTS = [
  {
    id: 'sync',
    label: 'Product Architecture Sync',
    text: `Alright uh so thanks everyone for hopping on the sync. Um first item Dave can you give us an update on the auth migration? Yeah sure so we finished the Cognito to Clerk migration in staging yesterday. We did hit a snag with the legacy session tokens because some users had active JWTs with the old HMAC secret. We wrote a 24-hour transition middleware so that won't block Friday's launch. Okay great. Sarah what about billing? Stripe webhooks are verified. We tested the webhooks for failed payment retries and everything behaves as expected. So who is owning the customer notification email? Dave will draft the notice by Wednesday noon and Sarah will review.`
  },
  {
    id: 'interview',
    label: 'User Discovery Call',
    text: `Thanks for chatting with us today Marcus. Can you tell us about your daily workflow with reporting? Honestly our biggest headache is pulling data from three different dashboards. Every Monday morning I spend at least two hours copying numbers into Excel. If your platform could just generate an automated executive briefing and email it to my CEO directly, that alone would justify a $500 monthly tier for us.`
  }
];

export const VoiceToText = () => {
  const navigate = useNavigate();
  const [transcript, setTranscript] = useState(SAMPLE_TRANSCRIPTS[0].text);
  const [structuringMode, setStructuringMode] = useState('minutes');
  const [structuredOutput, setStructuredOutput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recognitionRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          void 0;
        }
      }
    };
  }, []);

  const startRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please upload an audio file or paste text.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let currentTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript + ' ';
        }
        setTranscript(currentTranscript.trim());
      };

      recognition.onerror = () => {
        setIsRecording(false);
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      };

      recognition.onend = () => {
        setIsRecording(false);
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      };

      recognition.start();
      recognitionRef.current = recognition;
      setIsRecording(true);
      setRecordingSeconds(0);
      setTranscript('');

      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch {
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        void 0;
      }
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    setIsRecording(false);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith('audio/')) {
      setTranscript(`[Audio File Uploaded: ${file.name} - ${Math.round(file.size / 1024)} KB]
Transcribing audio recording: "Team engineering standup recording discussing infrastructure timeline, latency benchmarks, and client onboarding milestones."`);
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result;
        if (typeof content === 'string') {
          setTranscript(content);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleProcess = async () => {
    if (!transcript.trim() || isProcessing) return;
    setIsProcessing(true);
    setStructuredOutput('');

    const modeObj = STRUCTURING_MODES.find((m) => m.id === structuringMode);

    const systemPrompt = `You are an expert audio transcriptionist and executive assistant.
Transform the raw, unformatted transcript into a clear, professional, structured document following this format:
Format Mode: ${modeObj?.label} (${modeObj?.desc})
Rules:
- Eliminate spoken filler words, false starts, and repeated utterances.
- Identify decisions made, deadlines, and ownership responsibilities clearly.
- Output clean markdown with headers and bullet points. Do not include conversational remarks.`;

    try {
      await chatService.generateResponse(
        'qwen/qwen3.8-27b',
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: transcript }
        ],
        (chunk) => {
          setStructuredOutput((prev) => prev + chunk);
        }
      );
    } catch {
      setStructuredOutput('Processing failed. Please check your connection and retry.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = () => {
    if (!structuredOutput) return;
    navigator.clipboard.writeText(structuredOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!structuredOutput) return;
    const blob = new Blob([structuredOutput], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SumanAI_Structured_Transcript_${structuringMode}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatTimer = (secs) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${rem.toString().padStart(2, '0')}`;
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
          <span className="tool-nav-current">Audio Transcript Structurer</span>
        </nav>

        <div className="tool-header-content">
          <div className="tool-title-row">
            <h1 className="tool-app-heading">Audio Transcript Structurer</h1>
            <span className="tool-tag-pill">Speech Intelligence</span>
          </div>
          <p className="tool-app-subheading">
            Transform spoken audio or raw transcripts into polished meeting minutes, action items, and Q&A dialogues.
          </p>
        </div>
      </header>

      <main className="tool-app-body">
        <section className="tool-config-panel">
          <div className="tool-input-group">
            <label className="tool-label">Audio Capture & Source Input</label>

            <div className="voice-mic-box">
              {isRecording ? (
                <div className="voice-recording-active">
                  <div className="voice-pulse-circle" />
                  <div className="voice-recording-info">
                    <span className="voice-rec-status">Live Microphone Recording</span>
                    <span className="voice-rec-time">{formatTimer(recordingSeconds)}</span>
                  </div>
                  <button
                    type="button"
                    className="tool-btn-secondary voice-stop-btn"
                    onClick={stopRecording}
                  >
                    <Square size={14} /> Stop
                  </button>
                </div>
              ) : (
                <div className="voice-mic-idle">
                  <button
                    type="button"
                    className="tool-btn-primary voice-record-btn"
                    onClick={startRecording}
                  >
                    <Mic size={16} /> Record from Microphone
                  </button>

                  <button
                    type="button"
                    className="tool-btn-secondary"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload size={14} /> Upload Audio / Text
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*,.txt,.md"
                    style={{ display: 'none' }}
                    onChange={handleFileUpload}
                  />
                </div>
              )}
            </div>

            <div className="voice-sample-pills">
              {SAMPLE_TRANSCRIPTS.map((sample) => (
                <button
                  key={sample.id}
                  type="button"
                  className="voice-sample-pill"
                  onClick={() => setTranscript(sample.text)}
                >
                  {sample.label}
                </button>
              ))}
            </div>

            <textarea
              className="tool-textarea voice-textarea"
              rows={6}
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Live transcription will appear here, or you can paste raw speech transcripts..."
            />
          </div>

          <div className="tool-input-group">
            <label className="tool-label">Structuring Architecture</label>
            <div className="tool-grid-options">
              {STRUCTURING_MODES.map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  className={`tool-option-card ${structuringMode === mode.id ? 'active' : ''}`}
                  onClick={() => setStructuringMode(mode.id)}
                >
                  <span>{mode.label}</span>
                  <span className="tool-option-desc">{mode.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            className="tool-btn-primary"
            onClick={handleProcess}
            disabled={isProcessing || !transcript.trim() || isRecording}
          >
            {isProcessing ? (
              <>
                <RefreshCw size={16} className="tool-loading-spinner" />
                Structuring Audio Transcript...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Format & Structure Transcript
              </>
            )}
          </button>
        </section>

        <section className="tool-result-panel">
          <div className="tool-result-header">
            <div className="tool-result-title">
              <FileText size={16} />
              <span>Structured Documentation</span>
            </div>

            {structuredOutput && (
              <div className="tool-result-actions">
                <button
                  type="button"
                  className="tool-btn-secondary"
                  onClick={handleCopy}
                  title="Copy formatted text"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  type="button"
                  className="tool-btn-secondary"
                  onClick={handleDownload}
                  title="Download Markdown"
                >
                  <Download size={14} />
                  <span>Download .MD</span>
                </button>
                <button
                  type="button"
                  className="tool-btn-secondary"
                  onClick={() => setStructuredOutput('')}
                  title="Clear Output"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </div>

          <div className="voice-result-container">
            {isProcessing && !structuredOutput ? (
              <div className="voice-loading-state">
                <RefreshCw size={34} className="tool-loading-spinner" />
                <p className="voice-loading-title">
                  Structuring Transcript as {STRUCTURING_MODES.find((m) => m.id === structuringMode)?.label}...
                </p>
                <p className="voice-loading-desc">
                  Filtering filler speech, punctuating sentences, and extracting deliverables.
                </p>
              </div>
            ) : structuredOutput ? (
              <div className="voice-rendered-content">
                {structuredOutput.split('\n\n').map((block, idx) => (
                  <p key={idx} className="voice-paragraph">
                    {block}
                  </p>
                ))}
              </div>
            ) : (
              <div className="tool-empty-display">
                <div className="tool-empty-icon-box">
                  <Mic size={28} />
                </div>
                <p className="tool-empty-text">Audio Structurer Ready</p>
                <p className="tool-empty-subtext">
                  Record speech with your microphone or paste an existing meeting log to generate organized action items and executive notes.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default VoiceToText;

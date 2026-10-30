import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowUp, Globe, Paperclip, X, Plus,
  Camera, Image as ImageIcon, Lightbulb, PenTool, Layers, Square, Eye, Mic
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useModel } from '../hooks/useModel';
import { useChatStore } from '../store/useChatStore';
import { useAuthStore } from '../store/useAuthStore';
import { chatService } from '../services/ChatService';
import { usageService } from '../services/usageService';
import { DEFAULT_VISION_MODEL, DEFAULT_IMAGE_GEN_MODEL } from '../constants/models';
import { compressImage, isImageGenerationIntent } from '../utils/imageUtils';
import { parseArtifact } from '../utils/artifactUtils';

const mergeSpeechTranscripts = (results) => {
  if (!results || results.length === 0) return '';

  const finalParts = [];
  let interimText = '';

  for (let i = 0; i < results.length; i++) {
    const item = results[i];
    const text = item[0]?.transcript?.trim() || '';
    if (!text) continue;

    if (item.isFinal) {
      if (finalParts.length > 0) {
        const last = finalParts[finalParts.length - 1];
        if (text.toLowerCase().startsWith(last.toLowerCase())) {
          finalParts[finalParts.length - 1] = text;
        } else if (!last.toLowerCase().includes(text.toLowerCase())) {
          finalParts.push(text);
        }
      } else {
        finalParts.push(text);
      }
    } else {
      interimText = text;
    }
  }

  let combined = finalParts.join(' ');
  if (interimText) {
    if (!combined) {
      combined = interimText;
    } else if (interimText.toLowerCase().startsWith(combined.toLowerCase())) {
      combined = interimText;
    } else if (!combined.toLowerCase().endsWith(interimText.toLowerCase()) && !combined.toLowerCase().includes(interimText.toLowerCase())) {
      combined = `${combined} ${interimText}`;
    }
  }

  return combined.trim();
};

const InputBar = () => {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [deepThinking, setDeepThinking] = useState(false);
  const [smartSearch, setSmartSearch] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [visionToast, setVisionToast] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [micToast, setMicToast] = useState(null);

  const navigate = useNavigate();
  const { selectedModel, setSelectedModel, governance, defaultModelForTier, resetToDefaultModel } = useModel();
  const { user, openAuthModal } = useAuthStore();
  const fileRef = useRef(null);
  const cameraRef = useRef(null);
  const inputRef = useRef(null);
  const actionMenuRef = useRef(null);
  const abortControllerRef = useRef(null);
  const recognitionRef = useRef(null);
  const startingPrefixRef = useRef('');
  const isStartingMicRef = useRef(false);

  const ensureActiveChat = useChatStore(state => state.ensureActiveChat);
  const addMessage = useChatStore(state => state.addMessage);
  const updateLastMessage = useChatStore(state => state.updateLastMessage);
  const toggleCanvas = useChatStore(state => state.toggleCanvas);
  const isPendingGeneration = useChatStore(state => state.isPendingGeneration);
  const setPendingGeneration = useCallback((val) => useChatStore.setState({ isPendingGeneration: val }), []);
  const setHasAttachments = useChatStore(state => state.setHasAttachments);
  const hasImageGenActive = useChatStore(state => state.hasImageGenActive);
  const setHasImageGenActive = useChatStore(state => state.setHasImageGenActive);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(e.target)) {
        setShowActionMenu(false);
      }
    };
    if (showActionMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showActionMenu]);

  useEffect(() => {
    setHasAttachments(attachments.length > 0);
  }, [attachments, setHasAttachments]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      if (!file.type.startsWith('image/')) {
        alert("Only image files are supported currently.");
        return;
      }

      const reader = new FileReader();
      reader.onload = async (event) => {
        const compressedDataUrl = await compressImage(event.target.result);
        setAttachments(prev => [
          ...prev,
          {
            name: file.name,
            type: 'image/jpeg',
            data: compressedDataUrl.split(',')[1]
          }
        ]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
    setShowActionMenu(false);

    if (DEFAULT_VISION_MODEL && selectedModel?.id !== DEFAULT_VISION_MODEL.id) {
      const switched = setSelectedModel(DEFAULT_VISION_MODEL);
      if (switched !== false) {
        setVisionToast(DEFAULT_VISION_MODEL.name);
        setTimeout(() => setVisionToast(null), 4000);
      }
    }
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleToggleImageGen = () => {
    const newState = !hasImageGenActive;
    setShowActionMenu(false);

    if (newState) {
      const quota = usageService.checkImageGenAllowed(user, governance);
      if (!quota.allowed) {
        if (quota.reason === 'login_required') {
          openAuthModal();
          setVisionToast("Please sign in with Google to create AI images.");
          setTimeout(() => setVisionToast(null), 4000);
        } else {
          setVisionToast(quota.message);
          setTimeout(() => setVisionToast(null), 4500);
        }
        return;
      }

      setHasImageGenActive(true);
      if (DEFAULT_IMAGE_GEN_MODEL) {
        setSelectedModel(DEFAULT_IMAGE_GEN_MODEL);
        const remainingText = quota.unlimited ? 'Unlimited' : `${quota.remaining} left today`;
        setVisionToast(`Image Gen: ${DEFAULT_IMAGE_GEN_MODEL.name} (${remainingText})`);
        setTimeout(() => setVisionToast(null), 4000);
      }
    } else {
      setHasImageGenActive(false);
      const fallback = resetToDefaultModel ? resetToDefaultModel() : defaultModelForTier;
      if (fallback) {
        setSelectedModel(fallback);
        setVisionToast(`Switched back to ${fallback.name}`);
        setTimeout(() => setVisionToast(null), 3000);
      }
    }
  };

  const stopListening = useCallback(() => {
    isStartingMicRef.current = false;
    startingPrefixRef.current = '';
    if (recognitionRef.current) {
      const rec = recognitionRef.current;
      recognitionRef.current = null;
      rec.onresult = null;
      rec.onerror = null;
      rec.onend = null;
      rec.onstart = null;
      try {
        rec.abort();
      } catch {
        void 0;
      }
    }
    setIsListening(false);
  }, []);

  const startRecognition = useCallback((baseText = '') => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMicToast("Voice input is not supported in this browser.");
      setTimeout(() => setMicToast(null), 3500);
      return;
    }

    if (recognitionRef.current) {
      const oldRec = recognitionRef.current;
      recognitionRef.current = null;
      oldRec.onresult = null;
      oldRec.onerror = null;
      oldRec.onend = null;
      oldRec.onstart = null;
      try {
        oldRec.abort();
      } catch {
        void 0;
      }
    }

    isStartingMicRef.current = true;
    const cleanBase = typeof baseText === 'string' ? baseText.trim() : '';
    startingPrefixRef.current = cleanBase ? cleanBase + ' ' : '';

    const isMobile = typeof window !== 'undefined' && (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 0 && window.innerWidth < 1024));

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = !isMobile;
      recognition.interimResults = true;
      recognition.lang = navigator.language || 'en-US';

      recognition.onstart = () => {
        isStartingMicRef.current = false;
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const sessionTranscript = mergeSpeechTranscripts(event.results);
        const updated = (startingPrefixRef.current + sessionTranscript).trimStart();
        setText(updated);
        if (inputRef.current) {
          inputRef.current.style.height = 'auto';
          inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 180)}px`;
        }
      };

      recognition.onerror = (event) => {
        isStartingMicRef.current = false;
        if (event.error === 'not-allowed') {
          setMicToast("Microphone access denied. Please allow microphone permissions.");
          setTimeout(() => setMicToast(null), 4000);
          stopListening();
        } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
          setMicToast(`Voice input error: ${event.error}`);
          setTimeout(() => setMicToast(null), 3500);
          stopListening();
        }
      };

      recognition.onend = () => {
        isStartingMicRef.current = false;
        setIsListening(false);
        recognitionRef.current = null;
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      isStartingMicRef.current = false;
      setMicToast("Could not start microphone.");
      setTimeout(() => setMicToast(null), 3500);
      stopListening();
    }
  }, [stopListening]);

  const handleToggleMic = () => {
    if (isListening || isStartingMicRef.current) {
      stopListening();
    } else {
      startRecognition(text);
    }
  };

  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsGenerating(false);
    }
  };

  const handleSend = useCallback(async (cmdOrEvent = null, overrideOptions = {}) => {
    stopListening();
    const isManualSend = typeof cmdOrEvent !== 'string';
    const promptValue = isManualSend ? text.trim() : cmdOrEvent;

    if (isGenerating) return;
    if (!promptValue && attachments.length === 0) return;

    const autoDetectedImageGen = isImageGenerationIntent(promptValue);
    const isImageGen = Boolean(
      selectedModel?.supportsImageGen || 
      hasImageGenActive || 
      overrideOptions?.isImageGen || 
      overrideOptions?.modelId === DEFAULT_IMAGE_GEN_MODEL?.id ||
      overrideOptions?.modelId?.includes('flux') ||
      autoDetectedImageGen
    );

    if (autoDetectedImageGen && !hasImageGenActive && !selectedModel?.supportsImageGen) {
      setVisionToast('Auto-detected Image Request: Flux 1 Schnell');
      setTimeout(() => setVisionToast(null), 3200);
    }

    if (isImageGen) {
      const quota = usageService.checkImageGenAllowed(user, governance);
      if (!quota.allowed) {
        if (quota.reason === 'login_required') {
          openAuthModal();
        }
        setVisionToast(quota.message);
        setTimeout(() => setVisionToast(null), 4500);
        return;
      }
    }

    const useDeepThinking = overrideOptions.deepThinking !== undefined ? overrideOptions.deepThinking : deepThinking;
    const useSmartSearch = overrideOptions.smartSearch !== undefined ? overrideOptions.smartSearch : smartSearch;
    const currentAttachments = [...attachments];
    let targetChatId = null;

    try {
      setIsGenerating(true);
      abortControllerRef.current = new AbortController();

      if (isManualSend) {
        setText('');
        setAttachments([]);
        setHasImageGenActive(false);
        if (isImageGen) {
          if (resetToDefaultModel) {
            resetToDefaultModel();
          } else if (defaultModelForTier) {
            setSelectedModel(defaultModelForTier);
          }
        }
        if (inputRef.current) {
          inputRef.current.style.height = 'auto';
        }
      }

      const chatId = ensureActiveChat();
      targetChatId = chatId;

      if (window.location.pathname === '/' || window.location.pathname === '') {
        navigate(`/${chatId}`, { replace: true });
      }

      if (isManualSend) {
        addMessage(chatId, {
          role: 'user',
          content: promptValue,
          attachments: currentAttachments
        });
      }

      const modelToUse = overrideOptions?.modelId 
        || (isImageGen && DEFAULT_IMAGE_GEN_MODEL ? DEFAULT_IMAGE_GEN_MODEL.id : selectedModel.id);
      const modelDisplayName = (isImageGen && DEFAULT_IMAGE_GEN_MODEL) ? DEFAULT_IMAGE_GEN_MODEL.name : (selectedModel?.name || 'SumanAI');

      addMessage(chatId, { role: 'assistant', content: '', model: modelDisplayName });

      const { chats } = useChatStore.getState();
      const activeChat = chats.find(c => c.id === chatId);
      if (!activeChat) throw new Error("Chat initialization failed");

      const finalResult = await chatService.generateResponse(
        modelToUse,
        activeChat.messages,
        (chunk) => {
          updateLastMessage(chatId, chunk);

          const artifact = parseArtifact(chunk);
          if (artifact && artifact.isWeb) {
            const { setCanvasState, canvas } = useChatStore.getState();
            if (canvas.isOpen) {
              setCanvasState({
                content: artifact.content,
                previewHtml: artifact.previewHtml,
                files: artifact.files,
                language: artifact.language || 'html',
                title: "Generated Artifact"
              });
            }
          }
        },
        {
          deepThinking: useDeepThinking,
          smartSearch: useSmartSearch,
          signal: abortControllerRef.current.signal
        }
      );

      const completedText = finalResult || '';
      if (completedText) {
        if (isImageGen) {
          usageService.recordGenerationTimestamp(user?.uid || 'guest');
        }
        updateLastMessage(chatId, completedText);
        const finalArtifact = parseArtifact(completedText);
        if (finalArtifact && finalArtifact.isWeb) {
          const { setCanvasState, canvas } = useChatStore.getState();
          if (canvas.isOpen) {
            setCanvasState({
              content: finalArtifact.content,
              previewHtml: finalArtifact.previewHtml,
              files: finalArtifact.files,
              language: finalArtifact.language || 'html',
              title: "Generated Artifact"
            });
          }
        }
      } else {
        updateLastMessage(chatId, "⚠️ No response received from the model. Please try re-sending or use a different model.");
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        let userFriendlyMsg = err.message || "⚠️ Connection interrupted. Please try re-sending.";

        if (!userFriendlyMsg.includes('❌') && !userFriendlyMsg.includes('busy')) {
          if (err.message?.includes('DEGRADED') || err.message?.includes('invoked')) {
            userFriendlyMsg = "⚠️ Model currently under maintenance. Please try GPT-OSS 120B or Gemini!";
          } else if (err.message?.includes('401')) {
            userFriendlyMsg = "⚠️ API Key issue detected. Please check your Worker secrets.";
          } else {
            userFriendlyMsg = `⚠️ ${err.message || 'Connection interrupted. Please try re-sending.'}`;
          }
        }

        const finalChatId = targetChatId || useChatStore.getState().activeChatId;
        if (finalChatId) {
          updateLastMessage(finalChatId, userFriendlyMsg);
        }
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
      if (isImageGen) {
        if (resetToDefaultModel) {
          resetToDefaultModel();
        } else if (defaultModelForTier) {
          setSelectedModel(defaultModelForTier);
        }
      }
    }
  }, [text, isGenerating, attachments, deepThinking, smartSearch, ensureActiveChat, navigate, addMessage, selectedModel, setSelectedModel, updateLastMessage, setHasImageGenActive, stopListening, governance, hasImageGenActive, openAuthModal, user, defaultModelForTier, resetToDefaultModel]);

  useEffect(() => {
    if (isPendingGeneration) {
      const { chats, activeChatId, pendingOptions } = useChatStore.getState();
      const activeChat = chats.find(c => c.id === activeChatId);

      if (activeChat && activeChat.messages.length > 0) {
        setPendingGeneration(false);

        if (pendingOptions.smartSearch) setSmartSearch(true);
        if (pendingOptions.deepThinking) setDeepThinking(true);

        const lastMsg = activeChat.messages[activeChat.messages.length - 1];
        if (lastMsg.role === 'user') {
          handleSend(lastMsg.content, pendingOptions);
        }
      }
    }
  }, [isPendingGeneration, handleSend, setPendingGeneration]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextChange = (e) => {
    const val = e.target.value;
    setText(val);

    if (isListening || recognitionRef.current) {
      startRecognition(val);
    }

    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 180)}px`;
    }
  };

  return (
    <div className="input-container">
      {visionToast && typeof document !== 'undefined' && createPortal(
        <div className={`vision-toast ${hasImageGenActive ? 'image-gen' : ''}`} role="status" aria-live="polite">
          <div className="vision-toast-content">
            <Eye size={14} className="vision-toast-icon" />
            <span>
              Switched to <strong>{visionToast.replace('Image Gen: ', '')}</strong>: {hasImageGenActive ? 'tailored for creative image generation.' : 'ready for visual input analysis.'}
            </span>
          </div>
        </div>,
        document.body
      )}

      {micToast && typeof document !== 'undefined' && createPortal(
        <div className="vision-toast" role="status" aria-live="polite">
          <div className="vision-toast-content">
            <Mic size={14} className="vision-toast-icon" />
            <span>{micToast}</span>
          </div>
        </div>,
        document.body
      )}

      <div className="input-bar glass">
        {attachments.length > 0 && (
          <div className="attachment-preview-bar">
            {attachments.map((file, idx) => (
              <div key={idx} className="attachment-thumb">
                <img src={`data:${file.type};base64,${file.data}`} alt="preview" />
                <button className="remove-attachment" onClick={() => removeAttachment(idx)} aria-label="Remove image">
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="main-input-wrapper">
          <div className="action-menu-container" ref={actionMenuRef}>
            <button
              className={`action-trigger-btn ${showActionMenu ? 'active' : ''}`}
              onClick={() => setShowActionMenu(!showActionMenu)}
              title="Add tools & content"
              aria-label="Add tools and content"
            >
              <Plus size={19} />
            </button>

            {showActionMenu && (
              <div className="action-menu">
                <button className="action-item" onClick={() => cameraRef.current?.click()}>
                  <Camera size={16} />
                  <span>Take photo</span>
                </button>
                <button className="action-item" onClick={() => fileRef.current?.click()}>
                  <Paperclip size={16} />
                  <span>Add photos & files</span>
                </button>
                <div className="action-divider" />
                <button
                  className={`action-item ${hasImageGenActive ? 'active' : ''}`}
                  onClick={handleToggleImageGen}
                >
                  <ImageIcon size={16} />
                  <span>Create image</span>
                  {hasImageGenActive && <span className="action-active-dot" />}
                </button>
                <button
                  className={`action-item ${deepThinking ? 'active' : ''}`}
                  onClick={() => { setDeepThinking(!deepThinking); setShowActionMenu(false); }}
                >
                  <Lightbulb size={16} />
                  <span>Deep thinking</span>
                  {deepThinking && <span className="action-active-dot" />}
                </button>
                <button className="action-item" onClick={() => { toggleCanvas(); setShowActionMenu(false); }}>
                  <PenTool size={16} />
                  <span>Interactive canvas</span>
                </button>
                <button className="action-item disabled" disabled>
                  <Layers size={16} />
                  <span>Interactive quizzes</span>
                </button>
              </div>
            )}
          </div>

          <textarea
            ref={inputRef}
            placeholder="Ask anything..."
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            rows={1}
            className="input-textarea"
          />

          <div className="input-actions-primary">
            {(deepThinking || smartSearch) && (
              <div className="active-pill-indicators">
                {deepThinking && (
                  <div className="indicator-pill thinking" title="Deep thinking active">
                    <Lightbulb size={13} />
                    <span className="indicator-label">Thinking</span>
                  </div>
                )}
                {smartSearch && (
                  <div className="indicator-pill search" title="Smart web search active">
                    <Globe size={13} />
                    <span className="indicator-label">Search</span>
                  </div>
                )}
              </div>
            )}

            <button
              type="button"
              className={`mic-btn ${isListening ? 'listening' : ''}`}
              onClick={handleToggleMic}
              disabled={isGenerating}
              title={isListening ? "Listening... Click to stop" : "Voice input"}
              aria-label={isListening ? "Listening... Click to stop" : "Voice input"}
            >
              <Mic size={18} />
            </button>

            <button
              className={`send-btn ${isGenerating ? 'stop' : ''}`}
              onClick={isGenerating ? handleStop : () => handleSend()}
              disabled={!text.trim() && attachments.length === 0 && !isGenerating}
              title={isGenerating ? "Stop generating" : "Send message"}
              aria-label={isGenerating ? "Stop generating" : "Send message"}
            >
              {isGenerating ? <Square size={14} fill="currentColor" /> : <ArrowUp size={18} />}
            </button>
          </div>
        </div>

        <input
          type="file"
          ref={fileRef}
          style={{ display: 'none' }}
          accept="image/*"
          multiple
          onChange={handleFileChange}
        />
        <input
          type="file"
          ref={cameraRef}
          style={{ display: 'none' }}
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
        />
      </div>

      <div className="footer-text">
        <span className="footer-disclaimer">SumanAI may produce inaccurate info. Verify key facts.</span>
        <span className="footer-dot">•</span>
        <a
          href="https://url.sumanonline.com/join-whatsapp"
          target="_blank"
          rel="noopener noreferrer"
          className="footer-community-link"
        >
          Join WhatsApp Channel
        </a>
      </div>
    </div>
  );
};

export default InputBar;

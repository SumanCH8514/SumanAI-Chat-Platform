import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowUp, Globe, Paperclip, X, Plus,
  Camera, Image as ImageIcon, Lightbulb, PenTool, Layers, Square, Eye, Mic,
  Maximize2, Minimize2, Palette, Film, Cpu,
  Code2, FileText, BookOpen, GraduationCap, Clock, ChevronRight,
  MoreVertical, RotateCw, Send, MessageSquare, PlaySquare, Save, Compass
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useModel } from '../hooks/useModel';
import { useChatStore } from '../store/useChatStore';
import { useAuthStore } from '../store/useAuthStore';
import { chatService } from '../services/ChatService';
import { usageService } from '../services/usageService';
import { MODEL_LIST, DEFAULT_VISION_MODEL, DEFAULT_IMAGE_GEN_MODEL, DEFAULT_VIDEO_GEN_MODEL } from '../constants/models';
import { compressImage, isImageGenerationIntent } from '../utils/imageUtils';
import { parseArtifact } from '../utils/artifactUtils';
import ModelSelector from './ModelSelector';
import VideoOptionsToolbar from './VideoOptionsToolbar';

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

const suggestionSets = [
  [
    {
      icon: <BookOpen size={16} color="currentColor" />,
      title: "Design a poster based on my taste",
      prompt: "Design a modern graphic poster concept with bold typography, balanced composition, and a striking color palette based on clean contemporary design aesthetics."
    },
    {
      icon: <Film size={16} color="currentColor" />,
      title: "Help me pick a family movie",
      prompt: "Recommend 3 great family movies for an engaging movie night. For each, give a short synopsis, target age range, and where it is streaming."
    },
    {
      icon: <GraduationCap size={16} color="currentColor" />,
      title: "Explain machine learning simply",
      prompt: "Explain how machine learning works in simple, clear terms using real-world analogies that anyone can understand."
    }
  ],
  [
    {
      icon: <BookOpen size={16} color="currentColor" />,
      title: "Write a high-converting headline",
      prompt: "Write 5 compelling, benefit-driven hero headlines for a modern SaaS product that captures attention and drives conversions."
    },
    {
      icon: <Compass size={16} color="currentColor" />,
      title: "Plan a 3-day travel itinerary",
      prompt: "Create a balanced 3-day travel itinerary with local recommendations, scenic spots, and must-try foods."
    },
    {
      icon: <GraduationCap size={16} color="currentColor" />,
      title: "Compare SQL vs NoSQL databases",
      prompt: "Compare SQL and NoSQL databases in simple terms with pros, cons, and when to use each in production applications."
    }
  ]
];

const formatRecentChatTime = (timestamp) => {
  if (!timestamp) return 'Recently';
  const d = new Date(timestamp);
  if (isNaN(d.getTime())) return 'Recently';
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();

  const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

  if (isToday) {
    return `Today, ${timeStr}`;
  }
  if (isYesterday) {
    return `Yesterday, ${timeStr}`;
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ', ' + timeStr;
};

const InputBar = ({ isCentered = false }) => {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [deepThinking, setDeepThinking] = useState(false);
  const [smartSearch, setSmartSearch] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [visionToast, setVisionToast] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [micToast, setMicToast] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [suggestionSetIndex, setSuggestionSetIndex] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [codeMode, setCodeMode] = useState(false);
  const [summarizeMode, setSummarizeMode] = useState(false);

  const chats = useChatStore((state) => state.chats);
  const setActiveChat = useChatStore((state) => state.setActiveChat);
  const syncChats = useChatStore((state) => state.syncChats);

  const handleRefreshSuggestions = () => {
    setIsRefreshing(true);
    setSuggestionSetIndex((prev) => (prev + 1) % suggestionSets.length);
    setTimeout(() => setIsRefreshing(false), 300);
  };

  const currentSuggestions = suggestionSets[suggestionSetIndex] || suggestionSets[0];

  const realRecentChats = useMemo(() => {
    if (!Array.isArray(chats) || chats.length === 0) return [];
    return [...chats]
      .filter((chat) => chat && chat.id && ((chat.messages && chat.messages.length > 0) || (chat.title && chat.title !== 'New Chat')))
      .sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0))
      .slice(0, 5)
      .map((chat) => ({
        id: chat.id,
        title: chat.title || 'Untitled conversation',
        time: formatRecentChatTime(chat.updatedAt || chat.createdAt || (chat.messages?.[chat.messages.length - 1]?.timestamp)),
        prompt: chat.messages?.[0]?.content || chat.title || ''
      }));
  }, [chats]);

  const navigate = useNavigate();
  const { selectedModel, setSelectedModel, governance, defaultModelForTier, resetToDefaultModel } = useModel();
  const { user, openAuthModal } = useAuthStore();
  const fileRef = useRef(null);
  const cameraRef = useRef(null);
  const inputRef = useRef(null);
  const actionMenuRef = useRef(null);
  const abortControllerRef = useRef(null);
  const isGeneratingRef = useRef(false);
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
  const hasVideoGenActive = useChatStore(state => state.hasVideoGenActive);
  const setHasVideoGenActive = useChatStore(state => state.setHasVideoGenActive);

  useEffect(() => {
    if (user?.uid && typeof syncChats === 'function') {
      syncChats();
    }
  }, [user?.uid, syncChats]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      const inDesktop = actionMenuRef.current && actionMenuRef.current.contains(e.target);
      if (!inDesktop) {
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
      setHasVideoGenActive(false);
      setCodeMode(false);
      setSummarizeMode(false);
      inputRef.current?.focus();
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

  const handleToggleVideoGen = () => {
    const newState = !hasVideoGenActive;
    setShowActionMenu(false);

    if (newState) {
      const quota = usageService.checkVideoGenAllowed(user, governance);
      if (!quota.allowed) {
        if (quota.reason === 'login_required') {
          openAuthModal();
          setVisionToast("Please sign in with Google to create AI videos.");
          setTimeout(() => setVisionToast(null), 4000);
        } else {
          setVisionToast(quota.message);
          setTimeout(() => setVisionToast(null), 4500);
        }
        return;
      }

      setHasImageGenActive(false);
      setHasVideoGenActive(true);
      setCodeMode(false);
      setSummarizeMode(false);
      inputRef.current?.focus();
      if (DEFAULT_VIDEO_GEN_MODEL) {
        setSelectedModel(DEFAULT_VIDEO_GEN_MODEL);
        const remainingText = quota.unlimited ? 'Unlimited' : `${quota.remaining} left today`;
        setVisionToast(`Video Gen: ${DEFAULT_VIDEO_GEN_MODEL.name} (${remainingText})`);
        setTimeout(() => setVisionToast(null), 4000);
      }
    } else {
      setHasVideoGenActive(false);
      const fallback = resetToDefaultModel ? resetToDefaultModel() : defaultModelForTier;
      if (fallback) {
        setSelectedModel(fallback);
        setVisionToast(`Switched back to ${fallback.name}`);
        setTimeout(() => setVisionToast(null), 3000);
      }
    }
  };

  const handleToggleCodeMode = () => {
    const next = !codeMode;
    setCodeMode(next);
    setShowActionMenu(false);
    if (next) {
      setHasImageGenActive(false);
      setHasVideoGenActive(false);
      setSummarizeMode(false);
      const codeModel = MODEL_LIST.find(m => m.id === 'qwen/qwen3.8-27b') || MODEL_LIST.find(m => m.id?.includes('coder'));
      if (codeModel) setSelectedModel(codeModel);
      setVisionToast("Write Code mode active");
      setTimeout(() => setVisionToast(null), 3000);
      inputRef.current?.focus();
    } else {
      const fallback = resetToDefaultModel ? resetToDefaultModel() : defaultModelForTier;
      if (fallback) setSelectedModel(fallback);
    }
  };

  const handleToggleSummarizeMode = () => {
    const next = !summarizeMode;
    setSummarizeMode(next);
    setShowActionMenu(false);
    if (next) {
      setHasImageGenActive(false);
      setHasVideoGenActive(false);
      setCodeMode(false);
      setVisionToast("Summarize Text mode active");
      setTimeout(() => setVisionToast(null), 3000);
      inputRef.current?.focus();
    } else {
      const fallback = resetToDefaultModel ? resetToDefaultModel() : defaultModelForTier;
      if (fallback) setSelectedModel(fallback);
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
    useChatStore.setState({
      abortCurrentGeneration: () => {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
          abortControllerRef.current = null;
        }
        isGeneratingRef.current = false;
        setIsGenerating(false);
        useChatStore.setState({ isGenerating: false });
      }
    });
    return () => {
      useChatStore.setState({ abortCurrentGeneration: null });
      stopListening();
    };
  }, [stopListening]);

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    isGeneratingRef.current = false;
    setIsGenerating(false);
    useChatStore.setState({ isGenerating: false });
  };

  const handleSend = useCallback(async (cmdOrEvent = null, overrideOptions = {}) => {
    stopListening();
    const isRegenerate = Boolean(overrideOptions?.isRegenerate);
    let promptValue = typeof cmdOrEvent === 'string' ? cmdOrEvent.trim() : text.trim();

    if (codeMode && !overrideOptions?.isVideoGen && !overrideOptions?.isImageGen) {
      promptValue = `[Task: Write Code]\n${promptValue}`;
    } else if (summarizeMode && !overrideOptions?.isVideoGen && !overrideOptions?.isImageGen) {
      promptValue = `[Task: Summarize Text]\n${promptValue}`;
    }

    if (isGeneratingRef.current) return;
    if (!promptValue && attachments.length === 0) return;

    const autoDetectedImageGen = isImageGenerationIntent(promptValue);
    const isVideoGen = Boolean(
      selectedModel?.supportsVideoGen ||
      hasVideoGenActive ||
      overrideOptions?.isVideoGen ||
      overrideOptions?.modelId === DEFAULT_VIDEO_GEN_MODEL?.id ||
      overrideOptions?.modelId?.includes('ltx-video')
    );
    const isImageGen = !isVideoGen && Boolean(
      selectedModel?.supportsImageGen || 
      hasImageGenActive || 
      overrideOptions?.isImageGen || 
      overrideOptions?.modelId === DEFAULT_IMAGE_GEN_MODEL?.id ||
      overrideOptions?.modelId?.includes('flux') ||
      overrideOptions?.modelId?.includes('grok-imagine') ||
      autoDetectedImageGen
    );

    if (autoDetectedImageGen && !hasImageGenActive && !hasVideoGenActive && !selectedModel?.supportsImageGen) {
      setVisionToast('Auto-detected Image Request: Flux 1 Schnell');
      setTimeout(() => setVisionToast(null), 3200);
    }

    if (isVideoGen) {
      const quota = usageService.checkVideoGenAllowed(user, governance);
      if (!quota.allowed) {
        if (quota.reason === 'login_required') {
          openAuthModal();
        }
        setVisionToast(quota.message);
        setTimeout(() => setVisionToast(null), 4500);
        return;
      }
    } else if (isImageGen) {
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
      isGeneratingRef.current = true;
      setIsGenerating(true);
      useChatStore.setState({ isGenerating: true });
      abortControllerRef.current = new AbortController();

      const activeVideoModel = selectedModel?.supportsVideoGen ? selectedModel : DEFAULT_VIDEO_GEN_MODEL;
      const activeImageModel = selectedModel?.supportsImageGen ? selectedModel : DEFAULT_IMAGE_GEN_MODEL;
      const chosenModelId = overrideOptions?.modelId 
        || (isVideoGen ? activeVideoModel?.id : (isImageGen ? activeImageModel?.id : selectedModel.id));
      const chosenModelName = overrideOptions?.modelDisplayName 
        || (isVideoGen ? activeVideoModel?.name : (isImageGen ? activeImageModel?.name : (selectedModel?.name || 'SumanAI')));

      if (!isRegenerate) {
        setText('');
        setAttachments([]);
        setHasImageGenActive(false);
        setHasVideoGenActive(false);
        setCodeMode(false);
        setSummarizeMode(false);
        if (isImageGen || isVideoGen || codeMode || summarizeMode) {
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

      if (!isRegenerate) {
        addMessage(chatId, {
          role: 'user',
          content: promptValue,
          attachments: currentAttachments
        });
      }

      const modelToUse = chosenModelId;
      const modelDisplayName = chosenModelName;

      addMessage(chatId, { role: 'assistant', content: '', model: modelDisplayName, isGeneratingVideo: isVideoGen });

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
          videoMode: isVideoGen,
          isVideoGen,
          videoOptions: isVideoGen ? useChatStore.getState().videoOptions : undefined,
          signal: abortControllerRef.current.signal,
          onModelResolved: (realModelId) => {
            if (realModelId) {
              useChatStore.getState().updateLastMessageModel(chatId, realModelId);
            }
          }
        }
      );

      const completedText = finalResult || '';
      if (completedText) {
        if (isVideoGen) {
          usageService.recordVideoGenerationTimestamp(user?.uid || 'guest');
        } else if (isImageGen) {
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
      isGeneratingRef.current = false;
      setIsGenerating(false);
      useChatStore.setState({ isGenerating: false });
      abortControllerRef.current = null;
      if (isImageGen || isVideoGen || codeMode || summarizeMode) {
        if (resetToDefaultModel) {
          resetToDefaultModel();
        } else if (defaultModelForTier) {
          setSelectedModel(defaultModelForTier);
        }
      }
    }
  }, [text, attachments, deepThinking, smartSearch, ensureActiveChat, navigate, addMessage, selectedModel, setSelectedModel, updateLastMessage, setHasImageGenActive, setHasVideoGenActive, stopListening, governance, hasImageGenActive, hasVideoGenActive, codeMode, summarizeMode, openAuthModal, user, defaultModelForTier, resetToDefaultModel]);

  useEffect(() => {
    if (isPendingGeneration) {
      const { chats, activeChatId, pendingOptions } = useChatStore.getState();
      const activeChat = chats.find(c => c.id === activeChatId);

      if (activeChat && activeChat.messages.length > 0) {
        setPendingGeneration(false);

        if (pendingOptions?.smartSearch) setSmartSearch(true);
        if (pendingOptions?.deepThinking) setDeepThinking(true);

        const lastMsg = activeChat.messages[activeChat.messages.length - 1];
        if (lastMsg && lastMsg.role === 'user') {
          if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
          }
          isGeneratingRef.current = false;
          setIsGenerating(false);
          useChatStore.setState({ isGenerating: false });

          handleSend(lastMsg.content, { ...pendingOptions, isRegenerate: true });
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

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      const maxHeight = isExpanded ? 360 : 180;
      const minHeight = isExpanded ? 160 : 38;
      inputRef.current.style.height = `${Math.max(minHeight, Math.min(inputRef.current.scrollHeight, maxHeight))}px`;
    }
  }, [isExpanded]);

  const handleTextChange = (e) => {
    const val = e.target.value;
    setText(val);

    if (isListening || recognitionRef.current) {
      startRecognition(val);
    }

    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      const maxHeight = isExpanded ? 360 : 180;
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, maxHeight)}px`;
    }
  };

  return (
    <div className={`input-container ${isCentered ? 'is-centered' : 'bottom-docked'}`}>
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

      <div className={`input-bar standard-bar ${isExpanded ? 'expanded' : ''}`}>
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

        <div className="input-body-row">
          <textarea
            ref={inputRef}
            placeholder={hasImageGenActive ? "Describe the image you want to generate..." : (hasVideoGenActive ? "Describe the video you want to generate..." : (codeMode ? "Describe the code or problem you want to solve..." : (summarizeMode ? "Paste text or article to summarize..." : "Ask anything...")))}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            rows={isExpanded ? 6 : 1}
            className="input-textarea"
          />

          <button
            type="button"
            className={`expand-toggle-btn ${isExpanded ? 'active' : ''}`}
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? "Collapse input" : "Expand input"}
            aria-label={isExpanded ? "Collapse input" : "Expand input"}
          >
            {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>

        {hasVideoGenActive && (
          <div className="video-options-row">
            <VideoOptionsToolbar />
          </div>
        )}

        <div className="input-bottom-actions">
          <div className="input-bottom-left">
            <div className="action-menu-container" ref={actionMenuRef}>
              <button
                type="button"
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
                    className={`action-item ${hasVideoGenActive ? 'active' : ''}`}
                    onClick={handleToggleVideoGen}
                  >
                    <Film size={16} />
                    <span>Create video</span>
                    {hasVideoGenActive && <span className="action-active-dot" />}
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
                  <button
                    className={`action-item ${codeMode ? 'active' : ''}`}
                    onClick={() => { handleToggleCodeMode(); setShowActionMenu(false); }}
                  >
                    <Code2 size={16} />
                    <span>Write code</span>
                    {codeMode && <span className="action-active-dot" />}
                  </button>
                  <button
                    className={`action-item ${summarizeMode ? 'active' : ''}`}
                    onClick={() => { handleToggleSummarizeMode(); setShowActionMenu(false); }}
                  >
                    <FileText size={16} />
                    <span>Summarize text</span>
                    {summarizeMode && <span className="action-active-dot" />}
                  </button>
                  <button className="action-item disabled" disabled>
                    <Layers size={16} />
                    <span>Interactive quizzes</span>
                  </button>
                </div>
              )}
            </div>

            {(hasImageGenActive || hasVideoGenActive || codeMode || summarizeMode || deepThinking || smartSearch) && (
              <div className="active-pill-indicators">
                {hasImageGenActive && (
                  <button
                    type="button"
                    className="indicator-pill image-gen active"
                    onClick={handleToggleImageGen}
                    title="Image mode active. Click or tap to turn off."
                    aria-label="Image mode active. Click or tap to turn off."
                  >
                    <ImageIcon size={13} className="indicator-icon" />
                    <span className="indicator-label">Images</span>
                    <span className="indicator-close-btn">
                      <X size={12} />
                    </span>
                  </button>
                )}
                {hasVideoGenActive && (
                  <button
                    type="button"
                    className="indicator-pill video-gen active"
                    onClick={handleToggleVideoGen}
                    title="Video mode active. Click or tap to turn off."
                    aria-label="Video mode active. Click or tap to turn off."
                  >
                    <PlaySquare size={13} className="indicator-icon" />
                    <span className="indicator-label">Video</span>
                    <span className="indicator-close-btn">
                      <X size={12} />
                    </span>
                  </button>
                )}
                {codeMode && (
                  <button
                    type="button"
                    className="indicator-pill code-mode active"
                    onClick={handleToggleCodeMode}
                    title="Code mode active. Click or tap to turn off."
                    aria-label="Code mode active. Click or tap to turn off."
                  >
                    <Code2 size={13} className="indicator-icon" />
                    <span className="indicator-label">Code</span>
                    <span className="indicator-close-btn">
                      <X size={12} />
                    </span>
                  </button>
                )}
                {summarizeMode && (
                  <button
                    type="button"
                    className="indicator-pill summarize-mode active"
                    onClick={handleToggleSummarizeMode}
                    title="Summarize mode active. Click or tap to turn off."
                    aria-label="Summarize mode active. Click or tap to turn off."
                  >
                    <FileText size={13} className="indicator-icon" />
                    <span className="indicator-label">Summarize</span>
                    <span className="indicator-close-btn">
                      <X size={12} />
                    </span>
                  </button>
                )}
                {deepThinking && (
                  <button
                    type="button"
                    className="indicator-pill thinking"
                    onClick={() => setDeepThinking(false)}
                    title="Deep thinking active. Click or tap to turn off."
                    aria-label="Deep thinking active. Click or tap to turn off."
                  >
                    <Lightbulb size={13} className="indicator-icon" />
                    <span className="indicator-label">Thinking</span>
                    <span className="indicator-close-btn">
                      <X size={12} />
                    </span>
                  </button>
                )}
                {smartSearch && (
                  <button
                    type="button"
                    className="indicator-pill search"
                    onClick={() => setSmartSearch(false)}
                    title="Smart web search active. Click or tap to turn off."
                    aria-label="Smart web search active. Click or tap to turn off."
                  >
                    <Globe size={13} className="indicator-icon" />
                    <span className="indicator-label">Search</span>
                    <span className="indicator-close-btn">
                      <X size={12} />
                    </span>
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="input-bottom-right">
            <ModelSelector
              variant="inline"
              isCentered={isCentered}
              deepThinking={deepThinking}
              onToggleThinking={() => setDeepThinking(!deepThinking)}
            />

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
              type="button"
              className={`send-btn ${isGenerating ? 'stop' : ''}`}
              onClick={isGenerating ? handleStop : () => handleSend()}
              disabled={!text.trim() && attachments.length === 0 && !isGenerating}
              title={isGenerating ? "Stop generating" : "Send message"}
              aria-label={isGenerating ? "Stop generating" : "Send message"}
            >
              {isGenerating ? <Square size={14} fill="currentColor" /> : <Send size={15} className="send-arrow-icon" />}
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

      {isCentered && (
        <>
          <div className="input-suggestions-list desktop-only">
            {currentSuggestions.map((item, idx) => (
              <button
                key={idx}
                type="button"
                className="suggestion-pill-item"
                onClick={() => handleSend(item.prompt)}
              >
                <span className="suggestion-pill-icon">{item.icon}</span>
                <span className="suggestion-pill-text">{item.title}</span>
              </button>
            ))}
          </div>

          <div className="home-mobile-sections mobile-only">
          <div className="mobile-quick-tools-grid">
            <button
              type="button"
              className={`quick-tool-card ${hasImageGenActive ? 'active' : ''}`}
              onClick={handleToggleImageGen}
              aria-pressed={hasImageGenActive}
            >
              <div className="quick-tool-icon-box purple">
                <ImageIcon size={22} color="currentColor" />
              </div>
              <span className="quick-tool-label">Create image</span>
            </button>

            <button
              type="button"
              className={`quick-tool-card ${hasVideoGenActive ? 'active' : ''}`}
              onClick={handleToggleVideoGen}
              aria-pressed={hasVideoGenActive}
            >
              <div className="quick-tool-icon-box pink">
                <PlaySquare size={22} color="#ec4899" />
              </div>
              <span className="quick-tool-label">Generate video</span>
            </button>

            <button
              type="button"
              className={`quick-tool-card ${codeMode ? 'active' : ''}`}
              onClick={handleToggleCodeMode}
              aria-pressed={codeMode}
            >
              <div className="quick-tool-icon-box blue">
                <Code2 size={22} color="#0284c7" />
              </div>
              <span className="quick-tool-label">Write code</span>
            </button>

            <button
              type="button"
              className={`quick-tool-card ${summarizeMode ? 'active' : ''}`}
              onClick={handleToggleSummarizeMode}
              aria-pressed={summarizeMode}
            >
              <div className="quick-tool-icon-box green">
                <FileText size={22} color="#10b981" />
              </div>
              <span className="quick-tool-label">Summarize text</span>
            </button>
          </div>

          <div className="mobile-section-block">
            <div className="mobile-section-header">
              <span className="mobile-section-title">Suggestions</span>
              <button
                type="button"
                className="mobile-refresh-btn"
                onClick={handleRefreshSuggestions}
              >
                <span>Refresh</span>
                <RotateCw size={14} className={isRefreshing ? 'spinning' : ''} />
              </button>
            </div>

            <div className="mobile-suggestions-list">
              {currentSuggestions.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="mobile-suggestion-row"
                  onClick={() => handleSend(item.prompt)}
                >
                  <div className="mobile-suggestion-icon">
                    {item.icon}
                  </div>
                  <span className="mobile-suggestion-text">{item.title}</span>
                  <ChevronRight size={16} className="mobile-suggestion-arrow" />
                </button>
              ))}
            </div>
          </div>

          <div className="mobile-section-block">
            <div className="mobile-section-header">
              <div className="mobile-section-title-with-icon">
                <Clock size={16} color="#475569" />
                <span className="mobile-section-title">Recent chats</span>
              </div>
              <button
                type="button"
                className="mobile-view-all-btn"
                onClick={() => navigate('/history')}
              >
                View all
              </button>
            </div>

            <div className="mobile-recent-chats-list">
              {realRecentChats.length > 0 ? (
                realRecentChats.map((chat) => (
                  <div
                    key={chat.id}
                    className="mobile-recent-chat-row"
                    onClick={() => {
                      setActiveChat(chat.id);
                      navigate(`/${chat.id}`);
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="mobile-recent-chat-icon">
                      <MessageSquare size={16} color="#64748b" />
                    </div>
                    <div className="mobile-recent-chat-info">
                      <span className="mobile-recent-chat-title">{chat.title}</span>
                      <span className="mobile-recent-chat-time">{chat.time}</span>
                    </div>
                    <button
                      type="button"
                      className="mobile-recent-chat-more"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('/history');
                      }}
                      aria-label="More options"
                    >
                      <MoreVertical size={16} />
                    </button>
                  </div>
                ))
              ) : (
                <div className="mobile-recent-chats-empty">
                  <MessageSquare size={16} color="#94a3b8" />
                  <span>No recent conversations</span>
                </div>
              )}
            </div>
          </div>
        </div>
        </>
      )}

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

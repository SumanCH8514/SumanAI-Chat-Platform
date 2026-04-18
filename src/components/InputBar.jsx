import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  ArrowUp, BrainCircuit, Globe, Paperclip, ChevronDown, X, Plus, 
  Camera, ImagePlus, Lightbulb, Telescope, PenTool, Layers, Square
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useModel } from '../hooks/useModel';
import { useChatStore } from '../store/useChatStore';
import { chatService } from '../services/ChatService';

const InputBar = () => {
  const [text, setText]                 = useState('');
  const [attachments, setAttachments]   = useState([]); // Store { name, type, data } where data is base64
  const [deepThinking, setDeepThinking] = useState(false);
  const [smartSearch,  setSmartSearch]  = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  
  const navigate = useNavigate();
  const { selectedModel } = useModel();
  const fileRef = useRef(null);
  const inputRef = useRef(null);
  const actionMenuRef = useRef(null);
  const abortControllerRef = useRef(null);
  
  const ensureActiveChat = useChatStore(state => state.ensureActiveChat);
  const addMessage       = useChatStore(state => state.addMessage);
  const updateLastMessage= useChatStore(state => state.updateLastMessage);
  const toggleCanvas     = useChatStore(state => state.toggleCanvas);
  const isPendingGeneration = useChatStore(state => state.isPendingGeneration);
  const setPendingGeneration = useCallback((val) => useChatStore.setState({ isPendingGeneration: val }), []);

  // Close action menu when clicking outside
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

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      if (!file.type.startsWith('image/')) {
        alert("Only image files are supported currently.");
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        setAttachments(prev => [
          ...prev, 
          { 
            name: file.name, 
            type: file.type, 
            data: event.target.result.split(',')[1] // Get actual base64 part
          }
        ]);
      };
      reader.readAsDataURL(file);
    });
    // Clear input so same file can be selected again
    e.target.value = '';
    setShowActionMenu(false);
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsGenerating(false);
    }
  };

  const handleSend = useCallback(async (cmdOrEvent = null, overrideOptions = {}) => {
    // Distinguish between a string prompt (from suggestions) and a manual send (event/null)
    const isManualSend = typeof cmdOrEvent !== 'string';
    const promptValue = isManualSend ? text.trim() : cmdOrEvent;

    // Safety checks
    if (isGenerating) return;
    if (!promptValue && attachments.length === 0) return;
    
    // Prepare options
    const useDeepThinking = overrideOptions.deepThinking !== undefined ? overrideOptions.deepThinking : deepThinking;
    const useSmartSearch  = overrideOptions.smartSearch  !== undefined ? overrideOptions.smartSearch  : smartSearch;
    const currentAttachments = [...attachments];
    
    try {
      setIsGenerating(true);
      
      // Initialize AbortController for this request
      abortControllerRef.current = new AbortController();
      
      // Clear inputs immediately for manual sends
      if (isManualSend) {
        setText('');
        setAttachments([]);
        if (inputRef.current) {
          inputRef.current.style.height = 'auto'; // Reset height
        }
      }

      const chatId = ensureActiveChat();
      
      // Redirect if we're on the root path and just started a new chat
      if (window.location.pathname === '/' || window.location.pathname === '') {
        navigate(`/${chatId}`, { replace: true });
      }

      // 1. Add User Message (Only if manual, because automated flows add it via startChatWithPrompt)
      if (isManualSend) {
        addMessage(chatId, { 
          role: 'user', 
          content: promptValue,
          attachments: currentAttachments 
        });
      }

      // 2. Add empty AI Message placeholder for streaming
      addMessage(chatId, { role: 'assistant', content: '' });

      // 3. Request AI streaming
      const { chats } = useChatStore.getState();
      const activeChat = chats.find(c => c.id === chatId);
      
      if (!activeChat) throw new Error("Chat initialization failed");
      
      await chatService.generateResponse(
        selectedModel.id, 
        activeChat.messages, 
        (chunk) => {
          updateLastMessage(chatId, chunk);

          // Canvas Auto-Detection (Markdown blocks)
          const codeBlockRegex = /```(\w+)?\n([\s\S]*?)(?:```|$)/;
          const match = chunk.match(codeBlockRegex);
          if (match) {
            const { setCanvasState } = useChatStore.getState();
            setCanvasState({
              isOpen: true,
              content: match[2].trim(),
              language: match[1] || 'web',
              title: "Generated Artifact"
            });
          }
        },
        { 
          deepThinking: useDeepThinking, 
          smartSearch: useSmartSearch,
          signal: abortControllerRef.current.signal 
        }
      );
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log("Generation aborted by user");
      } else {
        console.error("AI Generation Error", err);
        const { activeChatId } = useChatStore.getState();
        if (activeChatId) {
          let userFriendlyMsg = "⚠️ Connection interrupted. Please try re-sending.";
          
          if (err.message.includes('DEGRADED') || err.message.includes('invoked')) {
            userFriendlyMsg = "⚠️ This NVIDIA model is currently under maintenance (Degraded). Please try DeepSeek-V3.2 or Gemini for now!";
          } else if (err.message.includes('401')) {
            userFriendlyMsg = "⚠️ API Key issue detected. Please check your Worker secrets.";
          }

          updateLastMessage(activeChatId, userFriendlyMsg);
        }
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  }, [text, isGenerating, attachments, deepThinking, smartSearch, ensureActiveChat, navigate, addMessage, selectedModel, updateLastMessage]);

  // Auto-trigger for suggestion cards
  useEffect(() => {
    if (isPendingGeneration) {
      const { chats, activeChatId, pendingOptions } = useChatStore.getState();
      const activeChat = chats.find(c => c.id === activeChatId);
      
      if (activeChat && activeChat.messages.length > 0) {
        setPendingGeneration(false);
        
        // Sync UI toggles with pending options
        if (pendingOptions.smartSearch) setSmartSearch(true);
        if (pendingOptions.deepThinking) setDeepThinking(true);
        
        const lastMsg = activeChat.messages[activeChat.messages.length - 1];
        if (lastMsg.role === 'user') {
          // Pass the override options to handleSend
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
    
    // Auto-grow logic
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  };

  return (
    <div className="input-container">
      <div className="input-bar glass">
        
        {/* Attachment Previews */}
        {attachments.length > 0 && (
          <div className="attachment-preview-bar">
            {attachments.map((file, idx) => (
              <div key={idx} className="attachment-thumb">
                <img src={`data:${file.type};base64,${file.data}`} alt="preview" />
                <button className="remove-attachment" onClick={() => removeAttachment(idx)}>
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="main-input-wrapper">
          {/* Action Menu Trigger (+) */}
          <div className="action-menu-container" ref={actionMenuRef}>
            <button 
              className={`action-trigger-btn ${showActionMenu ? 'active' : ''}`}
              onClick={() => setShowActionMenu(!showActionMenu)}
              title="AI Tools"
            >
              <Plus size={20} />
            </button>

            {showActionMenu && (
              <div className="action-menu">
                <button className="action-item" onClick={() => fileRef.current?.click()}>
                  <Camera size={18} /> Take photo
                </button>
                <button className="action-item" onClick={() => fileRef.current?.click()}>
                  <Paperclip size={18} /> Add photos & files
                </button>
                <div className="action-divider" />
                <button className="action-item disabled">
                  <ImagePlus size={18} /> Create image
                </button>
                <button 
                  className={`action-item ${deepThinking ? 'active' : ''}`}
                  onClick={() => { setDeepThinking(!deepThinking); setShowActionMenu(false); }}
                >
                  <Lightbulb size={18} /> Thinking
                </button>
                <button className="action-item" onClick={() => { toggleCanvas(); setShowActionMenu(false); }}>
                  <PenTool size={18} /> Canvas
                </button>
                <button className="action-item disabled">
                  <Layers size={18} /> Quizzes
                </button>
              </div>
            )}
          </div>

          {/* Text input (textarea for multi-line) */}
          <textarea
            ref={inputRef}
            placeholder="Ask anything.."
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            rows={1}
            className="input-textarea"
          />

          {/* Send Button */}
          <div className="input-actions-primary">
            {/* Active Status Indicators (Minimal) */}
            {(deepThinking || smartSearch) && (
              <div className="active-pill-indicators">
                {deepThinking && <Lightbulb size={22} className="indicator-icon thinking" />}
                {smartSearch && <Globe size={22} className="indicator-icon search" />}
              </div>
            )}
            
            <button
              className={`send-btn ${isGenerating ? 'stop' : ''}`}
              onClick={isGenerating ? handleStop : handleSend}
              style={{ opacity: (text.trim() || attachments.length > 0 || isGenerating) ? 1 : 0.5 }}
              title={isGenerating ? "Stop generating" : "Send"}
            >
              {isGenerating ? <Square size={16} fill="currentColor" /> : <ArrowUp size={20} />}
            </button>
          </div>
        </div>

        {/* Hidden inputs */}
        <input 
          type="file" 
          ref={fileRef} 
          style={{ display: 'none' }} 
          accept="image/*"
          multiple
          onChange={handleFileChange}
        />
      </div>

      <div className="footer-text">
        Join the SumanAI community <span className="hide-on-mobile">for more insights </span><a href="#">Join WhatsApp Channel</a>
      </div>
    </div>
  );
};

export default InputBar;

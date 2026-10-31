import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  User,
  Download,
  Copy,
  Check,
  Volume2,
  VolumeX,
  Share2,
  ThumbsUp,
  ThumbsDown,
  RotateCw,
  Loader2,
  Speech,
  Pencil
} from 'lucide-react';
import ReactMarkdown, { defaultUrlTransform } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useChatStore } from '../store/useChatStore';
import { useAuthStore } from '../store/useAuthStore';
import { downloadImage } from '../utils/downloadUtils';
import { ttsService } from '../services/ttsService';
import { getVoiceById, DEFAULT_VOICE_ID } from '../constants/voices';
import CodeBlock from './CodeBlock';
import GeneratedImageCard, { ImagePlaceholderCard } from './GeneratedImageCard';
import { isImageGenerationIntent } from '../utils/imageUtils';
import ThinkingIndicator from './ThinkingIndicator';
import VoiceSelectionModal from './VoiceSelectionModal';
import './ChatThread.css';

const UserAvatar = ({ user }) => {
  const [hasError, setHasError] = useState(false);
  const photo = user?.photoURL;

  if (photo && !hasError) {
    return (
      <img
        src={photo}
        alt={user?.displayName || 'User'}
        className="user-profile-avatar"
        referrerPolicy="no-referrer"
        onError={() => setHasError(true)}
      />
    );
  }

  return <User size={18} />;
};

const copyToClipboard = async (textToCopy) => {
  if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(textToCopy);
      return true;
    } catch {
      void 0;
    }
  }
  try {
    const textArea = document.createElement('textarea');
    textArea.value = textToCopy;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    textArea.style.top = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch {
    return false;
  }
};

const ChatThread = () => {
  const { chats, activeChatId } = useChatStore();
  const { user } = useAuthStore();

  const activeChat = chats.find(c => c.id === activeChatId);
  const messagesEndRef = useRef(null);
  const editTextareaRef = useRef(null);
  const lastSpeakClickRef = useRef(0);
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [copiedUserIdx, setCopiedUserIdx] = useState(null);
  const [editingChatId, setEditingChatId] = useState(null);
  const [editingMsgId, setEditingMsgId] = useState(null);
  const [editText, setEditText] = useState('');
  const [editError, setEditError] = useState(null);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [sharedIdx, setSharedIdx] = useState(null);
  const [speakingIdx, setSpeakingIdx] = useState(null);
  const [loadingTTSIdx, setLoadingTTSIdx] = useState(null);
  const [feedbackMap, setFeedbackMap] = useState({});
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [activeVoiceId, setActiveVoiceId] = useState(() => {
    try {
      return localStorage.getItem('sumanai_selected_voice_id') || DEFAULT_VOICE_ID;
    } catch {
      return DEFAULT_VOICE_ID;
    }
  });

  const currentVoice = getVoiceById(activeVoiceId);

  const handleDownloadImage = (src) => {
    downloadImage(src, 'SumanAI', 'jpg');
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeChat?.messages]);

  useEffect(() => {
    if (editingMsgId && editTextareaRef.current) {
      const el = editTextareaRef.current;
      el.focus();
      const length = el.value.length;
      el.setSelectionRange(length, length);
      el.style.height = 'auto';
      el.style.height = `${Math.min(el.scrollHeight, 320)}px`;
    }
  }, [editingMsgId]);

  useEffect(() => {
    return () => {
      ttsService.stop();
    };
  }, []);

  const handleCopyUserMessage = async (idx, text) => {
    if (!text) return;
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedUserIdx(idx);
      setTimeout(() => setCopiedUserIdx(null), 2000);
    }
  };

  const handleStartEdit = (msgId, content) => {
    setEditingChatId(activeChatId);
    setEditingMsgId(msgId);
    setEditText(content || '');
    setEditError(null);
  };

  const handleCancelEdit = () => {
    setEditingChatId(null);
    setEditingMsgId(null);
    setEditText('');
    setEditError(null);
    setIsSubmittingEdit(false);
  };

  const handleSubmitEdit = async (msgId, originalContent) => {
    const trimmed = editText.trim();
    if (!trimmed) {
      setEditError('Message cannot be empty.');
      editTextareaRef.current?.focus();
      return;
    }

    if (trimmed === (originalContent || '').trim()) {
      handleCancelEdit();
      return;
    }

    if (!activeChatId) return;

    setIsSubmittingEdit(true);
    ttsService.stop();
    setSpeakingIdx(null);

    try {
      const success = useChatStore.getState().editUserMessage(activeChatId, msgId, trimmed);
      if (success) {
        handleCancelEdit();
      } else {
        setEditError('Unable to update message. Please try again.');
        setIsSubmittingEdit(false);
      }
    } catch {
      setEditError('Failed to update message. Please try again.');
      setIsSubmittingEdit(false);
    }
  };

  const handleEditKeyDown = (e, msgId, originalContent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelEdit();
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitEdit(msgId, originalContent);
    }
  };

  const handleCopyMessage = async (idx, text) => {
    if (!text) return;
    const cleanText = text.replace(/!\[.*?\]\(.*?\)/g, '').trim();
    const ok = await copyToClipboard(cleanText || text);
    if (ok) {
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2000);
    }
  };

  const handleShareMessage = async (idx, text) => {
    if (!text) return;
    const cleanText = text.replace(/!\[.*?\]\(.*?\)/g, '').trim();
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'SumanAI',
          text: cleanText || text
        });
        return;
      } catch {
        void 0;
      }
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(cleanText || text);
        setSharedIdx(idx);
        setTimeout(() => setSharedIdx(null), 2000);
      } catch {
        void 0;
      }
    }
  };

  const handleToggleSpeakMessage = (idx, text) => {
    const now = Date.now();
    if (now - lastSpeakClickRef.current < 650) return;
    lastSpeakClickRef.current = now;

    if (speakingIdx === idx) {
      ttsService.stop();
      setSpeakingIdx(null);
      setLoadingTTSIdx(null);
      return;
    }

    if (loadingTTSIdx === idx) {
      return;
    }

    ttsService.stop();
    setSpeakingIdx(null);
    setLoadingTTSIdx(idx);

    const cleanText = text
      .replace(/```[\s\S]*?```/g, 'Code block omitted.')
      .replace(/!\[.*?\]\(.*?\)/g, '')
      .replace(/[#*`_~>]/g, '')
      .trim();

    ttsService.speak(cleanText || text, {
      onLoading: (isLoading) => {
        if (!isLoading) {
          setLoadingTTSIdx(prev => (prev === idx ? null : prev));
        }
      },
      onStart: () => {
        setLoadingTTSIdx(null);
        setSpeakingIdx(idx);
      },
      onEnd: () => {
        setLoadingTTSIdx(null);
        setSpeakingIdx(prev => (prev === idx ? null : prev));
      },
      onError: () => {
        setLoadingTTSIdx(null);
        setSpeakingIdx(prev => (prev === idx ? null : prev));
      }
    });
  };

  const handleToggleFeedback = (idx, type) => {
    setFeedbackMap((prev) => ({
      ...prev,
      [idx]: prev[idx] === type ? null : type
    }));
  };

  const handleRegenerateMessage = (idx) => {
    if (!activeChatId) return;
    ttsService.stop();
    setSpeakingIdx(null);
    useChatStore.getState().regenerateFromMessage(activeChatId, idx);
  };

  if (!activeChat || activeChat.messages.length === 0) return null;

  return (
    <div className="chat-thread">
      {activeChat.messages.map((msg, idx) => {
        const isUser = msg.role === 'user';
        const previousUserPrompt = activeChat.messages
          .slice(0, idx)
          .reverse()
          .find(m => m.role === 'user')?.content || '';

        const isImageGenMsg = Boolean(
          useChatStore.getState().hasImageGenActive ||
          isImageGenerationIntent(previousUserPrompt) ||
          previousUserPrompt.toLowerCase().includes('convert this image') ||
          previousUserPrompt.toLowerCase().includes('oil painting') ||
          previousUserPrompt.toLowerCase().includes('watercolor') ||
          previousUserPrompt.toLowerCase().includes('pixel art') ||
          previousUserPrompt.toLowerCase().includes('pencil sketch') ||
          previousUserPrompt.toLowerCase().includes('anime') ||
          previousUserPrompt.toLowerCase().includes('pop art')
        );

        const isPureImage = Boolean(
          msg.content &&
          msg.content.trim().startsWith('![') &&
          msg.content.trim().endsWith(')') &&
          !msg.content.trim().includes('\n\n')
        );

        const messageId = msg.id || `msg-${idx}`;
        const isEditingThis = isUser && editingMsgId === messageId && editingChatId === activeChatId;

        return (
          <div key={messageId} className={`message-wrapper ${isUser ? 'user' : 'ai'} ${isEditingThis ? 'is-editing' : ''}`}>
            <div className="message-avatar">
              {isUser ? (
                <UserAvatar user={user} />
              ) : (
                <Bot size={18} />
              )}
            </div>

            <div className="message-content">
              <div className={`message-bubble ${isPureImage ? 'pure-image-bubble' : ''}`}>
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="message-attachments">
                    {msg.attachments.map((file, fIdx) => (
                      <div key={fIdx} className="message-attachment-wrapper">
                        <img
                          src={`data:${file.type};base64,${file.data}`}
                          alt="attachment"
                          className="message-attachment-img"
                          onClick={() => handleDownloadImage(`data:${file.type};base64,${file.data}`)}
                        />
                        <button
                          className="img-download-btn"
                          onClick={() => handleDownloadImage(`data:${file.type};base64,${file.data}`)}
                          title="Save image"
                        >
                          <Download size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {isUser ? (
                  isEditingThis ? (
                    <div className="user-message-edit-container">
                      <textarea
                        ref={editTextareaRef}
                        className="user-message-edit-textarea"
                        value={editText}
                        onChange={(e) => {
                          setEditText(e.target.value);
                          if (editError) setEditError(null);
                          e.target.style.height = 'auto';
                          e.target.style.height = `${Math.min(e.target.scrollHeight, 320)}px`;
                        }}
                        onKeyDown={(e) => handleEditKeyDown(e, messageId, msg.content)}
                        rows={Math.max(2, Math.min(8, (editText.match(/\n/g) || []).length + 1))}
                        aria-label="Edit message"
                        placeholder="Type your message..."
                      />
                      {editError && (
                        <div className="user-message-edit-error" role="alert">
                          {editError}
                        </div>
                      )}
                      <div className="user-message-edit-actions">
                        <button
                          type="button"
                          className="user-edit-btn cancel"
                          onClick={handleCancelEdit}
                          disabled={isSubmittingEdit}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="user-edit-btn submit"
                          onClick={() => handleSubmitEdit(messageId, msg.content)}
                          disabled={isSubmittingEdit || !editText.trim()}
                        >
                          {isSubmittingEdit ? 'Saving...' : 'Send'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="user-message-text">{msg.content}</div>
                  )
                ) : (
                  msg.content ? (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      urlTransform={(url) => (url.startsWith('data:image/') || url.startsWith('http://') || url.startsWith('https://') ? url : defaultUrlTransform(url))}
                      components={{
                        p: ({ children, node, ...props }) => {
                          const hasBlockChild = Boolean(
                            node?.children?.some((child) => child.tagName === 'img') ||
                            React.Children.toArray(children).some(
                              (child) => React.isValidElement(child) && (child.type === GeneratedImageCard || child.type === 'div')
                            )
                          );

                          if (hasBlockChild) {
                            return <div className="message-paragraph" {...props}>{children}</div>;
                          }

                          return <p {...props}>{children}</p>;
                        },
                        pre: ({ children }) => <>{children}</>,
                        code: ({ className, children, ...props }) => {
                          const match = /language-(\w+)/.exec(className || '');
                          const codeString = String(children || '').replace(/\n$/, '');
                          const isMultiLine = codeString.includes('\n');

                          if (match || isMultiLine) {
                            return (
                              <CodeBlock
                                language={match ? match[1] : ''}
                                code={codeString}
                                fullMessageContent={msg.content}
                              />
                            );
                          }

                          return (
                            <code className="inline-code" {...props}>
                              {children}
                            </code>
                          );
                        },
                        img: ({ src, alt }) => (
                          <GeneratedImageCard
                            src={src}
                            alt={alt}
                            promptText={previousUserPrompt || alt}
                          />
                        ),
                        table: ({ children }) => (
                          <div className="table-responsive-container">
                            <table className="markdown-table">{children}</table>
                          </div>
                        )
                      }}
                    >
                      {typeof msg.content === 'string'
                        ? msg.content.replace(/!\[([^\]]*)\]\s+\((https?:\/\/[^\s)]+)\)/g, '![$1]($2)')
                        : msg.content}
                    </ReactMarkdown>
                  ) : (
                    isImageGenMsg ? (
                      <ImagePlaceholderCard status="generating" />
                    ) : (
                      <ThinkingIndicator
                        key={`thinking-${idx}`}
                        isImageGen={false}
                      />
                    )
                  )
                )}
              </div>

              {isUser && !isEditingThis && (
                <div className="user-message-actions-toolbar" role="toolbar" aria-label="User message options">
                  <button
                    type="button"
                    className={`msg-action-btn ${copiedUserIdx === idx ? 'active' : ''}`}
                    onClick={() => handleCopyUserMessage(idx, msg.content)}
                    title={copiedUserIdx === idx ? 'Copied to clipboard' : 'Copy message'}
                    aria-label="Copy message"
                  >
                    {copiedUserIdx === idx ? <Check size={14} color="#10B981" /> : <Copy size={14} />}
                  </button>
                  <button
                    type="button"
                    className="msg-action-btn"
                    onClick={() => handleStartEdit(messageId, msg.content)}
                    title="Edit message"
                    aria-label="Edit message"
                  >
                    <Pencil size={14} />
                  </button>
                </div>
              )}

              {!isUser && msg.content && !isPureImage && (
                <div className="message-actions-toolbar" role="toolbar" aria-label="Message options">
                  <button
                    type="button"
                    className={`msg-action-btn ${copiedIdx === idx ? 'active' : ''}`}
                    onClick={() => handleCopyMessage(idx, msg.content)}
                    title={copiedIdx === idx ? 'Copied to clipboard' : 'Copy'}
                    aria-label="Copy message"
                  >
                    {copiedIdx === idx ? <Check size={14} color="#10B981" /> : <Copy size={14} />}
                  </button>

                  <button
                    type="button"
                    className={`msg-action-btn ${speakingIdx === idx ? 'active speaking' : ''} ${loadingTTSIdx === idx ? 'active loading-audio' : ''}`}
                    onClick={() => handleToggleSpeakMessage(idx, msg.content)}
                    title={speakingIdx === idx ? 'Stop listening' : loadingTTSIdx === idx ? 'Synthesizing voice...' : 'Read aloud'}
                    aria-label="Read aloud"
                  >
                    {speakingIdx === idx ? (
                      <VolumeX size={14} />
                    ) : loadingTTSIdx === idx ? (
                      <Loader2 size={14} className="tts-spinner" />
                    ) : (
                      <Volume2 size={14} />
                    )}
                  </button>

                  <button
                    type="button"
                    className="msg-action-btn"
                    onClick={() => setIsVoiceModalOpen(true)}
                    title={`Voice model (${currentVoice.name})`}
                    aria-label={`Select AI voice model. Currently using ${currentVoice.name}`}
                  >
                    <Speech size={14} />
                  </button>

                  <button
                    type="button"
                    className={`msg-action-btn ${sharedIdx === idx ? 'active' : ''}`}
                    onClick={() => handleShareMessage(idx, msg.content)}
                    title={sharedIdx === idx ? 'Link Copied!' : 'Share message'}
                    aria-label="Share message"
                  >
                    <Share2 size={14} />
                  </button>

                  <button
                    type="button"
                    className={`msg-action-btn ${feedbackMap[idx] === 'like' ? 'active liked' : ''}`}
                    onClick={() => handleToggleFeedback(idx, 'like')}
                    title="Good response"
                    aria-label="Thumbs up"
                  >
                    <ThumbsUp size={14} />
                  </button>

                  <button
                    type="button"
                    className={`msg-action-btn ${feedbackMap[idx] === 'dislike' ? 'active disliked' : ''}`}
                    onClick={() => handleToggleFeedback(idx, 'dislike')}
                    title="Bad response"
                    aria-label="Thumbs down"
                  >
                    <ThumbsDown size={14} />
                  </button>

                  <button
                    type="button"
                    className="msg-action-btn"
                    onClick={() => handleRegenerateMessage(idx)}
                    title="Regenerate response"
                    aria-label="Regenerate response"
                  >
                    <RotateCw size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
      <div className="chat-bottom-spacer" />
      <div ref={messagesEndRef} />
      {isVoiceModalOpen && (
        <VoiceSelectionModal
          onClose={() => {
            setIsVoiceModalOpen(false);
            try {
              const updated = localStorage.getItem('sumanai_selected_voice_id') || DEFAULT_VOICE_ID;
              setActiveVoiceId(updated);
            } catch {
              void 0;
            }
          }}
          onVoiceSelected={(newId) => setActiveVoiceId(newId)}
        />
      )}
    </div>
  );
};

export default ChatThread;
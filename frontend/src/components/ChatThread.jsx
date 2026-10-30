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
  Loader2
} from 'lucide-react';
import ReactMarkdown, { defaultUrlTransform } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useChatStore } from '../store/useChatStore';
import { useAuthStore } from '../store/useAuthStore';
import { downloadImage } from '../utils/downloadUtils';
import { ttsService } from '../services/ttsService';
import CodeBlock from './CodeBlock';
import GeneratedImageCard from './GeneratedImageCard';
import ThinkingIndicator from './ThinkingIndicator';
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

const ChatThread = () => {
  const { chats, activeChatId } = useChatStore();
  const { user } = useAuthStore();
  
  const activeChat = chats.find(c => c.id === activeChatId);
  const messagesEndRef = useRef(null);
  const lastSpeakClickRef = useRef(0);
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [sharedIdx, setSharedIdx] = useState(null);
  const [speakingIdx, setSpeakingIdx] = useState(null);
  const [loadingTTSIdx, setLoadingTTSIdx] = useState(null);
  const [feedbackMap, setFeedbackMap] = useState({});

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
    return () => {
      ttsService.stop();
    };
  }, []);

  const handleCopyMessage = async (idx, text) => {
    if (!text || typeof navigator === 'undefined' || !navigator.clipboard) return;
    try {
      const cleanText = text.replace(/!\[.*?\]\(.*?\)/g, '').trim();
      await navigator.clipboard.writeText(cleanText || text);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2000);
    } catch {
      void 0;
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

  const handleRegenerateMessage = (prompt) => {
    if (!prompt) return;
    ttsService.stop();
    setSpeakingIdx(null);
    useChatStore.getState().startChatWithPrompt(prompt);
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

        return (
          <div key={idx} className={`message-wrapper ${isUser ? 'user' : 'ai'}`}>
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
                  msg.content
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
                      {msg.content}
                    </ReactMarkdown>
                  ) : (
                    <ThinkingIndicator
                      key={`thinking-${idx}`}
                      isImageGen={isImageGenMsg}
                    />
                  )
                )}
              </div>

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
                    onClick={() => handleRegenerateMessage(previousUserPrompt)}
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
    </div>
  );
};

export default ChatThread;
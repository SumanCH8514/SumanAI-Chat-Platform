import React, { useEffect, useRef } from 'react';
import { Bot, User, Download } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useChatStore } from '../store/useChatStore';
import { downloadImage } from '../utils/downloadUtils';
import Skeleton from './Skeleton';
import './ChatThread.css';

const ChatThread = () => {
  const { chats, activeChatId } = useChatStore();
  
  const activeChat = chats.find(c => c.id === activeChatId);
  const messagesEndRef = useRef(null);

  const handleDownloadImage = (src) => {
    downloadImage(src, 'SumanAI', 'jpg');
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeChat?.messages]);

  if (!activeChat || activeChat.messages.length === 0) return null;

  return (
    <div className="chat-thread">
      {activeChat.messages.map((msg, idx) => {
        const isUser = msg.role === 'user';
        return (
          <div key={idx} className={`message-wrapper ${isUser ? 'user' : 'ai'}`}>
            <div className="message-avatar">
              {isUser ? (
                <User size={18} />
              ) : (
                <Bot size={18} />
              )}
            </div>
            
            <div className="message-content">
              <div className="message-bubble">
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
                      components={{
                        img: ({ src, alt }) => (
                          <div className="message-img-wrapper">
                            <img 
                              src={src} 
                              alt={alt} 
                              onClick={() => handleDownloadImage(src)} 
                              className="chat-generated-img"
                            />
                            <button 
                              className="img-download-btn" 
                              onClick={() => handleDownloadImage(src)}
                              title="Save image"
                            >
                              <Download size={14} /> Save Image
                            </button>
                          </div>
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
                    <div className="ai-thinking-skeleton">
                      <Skeleton width="90%" height="12px" />
                      <Skeleton width="100%" height="12px" style={{ marginTop: '8px' }} />
                      <Skeleton width="70%" height="12px" style={{ marginTop: '8px' }} />
                    </div>
                  )
                )}
              </div>
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

import React, { useEffect, useRef } from 'react';
import { Bot, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useChatStore } from '../store/useChatStore';
import './ChatThread.css';

const ChatThread = () => {
  const { chats, activeChatId } = useChatStore();
  
  const activeChat = chats.find(c => c.id === activeChatId);
  const messagesEndRef = useRef(null);

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
                {/* Render Attachments (Images) if any */}
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="message-attachments">
                    {msg.attachments.map((file, fIdx) => (
                      <img 
                        key={fIdx} 
                        src={`data:${file.type};base64,${file.data}`} 
                        alt="attachment" 
                        className="message-attachment-img" 
                      />
                    ))}
                  </div>
                )}
                
                {isUser ? (
                  msg.content
                ) : (
                  msg.content ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.content}
                    </ReactMarkdown>
                  ) : (
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        );
      })}
      {/* Invisible element to auto-scroll to */}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatThread;

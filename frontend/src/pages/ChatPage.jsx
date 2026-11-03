import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import MainLayout from '../layouts/MainLayout';
import ChatThread from '../components/ChatThread';
import EmptyState from '../components/EmptyState';
import InputBar from '../components/InputBar';
import { useChatStore } from '../store/useChatStore';
import { useAuthStore } from '../store/useAuthStore';
import { getUserDisplayName } from '../utils/formatters';

export const ChatPage = ({ onSettingsClick, onLoginClick }) => {
  const { chatId } = useParams();
  const setActiveChat = useChatStore((state) => state.setActiveChat);
  const chats = useChatStore((state) => state.chats);
  const { user } = useAuthStore();

  useEffect(() => {
    if (chatId) {
      setActiveChat(chatId);
    } else {
      setActiveChat(null);
    }
    useChatStore.getState().setCanvasState({ isOpen: false });
  }, [chatId, setActiveChat]);

  const activeChat = chats.find((c) => c.id === chatId);
  const hasMessages = Boolean(activeChat && activeChat.messages.length > 0);
  const pageTitle = hasMessages
    ? `${activeChat.title} | SumanAI`
    : 'SumanAI Chat Platform | Smart AI - SumanOnline';

  const userName = getUserDisplayName(user);

  return (
    <MainLayout onSettingsClick={onSettingsClick} onLoginClick={onLoginClick}>
      <Helmet>
        <title>{pageTitle}</title>
        {!hasMessages && (
          <meta
            name="description"
            content="SumanAI is a smart multi-model AI chat platform featuring deep reasoning, code generation, vision chat, and AI image creation. Fast, free, private, and secure."
          />
        )}
      </Helmet>
      <div className={`chat-viewport ${hasMessages ? 'has-chat' : 'is-empty'}`}>
        {hasMessages ? <ChatThread /> : <EmptyState userName={userName} />}
        <InputBar key={chatId || 'active'} isCentered={!hasMessages} />
      </div>
    </MainLayout>
  );
};

export default ChatPage;

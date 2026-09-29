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
  }, [chatId, setActiveChat]);

  const activeChat = chats.find((c) => c.id === chatId);
  const hasMessages = activeChat && activeChat.messages.length > 0;
  const pageTitle = hasMessages
    ? `${activeChat.title} | SumanAI`
    : 'SumanAI Chat Platform | Smarter tools for a connected world';

  const userName = getUserDisplayName(user);

  return (
    <MainLayout onSettingsClick={onSettingsClick} onLoginClick={onLoginClick}>
      <Helmet>
        <title>{pageTitle}</title>
      </Helmet>
      {hasMessages ? <ChatThread /> : <EmptyState userName={userName} />}
      <InputBar key={chatId || 'new'} />
    </MainLayout>
  );
};

export default ChatPage;

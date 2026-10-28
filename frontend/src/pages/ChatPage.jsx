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
import { parseArtifact } from '../utils/artifactUtils';

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

  useEffect(() => {
    if (!activeChat || !activeChat.messages || activeChat.messages.length === 0) return;
    const assistantMessages = activeChat.messages.filter(m => m.role === 'assistant' && m.content);
    if (assistantMessages.length === 0) return;
    const latestAssistantMsg = assistantMessages[assistantMessages.length - 1];
    const artifact = parseArtifact(latestAssistantMsg.content);
    if (artifact && artifact.isWeb) {
      const currentCanvas = useChatStore.getState().canvas;
      const isContentDifferent = currentCanvas.content !== artifact.content || currentCanvas.previewHtml !== artifact.previewHtml;
      const isMissingCss = !currentCanvas.previewHtml || (!currentCanvas.previewHtml.includes('<style>') && artifact.previewHtml.includes('<style>'));
      const hasDifferentFiles = !currentCanvas.files || (artifact.files && currentCanvas.files.length !== artifact.files.length);
      if (!currentCanvas.isOpen || isContentDifferent || isMissingCss || hasDifferentFiles) {
        useChatStore.getState().setCanvasState({
          isOpen: true,
          content: artifact.content,
          previewHtml: artifact.previewHtml,
          files: artifact.files,
          language: 'html',
          title: "Generated Artifact"
        });
      }
    }
  }, [activeChat]);
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

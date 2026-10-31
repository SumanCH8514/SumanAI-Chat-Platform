import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

const createMockChatStore = (initialChats = []) => {
  let state = {
    chats: initialChats,
    activeChatId: initialChats[0]?.id || null,
    isPendingGeneration: false,
    pendingOptions: {},
    isGenerating: false,
    abortCallCount: 0
  };

  const get = () => state;
  const set = (updater) => {
    const next = typeof updater === 'function' ? updater(state) : updater;
    state = { ...state, ...next };
  };

  const abortCurrentGeneration = () => {
    state.abortCallCount += 1;
    state.isGenerating = false;
  };

  const addMessage = (chatId, message) => {
    set((s) => {
      const updatedChats = s.chats.map((chat) => {
        if (chat.id === chatId) {
          const isFirstUserMessage = chat.messages.length === 0 && message.role === 'user';
          const title = isFirstUserMessage
            ? message.content.slice(0, 30) + (message.content.length > 30 ? '...' : '')
            : chat.title;

          const messageWithId = {
            id: message.id || `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            createdAt: message.createdAt || Date.now(),
            ...message
          };

          return {
            ...chat,
            title,
            messages: [...chat.messages, messageWithId]
          };
        }
        return chat;
      });
      return { chats: updatedChats };
    });
  };

  const editUserMessage = (chatId, messageIdOrIndex, newContent) => {
    const cleanContent = typeof newContent === 'string' ? newContent.trim() : '';
    if (!cleanContent) return false;

    abortCurrentGeneration();

    let didUpdate = false;
    set((s) => {
      const updatedChats = s.chats.map((chat) => {
        if (chat.id !== chatId) return chat;

        let targetIdx = -1;
        if (typeof messageIdOrIndex === 'string') {
          targetIdx = chat.messages.findIndex((m) => m.id === messageIdOrIndex);
        }
        if (targetIdx === -1 && typeof messageIdOrIndex === 'number') {
          targetIdx = messageIdOrIndex;
        } else if (targetIdx === -1 && typeof messageIdOrIndex === 'string' && messageIdOrIndex.startsWith('msg-')) {
          const parsed = parseInt(messageIdOrIndex.replace('msg-', ''), 10);
          if (!isNaN(parsed) && parsed >= 0 && parsed < chat.messages.length) {
            targetIdx = parsed;
          }
        }

        if (targetIdx === -1 || targetIdx >= chat.messages.length) return chat;

        const originalMsg = chat.messages[targetIdx];
        if (originalMsg.role !== 'user') return chat;

        const updatedUserMessage = {
          ...originalMsg,
          id: originalMsg.id || `msg-${Date.now()}`,
          content: cleanContent,
          editedAt: Date.now()
        };

        const precedingMessages = chat.messages.slice(0, targetIdx);
        const newMessages = [...precedingMessages, updatedUserMessage];

        const isFirstUserMessage = targetIdx === 0 || !precedingMessages.some(m => m.role === 'user');
        const title = isFirstUserMessage
          ? cleanContent.slice(0, 30) + (cleanContent.length > 30 ? '...' : '')
          : chat.title;

        didUpdate = true;
        return {
          ...chat,
          title,
          messages: newMessages
        };
      });

      return {
        chats: updatedChats,
        isPendingGeneration: didUpdate ? true : s.isPendingGeneration,
        pendingOptions: didUpdate ? {} : s.pendingOptions
      };
    });

    return didUpdate;
  };

  const regenerateFromMessage = (chatId, messageIdOrIndex) => {
    abortCurrentGeneration();

    let didUpdate = false;
    set((s) => {
      const updatedChats = s.chats.map((chat) => {
        if (chat.id !== chatId) return chat;

        let targetIdx = -1;
        if (typeof messageIdOrIndex === 'string') {
          targetIdx = chat.messages.findIndex((m) => m.id === messageIdOrIndex);
        }
        if (targetIdx === -1 && typeof messageIdOrIndex === 'number') {
          targetIdx = messageIdOrIndex;
        } else if (targetIdx === -1 && typeof messageIdOrIndex === 'string' && messageIdOrIndex.startsWith('msg-')) {
          const parsed = parseInt(messageIdOrIndex.replace('msg-', ''), 10);
          if (!isNaN(parsed) && parsed >= 0 && parsed < chat.messages.length) {
            targetIdx = parsed;
          }
        }

        if (targetIdx === -1 || targetIdx >= chat.messages.length) return chat;

        let userMsgIdx = -1;
        if (chat.messages[targetIdx].role === 'user') {
          userMsgIdx = targetIdx;
        } else {
          for (let i = targetIdx - 1; i >= 0; i--) {
            if (chat.messages[i].role === 'user') {
              userMsgIdx = i;
              break;
            }
          }
        }

        if (userMsgIdx === -1) return chat;

        const newMessages = chat.messages.slice(0, userMsgIdx + 1);
        didUpdate = true;
        return {
          ...chat,
          messages: newMessages
        };
      });

      return {
        chats: updatedChats,
        isPendingGeneration: didUpdate ? true : s.isPendingGeneration,
        pendingOptions: didUpdate ? {} : s.pendingOptions
      };
    });

    return didUpdate;
  };

  return { get, set, addMessage, editUserMessage, regenerateFromMessage };
};

describe('Chat Message Edit & In-Place Regeneration', () => {
  it('updates first user message in place, rewrites title, slices old assistant response, and sets pending generation', () => {
    const store = createMockChatStore([
      {
        id: 'chat-1',
        title: 'Initial Question',
        messages: [
          { id: 'u-1', role: 'user', content: 'What is photosynthesis?' },
          { id: 'a-1', role: 'assistant', content: 'Photosynthesis is a process used by plants...' }
        ]
      }
    ]);

    const result = store.editUserMessage('chat-1', 'u-1', 'What is cellular respiration?');
    assert.strictEqual(result, true);

    const chat = store.get().chats[0];
    assert.strictEqual(chat.messages.length, 1);
    assert.strictEqual(chat.messages[0].id, 'u-1');
    assert.strictEqual(chat.messages[0].content, 'What is cellular respiration?');
    assert.strictEqual(chat.title, 'What is cellular respiration?');
    assert.strictEqual(store.get().isPendingGeneration, true);
    assert.strictEqual(store.get().abortCallCount, 1);
  });

  it('updates middle user message, preserves prior history, truncates downstream branch, and preserves attachments', () => {
    const store = createMockChatStore([
      {
        id: 'chat-2',
        title: 'Multi-turn Conversation',
        messages: [
          { id: 'u-1', role: 'user', content: 'Hello' },
          { id: 'a-1', role: 'assistant', content: 'Hi there! How can I help?' },
          {
            id: 'u-2',
            role: 'user',
            content: 'Analyze this chart',
            attachments: [{ name: 'chart.jpg', type: 'image/jpeg', data: 'base64sample' }]
          },
          { id: 'a-2', role: 'assistant', content: 'The chart shows upward trends.' },
          { id: 'u-3', role: 'user', content: 'Tell me more about Q3' },
          { id: 'a-3', role: 'assistant', content: 'Q3 experienced 15% growth.' }
        ]
      }
    ]);

    const result = store.editUserMessage('chat-2', 'u-2', 'Analyze this chart focusing on margins');
    assert.strictEqual(result, true);

    const chat = store.get().chats[0];
    assert.strictEqual(chat.messages.length, 3);
    assert.strictEqual(chat.messages[0].id, 'u-1');
    assert.strictEqual(chat.messages[1].id, 'a-1');
    assert.strictEqual(chat.messages[2].id, 'u-2');
    assert.strictEqual(chat.messages[2].content, 'Analyze this chart focusing on margins');
    assert.strictEqual(chat.messages[2].attachments.length, 1);
    assert.strictEqual(chat.messages[2].attachments[0].name, 'chart.jpg');
    assert.ok(chat.messages[2].editedAt);
    assert.strictEqual(store.get().isPendingGeneration, true);
  });

  it('rejects empty or whitespace-only edits without modifying conversation state', () => {
    const initialMessages = [
      { id: 'u-1', role: 'user', content: 'Valid prompt' },
      { id: 'a-1', role: 'assistant', content: 'Valid answer' }
    ];
    const store = createMockChatStore([
      {
        id: 'chat-3',
        title: 'Test',
        messages: [...initialMessages]
      }
    ]);

    const resultEmpty = store.editUserMessage('chat-3', 'u-1', '');
    assert.strictEqual(resultEmpty, false);
    assert.strictEqual(store.get().chats[0].messages.length, 2);
    assert.strictEqual(store.get().isPendingGeneration, false);

    const resultSpaces = store.editUserMessage('chat-3', 'u-1', '    \n\t  ');
    assert.strictEqual(resultSpaces, false);
    assert.strictEqual(store.get().chats[0].messages.length, 2);
  });

  it('supports legacy messages lacking explicit ID by falling back to array index or index-string', () => {
    const store = createMockChatStore([
      {
        id: 'chat-4',
        title: 'Legacy Chat',
        messages: [
          { role: 'user', content: 'Legacy question' },
          { role: 'assistant', content: 'Legacy response' }
        ]
      }
    ]);

    const result = store.editUserMessage('chat-4', 'msg-0', 'Updated legacy question');
    assert.strictEqual(result, true);

    const chat = store.get().chats[0];
    assert.strictEqual(chat.messages.length, 1);
    assert.strictEqual(chat.messages[0].content, 'Updated legacy question');
    assert.ok(chat.messages[0].id);
  });

  it('regenerates from assistant message by slicing back to associated user message', () => {
    const store = createMockChatStore([
      {
        id: 'chat-5',
        title: 'Regeneration Test',
        messages: [
          { id: 'u-1', role: 'user', content: 'First question' },
          { id: 'a-1', role: 'assistant', content: 'First answer' },
          { id: 'u-2', role: 'user', content: 'Second question' },
          { id: 'a-2', role: 'assistant', content: 'Failed answer' }
        ]
      }
    ]);

    const result = store.regenerateFromMessage('chat-5', 'a-2');
    assert.strictEqual(result, true);

    const chat = store.get().chats[0];
    assert.strictEqual(chat.messages.length, 3);
    assert.strictEqual(chat.messages[2].id, 'u-2');
    assert.strictEqual(store.get().isPendingGeneration, true);
  });

  it('assigns unique message ID and timestamp when messages are added', () => {
    const store = createMockChatStore([
      {
        id: 'chat-6',
        title: 'New Chat',
        messages: []
      }
    ]);

    store.addMessage('chat-6', { role: 'user', content: 'Hello assistant' });
    const msg = store.get().chats[0].messages[0];
    assert.ok(msg.id);
    assert.ok(msg.createdAt);
    assert.strictEqual(msg.content, 'Hello assistant');
  });
});


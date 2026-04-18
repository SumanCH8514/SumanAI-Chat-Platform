import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

export const useChatStore = create(
  persist(
    (set, get) => ({
      chats: [],
      activeChatId: null,
      isPendingGeneration: false, // Flag to trigger AI after home suggestions
      pendingOptions: {}, // Options (e.g., search) for the pending trigger
      canvas: {
        isOpen: false,
        content: '',
        language: '',
        title: '',
        lastUpdated: null,
      },

      setCanvasState: (updates) => {
        set((state) => ({
          canvas: { ...state.canvas, ...updates, lastUpdated: Date.now() }
        }));
      },

      toggleCanvas: () => {
        set((state) => ({
          canvas: { ...state.canvas, isOpen: !state.canvas.isOpen }
        }));
      },

      resetCanvas: () => {
        set({
          canvas: { isOpen: false, content: '', language: '', title: '', lastUpdated: null }
        });
      },

      // Initialize a new empty chat and set it as active
      createNewChat: () => {
        const id = uuidv4();
        set((state) => ({
          activeChatId: id,
          chats: [
            {
              id,
              title: 'New Chat',
              messages: [],
              createdAt: Date.now(),
              isPinned: false,
            },
            ...state.chats,
          ],
        }));
        return id;
      },

      // Starts a chat session with a specific prompt (useful for home suggestions)
      startChatWithPrompt: (prompt, options = {}) => {
        const { ensureActiveChat, addMessage } = get();
        const chatId = ensureActiveChat();
        addMessage(chatId, { role: 'user', content: prompt });
        set({ isPendingGeneration: true, pendingOptions: options });
      },

      // Set a specific chat as active
      setActiveChat: (id) => {
        set({ activeChatId: id });
      },

      // Ensure there's an active chat, creates one if null
      ensureActiveChat: () => {
        const { activeChatId, createNewChat } = get();
        if (!activeChatId) {
          return createNewChat();
        }
        return activeChatId;
      },

      // Add a message to the active chat
      addMessage: (chatId, message) => {
        set((state) => ({
          chats: state.chats.map((chat) => {
            if (chat.id === chatId) {
              // Auto-generate a title based on the first user message
              const isFirstUserMessage = chat.messages.length === 0 && message.role === 'user';
              const title = isFirstUserMessage 
                ? message.content.slice(0, 30) + (message.content.length > 30 ? '...' : '') 
                : chat.title;

              return {
                ...chat,
                title,
                messages: [...chat.messages, message],
              };
            }
            return chat;
          }),
        }));
      },

      // Update the last message (useful for streaming AI responses)
      updateLastMessage: (chatId, content) => {
        set((state) => ({
          chats: state.chats.map((chat) => {
            if (chat.id === chatId && chat.messages.length > 0) {
              const messages = [...chat.messages];
              messages[messages.length - 1] = {
                ...messages[messages.length - 1],
                content,
              };
              return { ...chat, messages };
            }
            return chat;
          }),
        }));
      },
      
      // Rename a chat
      renameChat: (id, newTitle) => {
        set((state) => ({
          chats: state.chats.map((c) =>
            c.id === id ? { ...c, title: newTitle } : c
          ),
        }));
      },

      // Toggle chat pinned status
      togglePinChat: (id) => {
        set((state) => ({
          chats: state.chats.map((c) =>
            c.id === id ? { ...c, isPinned: !c.isPinned } : c
          ),
        }));
      },
      
      // Delete a chat completely
      deleteChat: (id) => {
        set((state) => {
          const filtered = state.chats.filter(c => c.id !== id);
          return {
            chats: filtered,
            activeChatId: state.activeChatId === id ? (filtered[0]?.id || null) : state.activeChatId
          };
        });
      },

      // Clears all chats
      clearAll: () => set({ chats: [], activeChatId: null }),
    }),
    {
      name: 'sumanai-chat-storage', // localStorage key
    }
  )
);

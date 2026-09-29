import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { firestoreService } from '../services/firestoreService';
import { getFirebaseAuth } from '../services/firebase';

const getUserId = () => getFirebaseAuth()?.currentUser?.uid;

export const useChatStore = create(
  persist(
    (set, get) => ({
      chats: [],
      activeChatId: null,
      isSyncing: false,
      isPendingGeneration: false,
      pendingOptions: {},
      hasAttachments: false,
      hasImageGenActive: false,
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

      setHasAttachments: (val) => set({ hasAttachments: val }),
      setHasImageGenActive: (val) => set({ hasImageGenActive: val }),

      createNewChat: () => {
        const id = uuidv4();
        const newChat = {
          id,
          title: 'New Chat',
          messages: [],
          createdAt: Date.now(),
          isPinned: false,
        };
        set((state) => ({
          activeChatId: id,
          chats: [newChat, ...state.chats],
        }));
        
        const userId = getUserId();
        if (userId) firestoreService.saveChat(userId, newChat);
        
        return id;
      },

      startChatWithPrompt: (prompt, options = {}) => {
        const { ensureActiveChat, addMessage } = get();
        const chatId = ensureActiveChat();
        addMessage(chatId, { role: 'user', content: prompt });
        set({ isPendingGeneration: true, pendingOptions: options });
      },

      setActiveChat: (id) => {
        set({ activeChatId: id });
      },

      ensureActiveChat: () => {
        const { activeChatId, createNewChat } = get();
        if (!activeChatId) {
          return createNewChat();
        }
        return activeChatId;
      },

      addMessage: (chatId, message) => {
        set((state) => {
          const updatedChats = state.chats.map((chat) => {
            if (chat.id === chatId) {
              const isFirstUserMessage = chat.messages.length === 0 && message.role === 'user';
              const title = isFirstUserMessage 
                ? message.content.slice(0, 30) + (message.content.length > 30 ? '...' : '') 
                : chat.title;

              const updatedChat = {
                ...chat,
                title,
                messages: [...chat.messages, message],
              };
              
              const userId = getUserId();
              if (userId) firestoreService.saveChat(userId, updatedChat);
              
              return updatedChat;
            }
            return chat;
          });
          return { chats: updatedChats };
        });
      },

      updateLastMessage: (chatId, content) => {
        set((state) => {
          const updatedChats = state.chats.map((chat) => {
            if (chat.id === chatId && chat.messages.length > 0) {
              const messages = [...chat.messages];
              messages[messages.length - 1] = {
                ...messages[messages.length - 1],
                content,
              };
              const updatedChat = { ...chat, messages };
              
              const userId = getUserId();
              if (userId) firestoreService.saveChat(userId, updatedChat);
              
              return updatedChat;
            }
            return chat;
          });
          return { chats: updatedChats };
        });
      },
      
      renameChat: (id, newTitle) => {
        const cleanTitle = typeof newTitle === 'string' ? newTitle.trim() : '';
        if (!cleanTitle) return;

        set((state) => {
          const updatedChats = state.chats.map((c) =>
            c.id === id ? { ...c, title: cleanTitle } : c
          );
          
          const chat = updatedChats.find(c => c.id === id);
          const userId = getUserId();
          if (userId && chat) firestoreService.saveChat(userId, chat);
          
          return { chats: updatedChats };
        });
      },

      togglePinChat: (id) => {
        set((state) => {
          const updatedChats = state.chats.map((c) =>
            c.id === id ? { ...c, isPinned: !c.isPinned } : c
          );
          
          const chat = updatedChats.find(c => c.id === id);
          const userId = getUserId();
          if (userId && chat) firestoreService.saveChat(userId, chat);
          
          return { chats: updatedChats };
        });
      },
      
      deleteChat: (id) => {
        set((state) => {
          const filtered = state.chats.filter(c => c.id !== id);
          
          const userId = getUserId();
          if (userId) firestoreService.deleteChat(userId, id);
          
          return {
            chats: filtered,
            activeChatId: state.activeChatId === id ? (filtered[0]?.id || null) : state.activeChatId
          };
        });
      },

      syncChats: async () => {
        const userId = getUserId();
        if (!userId) return;
        set({ isSyncing: true });
        try {
          const firestoreChats = await firestoreService.loadChats(userId);
          if (firestoreChats.length > 0) {
            set({ chats: firestoreChats });
          }
        } catch (error) {
          console.error("Sync error:", error);
        } finally {
          set({ isSyncing: false });
        }
      },

      clearAll: () => {
        set({ chats: [], activeChatId: null });
      },
    }),
    {
      name: 'sumanai-chat-storage',
    }
  )
);

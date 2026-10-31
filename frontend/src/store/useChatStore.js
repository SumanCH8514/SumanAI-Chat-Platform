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

      replaceImageUrl: (oldUrl, newUrl) => {
        if (!oldUrl || !newUrl || oldUrl === newUrl) return;
        set((state) => {
          let hasGlobalChange = false;
          const updatedChats = state.chats.map((chat) => {
            let chatChanged = false;
            const updatedMessages = (chat.messages || []).map((msg) => {
              if (typeof msg.content === 'string' && msg.content.includes(oldUrl)) {
                chatChanged = true;
                return {
                  ...msg,
                  content: msg.content.split(oldUrl).join(newUrl)
                };
              }
              return msg;
            });

            if (chatChanged) {
              hasGlobalChange = true;
              const updatedChat = {
                ...chat,
                messages: updatedMessages
              };
              const userId = getUserId();
              if (userId) firestoreService.saveChat(userId, updatedChat);
              return updatedChat;
            }
            return chat;
          });

          return hasGlobalChange ? { chats: updatedChats } : state;
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
      
      updateLastMessageModel: (chatId, model) => {
        if (!model) return;
        set((state) => {
          const updatedChats = state.chats.map((chat) => {
            if (chat.id === chatId && chat.messages.length > 0) {
              const messages = [...chat.messages];
              const lastIdx = messages.length - 1;
              messages[lastIdx] = {
                ...messages[lastIdx],
                model,
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

      editUserMessage: (chatId, messageIdOrIndex, newContent) => {
        const cleanContent = typeof newContent === 'string' ? newContent.trim() : '';
        if (!cleanContent) return false;

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
            if (chat.messages[targetIdx].role !== 'user') return chat;

            const existingMsg = chat.messages[targetIdx];
            const updatedUserMsg = {
              ...existingMsg,
              content: cleanContent
            };

            const newMessages = [...chat.messages.slice(0, targetIdx), updatedUserMsg];
            const updatedTitle = targetIdx === 0
              ? cleanContent.slice(0, 30) + (cleanContent.length > 30 ? '...' : '')
              : chat.title;

            didUpdate = true;
            const updatedChat = {
              ...chat,
              title: updatedTitle,
              messages: newMessages
            };
            const userId = getUserId();
            if (userId) firestoreService.saveChat(userId, updatedChat);
            return updatedChat;
          });

          return {
            chats: updatedChats,
            isPendingGeneration: didUpdate ? true : s.isPendingGeneration,
            pendingOptions: didUpdate ? {} : s.pendingOptions
          };
        });

        return didUpdate;
      },

      regenerateFromMessage: (chatId, messageIdOrIndex) => {
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
            const updatedChat = {
              ...chat,
              messages: newMessages
            };
            const userId = getUserId();
            if (userId) firestoreService.saveChat(userId, updatedChat);
            return updatedChat;
          });

          return {
            chats: updatedChats,
            isPendingGeneration: didUpdate ? true : s.isPendingGeneration,
            pendingOptions: didUpdate ? {} : s.pendingOptions
          };
        });

        return didUpdate;
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

      removeImageFromChat: (chatId, imgUrl) => {
        if (!imgUrl) return;
        set((state) => {
          const updatedChats = state.chats.map((chat) => {
            if (chatId && chat.id !== chatId) return chat;

            let chatChanged = false;
            const updatedMessages = (chat.messages || []).map((msg) => {
              let msgChanged = false;
              let newAttachments = msg.attachments;
              if (Array.isArray(msg.attachments)) {
                newAttachments = msg.attachments.filter((att) => {
                  const match = att.url === imgUrl || (att.data && imgUrl.includes(att.data));
                  if (match) msgChanged = true;
                  return !match;
                });
              }

              let newContent = msg.content;
              if (typeof msg.content === 'string' && msg.content.includes(imgUrl)) {
                const escapedUrl = imgUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const regex = new RegExp(`!\\[[^\\]]*\\]\\(${escapedUrl}\\)`, 'g');
                newContent = msg.content.replace(regex, '').trim();
                msgChanged = true;
              }

              if (msgChanged) {
                chatChanged = true;
                return {
                  ...msg,
                  content: newContent,
                  attachments: newAttachments
                };
              }
              return msg;
            }).filter((m) => m.content || (m.attachments && m.attachments.length > 0) || m.role === 'user');

            if (chatChanged) {
              const updatedChat = {
                ...chat,
                messages: updatedMessages
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

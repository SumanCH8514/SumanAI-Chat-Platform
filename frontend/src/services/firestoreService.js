import { getFirebaseDb } from './firebase';
import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  query,
  orderBy,
  deleteDoc,
  updateDoc
} from 'firebase/firestore';

const getDb = () => getFirebaseDb();

export const firestoreService = {
  setUserProfile: async (user) => {
    if (!user?.uid) return;
    const db = getDb();
    if (!db) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        lastLogin: Date.now()
      }, { merge: true });
    } catch (err) {
      void err;
    }
  },

  setDefaultRole: async (userId) => {
    if (!userId) return;
    const db = getDb();
    if (!db) return;
    try {
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, { role: 'user' }, { merge: true });
    } catch (err) {
      void err;
    }
  },

  updatePreferences: async (userId, preferences) => {
    if (!userId) return;
    const db = getDb();
    if (!db) return;
    try {
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, { preferences }, { merge: true });
    } catch (err) {
      void err;
    }
  },

  getUserProfile: async (userId) => {
    if (!userId) return null;
    const db = getDb();
    if (!db) return null;
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      return userSnap.exists() ? userSnap.data() : null;
    } catch (err) {
      void err;
      return null;
    }
  },

  saveChat: async (userId, chat) => {
    if (!userId || !chat?.id) return;
    const db = getDb();
    if (!db) return;
    try {
      const chatRef = doc(db, 'users', userId, 'chats', chat.id);
      await setDoc(chatRef, {
        ...chat,
        updatedAt: Date.now()
      });
    } catch (err) {
      void err;
    }
  },

  loadChats: async (userId) => {
    if (!userId) return [];
    const db = getDb();
    if (!db) return [];
    try {
      const chatsRef = collection(db, 'users', userId, 'chats');
      const q = query(chatsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data());
    } catch (err) {
      void err;
      return [];
    }
  },

  deleteChat: async (userId, chatId) => {
    if (!userId || !chatId) return;
    const db = getDb();
    if (!db) return;
    try {
      const chatRef = doc(db, 'users', userId, 'chats', chatId);
      await deleteDoc(chatRef);
    } catch (err) {
      void err;
    }
  },

  updateChatFields: async (userId, chatId, fields) => {
    if (!userId || !chatId) return;
    const db = getDb();
    if (!db) return;
    try {
      const chatRef = doc(db, 'users', userId, 'chats', chatId);
      await updateDoc(chatRef, fields);
    } catch (err) {
      void err;
    }
  }
};

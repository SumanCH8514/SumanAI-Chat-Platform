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
  },

  incrementUsage: async (userId, metric, dateKey) => {
    if (!userId) return;
    const db = getDb();
    if (!db) return;
    try {
      const usageRef = doc(db, 'users', userId, 'usage', dateKey);
      const snap = await getDoc(usageRef);
      const current = snap.exists() ? (snap.data()[metric] || 0) : 0;
      await setDoc(usageRef, { [metric]: current + 1, updatedAt: Date.now() }, { merge: true });
    } catch (err) {
      void err;
    }
  },

  updateUserProfile: async (userId, profileData) => {
    if (!userId) return;
    const db = getDb();
    try {
      localStorage.setItem(`sumanai_profile_${userId}`, JSON.stringify(profileData));
    } catch (err) {
      void err;
    }
    if (!db) return;
    try {
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, {
        phoneNumber: profileData.phoneNumber || '',
        countryCode: profileData.countryCode || '+91',
        address: profileData.address || {},
        preferredCurrency: profileData.preferredCurrency || 'INR',
        updatedAt: Date.now()
      }, { merge: true });
    } catch (err) {
      void err;
    }
  },

  updateWallet: async (userId, creditsDelta = 0, balanceDelta = 0) => {
    if (!userId) return null;
    let newCredits = 0;
    let newBalance = 0;
    const db = getDb();
    if (db) {
      try {
        const userRef = doc(db, 'users', userId);
        const snap = await getDoc(userRef);
        const existingData = snap.exists() ? snap.data() : {};
        newCredits = Math.max(0, (existingData.credits || 0) + creditsDelta);
        newBalance = Math.max(0, (existingData.walletBalance || 0) + balanceDelta);
        await setDoc(userRef, {
          credits: newCredits,
          walletBalance: newBalance,
          walletUpdatedAt: Date.now()
        }, { merge: true });
      } catch (err) {
        void err;
      }
    }
    try {
      const cached = JSON.parse(localStorage.getItem(`sumanai_wallet_${userId}`) || '{"credits":0,"walletBalance":0}');
      newCredits = Math.max(0, (cached.credits || 0) + creditsDelta);
      newBalance = Math.max(0, (cached.walletBalance || 0) + balanceDelta);
      localStorage.setItem(`sumanai_wallet_${userId}`, JSON.stringify({ credits: newCredits, walletBalance: newBalance }));
    } catch (err) {
      void err;
    }
    return { credits: newCredits, walletBalance: newBalance };
  },

  recordTransaction: async (userId, transaction) => {
    if (!userId || !transaction) return;
    const txnId = transaction.id || transaction.transactionId || `TXN_${Date.now()}`;
    const payload = {
      ...transaction,
      id: txnId,
      timestamp: transaction.timestamp || Date.now()
    };
    try {
      const localKey = `sumanai_txns_${userId}`;
      const existing = JSON.parse(localStorage.getItem(localKey) || '[]');
      localStorage.setItem(localKey, JSON.stringify([payload, ...existing.filter(t => t.id !== txnId)].slice(0, 50)));

      const adminExisting = JSON.parse(localStorage.getItem('sumanai_admin_txns') || '[]');
      localStorage.setItem('sumanai_admin_txns', JSON.stringify([payload, ...adminExisting.filter(t => t.id !== txnId)].slice(0, 100)));
      window.dispatchEvent(new CustomEvent('sumanai_txns_updated', { detail: payload }));
    } catch (err) {
      void err;
    }
    const db = getDb();
    if (!db) return;
    try {
      const txnRef = doc(db, 'users', userId, 'transactions', txnId);
      await setDoc(txnRef, payload);
      const globalTxnRef = doc(db, 'transactions', txnId);
      await setDoc(globalTxnRef, { ...payload, userId });
    } catch (err) {
      void err;
    }
  },

  getTransactions: async (userId) => {
    if (!userId) return [];
    let localTxns = [];
    try {
      localTxns = JSON.parse(localStorage.getItem(`sumanai_txns_${userId}`) || '[]');
    } catch (err) {
      void err;
    }
    const db = getDb();
    if (!db) return localTxns;
    try {
      const txnsRef = collection(db, 'users', userId, 'transactions');
      const q = query(txnsRef, orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(q);
      const firestoreTxns = querySnapshot.docs.map(d => d.data());
      if (firestoreTxns.length > 0) {
        return firestoreTxns;
      }
    } catch (err) {
      void err;
    }
    return localTxns;
  },

  activateProSubscription: async (userId, details = {}) => {
    if (!userId) return;
    const db = getDb();
    const durationDays = details.durationDays || 30;
    const expiresAt = Date.now() + durationDays * 24 * 60 * 60 * 1000;
    const updateData = {
      role: 'pro',
      plan: 'pro',
      proStartedAt: Date.now(),
      proExpiresAt: expiresAt,
      lastPaymentGateway: details.gateway || 'razorpay',
      lastTransactionId: details.transactionId || ''
    };
    try {
      localStorage.setItem(`sumanai_subscription_${userId}`, JSON.stringify(updateData));
    } catch (err) {
      void err;
    }
    if (!db) return updateData;
    try {
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, updateData, { merge: true });
    } catch (err) {
      void err;
    }
    return updateData;
  }
};

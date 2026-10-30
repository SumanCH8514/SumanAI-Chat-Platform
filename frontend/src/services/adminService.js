import { getFirebaseDb } from './firebase';
import { env } from '../config/env';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  collectionGroup,
  query,
  orderBy,
  getDocs,
  onSnapshot
} from 'firebase/firestore';

const DEFAULT_GOVERNANCE = {
  updatedAt: Date.now(),
  tiers: {
    guest: {
      maxSelectableModels: 1,
      allowedModelIds: ['qwen/qwen3.8-27b'],
      defaultModelId: 'qwen/qwen3.8-27b',
      imageGenLimit: 0,
      rateLimit: {
        requestsPerHour: 20,
        requestsPerDay: 50
      }
    },
    free: {
      maxSelectableModels: 17,
      allowedModelIds: [
        'meta/llama-3.2-11b-vision-instruct',
        'z-ai/glm-5.3',
        'z-ai/glm-5.3-flash',
        'moonshotai/kimi-k3',
        'google/gemma-4-31b-it',
        'google/diffusiongemma-26b-a4b-it',
        'meta/muse-glimmer-30b',
        'openai/gpt-oss-120b',
        'openai/gpt-oss-20b',
        'qwen/qwen3.8-27b',
        'canopylabs/orpheus-v1-english',
        '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
        '@cf/deepseek-ai/deepseek-r1-distill-qwen-32b',
        '@cf/qwen/qwen2.5-72b-instruct',
        '@cf/meta/llama-3.1-8b-instruct',
        '@cf/meta/llama-3.2-11b-vision-instruct',
        '@cf/black-forest-labs/flux-1-schnell'
      ],
      defaultModelId: 'openai/gpt-oss-120b',
      imageGenLimit: 5,
      rateLimit: {
        requestsPerHour: 100,
        requestsPerDay: 300
      }
    },
    pro: {
      maxSelectableModels: 25,
      allowedModelIds: [
        'meta/llama-3.2-11b-vision-instruct',
        'z-ai/glm-5.3',
        'z-ai/glm-5.3-flash',
        'moonshotai/kimi-k3',
        'google/gemma-4-31b-it',
        'google/diffusiongemma-26b-a4b-it',
        'meta/muse-glimmer-30b',
        'openai/gpt-oss-120b',
        'openai/gpt-oss-20b',
        'qwen/qwen3.8-27b',
        'canopylabs/orpheus-v1-english',
        '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
        '@cf/deepseek-ai/deepseek-r1-distill-qwen-32b',
        '@cf/qwen/qwen2.5-72b-instruct',
        '@cf/meta/llama-3.1-8b-instruct',
        '@cf/meta/llama-3.2-11b-vision-instruct',
        '@cf/black-forest-labs/flux-1-schnell'
      ],
      premiumModelIds: [
        '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
        '@cf/deepseek-ai/deepseek-r1-distill-qwen-32b',
        '@cf/qwen/qwen2.5-72b-instruct',
        '@cf/meta/llama-3.1-8b-instruct',
        '@cf/meta/llama-3.2-11b-vision-instruct',
        '@cf/black-forest-labs/flux-1-schnell'
      ],
      defaultModelId: '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
      imageGenLimit: -1,
      rateLimit: {
        requestsPerHour: 500,
        requestsPerDay: 2000
      }
    }
  },
  maintenance: {
    enabled: false,
    message: ''
  }
};

const deepMergeGovernance = (data) => {
  if (!data || typeof data !== 'object') return DEFAULT_GOVERNANCE;
  const tiers = data.tiers || {};
  return {
    ...DEFAULT_GOVERNANCE,
    ...data,
    tiers: {
      guest: {
        ...DEFAULT_GOVERNANCE.tiers.guest,
        ...(tiers.guest || {}),
        imageGenLimit: tiers.guest?.imageGenLimit ?? DEFAULT_GOVERNANCE.tiers.guest.imageGenLimit,
        rateLimit: {
          ...DEFAULT_GOVERNANCE.tiers.guest.rateLimit,
          ...(tiers.guest?.rateLimit || {})
        }
      },
      free: {
        ...DEFAULT_GOVERNANCE.tiers.free,
        ...(tiers.free || {}),
        imageGenLimit: tiers.free?.imageGenLimit ?? DEFAULT_GOVERNANCE.tiers.free.imageGenLimit,
        rateLimit: {
          ...DEFAULT_GOVERNANCE.tiers.free.rateLimit,
          ...(tiers.free?.rateLimit || {})
        }
      },
      pro: {
        ...DEFAULT_GOVERNANCE.tiers.pro,
        ...(tiers.pro || {}),
        imageGenLimit: tiers.pro?.imageGenLimit ?? DEFAULT_GOVERNANCE.tiers.pro.imageGenLimit,
        premiumModelIds: (Array.isArray(tiers.pro?.premiumModelIds) && tiers.pro.premiumModelIds.length > 0)
          ? tiers.pro.premiumModelIds
          : DEFAULT_GOVERNANCE.tiers.pro.premiumModelIds,
        rateLimit: {
          ...DEFAULT_GOVERNANCE.tiers.pro.rateLimit,
          ...(tiers.pro?.rateLimit || {})
        }
      }
    }
  };
};

export const adminService = {
  checkIsAdmin: (user) => {
    if (!user) return false;
    if (user.role === 'admin' || user.isAdmin === true) return true;
    return false;
  },

  checkHasProAccess: (user) => {
    if (!user) return false;
    if (user.role === 'admin' || user.isAdmin === true || user.role === 'pro') return true;
    return false;
  },

  verifyAdminToken: async (token) => {
    if (!token) return { isAdmin: false };
    try {
      const baseUrl = (env.WORKER_URL || '').replace(/\/+$/, '');
      const response = await fetch(`${baseUrl}/api/admin/verify`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) return { isAdmin: false };
      return await response.json();
    } catch {
      return { isAdmin: false };
    }
  },

  getGovernanceConfig: async () => {
    let cached = null;
    try {
      const stored = localStorage.getItem('sumanai_governance_config');
      if (stored) cached = deepMergeGovernance(JSON.parse(stored));
    } catch {
      cached = null;
    }

    const db = getFirebaseDb();
    if (!db) return cached || DEFAULT_GOVERNANCE;

    try {
      const configRef = doc(db, 'system', 'governance');
      const snap = await getDoc(configRef);
      if (snap.exists()) {
        const merged = deepMergeGovernance(snap.data());
        try {
          localStorage.setItem('sumanai_governance_config', JSON.stringify(merged));
        } catch {
          void 0;
        }
        return merged;
      }
      return cached || DEFAULT_GOVERNANCE;
    } catch {
      return cached || DEFAULT_GOVERNANCE;
    }
  },

  subscribeGovernance: (onUpdate) => {
    let currentConfig = null;
    try {
      const stored = localStorage.getItem('sumanai_governance_config');
      if (stored) {
        currentConfig = deepMergeGovernance(JSON.parse(stored));
        onUpdate(currentConfig);
      }
    } catch {
      currentConfig = null;
    }

    const handleCustomUpdate = (e) => {
      if (e?.detail) {
        currentConfig = deepMergeGovernance(e.detail);
        onUpdate(currentConfig);
      }
    };

    const handleStorageUpdate = (e) => {
      if (e.key === 'sumanai_governance_config' && e.newValue) {
        try {
          currentConfig = deepMergeGovernance(JSON.parse(e.newValue));
          onUpdate(currentConfig);
        } catch {
          void 0;
        }
      }
    };

    window.addEventListener('sumanai_governance_updated', handleCustomUpdate);
    window.addEventListener('storage', handleStorageUpdate);

    let unsubSnapshot = () => {};
    const db = getFirebaseDb();
    if (db) {
      try {
        const configRef = doc(db, 'system', 'governance');
        unsubSnapshot = onSnapshot(
          configRef,
          (snap) => {
            if (snap.exists()) {
              const merged = deepMergeGovernance(snap.data());
              try {
                localStorage.setItem('sumanai_governance_config', JSON.stringify(merged));
              } catch {
                void 0;
              }
              onUpdate(merged);
            } else if (!currentConfig) {
              onUpdate(DEFAULT_GOVERNANCE);
            }
          },
          () => {
            if (!currentConfig) onUpdate(DEFAULT_GOVERNANCE);
          }
        );
      } catch {
        if (!currentConfig) onUpdate(DEFAULT_GOVERNANCE);
      }
    } else if (!currentConfig) {
      onUpdate(DEFAULT_GOVERNANCE);
    }

    return () => {
      window.removeEventListener('sumanai_governance_updated', handleCustomUpdate);
      window.removeEventListener('storage', handleStorageUpdate);
      unsubSnapshot();
    };
  },

  saveGovernanceConfig: async (config) => {
    const payload = deepMergeGovernance({
      ...config,
      updatedAt: Date.now()
    });

    try {
      localStorage.setItem('sumanai_governance_config', JSON.stringify(payload));
      window.dispatchEvent(new CustomEvent('sumanai_governance_updated', { detail: payload }));
    } catch {
      void 0;
    }

    const db = getFirebaseDb();
    if (db) {
      const configRef = doc(db, 'system', 'governance');
      await setDoc(configRef, payload, { merge: true });
    }
    return payload;
  },

  getAllUsers: async () => {
    const db = getFirebaseDb();
    if (!db) return [];
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, orderBy('lastLogin', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch {
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    }
  },

  updateUserRole: async (userId, newRole) => {
    if (!userId || !newRole) throw new Error('User ID and role are required');
    const db = getFirebaseDb();
    if (!db) throw new Error('Database not initialized');
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      role: newRole,
      updatedAt: Date.now()
    });
  },

  deleteUser: async (userId) => {
    if (!userId) throw new Error('User ID is required');
    const db = getFirebaseDb();
    if (!db) throw new Error('Database not initialized');
    const userRef = doc(db, 'users', userId);
    await deleteDoc(userRef);
  },

  getPaymentGatewayConfig: async () => {
    const defaultGatewayConfig = {
      razorpay: { enabled: true, mode: 'test', keyId: '', keySecret: '', webhookSecret: '' },
      zaakpay: { enabled: true, mode: 'sandbox', merchantId: '', secretKey: '' },
      phonepe: { enabled: true, mode: 'uat', merchantId: '', saltKey: '', saltIndex: '1' },
      stripe: { enabled: true, mode: 'test', publishableKey: '', secretKey: '', webhookSecret: '' },
      paypal: { enabled: true, mode: 'sandbox', clientId: '', clientSecret: '' },
      updatedAt: Date.now()
    };
    try {
      const stored = localStorage.getItem('sumanai_payment_gateways');
      if (stored) return { ...defaultGatewayConfig, ...JSON.parse(stored) };
    } catch {
      void 0;
    }
    const db = getFirebaseDb();
    if (!db) return defaultGatewayConfig;
    try {
      const ref = doc(db, 'system', 'payment_gateways');
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        localStorage.setItem('sumanai_payment_gateways', JSON.stringify(data));
        return { ...defaultGatewayConfig, ...data };
      }
    } catch {
      void 0;
    }
    return defaultGatewayConfig;
  },

  savePaymentGatewayConfig: async (config) => {
    const payload = {
      ...config,
      updatedAt: Date.now()
    };
    try {
      localStorage.setItem('sumanai_payment_gateways', JSON.stringify(payload));
      window.dispatchEvent(new CustomEvent('sumanai_payment_gateways_updated', { detail: payload }));
    } catch {
      void 0;
    }
    const db = getFirebaseDb();
    if (db) {
      const ref = doc(db, 'system', 'payment_gateways');
      await setDoc(ref, payload, { merge: true });
    }
    return payload;
  },

  getAllPlatformTransactions: async () => {
    const txnMap = new Map();

    try {
      const adminTxns = JSON.parse(localStorage.getItem('sumanai_admin_txns') || '[]');
      if (Array.isArray(adminTxns)) {
        adminTxns.forEach(t => {
          const id = t?.id || t?.transactionId;
          if (id) txnMap.set(id, t);
        });
      }

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('sumanai_txns_')) {
          try {
            const userTxns = JSON.parse(localStorage.getItem(key) || '[]');
            if (Array.isArray(userTxns)) {
              userTxns.forEach(t => {
                const id = t?.id || t?.transactionId;
                if (id && !txnMap.has(id)) {
                  txnMap.set(id, t);
                }
              });
            }
          } catch {
            void 0;
          }
        }
      }
    } catch {
      void 0;
    }

    const db = getFirebaseDb();
    if (db) {
      try {
        const txnsRef = collection(db, 'transactions');
        const q = query(txnsRef, orderBy('timestamp', 'desc'));
        const snapshot = await getDocs(q);
        snapshot.docs.forEach(d => {
          const data = d.data();
          const id = d.id || data.id || data.transactionId;
          if (id) {
            txnMap.set(id, { ...data, id });
          }
        });
      } catch {
        void 0;
      }

      try {
        const cgRef = collectionGroup(db, 'transactions');
        const cgSnap = await getDocs(cgRef);
        cgSnap.docs.forEach(d => {
          const data = d.data();
          const id = d.id || data.id || data.transactionId;
          if (id) {
            txnMap.set(id, { ...data, id });
          }
        });
      } catch {
        void 0;
      }

      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        for (const uDoc of usersSnap.docs) {
          try {
            const userTxnSnap = await getDocs(collection(db, 'users', uDoc.id, 'transactions'));
            userTxnSnap.docs.forEach(d => {
              const data = d.data();
              const id = d.id || data.id || data.transactionId;
              if (id) {
                txnMap.set(id, { ...data, id, userId: data.userId || uDoc.id });
              }
            });
          } catch {
            void 0;
          }
        }
      } catch {
        void 0;
      }
    }

    const allTxns = Array.from(txnMap.values());
    allTxns.sort((a, b) => {
      const tA = typeof a.timestamp === 'number' ? a.timestamp : new Date(a.timestamp || 0).getTime();
      const tB = typeof b.timestamp === 'number' ? b.timestamp : new Date(b.timestamp || 0).getTime();
      return tB - tA;
    });

    try {
      localStorage.setItem('sumanai_admin_txns', JSON.stringify(allTxns));
    } catch {
      void 0;
    }

    return allTxns;
  }
};


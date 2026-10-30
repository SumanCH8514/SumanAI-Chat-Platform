import { getFirebaseDb } from './firebase';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy
} from 'firebase/firestore';
import { firestoreService } from './firestoreService';

const REFERRER_REWARD_CREDITS = 100;
const REFEREE_REWARD_CREDITS = 50;

export const referralService = {
  REFERRER_REWARD_CREDITS,
  REFEREE_REWARD_CREDITS,

  generateCodeFromUser: (user) => {
    if (!user) return 'REF-GUEST';
    const emailPrefix = (user.email || '').split('@')[0].replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 5);
    const uidPart = (user.uid || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 4);
    const base = emailPrefix.length >= 3 ? emailPrefix : 'SUMAN';
    const suffix = uidPart.length >= 3 ? uidPart : Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${base}-${suffix}`;
  },

  getOrGenerateReferralCode: async (user) => {
    if (!user?.uid) return null;

    let existingCode = user.referralCode;
    if (!existingCode) {
      try {
        const local = localStorage.getItem(`sumanai_ref_code_${user.uid}`);
        if (local) existingCode = local;
      } catch {
        void 0;
      }
    }

    const db = getFirebaseDb();
    if (!existingCode && db) {
      try {
        const userRef = doc(db, 'users', user.uid);
        const snap = await getDoc(userRef);
        if (snap.exists() && snap.data()?.referralCode) {
          existingCode = snap.data().referralCode;
        }
      } catch {
        void 0;
      }
    }

    if (!existingCode) {
      existingCode = referralService.generateCodeFromUser(user);
      try {
        localStorage.setItem(`sumanai_ref_code_${user.uid}`, existingCode);
        const registry = JSON.parse(localStorage.getItem('sumanai_referral_codes') || '{}');
        registry[existingCode] = {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || 'SumanAI Member'
        };
        localStorage.setItem('sumanai_referral_codes', JSON.stringify(registry));
      } catch {
        void 0;
      }

      if (db) {
        try {
          const userRef = doc(db, 'users', user.uid);
          await setDoc(userRef, {
            referralCode: existingCode,
            referralCount: user.referralCount || 0,
            referralCreditsEarned: user.referralCreditsEarned || 0,
            updatedAt: Date.now()
          }, { merge: true });
        } catch {
          void 0;
        }
      }
    } else {
      try {
        const registry = JSON.parse(localStorage.getItem('sumanai_referral_codes') || '{}');
        if (!registry[existingCode]) {
          registry[existingCode] = {
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || 'SumanAI Member'
          };
          localStorage.setItem('sumanai_referral_codes', JSON.stringify(registry));
        }
      } catch {
        void 0;
      }
    }

    return existingCode;
  },

  getReferralStats: async (userId) => {
    let localHistory = [];
    try {
      localHistory = JSON.parse(localStorage.getItem(`sumanai_referrals_${userId}`) || '[]');
    } catch {
      localHistory = [];
    }

    let firestoreHistory = [];
    const db = getFirebaseDb();
    if (db && userId) {
      try {
        const refLogs = collection(db, 'users', userId, 'referrals');
        const q = query(refLogs, orderBy('timestamp', 'desc'));
        const snap = await getDocs(q);
        firestoreHistory = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      } catch {
        try {
          const globalRef = collection(db, 'referrals');
          const q = query(globalRef, where('referrerId', '==', userId));
          const snap = await getDocs(q);
          firestoreHistory = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        } catch {
          void 0;
        }
      }
    }

    const mergedMap = new Map();
    localHistory.forEach(r => { if (r?.id) mergedMap.set(r.id, r); });
    firestoreHistory.forEach(r => { if (r?.id) mergedMap.set(r.id, r); });

    const history = Array.from(mergedMap.values());
    history.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    return {
      count: history.length,
      creditsEarned: history.length * REFERRER_REWARD_CREDITS,
      history
    };
  },

  findReferrerByCode: async (code) => {
    if (!code) return null;
    const cleanCode = code.trim().toUpperCase();

    try {
      const registry = JSON.parse(localStorage.getItem('sumanai_referral_codes') || '{}');
      if (registry[cleanCode]) {
        return registry[cleanCode];
      }
    } catch {
      void 0;
    }

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('sumanai_ref_code_')) {
        const storedCode = localStorage.getItem(key);
        if (storedCode && storedCode.trim().toUpperCase() === cleanCode) {
          const uid = key.replace('sumanai_ref_code_', '');
          return { uid, email: 'Registered Member', displayName: 'Friend' };
        }
      }
    }

    const db = getFirebaseDb();
    if (db) {
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('referralCode', '==', cleanCode));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const docData = snap.docs[0].data();
          return {
            uid: snap.docs[0].id,
            email: docData.email || '',
            displayName: docData.displayName || 'Friend'
          };
        }
      } catch {
        void 0;
      }
    }

    return null;
  },

  redeemReferralCode: async (currentUser, inputCode) => {
    if (!currentUser?.uid) {
      throw new Error('Please sign in to claim your referral credits.');
    }

    if (currentUser.isAnonymous) {
      throw new Error('Please sign in with a registered account to claim referral rewards.');
    }

    if (!inputCode || !inputCode.trim()) {
      throw new Error('Please enter a valid referral code.');
    }

    const cleanCode = inputCode.trim().toUpperCase();

    let userProfile = null;
    try {
      userProfile = JSON.parse(localStorage.getItem(`sumanai_profile_${currentUser.uid}`) || '{}');
    } catch {
      userProfile = {};
    }

    if (currentUser.hasRedeemedReferral || userProfile.hasRedeemedReferral) {
      throw new Error('You have already claimed a referral bonus. Referral codes can only be redeemed once.');
    }

    let myOwnCode = currentUser.referralCode || localStorage.getItem(`sumanai_ref_code_${currentUser.uid}`);
    if (!myOwnCode) {
      myOwnCode = referralService.generateCodeFromUser(currentUser);
    }
    if (myOwnCode && myOwnCode.trim().toUpperCase() === cleanCode) {
      throw new Error('You cannot redeem your own referral code.');
    }

    const referrer = await referralService.findReferrerByCode(cleanCode);
    if (!referrer || !referrer.uid) {
      throw new Error('Invalid referral code. Please check the code and try again.');
    }

    if (referrer.uid === currentUser.uid) {
      throw new Error('You cannot redeem your own referral code.');
    }

    const refereeTxnId = `TXN_REF_CLAIM_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const refereeTxn = {
      id: refereeTxnId,
      purpose: 'referral_bonus',
      title: `Referral Welcome Bonus (Code: ${cleanCode})`,
      credits: REFEREE_REWARD_CREDITS,
      amount: 0,
      currency: 'INR',
      gateway: 'referral',
      status: 'Completed',
      timestamp: Date.now(),
      email: currentUser.email || 'Friend',
      phoneNumber: currentUser.phoneNumber || ''
    };

    const updatedRefereeWallet = await firestoreService.updateWallet(currentUser.uid, REFEREE_REWARD_CREDITS, 0);
    await firestoreService.recordTransaction(currentUser.uid, refereeTxn);

    const refereeProfileUpdate = {
      hasRedeemedReferral: true,
      referredBy: cleanCode,
      referredByUid: referrer.uid,
      redeemedAt: Date.now()
    };
    await firestoreService.updateUserProfile(currentUser.uid, refereeProfileUpdate);

    const referrerTxnId = `TXN_REF_EARN_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const referrerTxn = {
      id: referrerTxnId,
      purpose: 'referral_reward',
      title: `Referral Reward: Friend Joined (+${REFERRER_REWARD_CREDITS} Credits)`,
      credits: REFERRER_REWARD_CREDITS,
      amount: 0,
      currency: 'INR',
      gateway: 'referral',
      status: 'Completed',
      timestamp: Date.now(),
      email: referrer.email || 'Referrer',
      phoneNumber: ''
    };

    await firestoreService.updateWallet(referrer.uid, REFERRER_REWARD_CREDITS, 0);
    await firestoreService.recordTransaction(referrer.uid, referrerTxn);

    const referralLogId = `REF_LOG_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const referralRecord = {
      id: referralLogId,
      referrerId: referrer.uid,
      referrerEmail: referrer.email || 'Friend',
      refereeId: currentUser.uid,
      refereeEmail: currentUser.email || 'Friend',
      refereeName: currentUser.displayName || 'New Member',
      referralCode: cleanCode,
      referrerReward: REFERRER_REWARD_CREDITS,
      refereeReward: REFEREE_REWARD_CREDITS,
      status: 'Completed',
      timestamp: Date.now()
    };

    try {
      const referrerLogs = JSON.parse(localStorage.getItem(`sumanai_referrals_${referrer.uid}`) || '[]');
      localStorage.setItem(`sumanai_referrals_${referrer.uid}`, JSON.stringify([referralRecord, ...referrerLogs]));
      localStorage.removeItem('sumanai_pending_ref_code');
    } catch {
      void 0;
    }

    const db = getFirebaseDb();
    if (db) {
      try {
        const refDocRef = doc(db, 'referrals', referralLogId);
        await setDoc(refDocRef, referralRecord);

        const referrerSubRef = doc(db, 'users', referrer.uid, 'referrals', referralLogId);
        await setDoc(referrerSubRef, referralRecord);

        const referrerUserRef = doc(db, 'users', referrer.uid);
        const referrerSnap = await getDoc(referrerUserRef);
        const currentCount = referrerSnap.exists() ? (referrerSnap.data().referralCount || 0) : 0;
        const currentCredits = referrerSnap.exists() ? (referrerSnap.data().referralCreditsEarned || 0) : 0;
        await updateDoc(referrerUserRef, {
          referralCount: currentCount + 1,
          referralCreditsEarned: currentCredits + REFERRER_REWARD_CREDITS,
          updatedAt: Date.now()
        });
      } catch {
        void 0;
      }
    }

    window.dispatchEvent(new CustomEvent('sumanai_referral_claimed', { detail: referralRecord }));
    window.dispatchEvent(new CustomEvent('sumanai_wallet_updated', { detail: updatedRefereeWallet }));

    return {
      success: true,
      creditsAwarded: REFEREE_REWARD_CREDITS,
      referralCode: cleanCode,
      wallet: updatedRefereeWallet
    };
  },

  captureUrlReferralCode: () => {
    if (typeof window === 'undefined') return null;
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const ref = urlParams.get('ref') || urlParams.get('referral');
      if (ref && ref.trim()) {
        const clean = ref.trim().toUpperCase();
        localStorage.setItem('sumanai_pending_ref_code', clean);
        return clean;
      }
    } catch {
      void 0;
    }
    return null;
  },

  getPendingReferralCode: () => {
    try {
      return localStorage.getItem('sumanai_pending_ref_code') || '';
    } catch {
      return '';
    }
  },

  buildShareUrl: (referralCode) => {
    if (typeof window === 'undefined') return `https://sumanai.local/?ref=${referralCode}`;
    const base = window.location.origin;
    return `${base}/?ref=${encodeURIComponent(referralCode)}`;
  },

  getShareText: (referralCode) => {
    return `Join me on SumanAI! Use my referral code ${referralCode} to get 50 free platform credits instantly. Try flagship AI models, code generation, and image synthesis:`;
  }
};

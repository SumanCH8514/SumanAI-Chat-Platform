import { create } from 'zustand';
import { getFirebaseAuth } from '../services/firebase';
import { signOut } from 'firebase/auth';

export const useAuthStore = create((set) => ({
  user: null,
  loading: true,
  error: null,
  authModalOpen: false,

  openAuthModal: () => set({ authModalOpen: true }),
  closeAuthModal: () => set({ authModalOpen: false }),

  setUser: (user) => set({ user, loading: false }),
  updateUserPreferences: (preferences) =>
    set((state) => ({
      user: state.user
        ? {
            ...state.user,
            preferences: {
              ...(state.user.preferences || {}),
              ...preferences,
            },
          }
        : state.user,
    })),
  updateUserProfileData: (profileData) =>
    set((state) => ({
      user: state.user
        ? {
            ...state.user,
            ...profileData,
            address: {
              ...(state.user.address || {}),
              ...(profileData?.address || {}),
            },
          }
        : state.user,
    })),
  updateUserWallet: (credits, balance) =>
    set((state) => ({
      user: state.user
        ? {
            ...state.user,
            credits: credits !== undefined ? credits : (state.user.credits || 0),
            walletBalance: balance !== undefined ? balance : (state.user.walletBalance || 0),
          }
        : state.user,
    })),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error, loading: false }),
  
  logout: async () => {
    try {
      const auth = getFirebaseAuth();
      if (auth) await signOut(auth);
      set({ user: null });
    } catch (error) {
      void error;
    }
  },
}));

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

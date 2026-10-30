import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { getFirebaseAuth } from '../../config/firebase';
import { useAuthStore } from '../../store/useAuthStore';
import { useChatStore } from '../../store/useChatStore';
import { firestoreService } from '../../services/firestoreService';
import { adminService } from '../../services/adminService';
import { referralService } from '../../services/referralService';

export const AuthObserver = ({ children }) => {
  const setUser = useAuthStore((state) => state.setUser);
  const setLoading = useAuthStore((state) => state.setLoading);
  const syncChats = useChatStore((state) => state.syncChats);

  useEffect(() => {
    referralService.captureUrlReferralCode();

    const auth = getFirebaseAuth();
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const profile = await firestoreService.getUserProfile(user.uid);
        let isAdmin = profile?.role === 'admin';
        if (!isAdmin && !user.isAnonymous) {
          try {
            const token = await user.getIdToken();
            const res = await adminService.verifyAdminToken(token);
            if (res?.isAdmin) {
              isAdmin = true;
            }
          } catch {
            void 0;
          }
        }
        let referralCode = profile?.referralCode;
        if (!referralCode && !user.isAnonymous) {
          try {
            referralCode = await referralService.getOrGenerateReferralCode(user);
          } catch {
            void 0;
          }
        }
        setUser({ ...user, ...profile, referralCode: referralCode || profile?.referralCode, role: isAdmin ? 'admin' : (profile?.role || 'user'), isAdmin });
        syncChats();
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [setUser, setLoading, syncChats]);

  return children;
};

export default AuthObserver;

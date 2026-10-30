import { firestoreService } from './firestoreService';

const getTodayKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

export const usageService = {
  getDailyImageCount: (userId = 'guest') => {
    const today = getTodayKey();
    const key = `sumanai_img_gen_${userId}_${today}`;
    const stored = localStorage.getItem(key);
    return stored ? parseInt(stored, 10) || 0 : 0;
  },

  incrementDailyImageCount: (userId = 'guest') => {
    const today = getTodayKey();
    const key = `sumanai_img_gen_${userId}_${today}`;
    const current = usageService.getDailyImageCount(userId);
    const updated = current + 1;
    localStorage.setItem(key, String(updated));

    if (userId && userId !== 'guest') {
      firestoreService.incrementUsage(userId, 'imageGenerations', today);
    }
    return updated;
  },

  checkImageGenAllowed: (user, governance) => {
    const isGoogleUser = Boolean(user && !user.isAnonymous);
    const isAdmin = Boolean(user && (user.role === 'admin' || user.isAdmin === true));
    const isPro = Boolean(user?.role === 'pro' || isAdmin);

    if (!isGoogleUser) {
      const guestLimit = governance?.tiers?.guest?.imageGenLimit ?? 0;
      if (guestLimit <= 0) {
        return {
          allowed: false,
          reason: 'login_required',
          message: 'Non-login users cannot generate images. Please sign in with Google to create AI images.',
          limit: 0,
          used: 0,
          remaining: 0
        };
      }
      const used = usageService.getDailyImageCount('guest');
      const remaining = Math.max(0, guestLimit - used);
      return {
        allowed: remaining > 0,
        reason: remaining > 0 ? null : 'limit_reached',
        message: remaining > 0 ? null : `Daily guest limit of ${guestLimit} image generations reached. Please sign in with Google for more.`,
        limit: guestLimit,
        used,
        remaining
      };
    }

    if (isAdmin || isPro) {
      const proLimit = governance?.tiers?.pro?.imageGenLimit ?? -1;
      if (proLimit === -1 || isAdmin) {
        return {
          allowed: true,
          unlimited: true,
          limit: -1,
          used: usageService.getDailyImageCount(user.uid),
          remaining: Infinity
        };
      }
      const used = usageService.getDailyImageCount(user.uid);
      const remaining = Math.max(0, proLimit - used);
      return {
        allowed: remaining > 0,
        reason: remaining > 0 ? null : 'limit_reached',
        message: remaining > 0 ? null : `Daily limit of ${proLimit} image generations reached.`,
        limit: proLimit,
        used,
        remaining
      };
    }

    const freeLimit = governance?.tiers?.free?.imageGenLimit ?? 5;
    const used = usageService.getDailyImageCount(user.uid);
    const remaining = Math.max(0, freeLimit - used);

    return {
      allowed: remaining > 0,
      reason: remaining > 0 ? null : 'limit_reached',
      message: remaining > 0 ? null : `You have reached your daily limit of ${freeLimit} image generations. Upgrade to Premium for unlimited generations.`,
      limit: freeLimit,
      used,
      remaining
    };
  }
};


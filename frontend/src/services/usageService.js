import { firestoreService } from './firestoreService';

const getTodayKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

const getTimestampsKey = (userId = 'guest') => `sumanai_img_timestamps_${userId}`;

export const usageService = {
  getTimestamps: (userId = 'guest') => {
    try {
      const raw = localStorage.getItem(getTimestampsKey(userId));
      const list = raw ? JSON.parse(raw) : [];
      const now = Date.now();
      const cutoff = now - 24 * 60 * 60 * 1000;
      const valid = Array.isArray(list) ? list.filter((t) => typeof t === 'number' && t > cutoff) : [];
      if (valid.length !== (list ? list.length : 0)) {
        localStorage.setItem(getTimestampsKey(userId), JSON.stringify(valid));
      }
      return valid;
    } catch {
      return [];
    }
  },

  recordGenerationTimestamp: (userId = 'guest') => {
    try {
      const existing = usageService.getTimestamps(userId);
      const updated = [...existing, Date.now()];
      localStorage.setItem(getTimestampsKey(userId), JSON.stringify(updated));
      usageService.incrementDailyImageCount(userId);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('sumanai_image_usage_updated'));
      }
      return updated;
    } catch {
      return [];
    }
  },

  getDailyImageCount: (userId = 'guest') => {
    const active = usageService.getTimestamps(userId);
    return active.length;
  },

  incrementDailyImageCount: (userId = 'guest') => {
    const today = getTodayKey();
    const key = `sumanai_img_gen_${userId}_${today}`;
    const stored = localStorage.getItem(key);
    const count = stored ? parseInt(stored, 10) || 0 : 0;
    const updated = count + 1;
    localStorage.setItem(key, String(updated));

    if (userId && userId !== 'guest') {
      firestoreService.incrementUsage(userId, 'imageGenerations', today);
    }
    return updated;
  },

  getRollingUsage: (user, governance) => {
    const isGoogleUser = Boolean(user && !user.isAnonymous);
    const isAdmin = Boolean(user && (user.role === 'admin' || user.isAdmin === true));
    const isPro = Boolean(user?.role === 'pro' || isAdmin);
    const userId = isGoogleUser ? user.uid : 'guest';

    const activeTimestamps = usageService.getTimestamps(userId);
    const used = activeTimestamps.length;
    const now = Date.now();

    if (!isGoogleUser) {
      const guestLimit = governance?.tiers?.guest?.imageGenLimit ?? 0;
      const remaining = Math.max(0, guestLimit - used);
      const isBlocked = guestLimit <= 0 || remaining === 0;

      let resetsInText = null;
      let nextResetMs = null;
      if (isBlocked && activeTimestamps.length > 0) {
        const oldest = Math.min(...activeTimestamps);
        nextResetMs = oldest + 24 * 60 * 60 * 1000;
        const diffMs = Math.max(0, nextResetMs - now);
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        resetsInText = hours > 0 ? `${hours}h ${minutes}m` : `${Math.max(1, minutes)}m`;
      }

      return {
        tier: 'guest',
        isGoogleUser: false,
        isPro: false,
        isAdmin: false,
        limit: guestLimit,
        used,
        remaining,
        isUnlimited: false,
        isBlocked,
        resetsInText,
        nextResetMs
      };
    }

    if (isAdmin || isPro) {
      const proLimit = governance?.tiers?.pro?.imageGenLimit ?? -1;
      const isUnlimited = proLimit === -1 || isAdmin;
      const remaining = isUnlimited ? Infinity : Math.max(0, proLimit - used);
      const isBlocked = !isUnlimited && remaining === 0;

      let resetsInText = null;
      let nextResetMs = null;
      if (isBlocked && activeTimestamps.length > 0) {
        const oldest = Math.min(...activeTimestamps);
        nextResetMs = oldest + 24 * 60 * 60 * 1000;
        const diffMs = Math.max(0, nextResetMs - now);
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        resetsInText = hours > 0 ? `${hours}h ${minutes}m` : `${Math.max(1, minutes)}m`;
      }

      return {
        tier: 'pro',
        isGoogleUser: true,
        isPro: true,
        isAdmin,
        limit: proLimit,
        used,
        remaining,
        isUnlimited,
        isBlocked,
        resetsInText,
        nextResetMs
      };
    }

    const freeLimit = governance?.tiers?.free?.imageGenLimit ?? 5;
    const remaining = Math.max(0, freeLimit - used);
    const isBlocked = remaining === 0;

    let resetsInText = null;
    let nextResetMs = null;
    if (isBlocked && activeTimestamps.length > 0) {
      const oldest = Math.min(...activeTimestamps);
      nextResetMs = oldest + 24 * 60 * 60 * 1000;
      const diffMs = Math.max(0, nextResetMs - now);
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      resetsInText = hours > 0 ? `${hours}h ${minutes}m` : `${Math.max(1, minutes)}m`;
    }

    return {
      tier: 'free',
      isGoogleUser: true,
      isPro: false,
      isAdmin: false,
      limit: freeLimit,
      used,
      remaining,
      isUnlimited: false,
      isBlocked,
      resetsInText,
      nextResetMs
    };
  },

  checkImageGenAllowed: (user, governance) => {
    const usage = usageService.getRollingUsage(user, governance);

    if (!usage.isGoogleUser) {
      if (usage.limit <= 0) {
        return {
          allowed: false,
          reason: 'login_required',
          message: 'Non-login users cannot generate images. Please sign in with Google to create AI images.',
          limit: 0,
          used: 0,
          remaining: 0,
          resetsInText: null
        };
      }
      return {
        allowed: !usage.isBlocked,
        reason: usage.isBlocked ? 'limit_reached' : null,
        message: usage.isBlocked ? `Guest image limit reached. Please wait ${usage.resetsInText || '24 hours'} or sign in with Google.` : null,
        limit: usage.limit,
        used: usage.used,
        remaining: usage.remaining,
        resetsInText: usage.resetsInText
      };
    }

    if (usage.isUnlimited) {
      return {
        allowed: true,
        unlimited: true,
        limit: -1,
        used: usage.used,
        remaining: Infinity,
        resetsInText: null
      };
    }

    return {
      allowed: !usage.isBlocked,
      reason: usage.isBlocked ? 'limit_reached' : null,
      message: usage.isBlocked ? `You have reached your limit of ${usage.limit} images in 24 hours. Your next image generation slot unlocks in ${usage.resetsInText || '24 hours'}.` : null,
      limit: usage.limit,
      used: usage.used,
      remaining: usage.remaining,
      resetsInText: usage.resetsInText
    };
  }
};

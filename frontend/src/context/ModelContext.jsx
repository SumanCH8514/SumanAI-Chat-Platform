import React, { useState, useEffect, useMemo } from 'react';
import { MODEL_LIST } from '../constants/models';
import { ModelContext } from './Contexts';
import { firestoreService } from '../services/firestoreService';
import { adminService } from '../services/adminService';
import { useAuthStore } from '../store/useAuthStore';

const FALLBACK_GUEST_MODEL_ID = 'qwen/qwen3.8-27b';
const FALLBACK_DEFAULT_MODEL_ID = 'openai/gpt-oss-120b';

export const ModelProvider = ({ children }) => {
  const { user, openAuthModal, updateUserPreferences } = useAuthStore();
  const [governance, setGovernance] = useState(null);

  useEffect(() => {
    let isMounted = true;
    adminService.getGovernanceConfig().then((cfg) => {
      if (isMounted) setGovernance(cfg);
    });

    const unsubscribe = adminService.subscribeGovernance((newGov) => {
      if (isMounted) setGovernance(newGov);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const isGoogleUser = Boolean(user && !user.isAnonymous);
  const isGuest = !isGoogleUser;
  const isAdmin = adminService.checkIsAdmin(user);
  const isPro = adminService.checkHasProAccess(user);

  const guestDefaultModelId = governance?.tiers?.guest?.defaultModelId || FALLBACK_GUEST_MODEL_ID;
  const freeDefaultModelId = governance?.tiers?.free?.defaultModelId || FALLBACK_DEFAULT_MODEL_ID;
  const proDefaultModelId = governance?.tiers?.pro?.defaultModelId || FALLBACK_DEFAULT_MODEL_ID;

  const dynamicModels = useMemo(() => {
    const guestAllowedIds = governance?.tiers?.guest?.allowedModelIds || [FALLBACK_GUEST_MODEL_ID];
    const freeAllowedIds = governance?.tiers?.free?.allowedModelIds || MODEL_LIST.map((m) => m.id);
    const proAllowedIds = governance?.tiers?.pro?.allowedModelIds || MODEL_LIST.map((m) => m.id);
    const configuredPremiumIds = governance?.tiers?.pro?.premiumModelIds;
    const defaultPremiumIds = MODEL_LIST.filter(m => m.tier === 'premium').map(m => m.id);
    const premiumModelIds = Array.isArray(configuredPremiumIds) && configuredPremiumIds.length > 0
      ? configuredPremiumIds
      : defaultPremiumIds;

    return MODEL_LIST.map((m) => {
      const isDesignatedPremium = m.tier === 'premium' || premiumModelIds.includes(m.id);
      let isLocked = false;
      let lockReason = null;

      if (isAdmin) {
        isLocked = false;
        lockReason = null;
      } else if (isGuest) {
        isLocked = !guestAllowedIds.includes(m.id);
        lockReason = isLocked ? 'login_required' : null;
      } else if (!isPro) {
        if (!freeAllowedIds.includes(m.id)) {
          isLocked = true;
          lockReason = isDesignatedPremium ? 'pro_required' : 'restricted';
        }
      } else {
        if (!proAllowedIds.includes(m.id)) {
          isLocked = true;
          lockReason = 'restricted';
        }
      }

      return {
        ...m,
        tier: isDesignatedPremium ? 'premium' : 'free',
        locked: isLocked,
        lockReason
      };
    });
  }, [isGuest, isPro, isAdmin, governance]);

const defaultModelForTier = isGuest
  ? dynamicModels.find((m) => m.id === guestDefaultModelId) || dynamicModels[0]
  : (isPro || isAdmin)
    ? dynamicModels.find((m) => m.id === proDefaultModelId) || dynamicModels[0]
    : dynamicModels.find((m) => m.id === freeDefaultModelId) || dynamicModels[0];

const [selectedModelId, setSelectedModelId] = useState(() => {
  const saved = localStorage.getItem('sumanai_selected_model');
  if (saved && !saved.startsWith('gemini')) {
    return saved;
  }
  return user?.preferences?.selectedModelId || FALLBACK_DEFAULT_MODEL_ID;
});

const [prevUserPrefModel, setPrevUserPrefModel] = useState(user?.preferences?.selectedModelId);
if (user?.preferences?.selectedModelId && user.preferences.selectedModelId !== prevUserPrefModel) {
  setPrevUserPrefModel(user.preferences.selectedModelId);
  if (!user.preferences.selectedModelId.startsWith('gemini')) {
    setSelectedModelId(user.preferences.selectedModelId);
    localStorage.setItem('sumanai_selected_model', user.preferences.selectedModelId);
  }
}

const activeModelId = isGuest ? guestDefaultModelId : selectedModelId;
const currentModelMatch = dynamicModels.find((m) => m.id === activeModelId);
const selectedModel = currentModelMatch && (!currentModelMatch.locked || isAdmin)
  ? currentModelMatch
  : defaultModelForTier;

const selectModel = (model) => {
    if (model.locked && !isAdmin) {
      if (model.lockReason === 'login_required' || isGuest) {
        openAuthModal();
        return false;
      }
      return false;
    }

    setSelectedModelId(model.id);
    localStorage.setItem('sumanai_selected_model', model.id);

    if (user?.uid && !user.isAnonymous) {
      if (typeof updateUserPreferences === 'function') {
        updateUserPreferences({ selectedModelId: model.id });
      }
      firestoreService.updatePreferences(user.uid, { selectedModelId: model.id });
    }
    return true;
  };

  return (
    <ModelContext.Provider
      value={{
        selectedModel,
        setSelectedModel: selectModel,
        models: dynamicModels,
        MODEL_LIST: dynamicModels,
        isGuest,
        isGoogleUser,
        isPro,
        isAdmin,
        governance,
        guestModelId: guestDefaultModelId
      }}
    >
      {children}
    </ModelContext.Provider>
  );
};

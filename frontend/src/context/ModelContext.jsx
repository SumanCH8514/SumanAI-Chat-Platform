import React, { useState, useMemo } from 'react';
import { MODEL_LIST } from '../constants/models';
import { ModelContext } from './Contexts';
import { firestoreService } from '../services/firestoreService';
import { useAuthStore } from '../store/useAuthStore';

const GUEST_MODEL_ID = 'qwen/qwen3.8-27b';

export const ModelProvider = ({ children }) => {
  const { user, openAuthModal } = useAuthStore();
  const isGoogleUser = Boolean(user && !user.isAnonymous);
  const isGuest = !isGoogleUser;

  const dynamicModels = useMemo(() => {
    return MODEL_LIST.map((m) => ({
      ...m,
      locked: isGuest ? m.id !== GUEST_MODEL_ID : false
    }));
  }, [isGuest]);

  const qwenModel = dynamicModels.find((m) => m.id === GUEST_MODEL_ID) || dynamicModels[0];

  const [customModelId, setCustomModelId] = useState(() => {
    const saved = localStorage.getItem('sumanai_selected_model');
    if (!saved || saved === 'gemini-1.5-flash' || saved.startsWith('gemini')) {
      localStorage.setItem('sumanai_selected_model', 'meta/llama-3.2-11b-vision-instruct');
      return 'meta/llama-3.2-11b-vision-instruct';
    }
    return saved;
  });

  const activeModelId = isGuest
    ? GUEST_MODEL_ID
    : ((user?.preferences?.selectedModelId && !user.preferences.selectedModelId.startsWith('gemini'))
        ? user.preferences.selectedModelId
        : customModelId);

  const selectedModel = dynamicModels.find((m) => m.id === activeModelId) || qwenModel;

  const selectModel = (model) => {
    if (isGuest && model.id !== GUEST_MODEL_ID) {
      openAuthModal();
      return false;
    }

    setCustomModelId(model.id);
    localStorage.setItem('sumanai_selected_model', model.id);

    if (user?.uid && !user.isAnonymous) {
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
        guestModelId: GUEST_MODEL_ID
      }}
    >
      {children}
    </ModelContext.Provider>
  );
};

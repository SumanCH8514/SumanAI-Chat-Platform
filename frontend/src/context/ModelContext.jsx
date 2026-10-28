import React, { useState, useMemo } from 'react';
import { MODEL_LIST } from '../constants/models';
import { ModelContext } from './Contexts';
import { firestoreService } from '../services/firestoreService';
import { useAuthStore } from '../store/useAuthStore';

const GUEST_MODEL_ID = 'qwen/qwen3.8-27b';

export const ModelProvider = ({ children }) => {
  const { user, openAuthModal, updateUserPreferences } = useAuthStore();
  const isGoogleUser = Boolean(user && !user.isAnonymous);
  const isGuest = !isGoogleUser;

  const dynamicModels = useMemo(() => {
    return MODEL_LIST.map((m) => ({
      ...m,
      locked: isGuest ? m.id !== GUEST_MODEL_ID : false
    }));
  }, [isGuest]);

  const defaultModel = dynamicModels.find((m) => m.id === 'openai/gpt-oss-120b') || dynamicModels[0];
  const qwenModel = dynamicModels.find((m) => m.id === GUEST_MODEL_ID) || dynamicModels[0];

  const [selectedModelId, setSelectedModelId] = useState(() => {
    const saved = localStorage.getItem('sumanai_selected_model');
    if (saved && !saved.startsWith('gemini')) {
      return saved;
    }
    return user?.preferences?.selectedModelId || 'openai/gpt-oss-120b';
  });

  const [prevUserPrefModel, setPrevUserPrefModel] = useState(user?.preferences?.selectedModelId);
  if (user?.preferences?.selectedModelId && user.preferences.selectedModelId !== prevUserPrefModel) {
    setPrevUserPrefModel(user.preferences.selectedModelId);
    if (!user.preferences.selectedModelId.startsWith('gemini')) {
      setSelectedModelId(user.preferences.selectedModelId);
      localStorage.setItem('sumanai_selected_model', user.preferences.selectedModelId);
    }
  }

  const activeModelId = isGuest ? GUEST_MODEL_ID : selectedModelId;
  const selectedModel = dynamicModels.find((m) => m.id === activeModelId) || (isGuest ? qwenModel : defaultModel);

  const selectModel = (model) => {
    if (isGuest && model.id !== GUEST_MODEL_ID) {
      openAuthModal();
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
        guestModelId: GUEST_MODEL_ID
      }}
    >
      {children}
    </ModelContext.Provider>
  );
};

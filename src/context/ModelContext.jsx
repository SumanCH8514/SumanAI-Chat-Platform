import React, { useState } from 'react';
import { MODEL_LIST } from '../constants/models';
import { ModelContext } from './Contexts';

export const ModelProvider = ({ children }) => {
  const [selectedModel, setSelectedModel] = useState(() => {
    const savedId = localStorage.getItem('sumanai_selected_model');
    if (savedId) {
      return MODEL_LIST.find(m => m.id === savedId) || MODEL_LIST[0];
    }
    return MODEL_LIST[0];
  });

  const selectModel = (model) => {
    setSelectedModel(model);
    localStorage.setItem('sumanai_selected_model', model.id);
  };

  return (
    <ModelContext.Provider value={{ selectedModel, setSelectedModel: selectModel, MODEL_LIST }}>
      {children}
    </ModelContext.Provider>
  );
};

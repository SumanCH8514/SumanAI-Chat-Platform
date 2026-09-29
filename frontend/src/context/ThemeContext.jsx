import React, { useEffect, useState } from 'react';
import { COLOR_THEMES } from '../constants/themes';
import { ThemeContext } from './Contexts';
import { firestoreService } from '../services/firestoreService';
import { useAuthStore } from '../store/useAuthStore';

export const ThemeProvider = ({ children }) => {
  const { user } = useAuthStore();
  const [theme, setTheme] = useState(() => localStorage.getItem('suman_theme') || 'system');
  const [colorTheme, setColorTheme] = useState(() => localStorage.getItem('suman_color_theme') || 'purple');

  const [prevUserPref, setPrevUserPref] = useState(user?.preferences);
  if (user?.preferences !== prevUserPref) {
    setPrevUserPref(user?.preferences);
    if (user?.preferences?.theme && user.preferences.theme !== theme) {
      setTheme(user.preferences.theme);
    }
    if (user?.preferences?.colorTheme && user.preferences.colorTheme !== colorTheme) {
      setColorTheme(user.preferences.colorTheme);
    }
  }

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }

    localStorage.setItem('suman_theme', theme);
    
    if (user?.uid) {
      firestoreService.updatePreferences(user.uid, { theme });
    }
  }, [theme, user?.uid]);

  useEffect(() => {
    const root = window.document.documentElement;
    const ct = COLOR_THEMES[colorTheme] || COLOR_THEMES.purple;
    root.style.setProperty('--brand-primary', ct.primary);
    root.style.setProperty('--brand-hover', ct.hover || ct.primary);
    if (ct.subtle) root.style.setProperty('--brand-subtle', ct.subtle);
    if (ct.border) root.style.setProperty('--brand-border', ct.border);
    localStorage.setItem('suman_color_theme', colorTheme);

    if (user?.uid) {
      firestoreService.updatePreferences(user.uid, { colorTheme });
    }
  }, [colorTheme, user?.uid]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, colorTheme, setColorTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

import React, { useEffect, useState, useCallback } from 'react';
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

  const applyColors = useCallback((activeColorTheme, isDark) => {
    const root = window.document.documentElement;
    const ct = COLOR_THEMES[activeColorTheme] || COLOR_THEMES.purple;

    const primary = isDark ? ct.primaryDark || ct.primary : ct.primary;
    const hover = isDark ? ct.hoverDark || ct.hover : ct.hover;
    const subtle = isDark ? ct.subtleDark || ct.subtle : ct.subtle;
    const border = isDark ? ct.borderDark || ct.border : ct.border;
    const rgb = isDark ? ct.rgbDark || ct.rgb : ct.rgb;

    root.style.setProperty('--brand-primary', primary);
    root.style.setProperty('--brand-hover', hover);
    root.style.setProperty('--brand-subtle', subtle);
    root.style.setProperty('--brand-border', border);
    root.style.setProperty('--brand-rgb', rgb);
    root.style.setProperty('--brand-gradient', ct.gradient);
    root.style.setProperty('--bg-active', subtle);
    root.style.setProperty('--border-focus', border);
    root.style.setProperty('--shadow-glow', `0 0 25px -4px rgba(${rgb}, 0.35)`);
    root.style.setProperty('--shadow-float', `0 16px 40px -8px rgba(${rgb}, 0.18)`);
    root.setAttribute('data-color-theme', activeColorTheme);
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = () => {
      root.classList.remove('light', 'dark');
      const resolved = theme === 'system' ? (mediaQuery.matches ? 'dark' : 'light') : theme;
      root.classList.add(resolved);
      root.setAttribute('data-theme', resolved);
      applyColors(colorTheme, resolved === 'dark');
    };

    applyTheme();

    const handleMediaChange = () => {
      if (theme === 'system') {
        applyTheme();
      }
    };

    mediaQuery.addEventListener('change', handleMediaChange);
    localStorage.setItem('suman_theme', theme);

    if (user?.uid) {
      firestoreService.updatePreferences(user.uid, { theme });
    }

    return () => {
      mediaQuery.removeEventListener('change', handleMediaChange);
    };
  }, [theme, colorTheme, applyColors, user?.uid]);

  useEffect(() => {
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

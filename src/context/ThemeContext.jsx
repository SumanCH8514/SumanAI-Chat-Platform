import React, { useEffect, useState } from 'react';
import { COLOR_THEMES } from '../constants/themes';
import { ThemeContext } from './Contexts';

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => localStorage.getItem('suman_theme') || 'system');
  const [colorTheme, setColorTheme] = useState(() => localStorage.getItem('suman_color_theme') || 'pink');

  // Apply dark/light/system
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);

      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = (e) => {
        root.classList.remove('light', 'dark');
        root.classList.add(e.matches ? 'dark' : 'light');
      };
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', listener);
        return () => mediaQuery.removeEventListener('change', listener);
      } else {
        mediaQuery.addListener(listener);
        return () => mediaQuery.removeListener(listener);
      }
    } else {
      root.classList.add(theme);
    }

    localStorage.setItem('suman_theme', theme);
  }, [theme]);

  // Apply color theme CSS variables
  useEffect(() => {
    const root = window.document.documentElement;
    const ct = COLOR_THEMES[colorTheme] || COLOR_THEMES.pink;
    root.style.setProperty('--brand-primary', ct.primary);
    root.style.setProperty('--brand-gradient', ct.gradient);
    root.style.setProperty('--brand-gradient-hover', ct.gradient);
    localStorage.setItem('suman_color_theme', colorTheme);
  }, [colorTheme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, colorTheme, setColorTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

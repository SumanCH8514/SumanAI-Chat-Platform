import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="theme-toggle-group" role="radiogroup" aria-label="Theme selector">
      <button 
        type="button"
        role="radio"
        aria-checked={theme === 'light'}
        onClick={() => setTheme('light')} 
        className={`theme-toggle-btn ${theme === 'light' ? 'active' : ''}`}
        title="Light mode"
        aria-label="Light mode"
      >
        <Sun size={15} />
      </button>
      <button 
        type="button"
        role="radio"
        aria-checked={theme === 'dark'}
        onClick={() => setTheme('dark')} 
        className={`theme-toggle-btn ${theme === 'dark' ? 'active' : ''}`}
        title="Dark mode"
        aria-label="Dark mode"
      >
        <Moon size={15} />
      </button>
      <button 
        type="button"
        role="radio"
        aria-checked={theme === 'system'}
        onClick={() => setTheme('system')} 
        className={`theme-toggle-btn ${theme === 'system' ? 'active' : ''}`}
        title="Follow system"
        aria-label="Follow system theme"
      >
        <Monitor size={15} />
      </button>
    </div>
  );
};

export default ThemeToggle;

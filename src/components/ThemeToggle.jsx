import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { COLOR_THEMES } from '../constants/themes';

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="theme-toggle" style={{ 
      display: 'flex', 
      alignItems: 'center',
      gap: '4px', 
      marginRight: '24px', 
      background: 'var(--bg-sidebar)',
      padding: '4px',
      borderRadius: '24px',
      border: '1px solid var(--border-light)'
    }}>
      <button 
        onClick={() => setTheme('light')} 
        style={{ 
          padding: '6px', 
          borderRadius: '50%', 
          color: theme === 'light' ? 'var(--brand-primary)' : 'var(--text-muted)',
          background: theme === 'light' ? 'var(--bg-main)' : 'transparent',
          boxShadow: theme === 'light' ? 'var(--shadow-sm)' : 'none'
        }}
        title="Light Mode"
      >
        <Sun size={16} />
      </button>
      <button 
        onClick={() => setTheme('dark')} 
        style={{ 
          padding: '6px', 
          borderRadius: '50%', 
          color: theme === 'dark' ? 'var(--brand-primary)' : 'var(--text-muted)',
          background: theme === 'dark' ? 'var(--bg-main)' : 'transparent',
          boxShadow: theme === 'dark' ? 'var(--shadow-sm)' : 'none'
        }}
        title="Dark Mode"
      >
        <Moon size={16} />
      </button>
      <button 
        onClick={() => setTheme('system')} 
        style={{ 
          padding: '6px', 
          borderRadius: '50%', 
          color: theme === 'system' ? 'var(--brand-primary)' : 'var(--text-muted)',
          background: theme === 'system' ? 'var(--bg-main)' : 'transparent',
          boxShadow: theme === 'system' ? 'var(--shadow-sm)' : 'none'
        }}
        title="Follow System"
      >
        <Monitor size={16} />
      </button>
    </div>
  );
};
export default ThemeToggle;

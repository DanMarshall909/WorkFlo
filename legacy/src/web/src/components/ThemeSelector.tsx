'use client';

import { useTheme } from '@/providers/theme-provider';
import { Theme } from '@/lib/theme';

const themeLabels: Record<Theme, string> = {
  light: 'Light',
  dark: 'Dark', 
  earth: 'Earth',
  forest: 'Forest',
  desert: 'Desert',
  'desert-night': 'Desert Night',
  ocean: 'Ocean',
  stone: 'Stone',
  system: 'System',
};

export function ThemeSelector() {
  const { theme, setTheme, toggleTheme } = useTheme();

  // Show loading state while theme is being initialized
  if (!theme) {
    return (
      <div className="flex flex-col gap-4 p-4 bg-surface-variant border border-border rounded-lg animate-pulse">
        <h3 className="text-lg font-semibold text-on-surface">Theme Selector</h3>
        <div className="text-sm text-on-surface-variant">Loading theme...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 bg-surface border border-border rounded-lg">
      <h3 className="text-lg font-semibold text-on-surface">Theme Selector</h3>
      
      <div className="flex flex-wrap gap-2">
        {Object.entries(themeLabels).map(([themeKey, label]) => (
          <button
            key={themeKey}
            onClick={() => setTheme(themeKey as Theme)}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 ${
              theme === themeKey
                ? 'bg-primary/20 text-primary border border-primary/30 shadow-sm theme-button-active'
                : 'bg-surface-variant text-on-surface-variant hover:bg-primary-container/50 hover:text-primary theme-button-inactive'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <button
        onClick={toggleTheme}
        className="px-4 py-2 bg-secondary text-on-secondary rounded-md font-medium hover:opacity-90 transition-opacity"
      >
        Toggle Theme
      </button>

      <div className="text-sm text-on-surface-variant">
        Current theme: <span className="font-medium">{themeLabels[theme]}</span>
      </div>
    </div>
  );
}
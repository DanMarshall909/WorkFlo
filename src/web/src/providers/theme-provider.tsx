'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Theme, ThemeConfig, themes, lightTheme } from '@/lib/theme';

interface ThemeContextType {
  theme: Theme;
  themeConfig: ThemeConfig;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
}

export function ThemeProvider({ children, defaultTheme = 'system' }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [mounted, setMounted] = useState(false);

  // Get the actual theme config based on current theme and system preference
  const getThemeConfig = (currentTheme: Theme): ThemeConfig => {
    if (currentTheme === 'system') {
      if (typeof window !== 'undefined') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light';
        return themes[systemTheme];
      }
      return lightTheme; // fallback for SSR
    }
    return themes[currentTheme];
  };

  const [themeConfig, setThemeConfig] = useState<ThemeConfig>(() => getThemeConfig(theme));

  useEffect(() => {
    setMounted(true);

    // Load theme from localStorage
    const savedTheme = localStorage.getItem('anchor-theme') as Theme;
    if (savedTheme && ['light', 'dark', 'system', 'earth', 'forest', 'desert', 'desert-night', 'ocean', 'stone'].includes(savedTheme)) {
      setThemeState(savedTheme);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const updateThemeConfig = () => {
      const newConfig = getThemeConfig(theme);
      setThemeConfig(newConfig);

      // Apply theme to document
      const root = document.documentElement;

      // Remove existing theme classes
      root.classList.remove('light', 'dark', 'earth', 'forest', 'desert', 'desert-night', 'ocean', 'stone');

      // Add current theme class
      if (theme === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light';
        root.classList.add(systemTheme);
      } else {
        root.classList.add(theme);
      }

      // Set CSS custom properties for theme colors
      Object.entries(newConfig.colors).forEach(([key, value]) => {
        root.style.setProperty(`--color-${key}`, value);
      });
    };

    updateThemeConfig();

    // Listen for system theme changes when using 'system' theme
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', updateThemeConfig);
      return () => mediaQuery.removeEventListener('change', updateThemeConfig);
    }
  }, [theme, mounted]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    if (mounted) {
      localStorage.setItem('anchor-theme', newTheme);
    }
  };

  const toggleTheme = () => {
    const themeOrder: Theme[] = ['light', 'dark', 'earth', 'forest', 'desert', 'desert-night', 'ocean', 'stone', 'system'];
    const currentIndex = themeOrder.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themeOrder.length;
    setTheme(themeOrder[nextIndex]);
  };

  const contextValue = { theme, themeConfig, setTheme, toggleTheme };

  // Always provide context, but handle mounting state in the children
  return (
    <ThemeContext.Provider value={contextValue}>
      {mounted ? children : <div className="opacity-0">{children}</div>}
    </ThemeContext.Provider>
  );
}

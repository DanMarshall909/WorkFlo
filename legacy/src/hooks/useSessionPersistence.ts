/**
 * useSessionPersistence - Business-Focused Auto-save Hook
 * 
 * Business purpose: Prevent data loss during session interruptions
 * Integration: Works with session store to persist critical data
 */

import { useCallback, useRef, useEffect } from 'react';

export interface UseSessionPersistenceConfig {
  key: string;
  debounceMs?: number;
  enabled?: boolean;
}

export interface UseSessionPersistenceReturn {
  save: (data: any) => void;
  load: () => any | null;
  clear: () => void;
  isSupported: boolean;
}

/**
 * Hook for session data persistence
 * 
 * Business Rules:
 * - Auto-save session data to prevent loss
 * - Debounce saves to avoid excessive writes
 * - Handle browser storage errors gracefully
 */
export const useSessionPersistence = (
  config: UseSessionPersistenceConfig
): UseSessionPersistenceReturn => {
  const { key, debounceMs = 500, enabled = true } = config;

  const debounceRef = useRef<NodeJS.Timeout>();
  const isSupported = typeof window !== 'undefined' && 'localStorage' in window;

  /**
   * Business Rule: Load persisted session data on page refresh
   */
  const load = useCallback((): any | null => {
    if (!isSupported || !enabled) return null;

    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null; // Handle corrupted data gracefully
    }
  }, [isSupported, enabled, key]);

  /**
   * Business Rule: Save session data with debouncing for performance
   */
  const save = useCallback((data: any): void => {
    if (!isSupported || !enabled) return;

    // Clear existing timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Debounce save operation
    debounceRef.current = setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(data));
      } catch {
        // Handle storage quota exceeded or other errors
        console.warn('Failed to save session data');
      }
    }, debounceMs);
  }, [isSupported, enabled, key, debounceMs]);

  /**
   * Business Rule: Clear persisted data when session ends
   */
  const clear = useCallback((): void => {
    if (!isSupported || !enabled) return;

    try {
      localStorage.removeItem(key);
    } catch {
      // Handle errors gracefully
    }
  }, [isSupported, enabled, key]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return {
    save,
    load,
    clear,
    isSupported,
  };
};
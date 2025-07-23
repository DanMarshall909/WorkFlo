/**
 * useSessionPersistence - Auto-save Hook with Debouncing
 * 
 * Advanced patterns demonstrated:
 * - Debouncing with useCallback and useRef
 * - Local storage integration with error handling
 * - Custom hook composition
 */

import { useCallback, useRef, useEffect } from 'react';

export interface UseSessionPersistenceConfig {
  key: string;
  debounceMs?: number;
  enabled?: boolean;
  onSave?: (data: any) => void;
  onLoad?: (data: any) => void;
  onError?: (error: Error) => void;
}

export interface UseSessionPersistenceReturn {
  save: (data: any) => void;
  load: () => any | null;
  remove: () => void;
  isSupported: boolean;
}

/**
 * Hook for persistent session storage with debouncing
 */
export const useSessionPersistence = (
  config: UseSessionPersistenceConfig
): UseSessionPersistenceReturn => {
  const {
    key,
    debounceMs = 500,
    enabled = true,
    onSave,
    onLoad,
    onError,
  } = config;

  const debounceRef = useRef<NodeJS.Timeout>();
  const lastDataRef = useRef<any>();

  const isSupported = typeof window !== 'undefined' && 'localStorage' in window;

  /**
   * Load data from localStorage
   */
  const load = useCallback((): any | null => {
    if (!isSupported || !enabled) {
      return null;
    }

    try {
      const stored = localStorage.getItem(key);
      if (!stored) {
        return null;
      }

      const data = JSON.parse(stored);
      onLoad?.(data);
      return data;
    } catch (error) {
      onError?.(error as Error);
      return null;
    }
  }, [isSupported, enabled, key, onLoad, onError]);

  /**
   * Save data to localStorage (immediate)
   */
  const saveImmediate = useCallback((data: any): void => {
    if (!isSupported || !enabled) {
      return;
    }

    try {
      localStorage.setItem(key, JSON.stringify(data));
      lastDataRef.current = data;
      onSave?.(data);
    } catch (error) {
      onError?.(error as Error);
    }
  }, [isSupported, enabled, key, onSave, onError]);

  /**
   * Save data with debouncing
   */
  const save = useCallback((data: any): void => {
    if (!isSupported || !enabled) {
      return;
    }

    // Clear existing timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Set new timeout
    debounceRef.current = setTimeout(() => {
      saveImmediate(data);
    }, debounceMs);
  }, [isSupported, enabled, debounceMs, saveImmediate]);

  /**
   * Remove data from localStorage
   */
  const remove = useCallback((): void => {
    if (!isSupported || !enabled) {
      return;
    }

    try {
      localStorage.removeItem(key);
      lastDataRef.current = null;
    } catch (error) {
      onError?.(error as Error);
    }
  }, [isSupported, enabled, key, onError]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      // Save any pending data immediately on unmount
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        if (lastDataRef.current !== undefined) {
          saveImmediate(lastDataRef.current);
        }
      }
    };
  }, [saveImmediate]);

  return {
    save,
    load,
    remove,
    isSupported,
  };
};
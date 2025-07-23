/**
 * useSessionTimer - Integration Hook with Existing Session Store
 * 
 * Advanced React patterns demonstrated:
 * - Integration with existing Zustand store
 * - useCallback for stable function references
 * - Custom hook composition
 * 
 * This hook integrates with the existing session store instead of duplicating functionality
 */

import { useCallback, useEffect, useMemo } from 'react';
import { useSessionStore } from '../stores/session-store';

// Hook configuration interface
export interface UseSessionTimerConfig {
  autoTick?: boolean;
  tickInterval?: number;
  onTick?: (elapsedTime: number) => void;
  onSessionComplete?: () => void;
}

// Hook return interface
export interface UseSessionTimerReturn {
  // State from store
  isRunning: boolean;
  elapsedTime: number;
  remainingTime: number;
  currentSession: any;
  
  // Actions that integrate with store
  start: (config: { duration: number; title?: string; description?: string }) => void;
  pause: () => void;
  resume: () => void;
  complete: () => void;
  reset: () => void;
  
  // Timer-specific functionality
  tick: () => void;
}

/**
 * Session timer integration hook
 * 
 * Key patterns:
 * - Integration with existing Zustand store (no duplication)
 * - useCallback for stable function references
 * - Optional auto-tick functionality
 * - Proper separation of concerns
 */
export const useSessionTimer = (config: UseSessionTimerConfig = {}): UseSessionTimerReturn => {
  const {
    autoTick = false,
    tickInterval = 1000,
    onTick,
    onSessionComplete,
  } = config;

  // Get state and actions from existing store
  const store = useSessionStore();
  const { 
    currentSession, 
    isTimerRunning,
    startSession,
    pauseSession,
    resumeSession,
    completeSession,
    resetSession,
    tick: storeTick,
  } = store;

  // Memoized derived state for performance optimization
  const elapsedTime = useMemo(() => currentSession?.elapsedTime || 0, [currentSession?.elapsedTime]);
  const remainingTime = useMemo(() => currentSession?.remainingTime || 0, [currentSession?.remainingTime]);

  /**
   * Enhanced tick function with callback support
   */
  const tick = useCallback(() => {
    storeTick();
    if (onTick) {
      onTick(elapsedTime);
    }
  }, [storeTick, onTick, elapsedTime]);

  /**
   * Start session with duration
   */
  const start = useCallback((sessionConfig: { duration: number; title?: string; description?: string }) => {
    startSession(sessionConfig);
  }, [startSession]);

  /**
   * Pause current session
   */
  const pause = useCallback(() => {
    pauseSession();
  }, [pauseSession]);

  /**
   * Resume paused session
   */
  const resume = useCallback(() => {
    resumeSession();
  }, [resumeSession]);

  /**
   * Complete current session
   */
  const complete = useCallback(() => {
    completeSession();
    // onSessionComplete is called via useEffect when state changes
  }, [completeSession]);

  /**
   * Reset session
   */
  const reset = useCallback(() => {
    resetSession();
  }, [resetSession]);

  /**
   * Auto-tick functionality (optional)
   */
  useEffect(() => {
    if (!autoTick || !isTimerRunning) return;

    const interval = setInterval(tick, tickInterval);

    return () => clearInterval(interval);
  }, [autoTick, isTimerRunning, tick, tickInterval]);

  /**
   * Session completion detection
   */
  useEffect(() => {
    if (currentSession?.state === 'completed' && onSessionComplete) {
      onSessionComplete();
    }
  }, [currentSession?.state, onSessionComplete]);

  return {
    // State from store
    isRunning: isTimerRunning,
    elapsedTime,
    remainingTime,
    currentSession,
    
    // Actions
    start,
    pause,
    resume,
    complete,
    reset,
    tick,
  };
};

/**
 * ## 🎓 Integration Patterns Explained
 * 
 * ### 1. Store Integration
 * ```typescript
 * const store = useSessionStore();
 * ```
 * - Reuses existing proven session store
 * - No state duplication
 * - Single source of truth
 * 
 * ### 2. Stable Function Wrappers
 * ```typescript
 * const start = useCallback((config) => {
 *   startSession(config);
 * }, [startSession]);
 * ```
 * - Wraps store actions with useCallback
 * - Adds additional functionality (callbacks)
 * - Maintains stable references
 * 
 * ### 3. Optional Auto-Tick
 * ```typescript
 * useEffect(() => {
 *   if (!autoTick) return;
 *   const interval = setInterval(tick, tickInterval);
 *   return () => clearInterval(interval);
 * }, [autoTick, isTimerRunning, tick, tickInterval]);
 * ```
 * - Optional automatic timer updates
 * - Proper cleanup
 * - Respects running state
 */
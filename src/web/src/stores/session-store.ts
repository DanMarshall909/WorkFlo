// Session Store Implementation - Zustand Store with State Machine Logic
// Advanced state management using Zustand with persistence and comprehensive state machine

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { 
  Session, 
  SessionState, 
  SessionEvent,
  createSession,
  createTimestamp,
  isValidTransition,
  createDuration 
} from '../lib/types/session';
import { 
  SessionStore,
  SessionStoreState, 
  SessionStoreActions,
  SessionStoreConfig,
  initialSessionStoreState,
  SessionStoreError,
  hasActiveSession,
  canPauseSession,
  canResumeSession,
  canCompleteSession,
  validateStoreAction 
} from '../lib/types/session-store';

/**
 * Creates a session store with state machine logic and persistence
 * @param config - Optional configuration for the store
 * @returns Zustand store instance
 */
export const createSessionStore = (config: SessionStoreConfig = {}) => {
  const {
    persistenceKey = 'anchor-session-store',
    enablePersistence = true,
    tickInterval = 1000,
    onSessionStart,
    onSessionPause,
    onSessionResume,
    onSessionComplete,
    onSessionReset,
    onError
  } = config;

  const store = create<SessionStore>()(
    persist(
      (set, get) => ({
        // Initial state
        ...initialSessionStoreState,

        // Session lifecycle actions
        startSession: (sessionConfig) => {
          const state = get();
          
          // Validate duration first
          if (sessionConfig.duration <= 0) {
            const errorMsg = SessionStoreError.INVALID_DURATION;
            set({ error: errorMsg });
            onError?.(errorMsg);
            return;
          }

          // Check if session already active
          if (hasActiveSession(state) && state.currentSession.state !== SessionState.COMPLETED) {
            const errorMsg = 'session already active';
            set({ error: errorMsg });
            onError?.(errorMsg);
            return;
          }

          try {
            const newSession: Session = {
              ...createSession(sessionConfig),
              state: SessionState.ACTIVE,
              startedAt: createTimestamp(),
              elapsedTime: createDuration(0),
              remainingTime: createDuration(sessionConfig.duration)
            };

            set({ 
              currentSession: newSession,
              isTimerRunning: true,
              lastTickAt: createTimestamp(),
              error: null 
            });

            onSessionStart?.(newSession);
          } catch (err) {
            const errorMsg = err instanceof Error ? err.message : SessionStoreError.INVALID_DURATION;
            set({ error: errorMsg });
            onError?.(errorMsg);
          }
        },

        pauseSession: () => {
          const state = get();
          
          if (!hasActiveSession(state)) {
            const errorMsg = SessionStoreError.NO_ACTIVE_SESSION;
            set({ error: errorMsg });
            onError?.(errorMsg);
            return;
          }

          if (!canPauseSession(state)) {
            const errorMsg = SessionStoreError.INVALID_STATE_TRANSITION;
            set({ error: errorMsg });
            onError?.(errorMsg);
            return;
          }

          const updatedSession: Session = {
            ...state.currentSession!,
            state: SessionState.PAUSED,
            pausedAt: createTimestamp()
          };

          set({ 
            currentSession: updatedSession,
            isTimerRunning: false,
            error: null 
          });

          onSessionPause?.(updatedSession);
        },

        resumeSession: () => {
          const state = get();
          
          if (!hasActiveSession(state)) {
            const errorMsg = SessionStoreError.NO_ACTIVE_SESSION;
            set({ error: errorMsg });
            onError?.(errorMsg);
            return;
          }

          if (!canResumeSession(state)) {
            const errorMsg = SessionStoreError.INVALID_STATE_TRANSITION;
            set({ error: errorMsg });
            onError?.(errorMsg);
            return;
          }

          const updatedSession: Session = {
            ...state.currentSession!,
            state: SessionState.ACTIVE,
            resumedAt: createTimestamp()
          };

          set({ 
            currentSession: updatedSession,
            isTimerRunning: true,
            lastTickAt: createTimestamp(),
            error: null 
          });

          onSessionResume?.(updatedSession);
        },

        completeSession: () => {
          const state = get();
          
          if (!hasActiveSession(state)) {
            const errorMsg = SessionStoreError.NO_ACTIVE_SESSION;
            set({ error: errorMsg });
            onError?.(errorMsg);
            return;
          }

          if (!canCompleteSession(state)) {
            const errorMsg = SessionStoreError.INVALID_STATE_TRANSITION;
            set({ error: errorMsg });
            onError?.(errorMsg);
            return;
          }

          const updatedSession: Session = {
            ...state.currentSession!,
            state: SessionState.COMPLETED,
            completedAt: createTimestamp(),
            remainingTime: createDuration(0)
          };

          set({ 
            currentSession: updatedSession,
            isTimerRunning: false,
            error: null 
          });

          onSessionComplete?.(updatedSession);
        },

        resetSession: () => {
          set({ 
            currentSession: null,
            isTimerRunning: false,
            lastTickAt: null,
            error: null 
          });

          onSessionReset?.();
        },

        // Timer management
        tick: () => {
          const state = get();
          
          if (!state.isTimerRunning || !hasActiveSession(state)) {
            const errorMsg = SessionStoreError.TIMER_NOT_RUNNING;
            set({ error: errorMsg });
            onError?.(errorMsg);
            return;
          }

          const now = createTimestamp();
          const lastTick = state.lastTickAt || state.currentSession.startedAt || now;
          const timeDelta = now - lastTick;
          
          const newElapsedTime = createDuration(state.currentSession.elapsedTime + timeDelta);
          const newRemainingTime = createDuration(
            Math.max(0, state.currentSession.duration - newElapsedTime)
          );

          const updatedSession: Session = {
            ...state.currentSession,
            elapsedTime: newElapsedTime,
            remainingTime: newRemainingTime
          };

          // Auto-complete if time is up
          if (newRemainingTime === 0) {
            const completedSession: Session = {
              ...updatedSession,
              state: SessionState.COMPLETED,
              completedAt: now
            };

            set({ 
              currentSession: completedSession,
              isTimerRunning: false,
              lastTickAt: now,
              error: null 
            });

            onSessionComplete?.(completedSession);
          } else {
            set({ 
              currentSession: updatedSession,
              lastTickAt: now,
              error: null 
            });
          }
        },

        // Error handling
        setError: (error) => {
          set({ error });
          if (error) {
            onError?.(error);
          }
        },

        clearError: () => {
          set({ error: null });
        },

        // Store management
        reset: () => {
          set(initialSessionStoreState);
          onSessionReset?.();
        }
      }),
      {
        name: persistenceKey,
        storage: enablePersistence ? createJSONStorage(() => localStorage) : undefined,
        // Only persist session data, not runtime state
        partialize: (state) => ({
          currentSession: state.currentSession,
          // Don't persist timer state or errors
          isTimerRunning: false,
          lastTickAt: null,
          isLoading: false,
          error: null
        })
      }
    )
  );

  return store;
};

// Default store instance
export const useSessionStore = createSessionStore();
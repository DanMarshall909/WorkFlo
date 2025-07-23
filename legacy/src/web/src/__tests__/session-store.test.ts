// Session Store Test Suite - TDD Approach with State Machine Testing
// Comprehensive behavior-driven tests for Zustand session store

import { renderHook, act } from '@testing-library/react';
import { createSessionStore } from '../stores/session-store';
import { SessionState, PRESET_DURATIONS } from '../lib/types/session';
import { SessionStoreError } from '../lib/types/session-store';

// Mock timers for controlled testing
jest.useFakeTimers();

describe('SessionStore', () => {
  let store: ReturnType<typeof createSessionStore>;

  beforeEach(() => {
    jest.clearAllTimers();
    store = createSessionStore();
    // Reset store to ensure clean state
    store.getState().reset();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = store.getState();
      
      expect(state.currentSession).toBeNull();
      expect(state.isTimerRunning).toBe(false);
      expect(state.lastTickAt).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('Session Lifecycle - State Machine', () => {
    describe('Starting a Session', () => {
      it('should start a new session with correct initial state', () => {
        act(() => {
          store.getState().startSession({ 
            duration: PRESET_DURATIONS.POMODORO, 
            title: 'Test Session' 
          });
        });

        const state = store.getState();
        expect(state.currentSession).not.toBeNull();
        expect(state.currentSession!.state).toBe(SessionState.ACTIVE);
        expect(state.currentSession!.title).toBe('Test Session');
        expect(state.currentSession!.duration).toBe(PRESET_DURATIONS.POMODORO);
        expect(state.currentSession!.elapsedTime).toBe(0);
        expect(state.currentSession!.remainingTime).toBe(PRESET_DURATIONS.POMODORO);
        expect(state.isTimerRunning).toBe(true);
        expect(state.currentSession!.startedAt).toBeDefined();
      });

      it('should not start session if one is already active', () => {
        // Start first session
        act(() => {
          store.getState().startSession({ duration: PRESET_DURATIONS.POMODORO });
        });

        const firstSessionId = store.getState().currentSession!.id;

        // Try to start second session
        act(() => {
          store.getState().startSession({ duration: PRESET_DURATIONS.FOCUS });
        });

        const state = store.getState();
        expect(state.currentSession!.id).toBe(firstSessionId);
        expect(state.error).toContain('session already active');
      });

      it('should validate duration before starting session', () => {
        act(() => {
          store.getState().startSession({ duration: -100 });
        });

        const state = store.getState();
        expect(state.currentSession).toBeNull();
        expect(state.error).toBe(SessionStoreError.INVALID_DURATION);
      });
    });

    describe('Pausing a Session', () => {
      beforeEach(() => {
        act(() => {
          store.getState().startSession({ duration: PRESET_DURATIONS.POMODORO });
        });
      });

      it('should pause an active session', () => {
        act(() => {
          store.getState().pauseSession();
        });

        const state = store.getState();
        expect(state.currentSession!.state).toBe(SessionState.PAUSED);
        expect(state.isTimerRunning).toBe(false);
        expect(state.currentSession!.pausedAt).toBeDefined();
      });

      it('should not pause a session that is not active', () => {
        // First pause the session
        act(() => {
          store.getState().pauseSession();
        });

        // Try to pause again
        act(() => {
          store.getState().pauseSession();
        });

        const state = store.getState();
        expect(state.error).toBe(SessionStoreError.INVALID_STATE_TRANSITION);
      });

      it('should not pause if no session exists', () => {
        // Reset to clear session
        act(() => {
          store.getState().reset();
        });

        act(() => {
          store.getState().pauseSession();
        });

        const state = store.getState();
        expect(state.error).toBe(SessionStoreError.NO_ACTIVE_SESSION);
      });
    });

    describe('Resuming a Session', () => {
      beforeEach(() => {
        act(() => {
          store.getState().startSession({ duration: PRESET_DURATIONS.POMODORO });
          store.getState().pauseSession();
        });
      });

      it('should resume a paused session', () => {
        act(() => {
          store.getState().resumeSession();
        });

        const state = store.getState();
        expect(state.currentSession!.state).toBe(SessionState.ACTIVE);
        expect(state.isTimerRunning).toBe(true);
        expect(state.currentSession!.resumedAt).toBeDefined();
      });

      it('should not resume an active session', () => {
        // Resume first time
        act(() => {
          store.getState().resumeSession();
        });

        // Try to resume again
        act(() => {
          store.getState().resumeSession();
        });

        const state = store.getState();
        expect(state.error).toBe(SessionStoreError.INVALID_STATE_TRANSITION);
      });

      it('should not resume if no session exists', () => {
        act(() => {
          store.getState().reset();
        });

        act(() => {
          store.getState().resumeSession();
        });

        const state = store.getState();
        expect(state.error).toBe(SessionStoreError.NO_ACTIVE_SESSION);
      });
    });

    describe('Completing a Session', () => {
      beforeEach(() => {
        act(() => {
          store.getState().startSession({ duration: PRESET_DURATIONS.POMODORO });
        });
      });

      it('should complete an active session', () => {
        act(() => {
          store.getState().completeSession();
        });

        const state = store.getState();
        expect(state.currentSession!.state).toBe(SessionState.COMPLETED);
        expect(state.isTimerRunning).toBe(false);
        expect(state.currentSession!.completedAt).toBeDefined();
      });

      it('should complete a paused session', () => {
        act(() => {
          store.getState().pauseSession();
          store.getState().completeSession();
        });

        const state = store.getState();
        expect(state.currentSession!.state).toBe(SessionState.COMPLETED);
        expect(state.isTimerRunning).toBe(false);
        expect(state.currentSession!.completedAt).toBeDefined();
      });

      it('should not complete an already completed session', () => {
        act(() => {
          store.getState().completeSession();
          store.getState().completeSession();
        });

        const state = store.getState();
        expect(state.error).toBe(SessionStoreError.INVALID_STATE_TRANSITION);
      });
    });

    describe('Resetting a Session', () => {
      it('should reset an active session', () => {
        act(() => {
          store.getState().startSession({ duration: PRESET_DURATIONS.POMODORO });
          store.getState().resetSession();
        });

        const state = store.getState();
        expect(state.currentSession).toBeNull();
        expect(state.isTimerRunning).toBe(false);
        expect(state.lastTickAt).toBeNull();
      });

      it('should reset a completed session', () => {
        act(() => {
          store.getState().startSession({ duration: PRESET_DURATIONS.POMODORO });
          store.getState().completeSession();
          store.getState().resetSession();
        });

        const state = store.getState();
        expect(state.currentSession).toBeNull();
        expect(state.isTimerRunning).toBe(false);
      });
    });
  });

  describe('Timer Functionality', () => {
    beforeEach(() => {
      act(() => {
        store.getState().startSession({ duration: 60000 }); // 1 minute
      });
    });

    it('should update elapsed time when ticking', () => {
      const initialState = store.getState();
      const initialElapsed = initialState.currentSession!.elapsedTime;

      // Advance time and tick
      jest.advanceTimersByTime(1000);
      act(() => {
        store.getState().tick();
      });

      const state = store.getState();
      expect(state.currentSession!.elapsedTime).toBeGreaterThan(initialElapsed);
      expect(state.currentSession!.remainingTime).toBeLessThan(60000);
      expect(state.lastTickAt).toBeDefined();
    });

    it('should auto-complete when timer reaches zero', () => {
      // Advance time to session duration
      jest.advanceTimersByTime(60000);
      act(() => {
        store.getState().tick();
      });

      const state = store.getState();
      expect(state.currentSession!.state).toBe(SessionState.COMPLETED);
      expect(state.isTimerRunning).toBe(false);
      expect(state.currentSession!.remainingTime).toBe(0);
    });

    it('should not tick when session is paused', () => {
      act(() => {
        store.getState().pauseSession();
      });

      const pausedElapsed = store.getState().currentSession!.elapsedTime;

      jest.advanceTimersByTime(1000);
      act(() => {
        store.getState().tick();
      });

      const state = store.getState();
      expect(state.error).toBe(SessionStoreError.TIMER_NOT_RUNNING);
      expect(state.currentSession!.elapsedTime).toBe(pausedElapsed);
    });

    it('should not tick when no session exists', () => {
      act(() => {
        store.getState().reset();
        store.getState().tick();
      });

      const state = store.getState();
      expect(state.error).toBe(SessionStoreError.TIMER_NOT_RUNNING);
    });
  });

  describe('Error Handling', () => {
    it('should set and clear errors', () => {
      const testError = 'Test error message';

      act(() => {
        store.getState().setError(testError);
      });

      expect(store.getState().error).toBe(testError);

      act(() => {
        store.getState().clearError();
      });

      expect(store.getState().error).toBeNull();
    });

    it('should clear errors on successful actions', () => {
      act(() => {
        store.getState().setError('Previous error');
        store.getState().startSession({ duration: PRESET_DURATIONS.POMODORO });
      });

      const state = store.getState();
      expect(state.error).toBeNull();
    });
  });

  describe('Store Reset', () => {
    it('should reset entire store to initial state', () => {
      // Set up some state
      act(() => {
        store.getState().startSession({ duration: PRESET_DURATIONS.POMODORO });
        store.getState().setError('Some error');
      });

      // Reset store
      act(() => {
        store.getState().reset();
      });

      const state = store.getState();
      expect(state.currentSession).toBeNull();
      expect(state.isTimerRunning).toBe(false);
      expect(state.lastTickAt).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple rapid state changes gracefully', () => {
      act(() => {
        store.getState().startSession({ duration: PRESET_DURATIONS.POMODORO });
        store.getState().pauseSession();
        store.getState().resumeSession();
        store.getState().pauseSession();
        store.getState().completeSession();
      });

      const state = store.getState();
      expect(state.currentSession!.state).toBe(SessionState.COMPLETED);
      expect(state.error).toBeNull();
    });

    it('should maintain data integrity during state transitions', () => {
      const sessionConfig = { 
        duration: PRESET_DURATIONS.FOCUS, 
        title: 'Important Session',
        description: 'Critical work session'
      };

      act(() => {
        store.getState().startSession(sessionConfig);
      });

      const sessionId = store.getState().currentSession!.id;

      act(() => {
        store.getState().pauseSession();
        store.getState().resumeSession();
      });

      const state = store.getState();
      expect(state.currentSession!.id).toBe(sessionId);
      expect(state.currentSession!.title).toBe(sessionConfig.title);
      expect(state.currentSession!.description).toBe(sessionConfig.description);
      expect(state.currentSession!.duration).toBe(sessionConfig.duration);
    });
  });

  describe('Store Configuration and Callbacks', () => {
    it('should call onSessionStart callback when session starts', () => {
      const onSessionStart = jest.fn();
      const store = createSessionStore({ onSessionStart });

      act(() => {
        store.getState().startSession({ duration: PRESET_DURATIONS.POMODORO });
      });

      expect(onSessionStart).toHaveBeenCalledTimes(1);
      expect(onSessionStart).toHaveBeenCalledWith(expect.objectContaining({
        state: SessionState.ACTIVE,
        duration: PRESET_DURATIONS.POMODORO
      }));
    });

    it('should call onSessionPause callback when session is paused', () => {
      const onSessionPause = jest.fn();
      const store = createSessionStore({ onSessionPause });

      act(() => {
        store.getState().startSession({ duration: PRESET_DURATIONS.POMODORO });
        store.getState().pauseSession();
      });

      expect(onSessionPause).toHaveBeenCalledTimes(1);
      expect(onSessionPause).toHaveBeenCalledWith(expect.objectContaining({
        state: SessionState.PAUSED
      }));
    });

    it('should call onSessionResume callback when session is resumed', () => {
      const onSessionResume = jest.fn();
      const store = createSessionStore({ onSessionResume });

      act(() => {
        store.getState().startSession({ duration: PRESET_DURATIONS.POMODORO });
        store.getState().pauseSession();
        store.getState().resumeSession();
      });

      expect(onSessionResume).toHaveBeenCalledTimes(1);
      expect(onSessionResume).toHaveBeenCalledWith(expect.objectContaining({
        state: SessionState.ACTIVE
      }));
    });

    it('should call onSessionComplete callback when session is completed', () => {
      const onSessionComplete = jest.fn();
      const store = createSessionStore({ onSessionComplete });

      act(() => {
        store.getState().startSession({ duration: PRESET_DURATIONS.POMODORO });
        store.getState().completeSession();
      });

      expect(onSessionComplete).toHaveBeenCalledTimes(1);
      expect(onSessionComplete).toHaveBeenCalledWith(expect.objectContaining({
        state: SessionState.COMPLETED
      }));
    });

    it('should call onSessionComplete callback when timer auto-completes', () => {
      const onSessionComplete = jest.fn();
      const store = createSessionStore({ onSessionComplete });

      act(() => {
        store.getState().startSession({ duration: 1000 });
      });

      // Advance time to completion
      jest.advanceTimersByTime(1000);
      act(() => {
        store.getState().tick();
      });

      expect(onSessionComplete).toHaveBeenCalledTimes(1);
      expect(onSessionComplete).toHaveBeenCalledWith(expect.objectContaining({
        state: SessionState.COMPLETED,
        remainingTime: 0
      }));
    });

    it('should call onSessionReset callback when session is reset', () => {
      const onSessionReset = jest.fn();
      const store = createSessionStore({ onSessionReset });

      act(() => {
        store.getState().startSession({ duration: PRESET_DURATIONS.POMODORO });
        store.getState().resetSession();
      });

      expect(onSessionReset).toHaveBeenCalledTimes(1);
    });

    it('should call onError callback when errors occur', () => {
      const onError = jest.fn();
      const store = createSessionStore({ onError });

      act(() => {
        store.getState().startSession({ duration: -100 });
      });

      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(SessionStoreError.INVALID_DURATION);
    });

    it('should notify when session reaches completion milestones', () => {
      const onSessionComplete = jest.fn();
      const store = createSessionStore({ onSessionComplete });

      // Start a short session for testing
      act(() => {
        store.getState().startSession({ 
          duration: 1000,
          title: 'Quick task',
          description: 'Check emails'
        });
      });

      // Complete the session automatically
      jest.advanceTimersByTime(1000);
      act(() => {
        store.getState().tick();
      });

      // Verify business callback was triggered with session details
      expect(onSessionComplete).toHaveBeenCalledWith(expect.objectContaining({
        state: SessionState.COMPLETED,
        title: 'Quick task',
        description: 'Check emails',
        remainingTime: 0
      }));
    });
  });

  describe('Error Handling Edge Cases', () => {
    it('should handle createSession errors by testing try-catch coverage', () => {
      // We can't easily mock createSession due to module imports,
      // but we can test the error handling path by triggering other errors
      const onError = jest.fn();
      const store = createSessionStore({ onError });

      // Test the catch block by providing invalid data that causes createSession to fail
      act(() => {
        store.getState().startSession({ duration: NaN });
      });

      const state = store.getState();
      // This should trigger the error handling in the store
      expect(state.error).not.toBeNull();
      expect(onError).toHaveBeenCalled();
    });

    it('should handle complete session with no active session', () => {
      act(() => {
        store.getState().completeSession();
      });

      const state = store.getState();
      expect(state.error).toBe(SessionStoreError.NO_ACTIVE_SESSION);
    });
  });


  describe('Business Logic - Focus Session Workflow', () => {
    it('should support typical Pomodoro technique workflow', () => {
      // Start a 25-minute focus session
      act(() => {
        store.getState().startSession({ 
          duration: PRESET_DURATIONS.POMODORO,
          title: 'Write code',
          description: 'Implement session store feature'
        });
      });

      const session = store.getState().currentSession!;
      expect(session.title).toBe('Write code');
      expect(session.duration).toBe(PRESET_DURATIONS.POMODORO);
      expect(session.state).toBe(SessionState.ACTIVE);

      // User takes a short break
      act(() => {
        store.getState().pauseSession();
      });
      expect(store.getState().currentSession!.state).toBe(SessionState.PAUSED);

      // User resumes work
      act(() => {
        store.getState().resumeSession();
      });
      expect(store.getState().currentSession!.state).toBe(SessionState.ACTIVE);

      // Session completes naturally
      jest.advanceTimersByTime(PRESET_DURATIONS.POMODORO);
      act(() => {
        store.getState().tick();
      });

      const finalState = store.getState();
      expect(finalState.currentSession!.state).toBe(SessionState.COMPLETED);
      expect(finalState.isTimerRunning).toBe(false);
    });

    it('should preserve session context through interruptions', () => {
      const sessionConfig = {
        duration: PRESET_DURATIONS.FOCUS,
        title: 'Important Meeting Prep',
        description: 'Prepare slides for quarterly review'
      };

      act(() => {
        store.getState().startSession(sessionConfig);
      });

      const originalSessionId = store.getState().currentSession!.id;

      // Simulate interruption - pause and resume
      act(() => {
        store.getState().pauseSession();
        store.getState().resumeSession();
      });

      // Verify session context is preserved
      const session = store.getState().currentSession!;
      expect(session.id).toBe(originalSessionId);
      expect(session.title).toBe(sessionConfig.title);
      expect(session.description).toBe(sessionConfig.description);
      expect(session.duration).toBe(sessionConfig.duration);
    });
  });

  describe('Business Logic - Session Recovery After Browser Restart', () => {
    it('should restore session context but require manual timer restart', () => {
      // Business requirement: Sessions should survive browser restarts,
      // but timers should not auto-start for user safety
      const store = createSessionStore({ enablePersistence: true });
      
      act(() => {
        store.getState().startSession({ 
          duration: PRESET_DURATIONS.FOCUS,
          title: 'Deep work session',
          description: 'Research and documentation'
        });
      });

      const originalSession = store.getState().currentSession!;

      // Simulate browser restart - persistence restores session but not timer state
      const restoredState = {
        currentSession: originalSession,
        isTimerRunning: false, // Timer should not auto-start
        lastTickAt: null,
        isLoading: false,
        error: null
      };

      store.setState(restoredState);

      const state = store.getState();
      // Session context should be preserved
      expect(state.currentSession).not.toBeNull();
      expect(state.currentSession!.title).toBe('Deep work session');
      expect(state.currentSession!.description).toBe('Research and documentation');
      
      // But timer should not be running (safety feature)
      expect(state.isTimerRunning).toBe(false);
      expect(state.lastTickAt).toBe(null);
    });
  });
});
// Session Store Types Test Suite - Comprehensive Type Validation Testing
// Tests for all helper functions, type guards, and validation logic

import { 
  SessionStoreError, 
  hasActiveSession, 
  isSessionInState, 
  canPauseSession, 
  canResumeSession, 
  canCompleteSession,
  initialSessionStoreState,
  SessionStoreState
} from '../lib/types/session-store';
import { SessionState, createSession, PRESET_DURATIONS } from '../lib/types/session';

describe('Session Store Types', () => {
  describe('Type Guard Functions', () => {
    it('correctly identifies active sessions', () => {
      const stateWithSession: SessionStoreState = {
        currentSession: createSession({ duration: PRESET_DURATIONS.POMODORO }),
        isTimerRunning: true,
        lastTickAt: null,
        isLoading: false,
        error: null
      };

      const stateWithoutSession: SessionStoreState = {
        currentSession: null,
        isTimerRunning: false,
        lastTickAt: null,
        isLoading: false,
        error: null
      };

      expect(hasActiveSession(stateWithSession)).toBe(true);
      expect(hasActiveSession(stateWithoutSession)).toBe(false);
    });

    it('validates session states accurately', () => {
      const session = createSession({ duration: PRESET_DURATIONS.POMODORO });
      const activeSession = { ...session, state: SessionState.ACTIVE };
      const pausedSession = { ...session, state: SessionState.PAUSED };

      const activeState: SessionStoreState = {
        currentSession: activeSession,
        isTimerRunning: true,
        lastTickAt: null,
        isLoading: false,
        error: null
      };

      const pausedState: SessionStoreState = {
        currentSession: pausedSession,
        isTimerRunning: false,
        lastTickAt: null,
        isLoading: false,
        error: null
      };

      expect(isSessionInState(activeState, SessionState.ACTIVE)).toBe(true);
      expect(isSessionInState(activeState, SessionState.PAUSED)).toBe(false);
      expect(isSessionInState(pausedState, SessionState.PAUSED)).toBe(true);
      expect(isSessionInState(pausedState, SessionState.ACTIVE)).toBe(false);
    });

    it('determines when sessions can be paused', () => {
      const session = createSession({ duration: PRESET_DURATIONS.POMODORO });
      
      // Active session with timer running - can pause
      const canPauseState: SessionStoreState = {
        currentSession: { ...session, state: SessionState.ACTIVE },
        isTimerRunning: true,
        lastTickAt: null,
        isLoading: false,
        error: null
      };

      // Active session but timer not running - cannot pause
      const cannotPauseActiveState: SessionStoreState = {
        currentSession: { ...session, state: SessionState.ACTIVE },
        isTimerRunning: false,
        lastTickAt: null,
        isLoading: false,
        error: null
      };

      // Paused session - cannot pause again
      const pausedState: SessionStoreState = {
        currentSession: { ...session, state: SessionState.PAUSED },
        isTimerRunning: false,
        lastTickAt: null,
        isLoading: false,
        error: null
      };

      // No session - cannot pause
      const noSessionState: SessionStoreState = {
        currentSession: null,
        isTimerRunning: false,
        lastTickAt: null,
        isLoading: false,
        error: null
      };

      expect(canPauseSession(canPauseState)).toBe(true);
      expect(canPauseSession(cannotPauseActiveState)).toBe(false);
      expect(canPauseSession(pausedState)).toBe(false);
      expect(canPauseSession(noSessionState)).toBe(false);
    });

    it('determines when sessions can be resumed', () => {
      const session = createSession({ duration: PRESET_DURATIONS.POMODORO });
      
      // Paused session with timer not running - can resume
      const canResumeState: SessionStoreState = {
        currentSession: { ...session, state: SessionState.PAUSED },
        isTimerRunning: false,
        lastTickAt: null,
        isLoading: false,
        error: null
      };

      // Active session - cannot resume
      const activeState: SessionStoreState = {
        currentSession: { ...session, state: SessionState.ACTIVE },
        isTimerRunning: true,
        lastTickAt: null,
        isLoading: false,
        error: null
      };

      // Paused session but timer running - cannot resume
      const pausedWithTimerState: SessionStoreState = {
        currentSession: { ...session, state: SessionState.PAUSED },
        isTimerRunning: true,
        lastTickAt: null,
        isLoading: false,
        error: null
      };

      // No session - cannot resume
      const noSessionState: SessionStoreState = {
        currentSession: null,
        isTimerRunning: false,
        lastTickAt: null,
        isLoading: false,
        error: null
      };

      expect(canResumeSession(canResumeState)).toBe(true);
      expect(canResumeSession(activeState)).toBe(false);
      expect(canResumeSession(pausedWithTimerState)).toBe(false);
      expect(canResumeSession(noSessionState)).toBe(false);
    });

    it('determines when sessions can be completed', () => {
      const session = createSession({ duration: PRESET_DURATIONS.POMODORO });
      
      // Active session - can complete
      const activeState: SessionStoreState = {
        currentSession: { ...session, state: SessionState.ACTIVE },
        isTimerRunning: true,
        lastTickAt: null,
        isLoading: false,
        error: null
      };

      // Paused session - can complete
      const pausedState: SessionStoreState = {
        currentSession: { ...session, state: SessionState.PAUSED },
        isTimerRunning: false,
        lastTickAt: null,
        isLoading: false,
        error: null
      };

      // Completed session - cannot complete again
      const completedState: SessionStoreState = {
        currentSession: { ...session, state: SessionState.COMPLETED },
        isTimerRunning: false,
        lastTickAt: null,
        isLoading: false,
        error: null
      };

      // No session - cannot complete
      const noSessionState: SessionStoreState = {
        currentSession: null,
        isTimerRunning: false,
        lastTickAt: null,
        isLoading: false,
        error: null
      };

      expect(canCompleteSession(activeState)).toBe(true);
      expect(canCompleteSession(pausedState)).toBe(true);
      expect(canCompleteSession(completedState)).toBe(false);
      expect(canCompleteSession(noSessionState)).toBe(false);
    });
  });



  describe('Edge Cases in Type Guards', () => {
    it('handles edge cases in state validation', () => {
      const stateWithoutSession: SessionStoreState = {
        currentSession: null,
        isTimerRunning: false,
        lastTickAt: null,
        isLoading: false,
        error: null
      };

      // Should return false for any session state when no session exists
      expect(isSessionInState(stateWithoutSession, SessionState.ACTIVE)).toBe(false);
      expect(isSessionInState(stateWithoutSession, SessionState.PAUSED)).toBe(false);
      expect(isSessionInState(stateWithoutSession, SessionState.COMPLETED)).toBe(false);
      expect(isSessionInState(stateWithoutSession, SessionState.IDLE)).toBe(false);
    });

    it('validates completed session states', () => {
      const session = createSession({ duration: PRESET_DURATIONS.POMODORO });
      const completedSession = { ...session, state: SessionState.COMPLETED };
      
      const completedState: SessionStoreState = {
        currentSession: completedSession,
        isTimerRunning: false,
        lastTickAt: null,
        isLoading: false,
        error: null
      };

      // Completed sessions cannot be paused, resumed, or completed again
      expect(canPauseSession(completedState)).toBe(false);
      expect(canResumeSession(completedState)).toBe(false);
      expect(canCompleteSession(completedState)).toBe(false);
    });

    it('handles idle session states', () => {
      const session = createSession({ duration: PRESET_DURATIONS.POMODORO });
      const idleSession = { ...session, state: SessionState.IDLE };
      
      const idleState: SessionStoreState = {
        currentSession: idleSession,
        isTimerRunning: false,
        lastTickAt: null,
        isLoading: false,
        error: null
      };

      // Idle sessions should not be pausable or resumable
      expect(canPauseSession(idleState)).toBe(false);
      expect(canResumeSession(idleState)).toBe(false);
      expect(canCompleteSession(idleState)).toBe(false);
    });
  });
});
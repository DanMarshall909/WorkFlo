// Session Store Types - Zustand Store Interface with State Machine Logic
// Advanced TypeScript patterns for robust store typing

import { 
  Session, 
  SessionState, 
  SessionEvent, 
  SessionId, 
  Duration, 
  Timestamp,
  createTimestamp,
  isValidTransition 
} from './session';

// Store State Interface
export interface SessionStoreState {
  // Current session data
  readonly currentSession: Session | null;
  readonly isTimerRunning: boolean;
  readonly lastTickAt: Timestamp | null;
  
  // Store status
  readonly isLoading: boolean;
  readonly error: string | null;
}

// Store Actions Interface
export interface SessionStoreActions {
  // Session lifecycle
  startSession: (config: { duration: number; title?: string; description?: string }) => void;
  pauseSession: () => void;
  resumeSession: () => void;
  completeSession: () => void;
  resetSession: () => void;
  
  // Internal timer management
  tick: () => void;
  
  // Error handling
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // Store management
  reset: () => void;
}

// Complete Store Interface
export interface SessionStore extends SessionStoreState, SessionStoreActions {}

// Store Configuration
export interface SessionStoreConfig {
  // Persistence
  persistenceKey?: string;
  enablePersistence?: boolean;
  
  // Timer configuration
  tickInterval?: number; // milliseconds
  
  // Callbacks
  onSessionStart?: (session: Session) => void;
  onSessionPause?: (session: Session) => void;
  onSessionResume?: (session: Session) => void;
  onSessionComplete?: (session: Session) => void;
  onSessionReset?: () => void;
  onError?: (error: string) => void;
}

// Initial Store State
export const initialSessionStoreState: SessionStoreState = {
  currentSession: null,
  isTimerRunning: false,
  lastTickAt: null,
  isLoading: false,
  error: null,
};


// Store Error Types
export enum SessionStoreError {
  NO_ACTIVE_SESSION = 'No active session',
  INVALID_STATE_TRANSITION = 'Invalid state transition',
  SESSION_ALREADY_COMPLETED = 'Session already completed',
  TIMER_NOT_RUNNING = 'Timer not running',
  INVALID_DURATION = 'Invalid session duration',
}

// Type Guards for Store State
export const hasActiveSession = (state: SessionStoreState): state is SessionStoreState & { currentSession: Session } => {
  return state.currentSession !== null;
};

export const isSessionInState = (state: SessionStoreState, sessionState: SessionState): boolean => {
  return hasActiveSession(state) && state.currentSession.state === sessionState;
};

export const canPauseSession = (state: SessionStoreState): boolean => {
  return hasActiveSession(state) && 
         state.currentSession.state === SessionState.ACTIVE && 
         state.isTimerRunning;
};

export const canResumeSession = (state: SessionStoreState): boolean => {
  return hasActiveSession(state) && 
         state.currentSession.state === SessionState.PAUSED && 
         !state.isTimerRunning;
};

export const canCompleteSession = (state: SessionStoreState): boolean => {
  return hasActiveSession(state) && 
         (state.currentSession.state === SessionState.ACTIVE || 
          state.currentSession.state === SessionState.PAUSED);
};

export const validateStoreAction = (state: SessionStoreState, action: string): boolean => {
  // Validate if the action can be performed given the current state
  switch (action) {
    case 'pause':
      return canPauseSession(state);
    case 'resume':
      return canResumeSession(state);
    case 'complete':
      return canCompleteSession(state);
    case 'start':
      return !hasActiveSession(state);
    case 'reset':
      return hasActiveSession(state);
    default:
      return false;
  }
};


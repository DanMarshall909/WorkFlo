/**
 * Session Timer Types
 * 
 * Advanced TypeScript patterns demonstrated:
 * - Branded types for type safety
 * - State machine modeling with union types
 * - Temporal value objects
 */

// Branded types for stronger type safety
export type SessionId = string & { readonly __brand: 'SessionId' };
export type Duration = number & { readonly __brand: 'Duration' }; // milliseconds
export type Timestamp = number & { readonly __brand: 'Timestamp' };

// Session state machine - explicit states prevent invalid transitions
export type SessionState = 
  | 'idle'
  | 'running'
  | 'paused'
  | 'completed'
  | 'cancelled';

// Session types following ADHD-friendly patterns
export type SessionType = 
  | 'focus-25'     // 25-minute Pomodoro
  | 'focus-50'     // 50-minute deep work
  | 'focus-90'     // 90-minute flow state
  | 'break-5'      // 5-minute break
  | 'break-15'     // 15-minute break
  | 'break-30';    // 30-minute break

// Core session entity
export interface Session {
  readonly id: SessionId;
  readonly type: SessionType;
  readonly duration: Duration;
  readonly startedAt?: Timestamp;
  readonly pausedAt?: Timestamp;
  readonly completedAt?: Timestamp;
  readonly elapsedTime: Duration;
  readonly state: SessionState;
}

// Store state interface
export interface SessionTimerState {
  readonly currentSession: Session | null;
  readonly isRunning: boolean;
  readonly isPaused: boolean;
  readonly timeRemaining: Duration;
  readonly progress: number; // 0-1
}

// Store actions interface 
export interface SessionTimerActions {
  startSession: (type: SessionType) => void;
  pauseSession: () => void;
  resumeSession: () => void;
  completeSession: () => void;
  cancelSession: () => void;
  tick: () => void; // Called every second by timer
  reset: () => void;
}

// Combined store interface
export interface SessionTimerStore extends SessionTimerState, SessionTimerActions {}

// Utility functions for branded types
export const createSessionId = (): SessionId => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID() as SessionId;
  }
  // Fallback for test environments
  return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` as SessionId;
};

export const createDuration = (ms: number): Duration => 
  ms as Duration;

export const createTimestamp = (): Timestamp => 
  Date.now() as Timestamp;

// Session type durations in milliseconds
export const SESSION_DURATIONS: Record<SessionType, Duration> = {
  'focus-25': createDuration(25 * 60 * 1000),
  'focus-50': createDuration(50 * 60 * 1000), 
  'focus-90': createDuration(90 * 60 * 1000),
  'break-5': createDuration(5 * 60 * 1000),
  'break-15': createDuration(15 * 60 * 1000),
  'break-30': createDuration(30 * 60 * 1000),
} as const;

// Valid state transitions for state machine logic
export const VALID_TRANSITIONS: Record<SessionState, SessionState[]> = {
  idle: ['running'],
  running: ['paused', 'completed', 'cancelled'],
  paused: ['running', 'cancelled'],
  completed: ['idle'],
  cancelled: ['idle'],
} as const;
// Session Timer Types - Foundation for TDD Session Implementation
// Following advanced TypeScript patterns with branded types and state machines

// Branded Types for Type Safety
export type SessionId = string & { readonly __brand: 'SessionId' };
export type Duration = number & { readonly __brand: 'Duration' };
export type Timestamp = number & { readonly __brand: 'Timestamp' };

// Session State Machine
export enum SessionState {
  IDLE = 'idle',
  ACTIVE = 'active', 
  PAUSED = 'paused',
  COMPLETED = 'completed'
}

// Session State Transitions
export type SessionTransition = 
  | { from: SessionState.IDLE; to: SessionState.ACTIVE }
  | { from: SessionState.ACTIVE; to: SessionState.PAUSED }
  | { from: SessionState.ACTIVE; to: SessionState.COMPLETED }
  | { from: SessionState.PAUSED; to: SessionState.ACTIVE }
  | { from: SessionState.PAUSED; to: SessionState.COMPLETED };

// Core Session Configuration
export interface SessionConfig {
  readonly id: SessionId;
  readonly duration: Duration; // in milliseconds
  readonly title?: string;
  readonly description?: string;
}

// Session Runtime State
export interface SessionRuntime {
  readonly state: SessionState;
  readonly startedAt?: Timestamp;
  readonly pausedAt?: Timestamp;
  readonly resumedAt?: Timestamp;
  readonly completedAt?: Timestamp;
  readonly elapsedTime: Duration;
  readonly remainingTime: Duration;
}

// Complete Session Entity
export interface Session extends SessionConfig, SessionRuntime {}

// Session Events for State Machine
export type SessionEvent = 
  | { type: 'START'; timestamp: Timestamp }
  | { type: 'PAUSE'; timestamp: Timestamp }
  | { type: 'RESUME'; timestamp: Timestamp }
  | { type: 'COMPLETE'; timestamp: Timestamp }
  | { type: 'RESET'; timestamp: Timestamp };

// Predefined Session Durations (in milliseconds)
export const PRESET_DURATIONS = {
  POMODORO: 25 * 60 * 1000 as Duration,      // 25 minutes
  FOCUS: 50 * 60 * 1000 as Duration,         // 50 minutes  
  DEEP_WORK: 90 * 60 * 1000 as Duration      // 90 minutes
} as const;

// Type Guards
export const isSessionId = (value: string): value is SessionId => {
  return typeof value === 'string' && value.length > 0;
};

export const isDuration = (value: number): value is Duration => {
  return typeof value === 'number' && value >= 0;
};

export const isTimestamp = (value: number): value is Timestamp => {
  return typeof value === 'number' && value > 0;
};

export const isValidSessionState = (state: string): state is SessionState => {
  return Object.values(SessionState).includes(state as SessionState);
};

// Utility Type Constructors
export const createSessionId = (id: string): SessionId => {
  if (!isSessionId(id)) {
    throw new Error('Invalid session ID');
  }
  return id as SessionId;
};

export const createDuration = (ms: number): Duration => {
  if (!isDuration(ms)) {
    throw new Error('Invalid duration');
  }
  return ms as Duration;
};

export const createTimestamp = (time?: number): Timestamp => {
  const timestamp = time ?? Date.now();
  if (!isTimestamp(timestamp)) {
    throw new Error('Invalid timestamp');
  }
  return timestamp as Timestamp;
};

// State Machine Validation
export const isValidTransition = (from: SessionState, to: SessionState): boolean => {
  const validTransitions: Record<SessionState, SessionState[]> = {
    [SessionState.IDLE]: [SessionState.ACTIVE],
    [SessionState.ACTIVE]: [SessionState.PAUSED, SessionState.COMPLETED],
    [SessionState.PAUSED]: [SessionState.ACTIVE, SessionState.COMPLETED],
    [SessionState.COMPLETED]: [] // Terminal state
  };
  
  return validTransitions[from].includes(to);
};

// Session Factory Functions
export const createSessionConfig = (config: {
  duration: number;
  title?: string;
  description?: string;
}): SessionConfig => ({
  id: createSessionId(generateSessionId()),
  duration: createDuration(config.duration),
  title: config.title,
  description: config.description
});

// Helper function to generate session IDs with fallback for test environments
const generateSessionId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for test environments
  return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const createInitialSessionRuntime = (duration: Duration): SessionRuntime => ({
  state: SessionState.IDLE,
  elapsedTime: createDuration(0),
  remainingTime: duration
});

export const createSession = (config: {
  duration: number;
  title?: string;
  description?: string;
}): Session => ({
  ...createSessionConfig(config),
  ...createInitialSessionRuntime(createDuration(config.duration))
});
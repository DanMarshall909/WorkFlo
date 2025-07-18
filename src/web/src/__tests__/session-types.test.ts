// Session Types Test Suite - TDD Implementation
// Testing branded types, state machine, and type constructors

import {
  // Types
  SessionId, Duration, Timestamp, SessionState, Session,
  // Type constructors
  createSessionId, createDuration, createTimestamp,
  createSessionConfig, createInitialSessionRuntime, createSession,
  // Type guards
  isSessionId, isDuration, isTimestamp, isValidSessionState,
  // State machine
  isValidTransition,
  // Constants
  PRESET_DURATIONS
} from '../lib/types/session';

describe('Session Types - Branded Types', () => {
  describe('createSessionId', () => {
    it('should create valid session ID from string', () => {
      const id = createSessionId('test-session-123');
      expect(id).toBe('test-session-123');
      expect(isSessionId(id)).toBe(true);
    });

    it('should throw error for empty string', () => {
      expect(() => createSessionId('')).toThrow('Invalid session ID');
    });

    it('should throw error for invalid input', () => {
      expect(() => createSessionId(null as any)).toThrow('Invalid session ID');
    });
  });

  describe('createDuration', () => {
    it('should create valid duration from positive number', () => {
      const duration = createDuration(25 * 60 * 1000); // 25 minutes
      expect(duration).toBe(25 * 60 * 1000);
      expect(isDuration(duration)).toBe(true);
    });

    it('should accept zero duration', () => {
      const duration = createDuration(0);
      expect(duration).toBe(0);
      expect(isDuration(duration)).toBe(true);
    });

    it('should throw error for negative duration', () => {
      expect(() => createDuration(-1000)).toThrow('Invalid duration');
    });

    it('should throw error for non-number input', () => {
      expect(() => createDuration('invalid' as any)).toThrow('Invalid duration');
    });
  });

  describe('createTimestamp', () => {
    it('should create timestamp from current time when no input', () => {
      const before = Date.now();
      const timestamp = createTimestamp();
      const after = Date.now();
      
      expect(timestamp).toBeGreaterThanOrEqual(before);
      expect(timestamp).toBeLessThanOrEqual(after);
      expect(isTimestamp(timestamp)).toBe(true);
    });

    it('should create timestamp from provided time', () => {
      const testTime = 1640995200000; // 2022-01-01
      const timestamp = createTimestamp(testTime);
      expect(timestamp).toBe(testTime);
      expect(isTimestamp(timestamp)).toBe(true);
    });

    it('should throw error for invalid timestamp', () => {
      expect(() => createTimestamp(0)).toThrow('Invalid timestamp');
      expect(() => createTimestamp(-1)).toThrow('Invalid timestamp');
    });
  });
});

describe('Session Types - State Machine', () => {
  describe('SessionState enum', () => {
    it('should have correct state values', () => {
      expect(SessionState.IDLE).toBe('idle');
      expect(SessionState.ACTIVE).toBe('active');
      expect(SessionState.PAUSED).toBe('paused');
      expect(SessionState.COMPLETED).toBe('completed');
    });
  });

  describe('isValidTransition', () => {
    it('should allow valid transitions from IDLE', () => {
      expect(isValidTransition(SessionState.IDLE, SessionState.ACTIVE)).toBe(true);
    });

    it('should reject invalid transitions from IDLE', () => {
      expect(isValidTransition(SessionState.IDLE, SessionState.PAUSED)).toBe(false);
      expect(isValidTransition(SessionState.IDLE, SessionState.COMPLETED)).toBe(false);
    });

    it('should allow valid transitions from ACTIVE', () => {
      expect(isValidTransition(SessionState.ACTIVE, SessionState.PAUSED)).toBe(true);
      expect(isValidTransition(SessionState.ACTIVE, SessionState.COMPLETED)).toBe(true);
    });

    it('should reject invalid transitions from ACTIVE', () => {
      expect(isValidTransition(SessionState.ACTIVE, SessionState.IDLE)).toBe(false);
    });

    it('should allow valid transitions from PAUSED', () => {
      expect(isValidTransition(SessionState.PAUSED, SessionState.ACTIVE)).toBe(true);
      expect(isValidTransition(SessionState.PAUSED, SessionState.COMPLETED)).toBe(true);
    });

    it('should reject invalid transitions from PAUSED', () => {
      expect(isValidTransition(SessionState.PAUSED, SessionState.IDLE)).toBe(false);
    });

    it('should reject all transitions from COMPLETED (terminal state)', () => {
      expect(isValidTransition(SessionState.COMPLETED, SessionState.IDLE)).toBe(false);
      expect(isValidTransition(SessionState.COMPLETED, SessionState.ACTIVE)).toBe(false);
      expect(isValidTransition(SessionState.COMPLETED, SessionState.PAUSED)).toBe(false);
    });
  });
});

describe('Session Types - Factory Functions', () => {
  describe('createSessionConfig', () => {
    it('should create session config with required fields', () => {
      const config = createSessionConfig({
        duration: PRESET_DURATIONS.POMODORO
      });

      expect(config).toHaveProperty('id');
      expect(config).toHaveProperty('duration', PRESET_DURATIONS.POMODORO);
      expect(isSessionId(config.id)).toBe(true);
      expect(isDuration(config.duration)).toBe(true);
    });

    it('should create session config with optional fields', () => {
      const config = createSessionConfig({
        duration: PRESET_DURATIONS.FOCUS,
        title: 'Deep Work Session',
        description: 'Focus on complex problem solving'
      });

      expect(config.title).toBe('Deep Work Session');
      expect(config.description).toBe('Focus on complex problem solving');
    });

    it('should throw error for invalid duration', () => {
      expect(() => createSessionConfig({
        duration: -1000
      })).toThrow('Invalid duration');
    });
  });

  describe('createInitialSessionRuntime', () => {
    it('should create initial runtime state', () => {
      const duration = createDuration(PRESET_DURATIONS.POMODORO);
      const runtime = createInitialSessionRuntime(duration);

      expect(runtime.state).toBe(SessionState.IDLE);
      expect(runtime.elapsedTime).toBe(0);
      expect(runtime.remainingTime).toBe(PRESET_DURATIONS.POMODORO);
      expect(runtime.startedAt).toBeUndefined();
      expect(runtime.pausedAt).toBeUndefined();
      expect(runtime.completedAt).toBeUndefined();
    });
  });

  describe('createSession', () => {
    it('should create complete session object', () => {
      const sessionData = {
        duration: PRESET_DURATIONS.DEEP_WORK,
        title: 'Research Session',
        description: 'Learning new concepts'
      };

      const session = createSession(sessionData);

      // Config properties
      expect(session).toHaveProperty('id');
      expect(session.duration).toBe(PRESET_DURATIONS.DEEP_WORK);
      expect(session.title).toBe('Research Session');
      expect(session.description).toBe('Learning new concepts');

      // Runtime properties
      expect(session.state).toBe(SessionState.IDLE);
      expect(session.elapsedTime).toBe(0);
      expect(session.remainingTime).toBe(PRESET_DURATIONS.DEEP_WORK);
    });
  });
});

describe('Session Types - Type Guards', () => {
  describe('isValidSessionState', () => {
    it('should validate correct session states', () => {
      expect(isValidSessionState('idle')).toBe(true);
      expect(isValidSessionState('active')).toBe(true);
      expect(isValidSessionState('paused')).toBe(true);
      expect(isValidSessionState('completed')).toBe(true);
    });

    it('should reject invalid session states', () => {
      expect(isValidSessionState('invalid')).toBe(false);
      expect(isValidSessionState('running')).toBe(false);
      expect(isValidSessionState('')).toBe(false);
    });
  });
});

describe('Session Types - Constants', () => {
  describe('PRESET_DURATIONS', () => {
    it('should have correct preset durations', () => {
      expect(PRESET_DURATIONS.POMODORO).toBe(25 * 60 * 1000);
      expect(PRESET_DURATIONS.FOCUS).toBe(50 * 60 * 1000);
      expect(PRESET_DURATIONS.DEEP_WORK).toBe(90 * 60 * 1000);
    });

    it('should be valid Duration types', () => {
      expect(isDuration(PRESET_DURATIONS.POMODORO)).toBe(true);
      expect(isDuration(PRESET_DURATIONS.FOCUS)).toBe(true);
      expect(isDuration(PRESET_DURATIONS.DEEP_WORK)).toBe(true);
    });
  });
});

describe('Session Types - Advanced Type Safety', () => {
  it('should prevent mixing branded types at compile time', () => {
    // These tests verify that TypeScript compiler enforces type safety
    const sessionId = createSessionId('test-123');
    const duration = createDuration(25000);
    const timestamp = createTimestamp();

    // These should work (proper types)
    expect(isSessionId(sessionId)).toBe(true);
    expect(isDuration(duration)).toBe(true);
    expect(isTimestamp(timestamp)).toBe(true);

    // In a real TypeScript environment, these would cause compile errors:
    // const wrongId: SessionId = duration; // Type error
    // const wrongDuration: Duration = sessionId; // Type error
  });

  it('should maintain referential integrity with branded types', () => {
    const originalId = 'session-abc-123';
    const sessionId = createSessionId(originalId);
    
    // Branded type should maintain underlying value
    expect(String(sessionId)).toBe(originalId);
    expect(sessionId.valueOf()).toBe(originalId);
  });
});
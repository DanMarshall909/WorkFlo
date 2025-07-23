import {
  // Types
  SessionState,
  SessionConfig,
  SessionRuntime,
  SessionEvent,
  PRESET_DURATIONS,
  
  // Type Guards
  isSessionId,
  isDuration,
  isTimestamp,
  isValidSessionState,
  
  // Constructors
  createSessionId,
  createDuration,
  createTimestamp,
  
  // State Machine
  isValidTransition,
  
  // Factory Functions
  createSessionConfig,
  createInitialSessionRuntime,
  createSession
} from '../../../lib/types/session';

describe('Session Types - Foundation Layer', () => {
  describe('Branded Types', () => {
    describe('SessionId', () => {
      test('should create valid SessionId', () => {
        const id = 'test-session-123';
        const sessionId = createSessionId(id);
        expect(sessionId).toBe(id);
        expect(isSessionId(sessionId)).toBe(true);
      });

      test('should reject empty SessionId', () => {
        expect(() => createSessionId('')).toThrow('Invalid session ID');
        expect(isSessionId('')).toBe(false);
      });

      test('should reject non-string SessionId', () => {
        expect(isSessionId(123 as any)).toBe(false);
        expect(isSessionId(null as any)).toBe(false);
        expect(isSessionId(undefined as any)).toBe(false);
      });
    });

    describe('Duration', () => {
      test('should create valid Duration', () => {
        const ms = 1500;
        const duration = createDuration(ms);
        expect(duration).toBe(ms);
        expect(isDuration(duration)).toBe(true);
      });

      test('should reject negative Duration', () => {
        expect(() => createDuration(-1)).toThrow('Invalid duration');
        expect(isDuration(-1)).toBe(false);
      });

      test('should accept zero Duration for elapsed time', () => {
        const duration = createDuration(0);
        expect(duration).toBe(0);
        expect(isDuration(0)).toBe(true);
      });

      test('should reject non-number Duration', () => {
        expect(isDuration('123' as any)).toBe(false);
        expect(isDuration(null as any)).toBe(false);
      });
    });

    describe('Timestamp', () => {
      test('should create valid Timestamp with current time', () => {
        const before = Date.now();
        const timestamp = createTimestamp();
        const after = Date.now();
        
        expect(timestamp).toBeGreaterThanOrEqual(before);
        expect(timestamp).toBeLessThanOrEqual(after);
        expect(isTimestamp(timestamp)).toBe(true);
      });

      test('should create valid Timestamp with specific time', () => {
        const specificTime = 1609459200000; // 2021-01-01T00:00:00.000Z
        const timestamp = createTimestamp(specificTime);
        expect(timestamp).toBe(specificTime);
        expect(isTimestamp(timestamp)).toBe(true);
      });

      test('should reject invalid Timestamp', () => {
        expect(() => createTimestamp(-1)).toThrow('Invalid timestamp');
        expect(isTimestamp(-1)).toBe(false);
        expect(isTimestamp(0)).toBe(false);
      });
    });
  });

  describe('Session State Machine', () => {
    describe('SessionState enum', () => {
      test('should have all required states', () => {
        expect(SessionState.IDLE).toBe('idle');
        expect(SessionState.ACTIVE).toBe('active');
        expect(SessionState.PAUSED).toBe('paused');
        expect(SessionState.COMPLETED).toBe('completed');
      });

      test('should validate session states', () => {
        expect(isValidSessionState('idle')).toBe(true);
        expect(isValidSessionState('active')).toBe(true);
        expect(isValidSessionState('paused')).toBe(true);
        expect(isValidSessionState('completed')).toBe(true);
        expect(isValidSessionState('invalid')).toBe(false);
        expect(isValidSessionState('')).toBe(false);
      });
    });

    describe('State Transitions', () => {
      test('should allow valid transitions from IDLE', () => {
        expect(isValidTransition(SessionState.IDLE, SessionState.ACTIVE)).toBe(true);
        expect(isValidTransition(SessionState.IDLE, SessionState.PAUSED)).toBe(false);
        expect(isValidTransition(SessionState.IDLE, SessionState.COMPLETED)).toBe(false);
      });

      test('should allow valid transitions from ACTIVE', () => {
        expect(isValidTransition(SessionState.ACTIVE, SessionState.PAUSED)).toBe(true);
        expect(isValidTransition(SessionState.ACTIVE, SessionState.COMPLETED)).toBe(true);
        expect(isValidTransition(SessionState.ACTIVE, SessionState.IDLE)).toBe(false);
      });

      test('should allow valid transitions from PAUSED', () => {
        expect(isValidTransition(SessionState.PAUSED, SessionState.ACTIVE)).toBe(true);
        expect(isValidTransition(SessionState.PAUSED, SessionState.COMPLETED)).toBe(true);
        expect(isValidTransition(SessionState.PAUSED, SessionState.IDLE)).toBe(false);
      });

      test('should not allow transitions from COMPLETED', () => {
        expect(isValidTransition(SessionState.COMPLETED, SessionState.IDLE)).toBe(false);
        expect(isValidTransition(SessionState.COMPLETED, SessionState.ACTIVE)).toBe(false);
        expect(isValidTransition(SessionState.COMPLETED, SessionState.PAUSED)).toBe(false);
      });
    });
  });

  describe('Preset Durations', () => {
    test('should have correct Pomodoro duration', () => {
      expect(PRESET_DURATIONS.POMODORO).toBe(25 * 60 * 1000);
    });

    test('should have correct Focus duration', () => {
      expect(PRESET_DURATIONS.FOCUS).toBe(50 * 60 * 1000);
    });

    test('should have correct Deep Work duration', () => {
      expect(PRESET_DURATIONS.DEEP_WORK).toBe(90 * 60 * 1000);
    });
  });

  describe('Factory Functions', () => {
    describe('createSessionConfig', () => {
      test('should create valid SessionConfig with minimal data', () => {
        const config = createSessionConfig({ duration: 1500 });
        
        expect(config.id).toBeDefined();
        expect(isSessionId(config.id)).toBe(true);
        expect(config.duration).toBe(1500);
        expect(isDuration(config.duration)).toBe(true);
        expect(config.title).toBeUndefined();
        expect(config.description).toBeUndefined();
      });

      test('should create valid SessionConfig with full data', () => {
        const input = {
          duration: 2500,
          title: 'Test Session',
          description: 'A test session for unit testing'
        };
        
        const config = createSessionConfig(input);
        
        expect(config.id).toBeDefined();
        expect(config.duration).toBe(input.duration);
        expect(config.title).toBe(input.title);
        expect(config.description).toBe(input.description);
      });

      test('should generate unique IDs', () => {
        const config1 = createSessionConfig({ duration: 1000 });
        const config2 = createSessionConfig({ duration: 1000 });
        
        expect(config1.id).not.toBe(config2.id);
      });
    });

    describe('createInitialSessionRuntime', () => {
      test('should create initial runtime state', () => {
        const duration = createDuration(3000);
        const runtime = createInitialSessionRuntime(duration);
        
        expect(runtime.state).toBe(SessionState.IDLE);
        expect(runtime.elapsedTime).toBe(0);
        expect(runtime.remainingTime).toBe(duration);
        expect(runtime.startedAt).toBeUndefined();
        expect(runtime.pausedAt).toBeUndefined();
        expect(runtime.resumedAt).toBeUndefined();
        expect(runtime.completedAt).toBeUndefined();
      });
    });

    describe('createSession', () => {
      test('should create complete Session entity', () => {
        const input = {
          duration: 1800,
          title: 'Integration Test Session'
        };
        
        const session = createSession(input);
        
        // Config properties
        expect(session.id).toBeDefined();
        expect(session.duration).toBe(input.duration);
        expect(session.title).toBe(input.title);
        
        // Runtime properties
        expect(session.state).toBe(SessionState.IDLE);
        expect(session.elapsedTime).toBe(0);
        expect(session.remainingTime).toBe(input.duration);
      });

      test('should create Session with preset duration', () => {
        const session = createSession({ 
          duration: PRESET_DURATIONS.POMODORO,
          title: 'Pomodoro Session'
        });
        
        expect(session.duration).toBe(PRESET_DURATIONS.POMODORO);
        expect(session.remainingTime).toBe(PRESET_DURATIONS.POMODORO);
      });
    });
  });

  describe('Type Compatibility', () => {
    test('Session should extend both Config and Runtime', () => {
      const session = createSession({ 
        duration: 1000,
        title: 'Type Test'
      });
      
      // Should be assignable to SessionConfig
      const config: SessionConfig = session;
      expect(config.id).toBe(session.id);
      expect(config.duration).toBe(session.duration);
      
      // Should be assignable to SessionRuntime
      const runtime: SessionRuntime = session;
      expect(runtime.state).toBe(session.state);
      expect(runtime.elapsedTime).toBe(session.elapsedTime);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid duration in createSessionConfig', () => {
      expect(() => createSessionConfig({ duration: -1 })).toThrow('Invalid duration');
    });

    test('should handle crypto.randomUUID availability', () => {
      // Test that the function generates valid session IDs
      const config = createSessionConfig({ duration: 1000 });
      expect(config.id).toBeDefined();
      expect(typeof config.id).toBe('string');
      expect(config.id.length).toBeGreaterThan(0);
      expect(isSessionId(config.id)).toBe(true);
    });
  });

  describe('SessionEvent types', () => {
    test('should create valid session events', () => {
      const timestamp = createTimestamp();
      
      const startEvent: SessionEvent = { type: 'START', timestamp };
      const pauseEvent: SessionEvent = { type: 'PAUSE', timestamp };
      const resumeEvent: SessionEvent = { type: 'RESUME', timestamp };
      const completeEvent: SessionEvent = { type: 'COMPLETE', timestamp };
      const resetEvent: SessionEvent = { type: 'RESET', timestamp };
      
      expect(startEvent.type).toBe('START');
      expect(pauseEvent.type).toBe('PAUSE');
      expect(resumeEvent.type).toBe('RESUME');
      expect(completeEvent.type).toBe('COMPLETE');
      expect(resetEvent.type).toBe('RESET');
      
      [startEvent, pauseEvent, resumeEvent, completeEvent, resetEvent].forEach(event => {
        expect(event.timestamp).toBe(timestamp);
        expect(isTimestamp(event.timestamp)).toBe(true);
      });
    });
  });

  describe('Boundary Value Testing', () => {
    test('should handle edge cases in type validation', () => {
      // Test boundary values for Duration
      expect(isDuration(0)).toBe(true);
      expect(isDuration(0.1)).toBe(true);
      expect(isDuration(-0.1)).toBe(false);
      expect(isDuration(Number.MAX_SAFE_INTEGER)).toBe(true);
      expect(isDuration(Number.POSITIVE_INFINITY)).toBe(true);
      expect(isDuration(Number.NEGATIVE_INFINITY)).toBe(false);
      expect(isDuration(NaN)).toBe(false);
      
      // Test boundary values for Timestamp
      expect(isTimestamp(1)).toBe(true);
      expect(isTimestamp(0.1)).toBe(true);
      expect(isTimestamp(0)).toBe(false);
      expect(isTimestamp(-0.1)).toBe(false);
      
      // Test edge cases for SessionId
      expect(isSessionId(' ')).toBe(true); // Single space
      expect(isSessionId('a')).toBe(true); // Single character
    });

    test('should handle all state transition edge cases', () => {
      // Test all invalid state combinations not covered elsewhere
      const states = Object.values(SessionState);
      
      states.forEach(fromState => {
        states.forEach(toState => {
          const isValid = isValidTransition(fromState, toState);
          
          // Verify expected valid transitions
          if (fromState === SessionState.IDLE && toState === SessionState.ACTIVE) {
            expect(isValid).toBe(true);
          } else if (fromState === SessionState.ACTIVE && 
                    (toState === SessionState.PAUSED || toState === SessionState.COMPLETED)) {
            expect(isValid).toBe(true);
          } else if (fromState === SessionState.PAUSED && 
                    (toState === SessionState.ACTIVE || toState === SessionState.COMPLETED)) {
            expect(isValid).toBe(true);
          } else {
            expect(isValid).toBe(false);
          }
        });
      });
    });

    test('should handle preset duration edge cases', () => {
      // Verify preset durations are exact
      expect(PRESET_DURATIONS.POMODORO).toBe(1500000); // Exact milliseconds
      expect(PRESET_DURATIONS.FOCUS).toBe(3000000);
      expect(PRESET_DURATIONS.DEEP_WORK).toBe(5400000);
      
      // Verify they are valid durations
      expect(isDuration(PRESET_DURATIONS.POMODORO)).toBe(true);
      expect(isDuration(PRESET_DURATIONS.FOCUS)).toBe(true);
      expect(isDuration(PRESET_DURATIONS.DEEP_WORK)).toBe(true);
    });
  });
});
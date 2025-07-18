/**
 * useSessionMachine Tests - State Machine Patterns
 * 
 * Testing state machine logic and business rules only
 */

import { renderHook, act } from '@testing-library/react';
import { useSessionMachine } from '../../hooks/useSessionMachine';

describe('useSessionMachine', () => {
  describe('State Machine Operations', () => {
    it('user can track session state transitions', () => {
      const { result } = renderHook(() => useSessionMachine());

      // Business Rule: Should start in idle state
      expect(result.current.state).toBe('idle');
      expect(result.current.canStart).toBe(true);
      expect(result.current.canPause).toBe(false);
      expect(result.current.canResume).toBe(false);
      expect(result.current.canComplete).toBe(false);
      expect(result.current.canReset).toBe(false);
    });

    it('user can complete full session lifecycle', () => {
      const { result } = renderHook(() => useSessionMachine());

      // Business Rule: Can start from idle state
      act(() => {
        result.current.start();
      });

      expect(result.current.state).toBe('active');
      expect(result.current.canStart).toBe(false);
      expect(result.current.canPause).toBe(true);
      expect(result.current.canComplete).toBe(true);
      expect(result.current.startTime).toBeInstanceOf(Date);

      // Business Rule: Can pause active session
      act(() => {
        result.current.pause();
      });

      expect(result.current.state).toBe('paused');
      expect(result.current.canPause).toBe(false);
      expect(result.current.canResume).toBe(true);
      expect(result.current.pausedTime).toBeInstanceOf(Date);

      // Business Rule: Can resume paused session
      act(() => {
        result.current.resume();
      });

      expect(result.current.state).toBe('active');
      expect(result.current.canPause).toBe(true);
      expect(result.current.canResume).toBe(false);
      expect(result.current.pausedTime).toBeUndefined();

      // Business Rule: Can complete active session
      act(() => {
        result.current.complete();
      });

      expect(result.current.state).toBe('completed');
      expect(result.current.canStart).toBe(false);
      expect(result.current.canPause).toBe(false);
      expect(result.current.canComplete).toBe(false);
      expect(result.current.canReset).toBe(true);
    });

    it('user can reset session from any state', () => {
      const { result } = renderHook(() => useSessionMachine());

      // Business Rule: Reset from active state
      act(() => {
        result.current.start();
        result.current.reset();
      });

      expect(result.current.state).toBe('idle');
      expect(result.current.startTime).toBeUndefined();

      // Business Rule: Reset from paused state
      act(() => {
        result.current.start();
        result.current.pause();
        result.current.reset();
      });

      expect(result.current.state).toBe('idle');
      expect(result.current.pausedTime).toBeUndefined();

      // Business Rule: Reset from completed state
      act(() => {
        result.current.start();
        result.current.complete();
        result.current.reset();
      });

      expect(result.current.state).toBe('idle');
    });
  });

  describe('State Machine Guards', () => {
    it('invalid transitions are prevented by guards', () => {
      const { result } = renderHook(() => useSessionMachine());

      // Business Rule: Cannot pause when idle
      act(() => {
        result.current.pause();
      });
      expect(result.current.state).toBe('idle');

      // Business Rule: Cannot resume when idle
      act(() => {
        result.current.resume();
      });
      expect(result.current.state).toBe('idle');

      // Business Rule: Cannot complete when idle
      act(() => {
        result.current.complete();
      });
      expect(result.current.state).toBe('idle');

      // Business Rule: Cannot start when already active
      act(() => {
        result.current.start();
        result.current.start(); // Second start should be ignored
      });
      expect(result.current.state).toBe('active');

      // Business Rule: Cannot resume when active
      act(() => {
        result.current.resume();
      });
      expect(result.current.state).toBe('active');

      // Pause then test paused state guards
      act(() => {
        result.current.pause();
      });

      // Business Rule: Cannot start when paused
      act(() => {
        result.current.start();
      });
      expect(result.current.state).toBe('paused');

      // Business Rule: Cannot complete when paused
      act(() => {
        result.current.complete();
      });
      expect(result.current.state).toBe('paused');

      // Complete session and test completed state guards
      act(() => {
        result.current.resume();
        result.current.complete();
      });

      // Business Rule: Cannot pause when completed
      act(() => {
        result.current.pause();
      });
      expect(result.current.state).toBe('completed');

      // Business Rule: Cannot resume when completed
      act(() => {
        result.current.resume();
      });
      expect(result.current.state).toBe('completed');

      // Business Rule: Cannot complete when already completed
      act(() => {
        result.current.complete();
      });
      expect(result.current.state).toBe('completed');
    });
  });

  describe('Computed Properties', () => {
    it('computed properties reflect current state capabilities', () => {
      const { result } = renderHook(() => useSessionMachine());

      // Idle state capabilities
      expect(result.current.canStart).toBe(true);
      expect(result.current.canPause).toBe(false);
      expect(result.current.canResume).toBe(false);
      expect(result.current.canComplete).toBe(false);
      expect(result.current.canReset).toBe(false);

      // Active state capabilities
      act(() => {
        result.current.start();
      });

      expect(result.current.canStart).toBe(false);
      expect(result.current.canPause).toBe(true);
      expect(result.current.canResume).toBe(false);
      expect(result.current.canComplete).toBe(true);
      expect(result.current.canReset).toBe(true);

      // Paused state capabilities
      act(() => {
        result.current.pause();
      });

      expect(result.current.canStart).toBe(false);
      expect(result.current.canPause).toBe(false);
      expect(result.current.canResume).toBe(true);
      expect(result.current.canComplete).toBe(false);
      expect(result.current.canReset).toBe(true);

      // Completed state capabilities
      act(() => {
        result.current.resume();
        result.current.complete();
      });

      expect(result.current.canStart).toBe(false);
      expect(result.current.canPause).toBe(false);
      expect(result.current.canResume).toBe(false);
      expect(result.current.canComplete).toBe(false);
      expect(result.current.canReset).toBe(true);
    });
  });

  describe('Action Creator Optimization', () => {
    it('action creators maintain stable references', () => {
      const { result, rerender } = renderHook(() => useSessionMachine());

      const initialActions = {
        start: result.current.start,
        pause: result.current.pause,
        resume: result.current.resume,
        complete: result.current.complete,
        reset: result.current.reset,
      };

      // Trigger re-render by changing state
      act(() => {
        result.current.start();
      });

      rerender();

      // Business Rule: useCallback ensures stable function references
      expect(result.current.start).toBe(initialActions.start);
      expect(result.current.pause).toBe(initialActions.pause);
      expect(result.current.resume).toBe(initialActions.resume);
      expect(result.current.complete).toBe(initialActions.complete);
      expect(result.current.reset).toBe(initialActions.reset);
    });
  });

  describe('Time Tracking', () => {
    it('timestamps are recorded during state transitions', () => {
      const { result } = renderHook(() => useSessionMachine());

      const beforeStart = new Date();
      
      act(() => {
        result.current.start();
      });

      const afterStart = new Date();

      // Business Rule: Start time is recorded when session starts
      expect(result.current.startTime).toBeInstanceOf(Date);
      expect(result.current.startTime!.getTime()).toBeGreaterThanOrEqual(beforeStart.getTime());
      expect(result.current.startTime!.getTime()).toBeLessThanOrEqual(afterStart.getTime());

      const beforePause = new Date();

      act(() => {
        result.current.pause();
      });

      const afterPause = new Date();

      // Business Rule: Pause time is recorded when session pauses
      expect(result.current.pausedTime).toBeInstanceOf(Date);
      expect(result.current.pausedTime!.getTime()).toBeGreaterThanOrEqual(beforePause.getTime());
      expect(result.current.pausedTime!.getTime()).toBeLessThanOrEqual(afterPause.getTime());

      // Business Rule: Resume clears pause time
      act(() => {
        result.current.resume();
      });

      expect(result.current.pausedTime).toBeUndefined();

      // Business Rule: Reset clears all times
      act(() => {
        result.current.reset();
      });

      expect(result.current.startTime).toBeUndefined();
      expect(result.current.pausedTime).toBeUndefined();
    });
  });
});
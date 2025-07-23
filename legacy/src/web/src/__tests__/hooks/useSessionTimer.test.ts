/**
 * useSessionTimer Integration Hook Tests
 * 
 * Testing business rules and meaningful functionality only
 */

import { renderHook, act } from '@testing-library/react';
import { useSessionTimer } from '../../hooks/useSessionTimer';
import { PRESET_DURATIONS } from '../../lib/types/session';
import { useSessionStore } from '../../stores/session-store';

describe('useSessionTimer', () => {
  beforeEach(() => {
    // Reset store state between tests
    const store = useSessionStore.getState();
    store.reset();
  });

  describe('Session Lifecycle', () => {
    it('user can manage complete session workflow', () => {
      const { result } = renderHook(() => useSessionTimer());

      // Business Rule: Can start a session with duration and metadata
      act(() => {
        result.current.start({
          duration: PRESET_DURATIONS.POMODORO,
          title: 'Important Work',
          description: 'Focus on project deadline'
        });
      });

      expect(result.current.isRunning).toBe(true);
      expect(result.current.currentSession?.title).toBe('Important Work');

      // Business Rule: Can pause active session
      act(() => {
        result.current.pause();
      });

      expect(result.current.isRunning).toBe(false);
      expect(result.current.currentSession?.state).toBe('paused');

      // Business Rule: Can resume paused session
      act(() => {
        result.current.resume();
      });

      expect(result.current.isRunning).toBe(true);
      expect(result.current.currentSession?.state).toBe('active');

      // Business Rule: Can complete session
      act(() => {
        result.current.complete();
      });

      expect(result.current.currentSession?.state).toBe('completed');
    });

    it('user cannot start overlapping sessions', () => {
      const { result } = renderHook(() => useSessionTimer());

      act(() => {
        result.current.start({ duration: PRESET_DURATIONS.POMODORO, title: 'First' });
        result.current.start({ duration: PRESET_DURATIONS.FOCUS, title: 'Second' });
      });

      // Business Rule: Cannot start second session when one is active
      expect(result.current.currentSession?.title).toBe('First');
    });

    it('user receives notification when session completes', () => {
      const onSessionComplete = jest.fn();
      const { result } = renderHook(() => useSessionTimer({ onSessionComplete }));

      act(() => {
        result.current.start({ duration: 1000 });
      });

      // Clear any previous calls
      onSessionComplete.mockClear();

      act(() => {
        result.current.complete();
      });

      // Business Rule: Session completion triggers callback
      expect(onSessionComplete).toHaveBeenCalledTimes(1);
    });
  });

  describe('Timer Progress Tracking', () => {
    it('user sees accurate initial session state', () => {
      const { result } = renderHook(() => useSessionTimer());

      act(() => {
        result.current.start({ duration: 60000 }); // 1 minute
      });

      // Business Rule: Session starts with correct time values
      expect(result.current.elapsedTime).toBe(0);
      expect(result.current.remainingTime).toBe(60000);
      expect(result.current.isRunning).toBe(true);
    });

    it('external systems receive timer updates', () => {
      const onTick = jest.fn();
      const { result } = renderHook(() => useSessionTimer({ onTick }));

      act(() => {
        result.current.start({ duration: PRESET_DURATIONS.POMODORO });
        result.current.tick();
      });

      // Business Rule: External systems can track timer progress
      expect(onTick).toHaveBeenCalledWith(expect.any(Number));
    });

    it('timer updates automatically in background', () => {
      jest.useFakeTimers();
      
      const onTick = jest.fn();
      const { result } = renderHook(() => 
        useSessionTimer({ autoTick: true, tickInterval: 1000, onTick })
      );

      act(() => {
        result.current.start({ duration: 60000 });
      });

      // Business Rule: Timer should update automatically in production
      expect(result.current.isRunning).toBe(true);

      // Advance time and verify auto-tick
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(onTick).toHaveBeenCalled();

      // Stop timer should stop auto-tick
      act(() => {
        result.current.pause();
      });

      onTick.mockClear();
      
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      // Business Rule: Paused sessions don't auto-tick
      expect(onTick).not.toHaveBeenCalled();

      jest.useRealTimers();
    });
  });

  describe('Error Recovery', () => {
    it('user experience remains stable during errors', () => {
      const { result } = renderHook(() => useSessionTimer());

      // Business Rule: Operations on non-existent session should not crash
      expect(() => {
        act(() => {
          result.current.pause();  // No session to pause
          result.current.resume(); // No session to resume
          result.current.tick();   // No session to tick
        });
      }).not.toThrow();
    });
  });
});
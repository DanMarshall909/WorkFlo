/**
 * useSessionNotifications Tests - Business Rules Only
 */

import { renderHook, act } from '@testing-library/react';
import { useSessionNotifications } from '../../hooks/useSessionNotifications';

// Mock Notification API for business rule testing
const mockNotification = jest.fn();
Object.defineProperty(window, 'Notification', {
  value: mockNotification,
  writable: true,
});

Object.defineProperty(mockNotification, 'permission', {
  value: 'granted',
  writable: true,
});

mockNotification.requestPermission = jest.fn().mockResolvedValue('granted');

describe('useSessionNotifications - Business Rules', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNotification.mockClear();
  });

  describe('Session Completion Notifications', () => {
    it('should notify user when session completes', () => {
      const { result } = renderHook(() => useSessionNotifications());

      act(() => {
        result.current.notifySessionComplete('Important Task');
      });

      // Business Rule: Session completion notification includes task name
      expect(mockNotification).toHaveBeenCalledWith(
        'Session Complete: Important Task',
        expect.objectContaining({
          body: 'Your focus session has finished. Time for a break!',
          requireInteraction: true,
        })
      );
    });

    it('should provide generic notification when no title given', () => {
      const { result } = renderHook(() => useSessionNotifications());

      act(() => {
        result.current.notifySessionComplete();
      });

      // Business Rule: Generic notification when session has no title
      expect(mockNotification).toHaveBeenCalledWith(
        'Session Complete!',
        expect.any(Object)
      );
    });
  });

  describe('Session Reminders', () => {
    it('should notify user of remaining time in minutes', () => {
      const { result } = renderHook(() => useSessionNotifications());

      act(() => {
        result.current.notifySessionReminder(300000); // 5 minutes
      });

      // Business Rule: Show minutes remaining for time awareness
      expect(mockNotification).toHaveBeenCalledWith(
        'Session Reminder',
        expect.objectContaining({
          body: '5 minutes remaining in your session',
        })
      );
    });

    it('should notify when less than a minute remains', () => {
      const { result } = renderHook(() => useSessionNotifications());

      act(() => {
        result.current.notifySessionReminder(30000); // 30 seconds
      });

      // Business Rule: Special message for final moments
      expect(mockNotification).toHaveBeenCalledWith(
        'Session Reminder',
        expect.objectContaining({
          body: 'Less than a minute remaining!',
        })
      );
    });
  });

  describe('Permission Management', () => {
    it('should request notification permission for session alerts', async () => {
      const { result } = renderHook(() => useSessionNotifications());

      let permissionResult;
      await act(async () => {
        permissionResult = await result.current.requestPermission();
      });

      // Business Rule: Must have permission to show session notifications
      expect(mockNotification.requestPermission).toHaveBeenCalled();
      expect(permissionResult).toBe('granted');
    });
  });
});
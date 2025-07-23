/**
 * useSessionNotifications Tests - Business Rules Only
 */

import { renderHook, act } from '@testing-library/react';
import { useSessionNotifications } from '../../hooks/useSessionNotifications';

// Mock Notification API for business rule testing
const mockNotification = jest.fn() as any;
mockNotification.permission = 'granted';
mockNotification.requestPermission = jest.fn().mockResolvedValue('granted');

Object.defineProperty(window, 'Notification', {
  value: mockNotification,
  writable: true,
  configurable: true,
});

describe('useSessionNotifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNotification.mockClear();
  });

  describe('Notification System', () => {
    describe('session completion', () => {
      it('user receives completion notification', () => {
        const { result } = renderHook(() => useSessionNotifications());

      act(() => {
        result.current.showSessionComplete('Important Task');
      });

      // Business Rule: Session completion notification includes task name
      expect(mockNotification).toHaveBeenCalledWith(
        'Session Complete: Important Task',
        expect.objectContaining({
          body: 'Your focus session has finished. Great work!',
          requireInteraction: true,
        })
      );
    });

    it('user receives generic notification without title', () => {
      const { result } = renderHook(() => useSessionNotifications());

      act(() => {
        result.current.showSessionComplete();
      });

      // Business Rule: Generic notification when session has no title
      expect(mockNotification).toHaveBeenCalledWith(
        'Session Complete!',
        expect.any(Object)
      );
    });
    });
  });

  describe('Time Reminders', () => {
    it('user knows remaining time in minutes', () => {
      const { result } = renderHook(() => useSessionNotifications());

      act(() => {
        result.current.showSessionReminder(300000); // 5 minutes
      });

      // Business Rule: Show minutes remaining for time awareness
      expect(mockNotification).toHaveBeenCalledWith(
        'Session Reminder',
        expect.objectContaining({
          body: '5 minutes remaining in your session',
        })
      );
    });

    it('user warned when time nearly expires', () => {
      const { result } = renderHook(() => useSessionNotifications());

      act(() => {
        result.current.showSessionReminder(30000); // 30 seconds
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

  describe('Permission System', () => {
    it('user can grant notification permissions', async () => {
      const { result } = renderHook(() => useSessionNotifications());

      await act(async () => {
        await result.current.requestPermission();
      });

      // Business Rule: Must have permission to show session notifications
      expect(mockNotification.requestPermission).toHaveBeenCalled();
    });

    it('user onboarding requests permissions automatically', async () => {
      // Set permission to default (not yet requested)
      mockNotification.permission = 'default';

      const { result } = renderHook(() => 
        useSessionNotifications({ autoRequestPermission: true })
      );

      // Business Rule: Smooth user onboarding with automatic permission request
      await act(async () => {
        // Auto-request should happen in useEffect
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(mockNotification.requestPermission).toHaveBeenCalled();
    });

    it('user privacy respected without permission', () => {
      mockNotification.permission = 'denied';

      const { result } = renderHook(() => useSessionNotifications());

      act(() => {
        result.current.showSessionComplete('Test Session');
      });

      // Business Rule: No notifications shown without user permission
      expect(mockNotification).not.toHaveBeenCalled();
    });

    it.skip('should handle unsupported browsers gracefully', () => {
      // Remove Notification support
      const originalNotification = window.Notification;
      delete (window as any).Notification;

      const { result } = renderHook(() => useSessionNotifications());

      // Business Rule: Graceful degradation on unsupported browsers  
      expect(result.current.isSupported).toBe(false);
      expect(result.current.permission).toBe('denied');

      act(() => {
        result.current.showSessionComplete('Test Session');
      });

      // Should not crash on unsupported browsers
      expect(() => result.current.showSessionComplete()).not.toThrow();

      // Restore
      (window as any).Notification = originalNotification;
    });

    it('user can control notification preferences', () => {
      mockNotification.permission = 'granted';

      const { result } = renderHook(() => 
        useSessionNotifications({ enabled: false })
      );

      act(() => {
        result.current.showSessionComplete('Test Session');
      });

      // Business Rule: When disabled, no notifications should be shown
      expect(mockNotification).not.toHaveBeenCalled();
    });

    it('user experience unaffected by permission denial', async () => {
      mockNotification.permission = 'default';
      mockNotification.requestPermission = jest.fn().mockResolvedValue('denied');

      const { result } = renderHook(() => useSessionNotifications());

      const permission = await act(async () => {
        return await result.current.requestPermission();
      });

      // Business Rule: Permission denial should be handled gracefully
      expect(permission).toBe('denied');
      expect(result.current.permission).toBe('denied');
    });

    it('user experience remains stable when notifications fail', async () => {
      mockNotification.permission = 'granted';
      
      const onError = jest.fn();
      mockNotification.mockImplementation(() => {
        throw new Error('Notification failed');
      });

      const { result } = renderHook(() => 
        useSessionNotifications({ onNotificationError: onError })
      );

      const notification = await act(async () => {
        return await result.current.showNotification('Test', {});
      });

      // Business Rule: Notification errors should be caught and reported
      expect(notification).toBeNull();
      expect(onError).toHaveBeenCalledWith(expect.any(Error));
    });

    it('permission errors do not disrupt workflow', async () => {
      mockNotification.permission = 'default';
      
      const onError = jest.fn();
      mockNotification.requestPermission = jest.fn().mockRejectedValue(new Error('Permission request failed'));

      const { result } = renderHook(() => 
        useSessionNotifications({ onNotificationError: onError })
      );

      const permission = await act(async () => {
        return await result.current.requestPermission();
      });

      // Business Rule: Permission request errors should default to denied
      expect(permission).toBe('denied');
      expect(onError).toHaveBeenCalledWith(expect.any(Error));
    });

    it('user can interact with notifications', async () => {
      mockNotification.permission = 'granted';
      
      const onClick = jest.fn();
      const mockNotificationInstance = {
        onclick: null as any,
        close: jest.fn(),
      };
      
      mockNotification.mockReturnValue(mockNotificationInstance);

      const { result } = renderHook(() => 
        useSessionNotifications({ onNotificationClick: onClick })
      );

      const notification = await act(async () => {
        return await result.current.showNotification('Test', {});
      });

      // Simulate notification click
      if (mockNotificationInstance.onclick) {
        act(() => {
          mockNotificationInstance.onclick();
        });
      }

      // Business Rule: Notification clicks should trigger callback and close
      expect(onClick).toHaveBeenCalledWith(mockNotificationInstance);
      expect(mockNotificationInstance.close).toHaveBeenCalled();
    });

    it('user can toggle notifications during session', () => {
      mockNotification.permission = 'granted';

      const { result } = renderHook(() => useSessionNotifications());

      // Business Rule: Should start enabled by default
      expect(result.current.isEnabled).toBe(true);

      // Business Rule: Should be able to disable notifications
      act(() => {
        result.current.disable();
      });

      expect(result.current.isEnabled).toBe(false);

      // Business Rule: Should be able to re-enable notifications
      act(() => {
        result.current.enable();
      });

      expect(result.current.isEnabled).toBe(true);
    });

    it('system adapts to external permission changes', async () => {
      jest.useFakeTimers();
      
      mockNotification.permission = 'granted';

      const onPermissionChange = jest.fn();
      const { result } = renderHook(() => 
        useSessionNotifications({ onPermissionChange })
      );

      // Simulate external permission change
      mockNotification.permission = 'denied';

      // Advance time to trigger permission check
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      // Business Rule: Should detect when user changes permission externally
      expect(result.current.permission).toBe('denied');
      expect(onPermissionChange).toHaveBeenCalledWith('denied');

      jest.useRealTimers();
    });
  });
});
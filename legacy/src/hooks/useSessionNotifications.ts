/**
 * useSessionNotifications - Business-Focused Notification Hook
 * 
 * Business purpose: Notify users of session completion and reminders
 * Integration: Works with session timer to provide notifications
 */

import { useState, useCallback, useEffect } from 'react';

export interface UseSessionNotificationsConfig {
  enabled?: boolean;
  autoRequestPermission?: boolean;
}

export interface UseSessionNotificationsReturn {
  // State
  permission: NotificationPermission;
  isEnabled: boolean;
  isSupported: boolean;
  
  // Business actions
  requestPermission: () => Promise<NotificationPermission>;
  notifySessionComplete: (sessionTitle?: string) => void;
  notifySessionReminder: (timeRemaining: number) => void;
}

/**
 * Hook for session-related notifications
 * 
 * Business Rules:
 * - Only show notifications if permission granted
 * - Session completion notifications are high priority
 * - Reminder notifications help with time awareness
 */
export const useSessionNotifications = (
  config: UseSessionNotificationsConfig = {}
): UseSessionNotificationsReturn => {
  const { enabled = true, autoRequestPermission = false } = config;

  const [permission, setPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window 
      ? Notification.permission 
      : 'denied'
  );
  
  const [isEnabled, setIsEnabled] = useState(enabled);

  const isSupported = typeof window !== 'undefined' && 'Notification' in window;

  /**
   * Business Rule: Request notification permission for session alerts
   */
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!isSupported) return 'denied';

    try {
      const newPermission = await Notification.requestPermission();
      setPermission(newPermission);
      return newPermission;
    } catch {
      return 'denied';
    }
  }, [isSupported]);

  /**
   * Business Rule: Notify user when session completes
   */
  const notifySessionComplete = useCallback((sessionTitle?: string) => {
    if (!isSupported || !isEnabled || permission !== 'granted') return;

    const title = sessionTitle 
      ? `Session Complete: ${sessionTitle}`
      : 'Session Complete!';
    
    new Notification(title, {
      body: 'Your focus session has finished. Time for a break!',
      icon: '/favicon.ico',
      tag: 'session-complete',
      requireInteraction: true,
    });
  }, [isSupported, isEnabled, permission]);

  /**
   * Business Rule: Remind user of remaining time
   */
  const notifySessionReminder = useCallback((timeRemaining: number) => {
    if (!isSupported || !isEnabled || permission !== 'granted') return;

    const minutes = Math.floor(timeRemaining / 60000);
    const body = minutes > 0 
      ? `${minutes} minutes remaining in your session`
      : 'Less than a minute remaining!';

    new Notification('Session Reminder', {
      body,
      icon: '/favicon.ico',
      tag: 'session-reminder',
    });
  }, [isSupported, isEnabled, permission]);

  /**
   * Auto-request permission if configured
   */
  useEffect(() => {
    if (autoRequestPermission && permission === 'default') {
      requestPermission();
    }
  }, [autoRequestPermission, permission, requestPermission]);

  return {
    permission,
    isEnabled,
    isSupported,
    requestPermission,
    notifySessionComplete,
    notifySessionReminder,
  };
};
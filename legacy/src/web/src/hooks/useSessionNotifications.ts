/**
 * useSessionNotifications - Browser Notifications Hook
 * 
 * Advanced patterns demonstrated:
 * - Browser API integration with error handling
 * - Permission management patterns
 * - Cleanup and memory management
 */

import { useState, useCallback, useEffect } from 'react';

export interface UseSessionNotificationsConfig {
  enabled?: boolean;
  autoRequestPermission?: boolean;
  defaultIcon?: string;
  onPermissionChange?: (permission: NotificationPermission) => void;
  onNotificationClick?: (notification: Notification) => void;
  onNotificationError?: (error: Error) => void;
}

export interface UseSessionNotificationsReturn {
  // State
  permission: NotificationPermission;
  isEnabled: boolean;
  isSupported: boolean;
  
  // Actions
  requestPermission: () => Promise<NotificationPermission>;
  showNotification: (title: string, options?: NotificationOptions) => Promise<Notification | null>;
  showSessionComplete: (sessionTitle?: string) => Promise<Notification | null>;
  showSessionReminder: (timeRemaining: number) => Promise<Notification | null>;
  disable: () => void;
  enable: () => void;
}

/**
 * Hook for managing session-related browser notifications
 */
export const useSessionNotifications = (
  config: UseSessionNotificationsConfig = {}
): UseSessionNotificationsReturn => {
  const {
    enabled = true,
    autoRequestPermission = false,
    defaultIcon = '/favicon.ico',
    onPermissionChange,
    onNotificationClick,
    onNotificationError,
  } = config;

  const [permission, setPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window 
      ? Notification.permission 
      : 'denied'
  );
  
  const [isEnabled, setIsEnabled] = useState(enabled);

  const isSupported = typeof window !== 'undefined' && 'Notification' in window;

  /**
   * Request notification permission
   */
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!isSupported) {
      return 'denied';
    }

    try {
      const newPermission = await Notification.requestPermission();
      setPermission(newPermission);
      onPermissionChange?.(newPermission);
      return newPermission;
    } catch (error) {
      onNotificationError?.(error as Error);
      return 'denied';
    }
  }, [isSupported, onPermissionChange, onNotificationError]);

  /**
   * Show a generic notification
   */
  const showNotification = useCallback(async (
    title: string, 
    options: NotificationOptions = {}
  ): Promise<Notification | null> => {
    if (!isSupported || !isEnabled || permission !== 'granted') {
      return null;
    }

    try {
      const notification = new Notification(title, {
        icon: defaultIcon,
        badge: defaultIcon,
        ...options,
      });

      notification.onclick = () => {
        onNotificationClick?.(notification);
        notification.close();
      };

      return notification;
    } catch (error) {
      onNotificationError?.(error as Error);
      return null;
    }
  }, [isSupported, isEnabled, permission, defaultIcon, onNotificationClick, onNotificationError]);

  /**
   * Show session completion notification
   */
  const showSessionComplete = useCallback(async (
    sessionTitle?: string
  ): Promise<Notification | null> => {
    const title = sessionTitle 
      ? `Session Complete: ${sessionTitle}`
      : 'Session Complete!';
    
    return showNotification(title, {
      body: 'Your focus session has finished. Great work!',
      tag: 'session-complete',
      requireInteraction: true,
    });
  }, [showNotification]);

  /**
   * Show session reminder notification
   */
  const showSessionReminder = useCallback(async (
    timeRemaining: number
  ): Promise<Notification | null> => {
    const minutes = Math.floor(timeRemaining / 60000);
    const title = 'Session Reminder';
    const body = minutes > 0 
      ? `${minutes} minutes remaining in your session`
      : 'Less than a minute remaining!';

    return showNotification(title, {
      body,
      tag: 'session-reminder',
    });
  }, [showNotification]);

  /**
   * Disable notifications
   */
  const disable = useCallback(() => {
    setIsEnabled(false);
  }, []);

  /**
   * Enable notifications
   */
  const enable = useCallback(() => {
    setIsEnabled(true);
  }, []);

  /**
   * Auto-request permission on mount if configured
   */
  useEffect(() => {
    if (autoRequestPermission && permission === 'default') {
      requestPermission();
    }
  }, [autoRequestPermission, permission, requestPermission]);

  /**
   * Listen for permission changes
   */
  useEffect(() => {
    if (!isSupported) return;

    const checkPermission = () => {
      const currentPermission = Notification.permission;
      if (currentPermission !== permission) {
        setPermission(currentPermission);
        onPermissionChange?.(currentPermission);
      }
    };

    // Check periodically in case permission changed
    const interval = setInterval(checkPermission, 5000);

    return () => clearInterval(interval);
  }, [isSupported, permission, onPermissionChange]);

  return {
    // State
    permission,
    isEnabled,
    isSupported,
    
    // Actions
    requestPermission,
    showNotification,
    showSessionComplete,
    showSessionReminder,
    disable,
    enable,
  };
};
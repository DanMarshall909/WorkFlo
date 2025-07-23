import React, { useCallback, useEffect, useRef } from 'react';
import { logger, LogContext } from '@/lib/logger';

interface UseLoggerOptions {
  component?: string;
  userId?: string;
  sessionId?: string;
}

export function useLogger(options: UseLoggerOptions = {}) {
  const { component, userId, sessionId } = options;
  const startTimeRef = useRef<number>();

  // Create base context for all logs from this component
  const baseContext: LogContext = {
    component,
    userId,
    sessionId
  };

  // Performance tracking
  const startPerformanceTimer = useCallback((operation: string) => {
    startTimeRef.current = performance.now();
    return operation;
  }, []);

  const endPerformanceTimer = useCallback((operation: string, context: LogContext = {}) => {
    if (startTimeRef.current) {
      const duration = performance.now() - startTimeRef.current;
      logger.logPerformance(operation, duration, { ...baseContext, ...context });
      startTimeRef.current = undefined;
    }
  }, [baseContext]);

  // Convenience logging functions with automatic context
  const logUserAction = useCallback((action: string, context: LogContext = {}) => {
    logger.logUserAction(action, { ...baseContext, ...context });
  }, [baseContext]);

  const logError = useCallback((error: Error, context: LogContext = {}) => {
    logger.logError(error, { ...baseContext, ...context });
  }, [baseContext]);

  const logApiCall = useCallback((endpoint: string, method: string, duration: number, status: number, context: LogContext = {}) => {
    logger.logApiCall(endpoint, method, duration, status, { ...baseContext, ...context });
  }, [baseContext]);

  const logSessionEvent = useCallback((event: string, context: LogContext = {}) => {
    logger.logSessionEvent(event, { ...baseContext, ...context });
  }, [baseContext]);

  const logFocusEvent = useCallback((event: string, context: LogContext = {}) => {
    logger.logFocusEvent(event, { ...baseContext, ...context });
  }, [baseContext]);

  const logTaskEvent = useCallback((event: string, taskId: string, context: LogContext = {}) => {
    logger.logTaskEvent(event, taskId, { ...baseContext, ...context });
  }, [baseContext]);

  const logDebug = useCallback((message: string, context: LogContext = {}) => {
    logger.logDebug(message, { ...baseContext, ...context });
  }, [baseContext]);

  const logInfo = useCallback((message: string, context: LogContext = {}) => {
    logger.logInfo(message, { ...baseContext, ...context });
  }, [baseContext]);

  const logWarning = useCallback((message: string, context: LogContext = {}) => {
    logger.logWarning(message, { ...baseContext, ...context });
  }, [baseContext]);

  // Component lifecycle logging
  useEffect(() => {
    if (component) {
      logInfo(`Component mounted: ${component}`);
      
      return () => {
        logInfo(`Component unmounted: ${component}`);
      };
    }
  }, [component, logInfo]);

  return {
    // Performance tracking
    startPerformanceTimer,
    endPerformanceTimer,
    
    // Logging functions
    logUserAction,
    logError,
    logApiCall,
    logSessionEvent,
    logFocusEvent,
    logTaskEvent,
    logDebug,
    logInfo,
    logWarning,
    
    // Direct access to logger for advanced use cases
    logger
  };
}

// HOC for automatic component logging
export function withLogger<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName: string
) {
  const LoggedComponent = (props: P) => {
    const { logInfo } = useLogger({ component: componentName });
    
    useEffect(() => {
      logInfo(`Rendered: ${componentName}`);
    }, [logInfo]);

    return React.createElement(WrappedComponent, props);
  };

  LoggedComponent.displayName = `withLogger(${componentName})`;
  return LoggedComponent;
}
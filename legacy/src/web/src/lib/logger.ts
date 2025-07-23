import winston from 'winston';

// Interface for structured logging
export interface LogContext {
  userId?: string;
  sessionId?: string;
  action?: string;
  component?: string;
  duration?: number;
  error?: Error;
  [key: string]: any;
}

// Create Winston logger instance
const winstonLogger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'workflo-web',
    version: process.env.npm_package_version || '1.0.0'
  },
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    
    // Additional transports can be added here
    // TODO: Add Seq transport when winston-seq is available
  ]
});

// Custom logging interface for the application
export class Logger {
  private static instance: Logger;
  private logger: winston.Logger;

  private constructor() {
    this.logger = winstonLogger;
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  // User action logging
  public logUserAction(action: string, context: LogContext = {}): void {
    this.logger.info('User action', {
      action,
      ...context,
      timestamp: new Date().toISOString(),
      type: 'user_action'
    });
  }

  // Performance logging
  public logPerformance(operation: string, duration: number, context: LogContext = {}): void {
    this.logger.info('Performance metric', {
      operation,
      duration,
      ...context,
      timestamp: new Date().toISOString(),
      type: 'performance'
    });
  }

  // Error logging
  public logError(error: Error, context: LogContext = {}): void {
    this.logger.error('Application error', {
      error: error.message,
      stack: error.stack,
      ...context,
      timestamp: new Date().toISOString(),
      type: 'error'
    });
  }

  // API call logging
  public logApiCall(endpoint: string, method: string, duration: number, status: number, context: LogContext = {}): void {
    this.logger.info('API call', {
      endpoint,
      method,
      duration,
      status,
      ...context,
      timestamp: new Date().toISOString(),
      type: 'api_call'
    });
  }

  // Session events
  public logSessionEvent(event: string, context: LogContext = {}): void {
    this.logger.info('Session event', {
      event,
      ...context,
      timestamp: new Date().toISOString(),
      type: 'session_event'
    });
  }

  // Focus events (specific to WorkFlo)
  public logFocusEvent(event: string, context: LogContext = {}): void {
    this.logger.info('Focus event', {
      event,
      ...context,
      timestamp: new Date().toISOString(),
      type: 'focus_event'
    });
  }

  // Task events
  public logTaskEvent(event: string, taskId: string, context: LogContext = {}): void {
    this.logger.info('Task event', {
      event,
      taskId,
      ...context,
      timestamp: new Date().toISOString(),
      type: 'task_event'
    });
  }

  // Debug logging
  public logDebug(message: string, context: LogContext = {}): void {
    this.logger.debug('Debug info', {
      message,
      ...context,
      timestamp: new Date().toISOString(),
      type: 'debug'
    });
  }

  // Information logging
  public logInfo(message: string, context: LogContext = {}): void {
    this.logger.info('Information', {
      message,
      ...context,
      timestamp: new Date().toISOString(),
      type: 'info'
    });
  }

  // Warning logging
  public logWarning(message: string, context: LogContext = {}): void {
    this.logger.warn('Warning', {
      message,
      ...context,
      timestamp: new Date().toISOString(),
      type: 'warning'
    });
  }
}

// Export singleton instance
export const logger = Logger.getInstance();

// Export convenience functions
export const logUserAction = (action: string, context?: LogContext) => 
  logger.logUserAction(action, context);

export const logPerformance = (operation: string, duration: number, context?: LogContext) => 
  logger.logPerformance(operation, duration, context);

export const logError = (error: Error, context?: LogContext) => 
  logger.logError(error, context);

export const logApiCall = (endpoint: string, method: string, duration: number, status: number, context?: LogContext) => 
  logger.logApiCall(endpoint, method, duration, status, context);

export const logSessionEvent = (event: string, context?: LogContext) => 
  logger.logSessionEvent(event, context);

export const logFocusEvent = (event: string, context?: LogContext) => 
  logger.logFocusEvent(event, context);

export const logTaskEvent = (event: string, taskId: string, context?: LogContext) => 
  logger.logTaskEvent(event, taskId, context);

export const logDebug = (message: string, context?: LogContext) => 
  logger.logDebug(message, context);

export const logInfo = (message: string, context?: LogContext) => 
  logger.logInfo(message, context);

export const logWarning = (message: string, context?: LogContext) => 
  logger.logWarning(message, context);
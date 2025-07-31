// Functional logging utilities

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  SUCCESS = 3,
  DEBUG = 4,
  SCORE = 5
}

export interface LogConfig {
  level: LogLevel;
  debug: boolean;
  verbose: boolean;
  colors: boolean;
}

const colors = {
  RED: '\x1b[0;31m',
  GREEN: '\x1b[0;32m',
  YELLOW: '\x1b[1;33m',
  BLUE: '\x1b[0;34m',
  PURPLE: '\x1b[0;35m',
  CYAN: '\x1b[0;36m',
  NC: '\x1b[0m'
} as const;

const createLogConfig = (): LogConfig => ({
  level: LogLevel.INFO,
  debug: process.env.TDD_DEBUG === '1',
  verbose: process.env.TDD_VERBOSE === '1',
  colors: true
});

const formatMessage = (config: LogConfig, level: LogLevel, message: string, prefix: string, color: string): string => {
  const colorizedPrefix = config.colors ? `${color}[${prefix}]${colors.NC}` : `[${prefix}]`;
  return config.verbose || config.debug || level === LogLevel.SCORE
    ? `${colorizedPrefix} ${message}`
    : `${colorizedPrefix} ${message}`;
};

const shouldLog = (config: LogConfig, level: LogLevel): boolean => {
  return level <= config.level || level === LogLevel.DEBUG && config.debug;
};

// Pure logging functions
export const log = (config: LogConfig, level: LogLevel, message: string, prefix: string, color: string, useStderr = false): void => {
  if (!shouldLog(config, level) && level !== LogLevel.DEBUG) return;
  
  const formatted = formatMessage(config, level, message, prefix, color);
  
  if (useStderr) {
    console.error(formatted);
  } else {
    console.log(formatted);
  }
};

// Specialized logging functions
export const error = (message: string, config = createLogConfig()): never => {
  log(config, LogLevel.ERROR, message, 'ERROR', colors.RED);
  process.exit(1);
};

export const success = (message: string, config = createLogConfig()): void => {
  const prefix = config.verbose || config.debug ? 'SUCCESS' : '✅';
  log(config, LogLevel.SUCCESS, message, prefix, colors.GREEN);
};

export const warn = (message: string, config = createLogConfig()): void => {
  const prefix = config.verbose || config.debug ? 'WARNING' : '⚠️';
  log(config, LogLevel.WARN, message, prefix, colors.YELLOW);
};

export const info = (message: string, config = createLogConfig()): void => {
  const prefix = config.verbose || config.debug ? 'INFO' : 'ℹ️';
  log(config, LogLevel.INFO, message, prefix, colors.BLUE);
};

export const score = (message: string, config = createLogConfig()): void => {
  log(config, LogLevel.SCORE, message, 'SCORE', colors.PURPLE);
};

export const debug = (message: string, config = createLogConfig()): void => {
  if (config.debug) {
    log(config, LogLevel.DEBUG, message, 'DEBUG', colors.CYAN, true);
  }
};

// Functional composition helpers
export const withLogging = <T extends any[], R>(
  fn: (...args: T) => R,
  logMessage: string,
  level: 'info' | 'debug' | 'success' = 'info'
) => (...args: T): R => {
  const logFn = level === 'info' ? info : level === 'debug' ? debug : success;
  logFn(logMessage);
  return fn(...args);
};

export const logError = (err: Error, config = createLogConfig()): void => {
  if (err.name?.includes('WorkFlo')) {
    log(config, LogLevel.ERROR, err.message, 'ERROR', colors.RED);
  } else {
    log(config, LogLevel.ERROR, `Unexpected error: ${err.message}`, 'ERROR', colors.RED);
    if (config.debug) {
      log(config, LogLevel.DEBUG, `Stack: ${err.stack}`, 'DEBUG', colors.CYAN, true);
    }
  }
};

// Logger class for compatibility
export class Logger {
  constructor(private config: LogConfig = createLogConfig()) {}

  error(message: string): never {
    return error(message, this.config);
  }

  warn(message: string): void {
    warn(message, this.config);
  }

  info(message: string): void {
    info(message, this.config);
  }

  success(message: string): void {
    success(message, this.config);
  }

  debug(message: string): void {
    debug(message, this.config);
  }

  score(message: string): void {
    score(message, this.config);
  }
}

export const logger = new Logger();
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  SUCCESS = 3,
  DEBUG = 4,
  SCORE = 5
}

export interface LoggerConfig {
  level: LogLevel;
  debugMode: boolean;
  verboseOutput: boolean;
  colors: boolean;
}

export class Logger {
  private config: LoggerConfig;
  
  private readonly colors = {
    RED: '\x1b[0;31m',
    GREEN: '\x1b[0;32m',
    YELLOW: '\x1b[1;33m',
    BLUE: '\x1b[0;34m',
    PURPLE: '\x1b[0;35m',
    CYAN: '\x1b[0;36m',
    NC: '\x1b[0m'
  };

  constructor(config?: Partial<LoggerConfig>) {
    this.config = {
      level: LogLevel.INFO,
      debugMode: process.env.TDD_DEBUG === '1',
      verboseOutput: process.env.TDD_VERBOSE === '1',
      colors: true,
      ...config
    };
  }

  error(message: string): never {
    this.log(LogLevel.ERROR, message, 'ERROR', this.colors.RED);
    process.exit(1);
  }

  success(message: string): void {
    const prefix = this.config.verboseOutput || this.config.debugMode ? 'SUCCESS' : '✅';
    this.log(LogLevel.SUCCESS, message, prefix, this.colors.GREEN);
  }

  warn(message: string): void {
    const prefix = this.config.verboseOutput || this.config.debugMode ? 'WARNING' : '⚠️';
    this.log(LogLevel.WARN, message, prefix, this.colors.YELLOW);
  }

  info(message: string): void {
    const prefix = this.config.verboseOutput || this.config.debugMode ? 'INFO' : 'ℹ️';
    this.log(LogLevel.INFO, message, prefix, this.colors.BLUE);
  }

  score(message: string): void {
    this.log(LogLevel.SCORE, message, 'SCORE', this.colors.PURPLE);
  }

  debug(message: string): void {
    if (this.config.debugMode) {
      this.log(LogLevel.DEBUG, message, 'DEBUG', this.colors.CYAN, true);
    }
  }

  private log(level: LogLevel, message: string, prefix: string, color: string, useStderr: boolean = false): void {
    if (level > this.config.level && level !== LogLevel.DEBUG) {
      return;
    }

    const colorizedPrefix = this.config.colors ? `${color}[${prefix}]${this.colors.NC}` : `[${prefix}]`;
    const output = this.config.verboseOutput || this.config.debugMode || level === LogLevel.SCORE
      ? `${colorizedPrefix} ${message}`
      : `${colorizedPrefix} ${message}`;

    if (useStderr) {
      console.error(output);
    } else {
      console.log(output);
    }
  }

  setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  setDebugMode(enabled: boolean): void {
    this.config.debugMode = enabled;
  }

  setVerboseOutput(enabled: boolean): void {
    this.config.verboseOutput = enabled;
  }
}

// Singleton instance for global use
export const logger = new Logger();
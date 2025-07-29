// Application context types

export interface Context {
  configFile: string;
  stateFile: string;
  scoreFile: string;
  debug: boolean;
  verbose: boolean;
}

export interface LogConfig {
  level: LogLevel;
  debug: boolean;
  verbose: boolean;
  colors: boolean;
}

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  SUCCESS = 3,
  DEBUG = 4,
  SCORE = 5
}

// Functional composition types
export type Pipe = <T>(value: T) => T;
export type Transform<T, U> = (input: T) => U;
export type AsyncTransform<T, U> = (input: T) => Promise<U>;
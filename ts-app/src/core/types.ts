// Core functional types and interfaces

export type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

export const Ok = <T>(data: T): Result<T> => ({ success: true, data });
export const Err = <E>(error: E): Result<never, E> => ({ success: false, error });

export type AsyncResult<T, E = Error> = Promise<Result<T, E>>;

// Core domain types
export interface TddState {
  issue: string;
  criteria: number;
  phase: TddPhase;
  total: number;
}

export type TddPhase = 'START' | 'RED' | 'GREEN' | 'REFACTOR' | 'COVER';

export interface WorkFloConfig {
  PERSONA: string;
  CONFIDENCE_WEIGHTS_TEST_PASS: number;
  CONFIDENCE_WEIGHTS_COVERAGE: number;
  CONFIDENCE_WEIGHTS_REVIEW: number;
  CONFIDENCE_WEIGHTS_MUTATION: number;
  CONFIDENCE_THRESHOLD: number;
  MUTATION_THRESHOLD: number;
  LARGE_CHANGE_THRESHOLD: number;
  SMALL_CHANGE_THRESHOLD: number;
  QUALITY_BASE_SCORE: number;
  QUALITY_TEST_BONUS: number;
  QUALITY_TODO_PENALTY: number;
  QUALITY_LARGE_CHANGE_PENALTY: number;
  QUALITY_SMALL_CHANGE_BONUS: number;
  AI_REVIEW_RETRY_ATTEMPTS: number;
  AI_REVIEW_TIMEOUT: number;
  GIT_CACHE_ENABLED: boolean;
  GIT_CACHE_TTL: number;
}

export interface GameScores {
  PERFORMANCE_SCORE: number;
  QUALITY_SCORE: number;
  EFFICIENCY_SCORE: number;
  LLM_EFFICIENCY_SCORE: number;
  TOTAL_TESTS: number;
  TOTAL_LINES: number;
  TEST_RUNS: number;
  FAILED_RUNS: number;
  LLM_INTERACTIONS: number;
  ESTIMATED_TOKENS: number;
}

export interface TestResult {
  success: boolean;
  exitCode: number;
  duration: number;
  output?: string;
}

export interface IssueData {
  number: number;
  title: string;
  body: string;
  state: 'open' | 'closed';
}

export type ProjectType = 'bash' | 'nodejs' | 'dotnet';

export interface Context {
  configFile: string;
  stateFile: string;
  scoreFile: string;
  debug: boolean;
  verbose: boolean;
}

// Command function type
export type CommandFunction = (args: string[], context: Context) => AsyncResult<void>;

// Utility types for function composition
export type Pipe = <T>(value: T) => T;
export type Transform<T, U> = (input: T) => U;
export type AsyncTransform<T, U> = (input: T) => Promise<U>;

// Error types
export class WorkFloError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'WorkFloError';
  }
}

export class PhaseValidationError extends WorkFloError {
  constructor(message: string, public currentPhase: TddPhase, public attemptedPhase: string) {
    super(message, 'PHASE_VALIDATION');
    this.name = 'PhaseValidationError';
  }
}

export class GitHubApiError extends WorkFloError {
  constructor(message: string, public statusCode?: number) {
    super(message, 'GITHUB_API');
    this.name = 'GitHubApiError';
  }
}

export class TestExecutionError extends WorkFloError {
  constructor(message: string, public exitCode?: number) {
    super(message, 'TEST_EXECUTION');
    this.name = 'TestExecutionError';
  }
}
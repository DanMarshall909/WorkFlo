// Error types for the application

import { TddPhase } from './domain/tdd';

export class WorkFloError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'WorkFloError';
  }
}

export class ClaudeMdNotReadException extends WorkFloError {
  constructor(message: string = 'CLAUDE.md must be read before starting TDD workflow') {
    super(message, 'CLAUDE_MD_NOT_READ');
    this.name = 'ClaudeMdNotReadException';
  }
}

export class WorkflowViolationException extends WorkFloError {
  constructor(message: string, public violation: any) {
    super(message, 'WORKFLOW_VIOLATION');
    this.name = 'WorkflowViolationException';
  }
}

export class PhaseValidationError extends WorkFloError {
  constructor(message: string, public currentPhase: TddPhase, public attemptedPhase: string) {
    super(message, 'PHASE_VALIDATION');
    this.name = 'PhaseValidationError';
  }
}

export class TestExecutionError extends WorkFloError {
  constructor(message: string, public exitCode?: number) {
    super(message, 'TEST_EXECUTION');
    this.name = 'TestExecutionError';
  }
}

export class GitHubApiError extends WorkFloError {
  constructor(message: string, public statusCode?: number) {
    super(message, 'GITHUB_API');
    this.name = 'GitHubApiError';
  }
}
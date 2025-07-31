"use strict";
// Error types for the application
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitHubApiError = exports.TestExecutionError = exports.PhaseValidationError = exports.WorkflowViolationException = exports.ClaudeMdNotReadException = exports.WorkFloError = void 0;
class WorkFloError extends Error {
    constructor(message, code) {
        super(message);
        this.code = code;
        this.name = 'WorkFloError';
    }
}
exports.WorkFloError = WorkFloError;
class ClaudeMdNotReadException extends WorkFloError {
    constructor(message = 'CLAUDE.md must be read before starting TDD workflow') {
        super(message, 'CLAUDE_MD_NOT_READ');
        this.name = 'ClaudeMdNotReadException';
    }
}
exports.ClaudeMdNotReadException = ClaudeMdNotReadException;
class WorkflowViolationException extends WorkFloError {
    constructor(message, violation) {
        super(message, 'WORKFLOW_VIOLATION');
        this.violation = violation;
        this.name = 'WorkflowViolationException';
    }
}
exports.WorkflowViolationException = WorkflowViolationException;
class PhaseValidationError extends WorkFloError {
    constructor(message, currentPhase, attemptedPhase) {
        super(message, 'PHASE_VALIDATION');
        this.currentPhase = currentPhase;
        this.attemptedPhase = attemptedPhase;
        this.name = 'PhaseValidationError';
    }
}
exports.PhaseValidationError = PhaseValidationError;
class TestExecutionError extends WorkFloError {
    constructor(message, exitCode) {
        super(message, 'TEST_EXECUTION');
        this.exitCode = exitCode;
        this.name = 'TestExecutionError';
    }
}
exports.TestExecutionError = TestExecutionError;
class GitHubApiError extends WorkFloError {
    constructor(message, statusCode) {
        super(message, 'GITHUB_API');
        this.statusCode = statusCode;
        this.name = 'GitHubApiError';
    }
}
exports.GitHubApiError = GitHubApiError;

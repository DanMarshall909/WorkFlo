"use strict";
// Core domain interfaces
Object.defineProperty(exports, "__esModule", { value: true });
exports.CLAUDE_MD_FULL_CONSTRAINTS = exports.CLAUDE_MD_KEY_POINTS = exports.PHASE_TRANSITIONS = exports.TDD_PHASES = exports.GitHubApiException = exports.TestExecutionException = exports.PhaseValidationException = exports.WorkflowViolationException = exports.ClaudeMdNotReadException = exports.WorkFloError = void 0;
// Exceptions
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
class PhaseValidationException extends WorkFloError {
    constructor(message, currentPhase, attemptedPhase) {
        super(message, 'PHASE_VALIDATION');
        this.currentPhase = currentPhase;
        this.attemptedPhase = attemptedPhase;
        this.name = 'PhaseValidationException';
    }
}
exports.PhaseValidationException = PhaseValidationException;
class TestExecutionException extends WorkFloError {
    constructor(message, exitCode) {
        super(message, 'TEST_EXECUTION');
        this.exitCode = exitCode;
        this.name = 'TestExecutionException';
    }
}
exports.TestExecutionException = TestExecutionException;
class GitHubApiException extends WorkFloError {
    constructor(message, statusCode) {
        super(message, 'GITHUB_API');
        this.statusCode = statusCode;
        this.name = 'GitHubApiException';
    }
}
exports.GitHubApiException = GitHubApiException;
// Constants
exports.TDD_PHASES = ['START', 'RED', 'GREEN', 'REFACTOR', 'COVER'];
exports.PHASE_TRANSITIONS = {
    'START': ['red'],
    'RED': ['green'],
    'GREEN': ['refactor', 'cover'],
    'REFACTOR': ['cover'],
    'COVER': ['next']
};
exports.CLAUDE_MD_KEY_POINTS = `🚫 HARD RULE: Work on exactly ONE acceptance criteria, write ONE test, then STOP.

Required sequence (no skipping allowed):
1. RED → Write ONE failing test for current acceptance criteria
2. GREEN → Minimal implementation to make test pass
3. REFACTOR → Improve code quality (optional)
4. COVER → Add comprehensive tests + mutation testing (85% threshold)
5. NEXT → Hard stop, must explicitly continue to next criteria

Key constraints:
- Only ONE acceptance criteria is visible at a time
- Hard stops between criteria prevent scope creep
- Each phase requires explicit command to continue`;
exports.CLAUDE_MD_FULL_CONSTRAINTS = `🚫 CLAUDE.md TDD CONSTRAINTS REMINDER 🚫

📋 ULTRA-MINIMAL SELF-CONTAINED TDD WORKFLOW:
- Work on exactly ONE acceptance criteria at a time
- Hard stops between criteria prevent scope creep  
- No skipping phases allowed

🔄 REQUIRED SEQUENCE (RED-GREEN-REFACTOR-COVER-NEXT):
1. RED → Write ONE failing test for current acceptance criteria
2. GREEN → Minimal implementation to make test pass
3. REFACTOR → Improve code quality (optional)
4. COVER → Add comprehensive tests + mutation testing (85% threshold)
5. NEXT → Hard stop, must explicitly continue to next criteria

🛑 KEY CONSTRAINTS:
- Only ONE acceptance criteria is visible at a time
- Hard stops between criteria prevent scope creep
- Each phase requires explicit command to continue
- Tests must pass before advancing phases
- Mutation testing required in COVER phase (85% threshold)
- No manual git/gh commands - everything is automated
- Self-contained workflow with progressive disclosure

Remember: TUNNEL VISION on current criteria only!`;

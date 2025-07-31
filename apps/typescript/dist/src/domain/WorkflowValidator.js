"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowValidator = void 0;
const interfaces_1 = require("./interfaces");
class WorkflowValidator {
    constructor() {
        this.claudeMdReadFlag = false;
    }
    /**
     * Validates that CLAUDE.md has been read before starting TDD workflow
     * This enforces the requirement from the original .NET tests
     */
    validateClaudeMdRead() {
        if (!this.claudeMdReadFlag) {
            throw new interfaces_1.ClaudeMdNotReadException('CLAUDE.md must be read before starting TDD workflow');
        }
    }
    /**
     * Marks CLAUDE.md as read - this would be called when the system
     * detects that AI_GUIDELINES.md has been accessed
     */
    markClaudeMdAsRead() {
        this.claudeMdReadFlag = true;
    }
    /**
     * Validates TDD phase transitions to prevent skipping phases
     */
    validatePhaseTransition(currentPhase, nextCommand) {
        const allowedTransitions = interfaces_1.PHASE_TRANSITIONS[currentPhase];
        if (!allowedTransitions.includes(nextCommand)) {
            const message = this.getPhaseTransitionErrorMessage(currentPhase, nextCommand);
            throw new interfaces_1.PhaseValidationException(message, currentPhase, nextCommand);
        }
    }
    /**
     * Validates that tests are in the correct state for the current phase
     */
    validateTestState(phase, testsPass) {
        switch (phase) {
            case 'RED':
                if (testsPass) {
                    throw new interfaces_1.PhaseValidationException('RED phase requires failing tests. Tests are currently passing.', phase, 'test-validation');
                }
                break;
            case 'GREEN':
            case 'REFACTOR':
            case 'COVER':
                if (!testsPass) {
                    throw new interfaces_1.PhaseValidationException(`${phase} phase requires all tests to pass. Tests are currently failing.`, phase, 'test-validation');
                }
                break;
        }
    }
    /**
     * Validates that we're working on exactly one acceptance criteria
     */
    validateSingleCriteriaFocus(attemptedActions) {
        return attemptedActions.length === 1;
    }
    /**
     * Checks if the current session has a valid state
     */
    validateSessionState(issue, criteria, total) {
        if (!issue) {
            throw new interfaces_1.PhaseValidationException('No active TDD session found', 'START', 'session-validation');
        }
        if (criteria === undefined || criteria < 1) {
            throw new interfaces_1.PhaseValidationException('Invalid criteria number', 'START', 'session-validation');
        }
        if (total === undefined || total < 1) {
            throw new interfaces_1.PhaseValidationException('Invalid total criteria count', 'START', 'session-validation');
        }
        if (criteria > total) {
            throw new interfaces_1.PhaseValidationException('Current criteria exceeds total criteria', 'START', 'session-validation');
        }
    }
    /**
     * Validates that an issue has proper acceptance criteria format
     */
    validateAcceptanceCriteria(issueBody) {
        const criteriaPattern = /^- \[ \]/gm;
        const matches = issueBody.match(criteriaPattern);
        if (!matches || matches.length === 0) {
            throw new interfaces_1.PhaseValidationException('No acceptance criteria found in issue. Use format: - [ ] criterion', 'START', 'criteria-validation');
        }
    }
    /**
     * Resets the CLAUDE.md read flag (for testing purposes)
     */
    reset() {
        this.claudeMdReadFlag = false;
    }
    /**
     * Gets the current state of CLAUDE.md read flag
     */
    isClaudeMdRead() {
        return this.claudeMdReadFlag;
    }
    getPhaseTransitionErrorMessage(currentPhase, nextCommand) {
        switch (currentPhase) {
            case 'START':
                return 'Must start with: tdd red';
            case 'RED':
                return 'After RED: tdd green';
            case 'GREEN':
                return 'After GREEN: tdd refactor OR tdd cover';
            case 'REFACTOR':
                return 'After REFACTOR: tdd cover';
            case 'COVER':
                return 'After COVER: tdd next';
            default:
                return `Invalid phase transition from ${currentPhase} to ${nextCommand}`;
        }
    }
}
exports.WorkflowValidator = WorkflowValidator;

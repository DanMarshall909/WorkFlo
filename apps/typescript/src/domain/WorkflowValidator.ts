import { ClaudeMdNotReadException, PhaseValidationException, TddPhase, PHASE_TRANSITIONS } from './interfaces';

export class WorkflowValidator {
  private claudeMdReadFlag: boolean = false;

  /**
   * Validates that CLAUDE.md has been read before starting TDD workflow
   * This enforces the requirement from the original .NET tests
   */
  validateClaudeMdRead(): void {
    if (!this.claudeMdReadFlag) {
      throw new ClaudeMdNotReadException('CLAUDE.md must be read before starting TDD workflow');
    }
  }

  /**
   * Marks CLAUDE.md as read - this would be called when the system
   * detects that AI_GUIDELINES.md has been accessed
   */
  markClaudeMdAsRead(): void {
    this.claudeMdReadFlag = true;
  }

  /**
   * Validates TDD phase transitions to prevent skipping phases
   */
  validatePhaseTransition(currentPhase: TddPhase, nextCommand: string): void {
    const allowedTransitions = PHASE_TRANSITIONS[currentPhase];
    
    if (!allowedTransitions.includes(nextCommand)) {
      const message = this.getPhaseTransitionErrorMessage(currentPhase, nextCommand);
      throw new PhaseValidationException(message, currentPhase, nextCommand);
    }
  }

  /**
   * Validates that tests are in the correct state for the current phase
   */
  validateTestState(phase: TddPhase, testsPass: boolean): void {
    switch (phase) {
      case 'RED':
        if (testsPass) {
          throw new PhaseValidationException(
            'RED phase requires failing tests. Tests are currently passing.',
            phase,
            'test-validation'
          );
        }
        break;
      case 'GREEN':
      case 'REFACTOR':
      case 'COVER':
        if (!testsPass) {
          throw new PhaseValidationException(
            `${phase} phase requires all tests to pass. Tests are currently failing.`,
            phase,
            'test-validation'
          );
        }
        break;
    }
  }

  /**
   * Validates that we're working on exactly one acceptance criteria
   */
  validateSingleCriteriaFocus(attemptedActions: string[]): boolean {
    return attemptedActions.length === 1;
  }

  /**
   * Checks if the current session has a valid state
   */
  validateSessionState(issue?: string, criteria?: number, total?: number): void {
    if (!issue) {
      throw new PhaseValidationException('No active TDD session found', 'START', 'session-validation');
    }

    if (criteria === undefined || criteria < 1) {
      throw new PhaseValidationException('Invalid criteria number', 'START', 'session-validation');
    }

    if (total === undefined || total < 1) {
      throw new PhaseValidationException('Invalid total criteria count', 'START', 'session-validation');
    }

    if (criteria > total) {
      throw new PhaseValidationException('Current criteria exceeds total criteria', 'START', 'session-validation');
    }
  }

  /**
   * Validates that an issue has proper acceptance criteria format
   */
  validateAcceptanceCriteria(issueBody: string): void {
    const criteriaPattern = /^- \[ \]/gm;
    const matches = issueBody.match(criteriaPattern);
    
    if (!matches || matches.length === 0) {
      throw new PhaseValidationException(
        'No acceptance criteria found in issue. Use format: - [ ] criterion',
        'START',
        'criteria-validation'
      );
    }
  }

  /**
   * Resets the CLAUDE.md read flag (for testing purposes)
   */
  reset(): void {
    this.claudeMdReadFlag = false;
  }

  /**
   * Gets the current state of CLAUDE.md read flag
   */
  isClaudeMdRead(): boolean {
    return this.claudeMdReadFlag;
  }

  private getPhaseTransitionErrorMessage(currentPhase: TddPhase, nextCommand: string): string {
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
/**
 * Enhanced service mocks for unit testing
 * 
 * Provides comprehensive mocking infrastructure for all CLI services
 */

import { TddState } from '../../src/services/tdd-state';

/**
 * Factory for creating mock TDD states
 */
export class MockTddStateFactory {
  static createActiveState(overrides?: Partial<TddState>): TddState {
    return {
      issue: 123,
      criteria: 1,
      phase: 'START',
      total: 3,
      ...overrides
    };
  }

  static createRedPhaseState(overrides?: Partial<TddState>): TddState {
    return this.createActiveState({
      phase: 'RED',
      ...overrides
    });
  }

  static createGreenPhaseState(overrides?: Partial<TddState>): TddState {
    return this.createActiveState({
      phase: 'GREEN',
      ...overrides
    });
  }

  static createRefactorPhaseState(overrides?: Partial<TddState>): TddState {
    return this.createActiveState({
      phase: 'REFACTOR',
      ...overrides
    });
  }

  static createCoverPhaseState(overrides?: Partial<TddState>): TddState {
    return this.createActiveState({
      phase: 'COVER',
      ...overrides
    });
  }

  static createFinalCriteriaState(overrides?: Partial<TddState>): TddState {
    return this.createActiveState({
      criteria: 3,
      phase: 'COVER',
      total: 3,
      ...overrides
    });
  }
}

/**
 * Mock GitHub issue data factory
 */
export class MockGitHubIssueFactory {
  static createIssueWithCriteria(criteriaCount: number = 3) {
    const criteria = Array.from({ length: criteriaCount }, (_, i) => 
      `- [ ] Acceptance criteria ${i + 1}`
    ).join('\n');

    return {
      title: `Test Issue #123`,
      body: `## Description\nTest issue for TDD workflow\n\n## Acceptance Criteria\n${criteria}`
    };
  }

  static createIssueWithMixedCriteria() {
    return {
      title: 'Mixed Criteria Issue',
      body: `## Acceptance Criteria
- [ ] Unchecked criteria 1
- [x] Checked criteria (completed)
- [ ] Unchecked criteria 2
- [x] Another completed criteria
- [ ] Final unchecked criteria`
    };
  }

  static createIssueWithNoCriteria() {
    return {
      title: 'No Criteria Issue',
      body: 'This issue has no acceptance criteria'
    };
  }
}

/**
 * Command execution result factory
 */
export class MockCommandResultFactory {
  static createSuccessResult(output: string = 'Command succeeded') {
    return Buffer.from(output);
  }

  static createFailureResult(errorMessage: string = 'Command failed') {
    const error = new Error(errorMessage);
    (error as any).status = 1;
    throw error;
  }

  static createGitOutput(branchName: string = 'main') {
    return Buffer.from(branchName);
  }

  static createTestFailureResult() {
    const error = new Error('Tests failed as expected in RED phase');
    (error as any).status = 1;
    throw error;
  }

  static createTestSuccessResult() {
    return Buffer.from('All tests passed');
  }
}

/**
 * Project type detection mocks
 */
export class MockProjectDetector {
  static mockNodeJsProject() {
    return {
      detectProjectType: jest.fn().mockReturnValue('nodejs'),
      getBuildCommand: jest.fn().mockReturnValue('npm run build'),
      getTestCommand: jest.fn().mockReturnValue('npm test'),
      hasTests: jest.fn().mockReturnValue(true),
      getProjectCommands: jest.fn().mockReturnValue({
        build: 'npm run build',
        test: 'npm test',
        lint: 'npm run lint'
      })
    };
  }

  static mockPythonProject() {
    return {
      detectProjectType: jest.fn().mockReturnValue('python'),
      getBuildCommand: jest.fn().mockReturnValue('python -m build'),
      getTestCommand: jest.fn().mockReturnValue('pytest'),
      hasTests: jest.fn().mockReturnValue(true),
      getProjectCommands: jest.fn().mockReturnValue({
        build: 'python -m build',
        test: 'pytest',
        lint: 'flake8'
      })
    };
  }

  static mockBashProject() {
    return {
      detectProjectType: jest.fn().mockReturnValue('bash'),
      getBuildCommand: jest.fn().mockReturnValue(null),
      getTestCommand: jest.fn().mockReturnValue('npm test'),
      hasTests: jest.fn().mockReturnValue(true),
      getProjectCommands: jest.fn().mockReturnValue({
        test: 'npm test'
      })
    };
  }
}

/**
 * Logger output capture utilities
 */
export class MockLoggerCapture {
  private static capturedLogs: Array<{type: string, message: string}> = [];

  static setup() {
    this.capturedLogs = [];
    
    return {
      info: jest.fn().mockImplementation((msg: string) => {
        this.capturedLogs.push({type: 'info', message: msg});
      }),
      warn: jest.fn().mockImplementation((msg: string) => {
        this.capturedLogs.push({type: 'warn', message: msg});
      }),
      error: jest.fn().mockImplementation((msg: string) => {
        this.capturedLogs.push({type: 'error', message: msg});
      }),
      success: jest.fn().mockImplementation((msg: string) => {
        this.capturedLogs.push({type: 'success', message: msg});
      })
    };
  }

  static getLogs() {
    return this.capturedLogs;
  }

  static getLogsByType(type: string) {
    return this.capturedLogs.filter(log => log.type === type);
  }

  static reset() {
    this.capturedLogs = [];
  }
}

/**
 * File system operation mocks
 */
export class MockFileSystem {
  static mockStateFileExists(exists: boolean = true) {
    const fs = require('fs');
    return jest.spyOn(fs, 'existsSync').mockReturnValue(exists);
  }

  static mockStateFileContent(content: string) {
    const fs = require('fs');
    return jest.spyOn(fs, 'readFileSync').mockReturnValue(content);
  }

  static mockStateFileWrite() {
    const fs = require('fs');
    return jest.spyOn(fs, 'writeFileSync').mockImplementation();
  }

  static mockStateFileDelete() {
    const fs = require('fs');
    return jest.spyOn(fs, 'unlinkSync').mockImplementation();
  }
}
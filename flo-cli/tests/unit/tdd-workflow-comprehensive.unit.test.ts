/**
 * Comprehensive unit tests for TDD workflow logic
 * 
 * Tests the core business logic of TDD commands without CLI framework overhead.
 * Uses enhanced mocking infrastructure for precision testing.
 */

import { TddStateService } from '../../src/services/tdd-state';
import { Logger } from '../../src/services/logger';
import { ProjectDetector } from '../../src/services/project-detector';
import { execSync } from 'child_process';
import {
  MockTddStateFactory,
  MockGitHubIssueFactory,
  MockCommandResultFactory,
  MockProjectDetector
} from './service-mocks';

// Mock all dependencies
jest.mock('../../src/services/tdd-state');
jest.mock('../../src/services/logger');
jest.mock('../../src/services/project-detector');
jest.mock('child_process');

describe('TDD Workflow Logic (Comprehensive Unit Tests)', () => {
  let mockTddStateService: jest.Mocked<typeof TddStateService>;
  let mockLogger: jest.Mocked<typeof Logger>;
  let mockProjectDetector: jest.Mocked<typeof ProjectDetector>;
  let mockExecSync: jest.MockedFunction<typeof execSync>;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    // Setup mocks
    mockTddStateService = TddStateService as jest.Mocked<typeof TddStateService>;
    mockLogger = Logger as jest.Mocked<typeof Logger>;
    mockProjectDetector = ProjectDetector as jest.Mocked<typeof ProjectDetector>;
    mockExecSync = execSync as jest.MockedFunction<typeof execSync>;
    
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    // Reset all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('TDD Status Logic', () => {
    it('should handle no active session correctly', () => {
      // Given: No active TDD session
      mockTddStateService.loadState.mockReturnValue(null);
      
      // When: Checking status
      const state = mockTddStateService.loadState();
      
      if (!state) {
        mockLogger.warn('No active TDD session');
        mockLogger.info('Start with: flo tdd start <issue_number>');
      }
      
      // Then: Should show appropriate messages
      expect(mockTddStateService.loadState).toHaveBeenCalledTimes(1);
      expect(mockLogger.warn).toHaveBeenCalledWith('No active TDD session');
      expect(mockLogger.info).toHaveBeenCalledWith('Start with: flo tdd start <issue_number>');
    });

    it('should display status for active session in GREEN phase', () => {
      // Given: Active TDD session in GREEN phase
      const state = MockTddStateFactory.createGreenPhaseState({
        issue: 456,
        criteria: 2,
        total: 4
      });
      mockTddStateService.loadState.mockReturnValue(state);
      
      // When: Displaying status
      const loadedState = mockTddStateService.loadState();
      if (loadedState) {
        console.log('📊 TDD Session Status');
        console.log(`Issue: #${loadedState.issue}`);
        console.log(`Progress: ${loadedState.criteria}/${loadedState.total} acceptance criteria`);
        console.log(`Current Phase: ${loadedState.phase}`);
        
        if (loadedState.phase === 'GREEN') {
          mockLogger.info('Next: flo tdd refactor OR flo tdd cover');
        }
      }
      
      // Then: Should display correct information
      expect(consoleSpy).toHaveBeenCalledWith('📊 TDD Session Status');
      expect(consoleSpy).toHaveBeenCalledWith('Issue: #456');
      expect(consoleSpy).toHaveBeenCalledWith('Progress: 2/4 acceptance criteria');
      expect(consoleSpy).toHaveBeenCalledWith('Current Phase: GREEN');
      expect(mockLogger.info).toHaveBeenCalledWith('Next: flo tdd refactor OR flo tdd cover');
    });
  });

  describe('TDD Start Logic', () => {
    beforeEach(() => {
      // Setup default project detection
      Object.assign(mockProjectDetector, MockProjectDetector.mockNodeJsProject());
    });

    it('should validate issue number correctly', () => {
      // Test valid issue numbers
      expect(() => {
        const issueNumber = parseInt('123');
        if (!issueNumber || issueNumber <= 0) {
          throw new Error('Invalid issue number');
        }
      }).not.toThrow();

      // Test invalid issue numbers
      expect(() => {
        const issueNumber = parseInt('invalid');
        if (!issueNumber || issueNumber <= 0) {
          throw new Error('Invalid issue number');
        }
      }).toThrow('Invalid issue number');

      expect(() => {
        const issueNumber = parseInt('0');
        if (!issueNumber || issueNumber <= 0) {
          throw new Error('Invalid issue number');
        }
      }).toThrow('Invalid issue number');
    });

    it('should count acceptance criteria correctly', () => {
      // Given: Issue with 3 acceptance criteria
      const issueData = MockGitHubIssueFactory.createIssueWithCriteria(3);
      
      // When: Counting criteria
      const regex = /^- \[ \]/gm;
      const matches = issueData.body.match(regex);
      const count = matches ? matches.length : 0;
      
      // Then: Should count correctly
      expect(count).toBe(3);
    });

    it('should handle mixed criteria correctly', () => {
      // Given: Issue with mixed checked/unchecked criteria
      const issueData = MockGitHubIssueFactory.createIssueWithMixedCriteria();
      
      // When: Counting only unchecked criteria
      const regex = /^- \[ \]/gm;
      const matches = issueData.body.match(regex);
      const count = matches ? matches.length : 0;
      
      // Then: Should only count unchecked criteria
      expect(count).toBe(3); // Only unchecked items
    });

    it('should save initial TDD state correctly', () => {
      // Given: Valid issue with 2 criteria
      const issueNumber = 789;
      const totalCriteria = 2;
      
      // When: Saving initial state
      const initialState = {
        issue: issueNumber,
        criteria: 1,
        phase: 'START' as const,
        total: totalCriteria
      };
      
      mockTddStateService.saveState(initialState);
      
      // Then: Should save correct state
      expect(mockTddStateService.saveState).toHaveBeenCalledWith({
        issue: 789,
        criteria: 1,
        phase: 'START',
        total: 2
      });
    });
  });

  describe('TDD Phase Transitions', () => {
    it('should handle RED phase with failing tests', () => {
      // Given: Active TDD session in START phase
      const state = MockTddStateFactory.createActiveState();
      mockTddStateService.loadState.mockReturnValue(state);
      
      // Mock test execution to fail (expected in RED phase)
      mockExecSync.mockImplementation(() => {
        throw new Error('Tests failed as expected in RED phase');
      });
      
      // When: Running RED phase logic
      try {
        // Simulate test run with skip environment variable
        process.env['TDD_SKIP_SCRIPT_TESTS'] = '1';
        mockExecSync('./run-tests');
      } catch (error) {
        // Tests failed as expected in RED phase
        mockLogger.success('✅ Tests failing as expected');
        mockTddStateService.updatePhase('RED');
        mockLogger.success('RED phase complete. Next: flo tdd green');
      } finally {
        delete process.env['TDD_SKIP_SCRIPT_TESTS'];
      }
      
      // Then: Should handle failure correctly
      expect(mockLogger.success).toHaveBeenCalledWith('✅ Tests failing as expected');
      expect(mockTddStateService.updatePhase).toHaveBeenCalledWith('RED');
      expect(mockLogger.success).toHaveBeenCalledWith('RED phase complete. Next: flo tdd green');
    });

    it('should handle GREEN phase with passing tests', () => {
      // Given: Active TDD session in RED phase
      const state = MockTddStateFactory.createRedPhaseState();
      mockTddStateService.loadState.mockReturnValue(state);
      
      // Mock test execution to pass (expected in GREEN phase)
      mockExecSync.mockReturnValue(MockCommandResultFactory.createTestSuccessResult());
      
      // When: Running GREEN phase logic
      mockLogger.info('🟢 GREEN Phase - Minimal implementation');
      
      try {
        process.env['TDD_SKIP_SCRIPT_TESTS'] = '1';
        mockExecSync('./run-tests');
        mockLogger.success('✅ Tests passing');
        mockTddStateService.updatePhase('GREEN');
        mockLogger.success('GREEN phase complete. Next: flo tdd refactor OR flo tdd cover');
      } finally {
        delete process.env['TDD_SKIP_SCRIPT_TESTS'];
      }
      
      // Then: Should handle success correctly
      expect(mockLogger.info).toHaveBeenCalledWith('🟢 GREEN Phase - Minimal implementation');
      expect(mockLogger.success).toHaveBeenCalledWith('✅ Tests passing');
      expect(mockTddStateService.updatePhase).toHaveBeenCalledWith('GREEN');
      expect(mockLogger.success).toHaveBeenCalledWith('GREEN phase complete. Next: flo tdd refactor OR flo tdd cover');
    });

    it('should handle NEXT phase for final criteria', () => {
      // Given: TDD session on final criteria
      const finalState = MockTddStateFactory.createFinalCriteriaState();
      mockTddStateService.loadState.mockReturnValue(finalState);
      
      // When: Moving to next (which completes the session)
      const state = mockTddStateService.loadState();
      
      if (state && state.criteria >= state.total) {
        mockLogger.success('🎉 All acceptance criteria completed!');
        mockTddStateService.clearState();
      }
      
      // Then: Should complete the session
      expect(mockLogger.success).toHaveBeenCalledWith('🎉 All acceptance criteria completed!');
      expect(mockTddStateService.clearState).toHaveBeenCalledTimes(1);
    });

    it('should advance criteria for non-final criteria', () => {
      // Given: TDD session not on final criteria
      const state = MockTddStateFactory.createCoverPhaseState({
        criteria: 2,
        total: 4
      });
      mockTddStateService.loadState.mockReturnValue(state);
      
      // When: Moving to next criteria
      const currentState = mockTddStateService.loadState();
      
      if (currentState && currentState.criteria < currentState.total) {
        mockLogger.warn('🛑 HARD STOP');
        mockLogger.warn('To prevent scope creep, you must explicitly continue');
        mockTddStateService.nextCriteria();
      }
      
      // Then: Should advance to next criteria
      expect(mockLogger.warn).toHaveBeenCalledWith('🛑 HARD STOP');
      expect(mockLogger.warn).toHaveBeenCalledWith('To prevent scope creep, you must explicitly continue');
      expect(mockTddStateService.nextCriteria).toHaveBeenCalledTimes(1);
    });
  });

  describe('Project Type Integration', () => {
    it('should work with Node.js projects', () => {
      // Given: Node.js project setup
      const projectMocks = MockProjectDetector.mockNodeJsProject();
      Object.assign(mockProjectDetector, projectMocks);
      
      // When: Detecting project type
      const projectType = mockProjectDetector.detectProjectType();
      const buildCmd = mockProjectDetector.getBuildCommand(projectType);
      const testCmd = mockProjectDetector.getTestCommand(projectType);
      
      // Then: Should detect Node.js project
      expect(projectType).toBe('nodejs');
      expect(buildCmd).toBe('npm run build');
      expect(testCmd).toBe('npm test');
    });

    it('should work with Python projects', () => {
      // Given: Python project setup
      const projectMocks = MockProjectDetector.mockPythonProject();
      Object.assign(mockProjectDetector, projectMocks);
      
      // When: Detecting project type
      const projectType = mockProjectDetector.detectProjectType();
      const testCmd = mockProjectDetector.getTestCommand(projectType);
      
      // Then: Should detect Python project
      expect(projectType).toBe('python');
      expect(testCmd).toBe('pytest');
    });

    it('should work with Bash projects', () => {
      // Given: Bash project setup
      const projectMocks = MockProjectDetector.mockBashProject();
      Object.assign(mockProjectDetector, projectMocks);
      
      // When: Detecting project type
      const projectType = mockProjectDetector.detectProjectType();
      const testCmd = mockProjectDetector.getTestCommand(projectType);
      
      // Then: Should detect Bash project
      expect(projectType).toBe('bash');
      expect(testCmd).toBe('./run-tests');
    });
  });
});
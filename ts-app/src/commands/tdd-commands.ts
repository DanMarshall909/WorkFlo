// Functional TDD command implementations

import * as logger from '../core/logger';
import * as config from '../core/config';
import * as state from '../core/state';
import * as git from '../core/git';
import * as testing from '../core/testing';
import * as scoring from '../core/scoring';
import { Context, Result, Ok, Err, PhaseValidationError, TddState } from '../core/types';

// Command type definitions
export type TddCommand = (args: string[], context: Context) => Promise<Result<void>>;

// Validation functions
const validatePhaseTransition = (currentPhase: string, nextPhase: string): Result<void> => {
  const transitions: Record<string, string[]> = {
    'START': ['red'],
    'RED': ['green'],
    'GREEN': ['refactor', 'cover'],
    'REFACTOR': ['cover'],
    'COVER': ['next']
  };

  const allowed = transitions[currentPhase.toUpperCase()] || [];
  if (!allowed.includes(nextPhase.toLowerCase())) {
    const message = getPhaseTransitionError(currentPhase, nextPhase);
    return Err(new PhaseValidationError(message, currentPhase as any, nextPhase));
  }

  return Ok(undefined);
};

const getPhaseTransitionError = (currentPhase: string, nextPhase: string): string => {
  switch (currentPhase) {
    case 'START': return 'Must start with: tdd red';
    case 'RED': return 'After RED: tdd green';
    case 'GREEN': return 'After GREEN: tdd refactor OR tdd cover';
    case 'REFACTOR': return 'After REFACTOR: tdd cover';
    case 'COVER': return 'After COVER: tdd next';
    default: return `Invalid phase transition from ${currentPhase} to ${nextPhase}`;
  }
};

const showCurrentCriteria = (issue: string, criteria: number, total: number): Result<void> => {
  const criteriaResult = git.getCriteriaText(issue, criteria);
  if (!criteriaResult.success) return criteriaResult;

  console.log('');
  console.log(`🎯 Criteria ${criteria}/${total}: ${criteriaResult.data}`);
  console.log('📝 Write ONE test for this criteria only');
  console.log('🚫 Do NOT work on other criteria');
  console.log('');

  return Ok(undefined);
};

const commitPhase = async (
  phase: string, 
  issue: string, 
  criteria: number, 
  context: Context
): Promise<Result<void>> => {
  const criteriaResult = git.getCriteriaText(issue, criteria);
  if (!criteriaResult.success) return criteriaResult;

  const issueResult = git.getIssueData(issue);
  const issueTitle = issueResult.success ? issueResult.data.title : `Issue ${issue}`;

  const messageResult = git.generateCommitMessage(phase, criteria, criteriaResult.data, issue, issueTitle);
  if (!messageResult.success) return messageResult;

  const commitResult = git.autoCommit(messageResult.data);
  if (commitResult.success) {
    logger.success('💾 Auto-committed changes');
  } else {
    logger.warn('⚠️  Auto-commit failed (continuing anyway)');
  }

  return Ok(undefined);
};

// TDD Commands
export const startCommand: TddCommand = async (args, context) => {
  if (args.length === 0) {
    return Err(new Error('Usage: tdd start <issue_number> [--non-interactive]'));
  }

  const issue = args[0];
  const nonInteractive = args.includes('--non-interactive');

  // Check prerequisites
  const prereqResult = git.checkPrerequisites();
  if (!prereqResult.success) return prereqResult;

  logger.info(`Starting TDD workflow for issue #${issue}`);

  // Validate issue exists
  if (!git.issueExists(issue)) {
    return Err(new Error(`Issue #${issue} not found`));
  }

  // Get issue data
  const issueResult = git.getIssueData(issue);
  if (!issueResult.success) return issueResult;

  const branchName = git.generateBranchName(issue);
  const currentBranchResult = git.getCurrentBranch();
  
  if (currentBranchResult.success && currentBranchResult.data !== branchName) {
    if (git.branchExists(branchName)) {
      logger.info(`Switching to existing branch: ${branchName}`);
      const switchResult = git.switchBranch(branchName);
      if (!switchResult.success) return switchResult;
    } else {
      logger.info(`Creating and switching to new branch: ${branchName}`);
      const createResult = git.createAndSwitchBranch(branchName);
      if (!createResult.success) return createResult;

      // Create initial commit
      const initialMessage = `feat: initialize TDD workflow for issue #${issue}

${issueResult.data.title}

Linked-to: #${issue}
Branch: ${branchName}
TDD-Session: START

🤖 Generated with WorkFlo TDD automation`;

      git.commit(initialMessage, true);
    }
  }

  // Count acceptance criteria
  const countResult = git.countAcceptanceCriteria(issue);
  if (!countResult.success) return countResult;

  const total = countResult.data;
  const initialState = state.createInitialState(issue, total);

  const saveResult = state.saveState(context.stateFile, initialState);
  if (!saveResult.success) return saveResult;

  logger.success(`Started issue #${issue} with ${total} acceptance criteria`);
  logger.success(`Working on branch: ${branchName}`);
  
  const showResult = showCurrentCriteria(issue, 1, total);
  if (!showResult.success) return showResult;

  logger.info('Next step: tdd red');
  return Ok(undefined);
};

export const redCommand: TddCommand = async (args, context) => {
  const stateResult = state.loadState(context.stateFile);
  if (!stateResult.success) return stateResult;

  const currentState = stateResult.data;
  if (!currentState) {
    return Err(new Error('No active TDD session. Run: tdd start <issue>'));
  }

  const validationResult = validatePhaseTransition(currentState.phase, 'red');
  if (!validationResult.success) return validationResult;

  logger.info('🔴 RED Phase - Write failing test');
  const showResult = showCurrentCriteria(currentState.issue, currentState.criteria, currentState.total);
  if (!showResult.success) return showResult;

  console.log('Write a failing test for the current acceptance criteria.');
  console.log('The test should:');
  console.log('  • Cover ONLY the current criteria');
  console.log('  • Use business scenario naming (not \'should\' statements)');
  console.log('  • Follow Given-When-Then structure');
  console.log('');

  // Verify test fails
  logger.info('Verifying test fails...');
  const testResult = testing.runTests(true, 'RED');
  if (!testResult.success) return testResult;

  if (testResult.data.success) {
    return Err(new Error('Tests are passing! RED phase requires failing tests'));
  }

  logger.success('✅ Tests failing as expected');
  
  const commitResult = await commitPhase('RED', currentState.issue, currentState.criteria, context);
  if (!commitResult.success) return commitResult;

  const newState = state.updatePhase(currentState, 'RED');
  const saveResult = state.saveState(context.stateFile, newState);
  if (!saveResult.success) return saveResult;

  logger.success('RED phase complete. Next: tdd green');
  return Ok(undefined);
};

export const greenCommand: TddCommand = async (args, context) => {
  const stateResult = state.loadState(context.stateFile);
  if (!stateResult.success) return stateResult;

  const currentState = stateResult.data;
  if (!currentState) {
    return Err(new Error('No active TDD session'));
  }

  const validationResult = validatePhaseTransition(currentState.phase, 'green');
  if (!validationResult.success) return validationResult;

  logger.info('🟢 GREEN Phase - Minimal implementation');
  const showResult = showCurrentCriteria(currentState.issue, currentState.criteria, currentState.total);
  if (!showResult.success) return showResult;

  console.log('Implement the MINIMAL code needed to make the test pass.');
  console.log('Requirements:');
  console.log('  • Simplest possible solution');
  console.log('  • No extra features or optimizations');
  console.log('  • Just enough to make the test green');
  console.log('');

  // Verify tests pass
  logger.info('Verifying tests pass...');
  const testResult = testing.runTests(true, 'GREEN');
  if (!testResult.success) return testResult;

  if (!testResult.data.success) {
    return Err(new Error('Tests still failing! GREEN phase requires passing tests'));
  }

  logger.success('✅ All tests passing');
  
  const commitResult = await commitPhase('GREEN', currentState.issue, currentState.criteria, context);
  if (!commitResult.success) return commitResult;

  const newState = state.updatePhase(currentState, 'GREEN');
  const saveResult = state.saveState(context.stateFile, newState);
  if (!saveResult.success) return saveResult;

  logger.success('GREEN phase complete. Next: tdd refactor OR tdd cover');
  return Ok(undefined);
};

export const refactorCommand: TddCommand = async (args, context) => {
  const stateResult = state.loadState(context.stateFile);
  if (!stateResult.success) return stateResult;

  const currentState = stateResult.data;
  if (!currentState) {
    return Err(new Error('No active TDD session'));
  }

  const validationResult = validatePhaseTransition(currentState.phase, 'refactor');
  if (!validationResult.success) return validationResult;

  logger.info('🔵 REFACTOR Phase - Improve code quality');

  console.log('Improve the code while keeping all tests green.');
  console.log('Focus on:');
  console.log('  • Code readability and structure');
  console.log('  • Removing duplication');
  console.log('  • Better naming and organization');
  console.log('');

  // Check if changes were made
  if (!git.hasChanges()) {
    logger.info('No changes detected - skipping refactor commit');
  } else {
    // Verify tests still pass
    logger.info('Verifying tests still pass after refactoring...');
    const testResult = testing.runTests(true);
    if (!testResult.success) return testResult;

    if (!testResult.data.success) {
      return Err(new Error('Tests failing after refactor! Fix the refactoring'));
    }

    logger.success('✅ Tests still passing after refactor');
    
    const commitResult = await commitPhase('REFACTOR', currentState.issue, currentState.criteria, context);
    if (!commitResult.success) return commitResult;
  }

  const newState = state.updatePhase(currentState, 'REFACTOR');
  const saveResult = state.saveState(context.stateFile, newState);
  if (!saveResult.success) return saveResult;

  logger.success('REFACTOR phase complete. Next: tdd cover');
  return Ok(undefined);
};

export const coverCommand: TddCommand = async (args, context) => {
  const stateResult = state.loadState(context.stateFile);
  if (!stateResult.success) return stateResult;

  const currentState = stateResult.data;
  if (!currentState) {
    return Err(new Error('No active TDD session'));
  }

  const validationResult = validatePhaseTransition(currentState.phase, 'cover');
  if (!validationResult.success) return validationResult;

  logger.info('📊 COVER Phase - Comprehensive test coverage');

  console.log('Add comprehensive test coverage for the current criteria.');
  console.log('Include:');
  console.log('  • Edge cases and boundary conditions');
  console.log('  • Error scenarios and exception handling');
  console.log('  • Different input variations');
  console.log('');

  // Verify all tests pass
  logger.info('Running all tests...');
  const testResult = testing.runTests(false);
  if (!testResult.success) return testResult;

  if (!testResult.data.success) {
    return Err(new Error('Tests must pass before completing COVER phase'));
  }

  // Note: Mutation testing will run during PR submission
  logger.info('Mutation testing will be performed during PR submission');
  
  const commitResult = await commitPhase('COVER', currentState.issue, currentState.criteria, context);
  if (!commitResult.success) return commitResult;

  const newState = state.updatePhase(currentState, 'COVER');
  const saveResult = state.saveState(context.stateFile, newState);
  if (!saveResult.success) return saveResult;

  logger.success('COVER phase complete. Next: tdd next');
  return Ok(undefined);
};

export const nextCommand: TddCommand = async (args, context) => {
  const stateResult = state.loadState(context.stateFile);
  if (!stateResult.success) return stateResult;

  const currentState = stateResult.data;
  if (!currentState) {
    return Err(new Error('No active TDD session'));
  }

  const validationResult = validatePhaseTransition(currentState.phase, 'next');
  if (!validationResult.success) return validationResult;

  logger.success(`✅ Acceptance criteria ${currentState.criteria} completed!`);

  // Move to next criteria
  const nextState = state.nextCriteria(currentState);

  if (state.isComplete(nextState)) {
    logger.success(`🎉 ALL ${currentState.total} acceptance criteria completed for issue #${currentState.issue}!`);

    console.log('');
    logger.info(`✅ Issue #${currentState.issue} is complete and ready for PR`);
    logger.info('💡 Next step: Create Pull Request when ready');
    console.log('');

    // Clear state file
    const clearResult = state.clearState(context.stateFile);
    if (!clearResult.success) return clearResult;

    return Ok(undefined);
  }

  const saveResult = state.saveState(context.stateFile, nextState);
  if (!saveResult.success) return saveResult;

  console.log('');
  logger.info('Moving to next acceptance criteria...');
  const showResult = showCurrentCriteria(nextState.issue, nextState.criteria, nextState.total);
  if (!showResult.success) return showResult;

  logger.warn('🛑 HARD STOP');
  logger.warn('To prevent scope creep, you must explicitly continue');
  console.log('');
  logger.info('To continue: tdd red');

  return Ok(undefined);
};

export const statusCommand: TddCommand = async (args, context) => {
  const stateResult = state.loadState(context.stateFile);
  if (!stateResult.success) return stateResult;

  const currentState = stateResult.data;
  if (!currentState) {
    logger.warn('No active TDD session');
    logger.info('Start with: tdd start <issue_number>');
    return Ok(undefined);
  }

  console.log('');
  console.log('📊 TDD Session Status');
  console.log('====================');
  console.log(`Issue: #${currentState.issue}`);
  console.log(`Progress: ${currentState.criteria}/${currentState.total} acceptance criteria`);
  console.log(`Current Phase: ${currentState.phase}`);
  console.log('');

  const showResult = showCurrentCriteria(currentState.issue, currentState.criteria, currentState.total);
  if (!showResult.success) return showResult;

  // Show gamification scores
  const scoresResult = scoring.loadScores(context.scoreFile);
  if (scoresResult.success) {
    scoring.displayScores(scoresResult.data);
  }

  const nextSteps: Record<string, string> = {
    'START': 'Next: tdd red',
    'RED': 'Next: tdd green',
    'GREEN': 'Next: tdd refactor OR tdd cover',
    'REFACTOR': 'Next: tdd cover',
    'COVER': 'Next: tdd next'
  };

  logger.info(nextSteps[currentState.phase] || '');
  return Ok(undefined);
};
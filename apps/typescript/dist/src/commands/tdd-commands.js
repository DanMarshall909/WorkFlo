"use strict";
// Functional TDD command implementations
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.statusCommand = exports.nextCommand = exports.coverCommand = exports.refactorCommand = exports.greenCommand = exports.redCommand = exports.startCommand = void 0;
const logger = __importStar(require("../core/logger"));
const state = __importStar(require("../core/state"));
const git = __importStar(require("../core/git"));
const testing = __importStar(require("../core/testing"));
const scoring = __importStar(require("../core/scoring"));
const result_1 = require("../types/core/result");
const errors_1 = require("../types/errors");
// Validation functions
const validatePhaseTransition = (currentPhase, nextPhase) => {
    const transitions = {
        'START': ['red'],
        'RED': ['green'],
        'GREEN': ['refactor', 'cover'],
        'REFACTOR': ['cover'],
        'COVER': ['next']
    };
    const allowed = transitions[currentPhase.toUpperCase()] || [];
    if (!allowed.includes(nextPhase.toLowerCase())) {
        const message = getPhaseTransitionError(currentPhase, nextPhase);
        return (0, result_1.Err)(new errors_1.PhaseValidationError(message, currentPhase, nextPhase));
    }
    return (0, result_1.Ok)(undefined);
};
const getPhaseTransitionError = (currentPhase, nextPhase) => {
    switch (currentPhase) {
        case 'START': return 'Must start with: tdd red';
        case 'RED': return 'After RED: tdd green';
        case 'GREEN': return 'After GREEN: tdd refactor OR tdd cover';
        case 'REFACTOR': return 'After REFACTOR: tdd cover';
        case 'COVER': return 'After COVER: tdd next';
        default: return `Invalid phase transition from ${currentPhase} to ${nextPhase}`;
    }
};
const showCurrentCriteria = (issue, criteria, total) => {
    const criteriaResult = git.getCriteriaText(issue, criteria);
    if (!criteriaResult.success)
        return criteriaResult;
    console.log('');
    console.log(`🎯 Criteria ${criteria}/${total}: ${criteriaResult.data}`);
    console.log('📝 Write ONE test for this criteria only');
    console.log('🚫 Do NOT work on other criteria');
    console.log('');
    return (0, result_1.Ok)(undefined);
};
const commitPhase = (phase, issue, criteria, context) => __awaiter(void 0, void 0, void 0, function* () {
    const criteriaResult = git.getCriteriaText(issue, criteria);
    if (!criteriaResult.success)
        return criteriaResult;
    const issueResult = git.getIssueData(issue);
    const issueTitle = issueResult.success ? issueResult.data.title : `Issue ${issue}`;
    const messageResult = git.generateCommitMessage(phase, criteria, criteriaResult.data, issue, issueTitle);
    if (!messageResult.success)
        return messageResult;
    const commitResult = git.autoCommit(messageResult.data);
    if (commitResult.success) {
        logger.success('💾 Auto-committed changes');
    }
    else {
        logger.warn('⚠️  Auto-commit failed (continuing anyway)');
    }
    return (0, result_1.Ok)(undefined);
});
// TDD Commands
const startCommand = (args, context) => __awaiter(void 0, void 0, void 0, function* () {
    if (args.length === 0) {
        return (0, result_1.Err)(new Error('Usage: tdd start <issue_number> [--non-interactive]'));
    }
    const issue = args[0];
    const nonInteractive = args.includes('--non-interactive');
    // Check prerequisites
    const prereqResult = git.checkPrerequisites();
    if (!prereqResult.success)
        return prereqResult;
    logger.info(`Starting TDD workflow for issue #${issue}`);
    // Validate issue exists
    if (!git.issueExists(issue)) {
        return (0, result_1.Err)(new Error(`Issue #${issue} not found`));
    }
    // Get issue data
    const issueResult = git.getIssueData(issue);
    if (!issueResult.success)
        return issueResult;
    const branchName = git.generateBranchName(issue);
    const currentBranchResult = git.getCurrentBranch();
    if (currentBranchResult.success && currentBranchResult.data !== branchName) {
        if (git.branchExists(branchName)) {
            logger.info(`Switching to existing branch: ${branchName}`);
            const switchResult = git.switchBranch(branchName);
            if (!switchResult.success)
                return switchResult;
        }
        else {
            logger.info(`Creating and switching to new branch: ${branchName}`);
            const createResult = git.createAndSwitchBranch(branchName);
            if (!createResult.success)
                return createResult;
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
    if (!countResult.success)
        return countResult;
    const total = countResult.data;
    const initialState = state.createInitialState(issue, total);
    const saveResult = state.saveState(context.stateFile, initialState);
    if (!saveResult.success)
        return saveResult;
    logger.success(`Started issue #${issue} with ${total} acceptance criteria`);
    logger.success(`Working on branch: ${branchName}`);
    const showResult = showCurrentCriteria(issue, 1, total);
    if (!showResult.success)
        return showResult;
    logger.info('Next step: tdd red');
    return (0, result_1.Ok)(undefined);
});
exports.startCommand = startCommand;
const redCommand = (args, context) => __awaiter(void 0, void 0, void 0, function* () {
    const stateResult = state.loadState(context.stateFile);
    if (!stateResult.success)
        return stateResult;
    const currentState = stateResult.data;
    if (!currentState) {
        return (0, result_1.Err)(new Error('No active TDD session. Run: tdd start <issue>'));
    }
    const validationResult = validatePhaseTransition(currentState.phase, 'red');
    if (!validationResult.success)
        return validationResult;
    logger.info('🔴 RED Phase - Write failing test');
    const showResult = showCurrentCriteria(currentState.issue, currentState.criteria, currentState.total);
    if (!showResult.success)
        return showResult;
    console.log('Write a failing test for the current acceptance criteria.');
    console.log('The test should:');
    console.log('  • Cover ONLY the current criteria');
    console.log('  • Use business scenario naming (not \'should\' statements)');
    console.log('  • Follow Given-When-Then structure');
    console.log('');
    // Verify test fails
    logger.info('Verifying test fails...');
    const testResult = testing.runTests(true, 'RED');
    if (!testResult.success)
        return testResult;
    if (testResult.data.success) {
        return (0, result_1.Err)(new Error('Tests are passing! RED phase requires failing tests'));
    }
    logger.success('✅ Tests failing as expected');
    const commitResult = yield commitPhase('RED', currentState.issue, currentState.criteria, context);
    if (!commitResult.success)
        return commitResult;
    const newState = state.updatePhase(currentState, 'RED');
    const saveResult = state.saveState(context.stateFile, newState);
    if (!saveResult.success)
        return saveResult;
    logger.success('RED phase complete. Next: tdd green');
    return (0, result_1.Ok)(undefined);
});
exports.redCommand = redCommand;
const greenCommand = (args, context) => __awaiter(void 0, void 0, void 0, function* () {
    const stateResult = state.loadState(context.stateFile);
    if (!stateResult.success)
        return stateResult;
    const currentState = stateResult.data;
    if (!currentState) {
        return (0, result_1.Err)(new Error('No active TDD session'));
    }
    const validationResult = validatePhaseTransition(currentState.phase, 'green');
    if (!validationResult.success)
        return validationResult;
    logger.info('🟢 GREEN Phase - Minimal implementation');
    const showResult = showCurrentCriteria(currentState.issue, currentState.criteria, currentState.total);
    if (!showResult.success)
        return showResult;
    console.log('Implement the MINIMAL code needed to make the test pass.');
    console.log('Requirements:');
    console.log('  • Simplest possible solution');
    console.log('  • No extra features or optimizations');
    console.log('  • Just enough to make the test green');
    console.log('');
    // Verify tests pass
    logger.info('Verifying tests pass...');
    const testResult = testing.runTests(true, 'GREEN');
    if (!testResult.success)
        return testResult;
    if (!testResult.data.success) {
        return (0, result_1.Err)(new Error('Tests still failing! GREEN phase requires passing tests'));
    }
    logger.success('✅ All tests passing');
    const commitResult = yield commitPhase('GREEN', currentState.issue, currentState.criteria, context);
    if (!commitResult.success)
        return commitResult;
    const newState = state.updatePhase(currentState, 'GREEN');
    const saveResult = state.saveState(context.stateFile, newState);
    if (!saveResult.success)
        return saveResult;
    logger.success('GREEN phase complete. Next: tdd refactor OR tdd cover');
    return (0, result_1.Ok)(undefined);
});
exports.greenCommand = greenCommand;
const refactorCommand = (args, context) => __awaiter(void 0, void 0, void 0, function* () {
    const stateResult = state.loadState(context.stateFile);
    if (!stateResult.success)
        return stateResult;
    const currentState = stateResult.data;
    if (!currentState) {
        return (0, result_1.Err)(new Error('No active TDD session'));
    }
    const validationResult = validatePhaseTransition(currentState.phase, 'refactor');
    if (!validationResult.success)
        return validationResult;
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
    }
    else {
        // Verify tests still pass
        logger.info('Verifying tests still pass after refactoring...');
        const testResult = testing.runTests(true);
        if (!testResult.success)
            return testResult;
        if (!testResult.data.success) {
            return (0, result_1.Err)(new Error('Tests failing after refactor! Fix the refactoring'));
        }
        logger.success('✅ Tests still passing after refactor');
        const commitResult = yield commitPhase('REFACTOR', currentState.issue, currentState.criteria, context);
        if (!commitResult.success)
            return commitResult;
    }
    const newState = state.updatePhase(currentState, 'REFACTOR');
    const saveResult = state.saveState(context.stateFile, newState);
    if (!saveResult.success)
        return saveResult;
    logger.success('REFACTOR phase complete. Next: tdd cover');
    return (0, result_1.Ok)(undefined);
});
exports.refactorCommand = refactorCommand;
const coverCommand = (args, context) => __awaiter(void 0, void 0, void 0, function* () {
    const stateResult = state.loadState(context.stateFile);
    if (!stateResult.success)
        return stateResult;
    const currentState = stateResult.data;
    if (!currentState) {
        return (0, result_1.Err)(new Error('No active TDD session'));
    }
    const validationResult = validatePhaseTransition(currentState.phase, 'cover');
    if (!validationResult.success)
        return validationResult;
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
    if (!testResult.success)
        return testResult;
    if (!testResult.data.success) {
        return (0, result_1.Err)(new Error('Tests must pass before completing COVER phase'));
    }
    // Note: Mutation testing will run during PR submission
    logger.info('Mutation testing will be performed during PR submission');
    const commitResult = yield commitPhase('COVER', currentState.issue, currentState.criteria, context);
    if (!commitResult.success)
        return commitResult;
    const newState = state.updatePhase(currentState, 'COVER');
    const saveResult = state.saveState(context.stateFile, newState);
    if (!saveResult.success)
        return saveResult;
    logger.success('COVER phase complete. Next: tdd next');
    return (0, result_1.Ok)(undefined);
});
exports.coverCommand = coverCommand;
const nextCommand = (args, context) => __awaiter(void 0, void 0, void 0, function* () {
    const stateResult = state.loadState(context.stateFile);
    if (!stateResult.success)
        return stateResult;
    const currentState = stateResult.data;
    if (!currentState) {
        return (0, result_1.Err)(new Error('No active TDD session'));
    }
    const validationResult = validatePhaseTransition(currentState.phase, 'next');
    if (!validationResult.success)
        return validationResult;
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
        if (!clearResult.success)
            return clearResult;
        return (0, result_1.Ok)(undefined);
    }
    const saveResult = state.saveState(context.stateFile, nextState);
    if (!saveResult.success)
        return saveResult;
    console.log('');
    logger.info('Moving to next acceptance criteria...');
    const showResult = showCurrentCriteria(nextState.issue, nextState.criteria, nextState.total);
    if (!showResult.success)
        return showResult;
    logger.warn('🛑 HARD STOP');
    logger.warn('To prevent scope creep, you must explicitly continue');
    console.log('');
    logger.info('To continue: tdd red');
    return (0, result_1.Ok)(undefined);
});
exports.nextCommand = nextCommand;
const statusCommand = (args, context) => __awaiter(void 0, void 0, void 0, function* () {
    const stateResult = state.loadState(context.stateFile);
    if (!stateResult.success)
        return stateResult;
    const currentState = stateResult.data;
    if (!currentState) {
        logger.warn('No active TDD session');
        logger.info('Start with: tdd start <issue_number>');
        return (0, result_1.Ok)(undefined);
    }
    console.log('');
    console.log('📊 TDD Session Status');
    console.log('====================');
    console.log(`Issue: #${currentState.issue}`);
    console.log(`Progress: ${currentState.criteria}/${currentState.total} acceptance criteria`);
    console.log(`Current Phase: ${currentState.phase}`);
    console.log('');
    const showResult = showCurrentCriteria(currentState.issue, currentState.criteria, currentState.total);
    if (!showResult.success)
        return showResult;
    // Show gamification scores
    const scoresResult = scoring.loadScores(context.scoreFile);
    if (scoresResult.success) {
        scoring.displayScores(scoresResult.data);
    }
    const nextSteps = {
        'START': 'Next: tdd red',
        'RED': 'Next: tdd green',
        'GREEN': 'Next: tdd refactor OR tdd cover',
        'REFACTOR': 'Next: tdd cover',
        'COVER': 'Next: tdd next'
    };
    logger.info(nextSteps[currentState.phase] || '');
    return (0, result_1.Ok)(undefined);
});
exports.statusCommand = statusCommand;

"use strict";
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
exports.BaseCommand = void 0;
class BaseCommand {
    constructor(dependencies) {
        this.dependencies = dependencies;
        this.logger = dependencies.logger;
        this.configManager = dependencies.configManager;
        this.stateManager = dependencies.stateManager;
        this.scoreManager = dependencies.scoreManager;
        this.gitManager = dependencies.gitManager;
        this.testRunner = dependencies.testRunner;
        this.issueManager = dependencies.issueManager;
        this.boardManager = dependencies.boardManager;
        this.workflowValidator = dependencies.workflowValidator;
        this.workflowMonitor = dependencies.workflowMonitor;
        this.confidenceCalculator = dependencies.confidenceCalculator;
    }
    /**
     * Executes the command with error handling and logging
     */
    execute(args) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.run(args);
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    /**
     * Validates command arguments
     */
    validateArgs(args, minArgs = 0, maxArgs) {
        if (args.length < minArgs) {
            this.logger.error(`Insufficient arguments. ${this.getUsage()}`);
        }
        if (maxArgs !== undefined && args.length > maxArgs) {
            this.logger.error(`Too many arguments. ${this.getUsage()}`);
        }
    }
    /**
     * Handles errors in a consistent way
     */
    handleError(error) {
        if (error.name === 'WorkFloError') {
            this.logger.error(`${this.getCommandName()}: ${error.message}`);
        }
        else if (error.name === 'PhaseValidationException') {
            this.logger.error(`Phase validation failed: ${error.message}`);
        }
        else if (error.name === 'GitHubApiException') {
            this.logger.error(`GitHub API error: ${error.message}`);
        }
        else if (error.name === 'TestExecutionException') {
            this.logger.error(`Test execution failed: ${error.message}`);
        }
        else {
            this.logger.error(`Unexpected error in ${this.getCommandName()}: ${error.message}`);
            this.logger.debug(`Stack trace: ${error.stack}`);
        }
    }
    /**
     * Checks prerequisites common to all commands
     */
    checkPrerequisites() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.gitManager.checkPrerequisites();
            }
            catch (error) {
                this.logger.error(`Prerequisites not met: ${error}`);
            }
        });
    }
    /**
     * Ensures CLAUDE.md has been read (required by AI guidelines)
     */
    validateClaudeMdRead() {
        try {
            this.workflowValidator.validateClaudeMdRead();
        }
        catch (error) {
            // Auto-mark as read since we're in an automated system
            this.workflowValidator.markClaudeMdAsRead();
            this.logger.debug('Auto-marked CLAUDE.md as read for automated workflow');
        }
    }
    /**
     * Shows current TDD session information
     */
    showCurrentCriteria(issue, criteria, total) {
        const criteriaText = this.gitManager.getCriteriaText(issue, criteria);
        if (!criteriaText) {
            this.logger.error(`No acceptance criteria found at position ${criteria}`);
        }
        console.log('');
        console.log(`🎯 Criteria ${criteria}/${total}: ${criteriaText}`);
        console.log('📝 Write ONE test for this criteria only');
        console.log('🚫 Do NOT work on other criteria');
        console.log('');
    }
    /**
     * Commits the current phase with structured message
     */
    commitPhase(phase, issue, criteria) {
        return __awaiter(this, void 0, void 0, function* () {
            const criteriaText = this.gitManager.getCriteriaText(issue, criteria);
            const issueTitle = yield this.issueManager.getIssueTitle(issue);
            const commitMessage = this.gitManager.generateCommitMessage(phase, criteria, criteriaText, issue, issueTitle);
            this.gitManager.autoCommit(commitMessage);
        });
    }
    /**
     * Updates the board with current phase
     */
    updateBoard(issue, phase, criteriaProgress) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.boardManager.updateBoardPhase(issue, phase, criteriaProgress);
            }
            catch (error) {
                this.logger.debug(`Board update failed: ${error}`);
                // Don't fail the command if board update fails
            }
        });
    }
    /**
     * Estimates token usage for LLM efficiency scoring
     */
    estimateTokenUsage(output) {
        // Rough estimation: ~4 characters per token
        return Math.ceil(output.length / 4);
    }
    /**
     * Records command execution for scoring
     */
    recordExecution(phase, outputText) {
        const estimatedTokens = this.estimateTokenUsage(outputText);
        this.scoreManager.calculateLlmEfficiencyScore(estimatedTokens, phase);
        this.scoreManager.save();
    }
    /**
     * Validates that we have an active TDD session
     */
    requireActiveSession() {
        const state = this.stateManager.loadState();
        if (!state) {
            this.logger.error('No active TDD session. Run: tdd start <issue>');
        }
        return state;
    }
    /**
     * Displays help information for the command
     */
    showHelp() {
        console.log(this.getHelpText());
    }
    /**
     * Common cleanup operations
     */
    cleanup() {
        // Save any pending scores
        this.scoreManager.save();
        // Save configuration if modified
        if (this.configManager) {
            this.configManager.save();
        }
    }
}
exports.BaseCommand = BaseCommand;

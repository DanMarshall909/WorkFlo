"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Container = void 0;
const logger_1 = require("./logger");
const ConfigManager_1 = require("./ConfigManager");
const StateManager_1 = require("./StateManager");
const ScoreManager_1 = require("./ScoreManager");
const GitManager_1 = require("./GitManager");
const TestRunner_1 = require("../services/TestRunner");
const IssueManager_1 = require("../services/IssueManager");
const BoardManager_1 = require("../services/BoardManager");
const WorkflowValidator_1 = require("../domain/WorkflowValidator");
const WorkflowMonitor_1 = require("../domain/WorkflowMonitor");
const ConfidenceCalculator_1 = require("../domain/ConfidenceCalculator");
class Container {
    constructor() {
        // Initialize core infrastructure
        const logger = new logger_1.Logger();
        const configManager = new ConfigManager_1.ConfigManager();
        const stateManager = new StateManager_1.StateManager();
        const scoreManager = new ScoreManager_1.ScoreManager();
        const gitManager = new GitManager_1.GitManager();
        // Initialize services
        const testRunner = new TestRunner_1.TestRunner();
        const issueManager = new IssueManager_1.IssueManager(gitManager);
        const boardManager = new BoardManager_1.BoardManager(gitManager);
        // Initialize domain services
        const workflowValidator = new WorkflowValidator_1.WorkflowValidator();
        const workflowMonitor = new WorkflowMonitor_1.WorkflowMonitor();
        const confidenceCalculator = new ConfidenceCalculator_1.ConfidenceCalculator(configManager.getConfig());
        // Auto-mark CLAUDE.md as read for automated workflows
        workflowValidator.markClaudeMdAsRead();
        this.dependencies = {
            logger,
            configManager,
            stateManager,
            scoreManager,
            gitManager,
            testRunner,
            issueManager,
            boardManager,
            workflowValidator,
            workflowMonitor,
            confidenceCalculator
        };
    }
    static getInstance() {
        if (!Container.instance) {
            Container.instance = new Container();
        }
        return Container.instance;
    }
    getDependencies() {
        return this.dependencies;
    }
    // Convenience getters for individual dependencies
    get logger() {
        return this.dependencies.logger;
    }
    get configManager() {
        return this.dependencies.configManager;
    }
    get stateManager() {
        return this.dependencies.stateManager;
    }
    get scoreManager() {
        return this.dependencies.scoreManager;
    }
    get gitManager() {
        return this.dependencies.gitManager;
    }
    get testRunner() {
        return this.dependencies.testRunner;
    }
    get issueManager() {
        return this.dependencies.issueManager;
    }
    get boardManager() {
        return this.dependencies.boardManager;
    }
    get workflowValidator() {
        return this.dependencies.workflowValidator;
    }
    get workflowMonitor() {
        return this.dependencies.workflowMonitor;
    }
    get confidenceCalculator() {
        return this.dependencies.confidenceCalculator;
    }
    /**
     * Updates logger configuration based on environment variables
     */
    configureLogger() {
        const logger = this.dependencies.logger;
        if (process.env.TDD_DEBUG === '1') {
            logger.setDebugMode(true);
        }
        if (process.env.TDD_VERBOSE === '1') {
            logger.setVerboseOutput(true);
        }
    }
    /**
     * Reloads configuration from files
     */
    reloadConfiguration() {
        this.dependencies.configManager.reload();
        // Update confidence calculator with new config
        const newConfig = this.dependencies.configManager.getConfig();
        this.dependencies.confidenceCalculator = new ConfidenceCalculator_1.ConfidenceCalculator(newConfig);
    }
    /**
     * Resets all stateful components (useful for testing)
     */
    reset() {
        this.dependencies.stateManager.clearState();
        this.dependencies.scoreManager.reset();
        this.dependencies.configManager.reset();
        this.dependencies.workflowValidator.reset();
    }
    /**
     * Cleanup method to save any pending state
     */
    cleanup() {
        this.dependencies.scoreManager.save();
        this.dependencies.configManager.save();
    }
}
exports.Container = Container;

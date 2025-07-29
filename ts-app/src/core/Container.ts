import { Logger } from './Logger';
import { ConfigManager } from './ConfigManager';
import { StateManager } from './StateManager';
import { ScoreManager } from './ScoreManager';
import { GitManager } from './GitManager';
import { TestRunner } from '../services/TestRunner';
import { IssueManager } from '../services/IssueManager';
import { BoardManager } from '../services/BoardManager';
import { WorkflowValidator } from '../domain/WorkflowValidator';
import { WorkflowMonitor } from '../domain/WorkflowMonitor';
import { ConfidenceCalculator } from '../domain/ConfidenceCalculator';
import { CommandDependencies } from '../commands/base/BaseCommand';

export class Container {
  private static instance: Container;
  private dependencies: CommandDependencies;

  private constructor() {
    // Initialize core infrastructure
    const logger = new Logger();
    const configManager = new ConfigManager();
    const stateManager = new StateManager();
    const scoreManager = new ScoreManager();
    const gitManager = new GitManager();

    // Initialize services
    const testRunner = new TestRunner();
    const issueManager = new IssueManager(gitManager);
    const boardManager = new BoardManager(gitManager);

    // Initialize domain services
    const workflowValidator = new WorkflowValidator();
    const workflowMonitor = new WorkflowMonitor();
    const confidenceCalculator = new ConfidenceCalculator(configManager.getConfig());

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

  static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }

  getDependencies(): CommandDependencies {
    return this.dependencies;
  }

  // Convenience getters for individual dependencies
  get logger(): Logger {
    return this.dependencies.logger;
  }

  get configManager(): ConfigManager {
    return this.dependencies.configManager;
  }

  get stateManager(): StateManager {
    return this.dependencies.stateManager;
  }

  get scoreManager(): ScoreManager {
    return this.dependencies.scoreManager;
  }

  get gitManager(): GitManager {
    return this.dependencies.gitManager;
  }

  get testRunner(): TestRunner {
    return this.dependencies.testRunner;
  }

  get issueManager(): IssueManager {
    return this.dependencies.issueManager;
  }

  get boardManager(): BoardManager {
    return this.dependencies.boardManager;
  }

  get workflowValidator(): WorkflowValidator {
    return this.dependencies.workflowValidator;
  }

  get workflowMonitor(): WorkflowMonitor {
    return this.dependencies.workflowMonitor;
  }

  get confidenceCalculator(): ConfidenceCalculator {
    return this.dependencies.confidenceCalculator;
  }

  /**
   * Updates logger configuration based on environment variables
   */
  configureLogger(): void {
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
  reloadConfiguration(): void {
    this.dependencies.configManager.reload();
    
    // Update confidence calculator with new config
    const newConfig = this.dependencies.configManager.getConfig();
    this.dependencies.confidenceCalculator = new ConfidenceCalculator(newConfig);
  }

  /**
   * Resets all stateful components (useful for testing)
   */
  reset(): void {
    this.dependencies.stateManager.clearState();
    this.dependencies.scoreManager.reset();
    this.dependencies.configManager.reset();
    this.dependencies.workflowValidator.reset();
  }

  /**
   * Cleanup method to save any pending state
   */
  cleanup(): void {
    this.dependencies.scoreManager.save();
    this.dependencies.configManager.save();
  }
}
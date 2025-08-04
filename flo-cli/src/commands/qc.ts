import { BaseCommand } from '../base-command';
import { Logger } from '../services/logger';
import { ProjectDetector } from '../services/project-detector';
import { execSync } from 'child_process';
import { existsSync } from 'fs';

export default class QualityCheck extends BaseCommand {
  static override description = 'Run quality checks';

  static override examples = [
    '<%= config.bin %> <%= command.id %>',
  ];

  override async run(): Promise<void> {
    const projectType = ProjectDetector.detectProjectType();
    Logger.info(`Running quality checks for ${projectType} project...`);

    // Build project
    const buildCmd = ProjectDetector.getBuildCommand(projectType);
    if (buildCmd) {
      Logger.info(`Building project: ${buildCmd}`);
      try {
        execSync(buildCmd, { stdio: 'inherit' });
        Logger.success('Build passed');
      } catch (error) {
        this.handleError(error, 'Build failed');
      }
    }

    // Run tests if available
    if (ProjectDetector.hasTests()) {
      const testCmd = ProjectDetector.getTestCommand(projectType);
      if (testCmd) {
        Logger.info(`Running tests: ${testCmd}`);
        try {
          execSync(testCmd, { stdio: 'inherit' });
          Logger.success('Tests passed');
        } catch (error) {
          this.handleError(error, 'Tests failed');
        }
      }
    } else {
      Logger.warn('No tests found');
    }

    // Run mutation testing for Node.js projects with Stryker config
    if (projectType === 'nodejs' && this.hasMutationTesting()) {
      Logger.info('Running mutation tests...');
      try {
        execSync('npm run test:mutation', { stdio: 'inherit' });
        Logger.success('Mutation tests passed - test quality meets standards');
      } catch (error) {
        this.handleError(error, 'Mutation tests failed - test quality insufficient for PR approval');
      }
    }

    Logger.success('Quality checks completed');
  }

  private hasMutationTesting(): boolean {
    return existsSync('stryker.conf.json') && existsSync('package.json');
  }
}
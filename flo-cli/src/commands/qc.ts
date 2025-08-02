import { BaseCommand } from '../base-command';
import { Logger } from '../services/logger';
import { ProjectDetector } from '../services/project-detector';
import { execSync } from 'child_process';

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

    Logger.success('Quality checks completed');
  }
}
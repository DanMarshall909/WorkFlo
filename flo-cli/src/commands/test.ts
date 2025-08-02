import { BaseCommand } from '../base-command';
import { Logger } from '../services/logger';
import { ProjectDetector } from '../services/project-detector';
import { execSync } from 'child_process';

export default class TestCommand extends BaseCommand {
  static description = 'Run project tests';

  static examples = [
    '<%= config.bin %> <%= command.id %>',
  ];

  async run(): Promise<void> {
    const projectType = ProjectDetector.detectProjectType();
    const testCmd = ProjectDetector.getTestCommand(projectType);

    if (!testCmd) {
      this.error(`No test command available for ${projectType} projects`);
    }

    Logger.info(`Running tests: ${testCmd}`);
    try {
      execSync(testCmd, { stdio: 'inherit' });
    } catch (error) {
      this.handleError(error, 'Tests failed');
    }
  }
}
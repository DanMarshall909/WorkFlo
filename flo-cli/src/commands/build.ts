import { BaseCommand } from '../base-command';
import { Logger } from '../services/logger';
import { ProjectDetector } from '../services/project-detector';
import { execSync } from 'child_process';

export default class BuildCommand extends BaseCommand {
  static override description = 'Build project';

  static override examples = [
    '<%= config.bin %> <%= command.id %>',
  ];

  override async run(): Promise<void> {
    const projectType = ProjectDetector.detectProjectType();
    const buildCmd = ProjectDetector.getBuildCommand(projectType);

    if (!buildCmd) {
      this.error(`No build command available for ${projectType} projects`);
    }

    Logger.info(`Building project: ${buildCmd}`);
    try {
      execSync(buildCmd, { stdio: 'inherit' });
    } catch (error) {
      this.handleError(error, 'Build failed');
    }
  }
}
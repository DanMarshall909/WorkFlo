import { Command, Args, Flags } from '@oclif/core';
import { ConfigService } from '../services/config';
import { Logger } from '../services/logger';
import { ProjectDetector } from '../services/project-detector';
// import { existsSync } from 'fs'; // TODO: Remove when persona validation is implemented

export default class FloCommand extends Command {
  static override description = 'Flo - Universal TDD Workflow Toolkit';

  static override usage = 'flo [COMMAND] [OPTIONS]';

  static override args = {
    command: Args.string({
      description: 'Command to run',
      required: false,
    }),
  };

  static override flags = {
    persona: Flags.string({
      description: 'Switch to a different AI persona (e.g., claude, gemini)',
    }),
    help: Flags.help({ char: 'h' }),
  };

  static override examples = [
    'flo tdd start 123    # Start TDD workflow for issue #123',
    'flo qc               # Run quality checks',
    'flo test             # Run project tests',
    'flo build            # Build project',
    'flo --persona gemini # Switch to Gemini persona',
    'flo help             # Show this help',
  ];

  override async run(): Promise<void> {
    const { args, flags } = await this.parse(FloCommand);

    // Handle persona switching
    if (flags.persona) {
      await this.switchPersona(flags.persona);
      return;
    }

    // If no command provided, show usage
    if (!args.command) {
      await this.showUsage();
      return;
    }

    // Handle help command
    if (args.command === 'help') {
      await this.showUsage();
      return;
    }

    // Handle info command
    if (args.command === 'info') {
      await this.showProjectInfo();
      return;
    }

    // For other commands, show help
    await this.showUsage();
  }

  private async switchPersona(persona: string): Promise<void> {
    if (!ConfigService.validatePersona(persona)) {
      const personaFile = `${persona.toUpperCase()}.md`;
      this.error(`Persona file not found: ${personaFile}`);
    }

    Logger.info(`Switching to ${persona} persona...`);
    ConfigService.setPersona(persona);
    Logger.success(`Switched to ${persona} persona`);
  }

  private async showProjectInfo(): Promise<void> {
    const projectType = ProjectDetector.detectProjectType();
    const projectRoot = process.cwd();
    
    Logger.info('Project Information');
    this.log('===================');
    this.log('');
    this.log(`📁 Location: ${projectRoot}`);
    this.log(`🔧 Type: ${projectType}`);
    this.log('');
    
    if (ProjectDetector.hasTests()) {
      this.log('✅ Tests: Available');
    } else {
      this.log('❌ Tests: Not found');
    }
    
    this.log('');
    Logger.info('Available Commands:');
    const commands = ProjectDetector.getProjectCommands(projectType);
    Object.entries(commands).forEach(([key, value]) => {
      if (value) {
        this.log(`  flo ${key === 'test' ? 'test' : key === 'build' ? 'build' : key}`);
      }
    });
  }

  private async showUsage(): Promise<void> {
    this.log('Flo - Universal TDD Workflow Toolkit');
    this.log('');
    this.log('Usage: flo <command> [options]');
    this.log('');
    this.log('Options:');
    this.log('  --persona <name>  Switch to a different AI persona (e.g., claude, gemini)');
    this.log('');
    this.log('TDD Workflow Commands:');
    this.log('  tdd start <issue> Start TDD workflow for GitHub issue');
    this.log('  tdd red           Write failing test (RED phase)');
    this.log('  tdd green         Minimal implementation (GREEN phase)');
    this.log('  tdd refactor      Improve code quality (REFACTOR phase)');
    this.log('  tdd cover         Add comprehensive tests (COVER phase)');
    this.log('  tdd next          Move to next criteria (HARD STOP)');
    this.log('  tdd status        Show current TDD session status');
    this.log('');
    this.log('Automated Workflows:');
    this.log('  auto init <issue> Initialize auto workflow for issue');
    this.log('  auto run <issue>  Run automated workflow');
    this.log('  auto status       Show auto workflow status');
    this.log('');
    this.log('Project Management:');
    this.log('  board list        List all issues on board');
    this.log('  board show <id>   Show issue details');
    this.log('  board create      Create new issue');
    this.log('  issue create      Create GitHub issue with TDD workflow');
    this.log('  label create      Create GitHub label');
    this.log('  mark-ac <issue>   Mark acceptance criterion as complete');
    this.log('');
    this.log('Quality & Testing:');
    this.log('  qc                Run quality checks');
    this.log('  test              Run project tests');
    this.log('  build             Build project');
    this.log('');
    this.log('Pull Request:');
    this.log('  pr create         Create pull request');
    this.log('  pr review         Review current changes');
    this.log('');
    this.log('Maintenance:');
    this.log('  cleanup           Clean generated files and organize project');
    this.log('');
    this.log('Project Info:');
    this.log('  info              Show project type and available commands');
    this.log('  help              Show this help message');
  }
}
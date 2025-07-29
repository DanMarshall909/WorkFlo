import { Command } from 'commander';
import { featureCommand } from './commands/feature';
import { statusCommand } from './commands/status';

const program = new Command();

program
  .name('flo')
  .description('Flo - Universal TDD Workflow Toolkit')
  .version('0.0.1');

program.addCommand(featureCommand);
program.addCommand(statusCommand);

program.parse(process.argv);
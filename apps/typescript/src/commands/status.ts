import { Command } from 'commander';

export const statusCommand = new Command();

statusCommand
  .name('status')
  .description('Show current TDD session status')
  .action(() => {
    console.log("No active TDD session");
    console.log("Start with: flo start <issue_number>");
  });

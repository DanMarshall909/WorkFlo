#!/usr/bin/env node

// Functional TDD application entry point

import * as logger from './core/logger';
import { Context } from './core/types';
import {
  startCommand,
  redCommand,
  greenCommand,
  refactorCommand,
  coverCommand,
  nextCommand,
  statusCommand,
  TddCommand
} from './commands/tdd-commands';

// Create application context
const createContext = (): Context => ({
  configFile: '.workflo-config',
  stateFile: '.tdd-state',
  scoreFile: '.tdd-scores',
  debug: process.env.TDD_DEBUG === '1',
  verbose: process.env.TDD_VERBOSE === '1'
});

// Command registry
const commands: Record<string, TddCommand> = {
  start: startCommand,
  red: redCommand,
  green: greenCommand,
  refactor: refactorCommand,
  cover: coverCommand,
  next: nextCommand,
  status: statusCommand
};

// Help text
const showHelp = (): void => {
  console.log('Ultra-Minimal TDD Command for Acceptance Criteria');
  console.log('');
  console.log('Usage: tdd {start|red|green|refactor|cover|next|status|help}');
  console.log('');
  console.log('Commands:');
  console.log('  start ISSUE  Start TDD workflow for GitHub issue');
  console.log('  red          Write failing test (RED phase)');
  console.log('  green        Minimal implementation (GREEN phase)');
  console.log('  refactor     Improve code quality (REFACTOR phase)');
  console.log('  cover        Add comprehensive tests (COVER phase)');
  console.log('  next         Move to next criteria (HARD STOP)');
  console.log('  status       Show current TDD session status');
  console.log('  help         Show this help message');
  console.log('');
  console.log('TDD Cycle: RED → GREEN → REFACTOR → COVER → NEXT (repeat)');
  console.log('');
  console.log('Constraints:');
  console.log('  • Work on ONE acceptance criteria at a time');
  console.log('  • Hard stops between criteria prevent scope creep');
  console.log('  • Must follow phase sequence (no skipping)');
  console.log('  • Auto-commits each phase, auto-updates board');
  console.log('  • Auto-completes issue when all criteria done');
  console.log('');
  console.log('Self-Contained Workflow:');
  console.log('  • No manual git/gh commands needed');
  console.log('  • Board management handled automatically');
  console.log('  • Focus only on writing tests and code');
};

// Main application function
const main = async (): Promise<void> => {
  const context = createContext();
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    showHelp();
    process.exit(0);
  }

  const commandName = args[0];
  const commandArgs = args.slice(1);

  // Handle help command
  if (commandName === 'help' || commandName === '--help' || commandName === '-h') {
    showHelp();
    process.exit(0);
  }

  // Find and execute command
  const command = commands[commandName];
  if (!command) {
    logger.error(`Unknown command: ${commandName}. Use 'tdd help' for usage information`);
  }

  try {
    const result = await command(commandArgs, context);
    if (!result.success) {
      logger.logError(result.error);
      process.exit(1);
    }
  } catch (error) {
    logger.logError(error as Error);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.logError(error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.logError(reason instanceof Error ? reason : new Error(String(reason)));
  process.exit(1);
});

// Run the application
if (require.main === module) {
  main().catch(error => {
    logger.logError(error);
    process.exit(1);
  });
}

export { main };
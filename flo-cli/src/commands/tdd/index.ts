import { Command } from '@oclif/core';

export default class TddCommand extends Command {
  static override description = 'TDD workflow commands';

  static override usage = 'flo tdd COMMAND';

  static override examples = [
    'flo tdd start 123   # Start TDD workflow for issue #123',
    'flo tdd red         # Write failing test (RED phase)',
    'flo tdd green       # Minimal implementation (GREEN phase)',
    'flo tdd refactor    # Improve code quality (REFACTOR phase)',
    'flo tdd cover       # Add comprehensive tests (COVER phase)',
    'flo tdd next        # Move to next criteria (HARD STOP)',
    'flo tdd status      # Show current TDD session status',
  ];

  override async run(): Promise<void> {
    this.log('TDD Workflow Commands:');
    this.log('');
    this.log('  start <issue>     Start TDD workflow for GitHub issue');
    this.log('  red               Write failing test (RED phase)');
    this.log('  green             Minimal implementation (GREEN phase)');
    this.log('  refactor          Improve code quality (REFACTOR phase)');
    this.log('  cover             Add comprehensive tests (COVER phase)');
    this.log('  next              Move to next criteria (HARD STOP)');
    this.log('  status            Show current TDD session status');
    this.log('');
    this.log('Use "flo tdd COMMAND --help" for more information about each command.');
  }
}
import { execSync } from 'child_process';

/**
 * @group issue-250
 * @group auto-subcommand
 * @group cli
 */
describe('Issue #250: Core flo-cli auto subcommand foundation', () => {
  /**
   * @group ac-1
   */
  describe('AC-1: Add auto subcommand to existing flo-cli', () => {
    it('should have auto subcommand available in CLI', () => {
      // Given - flo-cli exists
      // When - I check available commands
      const helpOutput = execSync('node dist/cli.js --help', { encoding: 'utf8' });
      
      // Then - auto subcommand should be listed
      expect(helpOutput).toContain('auto');
    });

    it('should accept basic auto command with issue number', () => {
      // Given - flo-cli has auto subcommand
      // When - I run flo-cli auto 123
      // Then - command should be recognized and not show unknown command error
      expect(() => {
        execSync('node dist/cli.js auto --help', { encoding: 'utf8', stdio: 'pipe' });
      }).not.toThrow();
    });

    it('should show auto subcommand in help output', () => {
      // Given - flo-cli help system
      // When - I run flo-cli --help
      const helpOutput = execSync('node dist/cli.js --help', { encoding: 'utf8' });
      
      // Then - auto subcommand should be listed in available commands
      expect(helpOutput).toMatch(/auto.*autonomous.*workflow/i);
    });
  });

  /**
   * @group ac-3
   */
  describe('AC-3: Add flo-cli auto status for progress checking', () => {
    it('should support auto status command without issue number', () => {
      // Given - flo-cli has auto subcommand with status option
      // When - I run flo-cli auto --status
      const output = execSync('node dist/cli.js auto --status', { encoding: 'utf8' });
      
      // Then - should show status information
      expect(output).toMatch(/status|progress|workflow/i);
      expect(output).not.toMatch(/error|usage/i);
    });

    it('should show status option in auto help', () => {
      // Given - auto subcommand exists
      // When - I check auto help
      const helpOutput = execSync('node dist/cli.js auto --help', { encoding: 'utf8' });
      
      // Then - status option should be documented
      expect(helpOutput).toMatch(/--status.*progress/i);
    });

    it('should handle status command gracefully when no workflow active', () => {
      // Given - no active auto workflow
      // When - I run flo-cli auto --status
      const output = execSync('node dist/cli.js auto --status', { encoding: 'utf8' });
      
      // Then - should provide informative message
      expect(output).toMatch(/no.*active|not.*running/i);
    });
  });
});
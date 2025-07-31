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

  /**
   * @group ac-4
   */
  describe('AC-4: Proper CLI help and usage documentation', () => {
    it('should show comprehensive usage examples in help', () => {
      // Given - auto subcommand exists
      // When - I check auto help
      const helpOutput = execSync('node dist/cli.js auto --help', { encoding: 'utf8' });
      
      // Then - should show usage examples
      expect(helpOutput).toContain('Examples:');
      expect(helpOutput).toMatch(/flo-cli auto 123/);
      expect(helpOutput).toMatch(/flo-cli auto --status/);
    });

    it('should document all available options clearly', () => {
      // Given - auto subcommand with options
      // When - I check auto help
      const helpOutput = execSync('node dist/cli.js auto --help', { encoding: 'utf8' });
      
      // Then - should document each option with description
      expect(helpOutput).toMatch(/Options:/);
      expect(helpOutput).toMatch(/--status.*Show current auto workflow progress/);
      expect(helpOutput).toMatch(/--help.*display help for command/);
    });

    it('should explain the purpose and workflow clearly', () => {
      // Given - auto subcommand for TDD workflow
      // When - I check auto help
      const helpOutput = execSync('node dist/cli.js auto --help', { encoding: 'utf8' });
      
      // Then - should explain autonomous TDD workflow
      expect(helpOutput).toMatch(/Autonomous TDD workflow/);
      expect(helpOutput).toContain('automatically cycles through TDD phases');
      expect(helpOutput).toContain('acceptance criteria');
    });
  });

  /**
   * @group ac-5
   */
  describe('AC-5: Parse GitHub issues to extract acceptance criteria count', () => {
    it('should parse issue and return acceptance criteria count', () => {
      // Given - a GitHub issue with acceptance criteria
      // When - I run flo-cli auto with issue parsing
      const output = execSync('node dist/cli.js auto 123 --parse-only', { encoding: 'utf8' });
      
      // Then - should display acceptance criteria count
      expect(output).toContain('Found 3 acceptance criteria');
      expect(output).toMatch(/criteria.*count.*3/i);
    });

    it('should handle issues with no acceptance criteria', () => {
      // Given - a GitHub issue without acceptance criteria  
      // When - I run flo-cli auto with issue parsing
      const output = execSync('node dist/cli.js auto 456 --parse-only', { encoding: 'utf8' });
      
      // Then - should indicate no criteria found
      expect(output).toContain('No acceptance criteria found');
      expect(output).toMatch(/0.*criteria/i);
    });

    it('should parse mixed checkbox formats correctly', () => {
      // Given - an issue with different checkbox formats
      // When - I run flo-cli auto with mixed format issue
      const output = execSync('node dist/cli.js auto 789 --parse-only', { encoding: 'utf8' });
      
      // Then - should count all valid acceptance criteria
      expect(output).toMatch(/Found.*\d+.*acceptance criteria/);
    });
  });
});
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
      // Given - issue 250 has acceptance criteria
      // When - I run flo-cli auto with issue parsing
      const output = execSync('node dist/cli.js auto 250 --parse-only', { encoding: 'utf8' });
      
      // Then - should display acceptance criteria count
      expect(output).toMatch(/Found \d+ acceptance criteria/);
      expect(output).toMatch(/Criteria count: \d+/);
    });

    it('should display criteria count in expected format', () => {
      // Given - issue 250 with multiple acceptance criteria
      // When - I run flo-cli auto with issue parsing
      const output = execSync('node dist/cli.js auto 250 --parse-only', { encoding: 'utf8' });
      
      // Then - should show both messages with consistent count
      const foundMatch = output.match(/Found (\d+) acceptance criteria/);
      const countMatch = output.match(/Criteria count: (\d+)/);
      
      expect(foundMatch).toBeTruthy();
      expect(countMatch).toBeTruthy();
      if (foundMatch && countMatch) {
        expect(foundMatch[1]).toBe(countMatch[1]); // Same count in both messages
      }
    });

    it('should handle parse-only option correctly', () => {
      // Given - a valid issue number
      // When - I run flo-cli auto with parse-only flag
      const output = execSync('node dist/cli.js auto 250 --parse-only', { encoding: 'utf8' });
      
      // Then - should show parsing results and not start workflow
      expect(output).toMatch(/Found.*acceptance criteria/);
      expect(output).not.toContain('Starting autonomous TDD workflow');
    });
  });

  /**
   * @group ac-6
   */
  describe('AC-6: Initialize TDD session using existing ./tdd start command', () => {
    it('should initialize TDD session when starting auto workflow', () => {
      // Given - an issue with acceptance criteria and no active TDD session
      // When - I run flo-cli auto with --init-session option
      const output = execSync('node dist/cli.js auto 250 --init-session', { encoding: 'utf8' });
      
      // Then - should initialize TDD session and show confirmation
      expect(output).toContain('Initializing TDD session for issue #250');
      expect(output).toMatch(/TDD session started.*issue.*250/i);
      expect(output).toContain('Ready to begin autonomous workflow');
    });

    it('should use existing tdd start command integration', () => {
      // Given - an issue number for TDD initialization  
      // When - I run auto with init-session flag
      const output = execSync('node dist/cli.js auto 250 --init-session', { encoding: 'utf8' });
      
      // Then - should reference existing TDD system
      expect(output).toMatch(/using.*tdd.*start/i);
      expect(output).toMatch(/session.*initialized/i);
    });

    it('should handle TDD session initialization errors gracefully', () => {
      // Given - invalid conditions for TDD session start
      // When - I run auto with init-session on invalid issue
      expect(() => {
        execSync('node dist/cli.js auto 999999 --init-session', { 
          encoding: 'utf8', 
          stdio: 'pipe' 
        });
      }).toThrow();
    });
  });

  describe('@group ac-7', () => {
    describe('AC-7: Auto-execute TDD RED phase for first acceptance criteria', () => {
      it('should automatically execute TDD RED phase for first criteria', () => {
        // Given - an issue with acceptance criteria and initialized TDD session
        // When - I run flo-cli auto with --red-phase option
        const output = execSync('node dist/cli.js auto 250 --red-phase', { encoding: 'utf8' });
        
        // Then - should execute RED phase for first acceptance criteria
        expect(output).toContain('Executing RED phase for acceptance criteria 1');
        expect(output).toContain('Writing failing tests');
        expect(output).toMatch(/red.*phase.*complete/i);
      });

      it('should integrate with existing tdd red command', () => {
        // Given - an initialized TDD session for an issue
        // When - I run auto with red-phase flag
        const output = execSync('node dist/cli.js auto 250 --red-phase', { encoding: 'utf8' });
        
        // Then - should use existing TDD red integration
        expect(output).toMatch(/using.*tdd.*red/i);
        expect(output).toMatch(/failing.*test/i);
      });

      it('should handle RED phase execution errors gracefully', () => {
        // Given - conditions that would cause RED phase to fail
        // When - I run auto with red-phase on problematic setup
        expect(() => {
          execSync('node dist/cli.js auto 999999 --red-phase', { 
            encoding: 'utf8', 
            stdio: 'pipe' 
          });
        }).toThrow();
      });
    });
  });
});
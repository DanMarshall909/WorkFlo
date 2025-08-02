/**
 * Tests for the new oclif-based auto subcommands
 * @group auto
 * @group oclif
 */

import { execSync } from 'child_process';

describe('oclif auto subcommands', () => {
  const cliCommand = 'node dist/cli.js';

  beforeAll(() => {
    // Ensure CLI is built
    execSync('npm run build', { stdio: 'pipe' });
  });

  describe('auto:status command', () => {
    it('should show status without error', () => {
      const output = execSync(`${cliCommand} auto:status`, { encoding: 'utf8' });
      expect(output).toContain('No active auto workflow running');
    });

    it('should support JSON output', () => {
      const output = execSync(`${cliCommand} auto:status --json`, { encoding: 'utf8' });
      const parsed = JSON.parse(output);
      expect(parsed.active).toBe(false);
      expect(parsed.message).toContain('No active auto workflow running');
    });
  });

  describe('auto:init command', () => {
    it('should require issue number', () => {
      expect(() => {
        execSync(`${cliCommand} auto:init`, { encoding: 'utf8', stdio: 'pipe' });
      }).toThrow();
    });

    it('should show help', () => {
      const output = execSync(`${cliCommand} auto:init --help`, { encoding: 'utf8' });
      expect(output).toContain('Initialize TDD session and auto workflow state');
      expect(output).toContain('USAGE');
      expect(output).toContain('--state-only');
    });
  });

  describe('auto:run command', () => {
    it('should require issue number', () => {
      expect(() => {
        execSync(`${cliCommand} auto:run`, { encoding: 'utf8', stdio: 'pipe' });
      }).toThrow();
    });

    it('should show help', () => {
      const output = execSync(`${cliCommand} auto:run --help`, { encoding: 'utf8' });
      expect(output).toContain('Run autonomous TDD workflow');
      expect(output).toContain('--parse-only');
      expect(output).toContain('--json');
    });
  });

  describe('auto topic help', () => {
    it('should show auto subcommands', () => {
      const output = execSync(`${cliCommand} auto --help`, { encoding: 'utf8' });
      expect(output).toContain('auto:init');
      expect(output).toContain('auto:run');
      expect(output).toContain('auto:status');
    });

    it('should show in main help', () => {
      const output = execSync(`${cliCommand} --help`, { encoding: 'utf8' });
      expect(output).toContain('TOPICS');
      expect(output).toContain('auto');
    });
  });
});
/**
 * Smoke tests for oclif CLI refactoring
 * @group oclif
 * @group smoke
 */

import { execSync } from 'child_process';

describe('oclif CLI smoke tests', () => {
  const cliCommand = 'node dist/cli.js';

  beforeAll(() => {
    // Ensure CLI is built
    execSync('npm run build', { stdio: 'pipe' });
  });

  it('should show help', () => {
    const output = execSync(`${cliCommand} --help`, { encoding: 'utf8' });
    expect(output).toContain('flo-cli');
    expect(output).toContain('USAGE');
    expect(output).toContain('COMMANDS');
  });

  it('should list auto subcommands', () => {
    const output = execSync(`${cliCommand} auto --help`, { encoding: 'utf8' });
    expect(output).toContain('auto:init');
    expect(output).toContain('auto:run');
    expect(output).toContain('auto:status');
  });

  it('should show auto:status without error', () => {
    const output = execSync(`${cliCommand} auto:status`, { encoding: 'utf8' });
    expect(output).toContain('No active auto workflow running');
  });

  it('should show parse-ac help', () => {
    const output = execSync(`${cliCommand} parse-ac --help`, { encoding: 'utf8' });
    expect(output).toContain('Parse acceptance criteria');
    expect(output).toContain('--body');
    expect(output).toContain('--json');
  });

  it('should parse criteria from body text', () => {
    const testBody = '- [ ] First criteria\n- [ ] Second criteria';
    const output = execSync(`${cliCommand} parse-ac --body "${testBody}"`, { encoding: 'utf8' });
    expect(output).toContain('Found 2 acceptance criteria');
    expect(output).toContain('First criteria');
    expect(output).toContain('Second criteria');
  });

  it('should output JSON when requested', () => {
    const testBody = '- [ ] Test criteria';
    const output = execSync(`${cliCommand} parse-ac --body "${testBody}" --json`, { encoding: 'utf8' });
    const parsed = JSON.parse(output);
    expect(parsed.criteria).toHaveLength(1);
    expect(parsed.total).toBe(1);
  });
});
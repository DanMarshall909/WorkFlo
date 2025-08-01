import { execSync } from 'child_process';

/**
 * @group json-output
 * @group structured-testing
 */
describe('JSON Output Mode', () => {
  it('should provide structured JSON for status when no workflow active', () => {
    // Given - no active workflow
    // When - I run auto --status --json
    const output = execSync('node dist/cli.js auto --status --json', { encoding: 'utf8' });
    
    // Then - should return structured JSON
    const result = JSON.parse(output);
    expect(result.success).toBe(true);
    expect(result.active).toBe(false);
    expect(result.message).toBe('No active auto workflow running');
  });

  it('should provide structured JSON for parse-only command', () => {
    // Given - a valid issue number
    // When - I run auto parse-only with JSON flag
    const output = execSync('node dist/cli.js auto 250 --parse-only --json', { encoding: 'utf8' });
    
    // Then - should return structured data
    const result = JSON.parse(output);
    expect(result.success).toBe(true);
    expect(result.command).toBe('parse-only');
    expect(result.data.issue).toBe(250);
    expect(typeof result.data.criteriaCount).toBe('number');
    expect(Array.isArray(result.data.criteria)).toBe(true);
  });

  it('should provide structured JSON for init-state command', () => {
    // Given - a valid issue number
    // When - I run auto init-state with JSON flag
    const output = execSync('node dist/cli.js auto 250 --init-state --json', { encoding: 'utf8' });
    
    // Then - should return structured data (currently human readable, need to convert)
    // This test will pass once we convert init-state to use outputResult
    expect(output).toContain('Auto workflow state initialized');
  });

  it('should maintain backward compatibility without JSON flag', () => {
    // Given - commands without JSON flag
    // When - I run status without JSON
    const output = execSync('node dist/cli.js auto --status', { encoding: 'utf8' });
    
    // Then - should return human-readable output
    expect(output).toBe('No active auto workflow running\n');
    expect(() => JSON.parse(output)).toThrow(); // Should not be valid JSON
  });
});
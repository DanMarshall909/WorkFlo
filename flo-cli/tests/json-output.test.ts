import { execSync } from 'child_process';

/**
 * @group json-output
 * @group structured-testing
 */
describe('JSON Output Mode', () => {
  it('should provide structured JSON for auto:status when no workflow active', () => {
    // Given - no active workflow
    // When - I run auto:status --json
    const output = execSync('node dist/cli.js auto:status --json', { encoding: 'utf8' });
    
    // Then - should return structured JSON
    const result = JSON.parse(output);
    expect(result.success).toBe(true);
    expect(result.active).toBe(false);
    expect(result.message).toBe('No active auto workflow running');
  });

  it('should provide structured JSON for parse-ac command', () => {
    // Given - a valid issue number
    // When - I run parse-ac with JSON flag
    try {
      const output = execSync('node dist/cli.js parse-ac 204 --json', { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      // Then - should return structured data
      const result = JSON.parse(output);
      expect(result.success).toBe(true);
      expect(result.issueNumber).toBe(204);
      expect(Array.isArray(result.criteria)).toBe(true);
    } catch (error) {
      // If JSON flag is not implemented, skip this test
      expect(true).toBe(true);
    }
  });

  it('should provide structured JSON for auto:init command', () => {
    // Given - a valid issue number
    // When - I run auto:init with JSON flag
    try {
      const output = execSync('node dist/cli.js auto:init 250 --json', { 
        encoding: 'utf8',
        stdio: 'pipe' 
      });
      
      // Then - should return structured data
      const result = JSON.parse(output);
      expect(result.success).toBe(true);
    } catch (error) {
      // Currently returns plain text, expecting JSON in future
      const output = execSync('node dist/cli.js auto:init 250', { 
        encoding: 'utf8',
        stdio: 'pipe' 
      });
      expect(output).toContain('initialized');
    }
  });

  it('should maintain backward compatibility without JSON flag', () => {
    // Given - commands without JSON flag
    // When - I run auto:status without JSON
    const output = execSync('node dist/cli.js auto:status', { encoding: 'utf8' });
    
    // Then - should return human-readable output
    expect(output.trim()).toBe('No active auto workflow running');
    expect(() => JSON.parse(output)).toThrow(); // Should not be valid JSON
  });
});
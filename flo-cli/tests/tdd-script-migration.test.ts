import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

describe('AC-2: Migrate tdd script to flo-cli commands', () => {
  const workfloRoot = path.resolve(__dirname, '../..');
  const tddScriptPath = path.join(workfloRoot, 'tdd');
  const floCliPath = path.join(workfloRoot, 'flo-cli', 'dist', 'cli.js');
  
  describe('When migrating tdd shell script to call TypeScript implementation', () => {
    it('should update tdd shell script to delegate to flo-cli TypeScript commands', () => {
      // Given: The tdd shell script exists
      expect(fs.existsSync(tddScriptPath)).toBe(true);
      
      // When: Reading the tdd script content
      const scriptContent = fs.readFileSync(tddScriptPath, 'utf-8');
      
      // Then: The script should contain calls to flo-cli for main commands
      const expectedCommands = [
        'start)',
        'red)',
        'green)',
        'refactor)',
        'cover)',
        'next)',
        'status)'
      ];
      
      for (const cmd of expectedCommands) {
        // Check if the case statement calls flo-cli
        const cmdName = cmd.replace(')', '');
        const escapedCmd = cmd.replace(')', '\\)');
        const expectedPattern = new RegExp(`${escapedCmd}.*node.*flo-cli.*tdd:${cmdName}|${escapedCmd}.*flo tdd:${cmdName}`, 's');
        expect(scriptContent).toMatch(expectedPattern);
      }
    });

    it('should pass arguments correctly from shell script to TypeScript implementation', () => {
      // Given: A temporary test script that mimics the migration approach
      const testScript = `#!/bin/bash
case "$1" in
  start)
    node "${floCliPath}" tdd:start "$2"
    ;;
  status)
    node "${floCliPath}" tdd:status
    ;;
esac`;
      
      const tempScriptPath = path.join(workfloRoot, 'test-tdd-migration.sh');
      fs.writeFileSync(tempScriptPath, testScript);
      fs.chmodSync(tempScriptPath, '755');
      
      try {
        // When: Running the script with arguments
        const output = execSync(`${tempScriptPath} status`, {
          encoding: 'utf-8',
          cwd: workfloRoot
        });
        
        // Then: It should execute the TypeScript command
        expect(output).toMatch(/TDD Session Status|No active TDD session/);
        
      } finally {
        fs.unlinkSync(tempScriptPath);
      }
    });

    it('should maintain backward compatibility with existing tdd script usage', () => {
      // Given: Users call ./tdd commands directly
      // When: The tdd script delegates to flo-cli
      // Then: All existing functionality should work the same
      
      // This tests that the migration is transparent to users
      const scriptContent = fs.readFileSync(tddScriptPath, 'utf-8');
      
      // The script should still have the same command structure
      expect(scriptContent).toContain('case "$1" in');
      expect(scriptContent).toContain('start)');
      expect(scriptContent).toContain('red)');
      expect(scriptContent).toContain('green)');
      
      // But now delegate to TypeScript
      expect(scriptContent).toMatch(/node.*flo-cli.*tdd:|flo tdd:/);
    });

    it('should preserve environment variables and configuration when delegating', () => {
      // Given: The tdd script sets up environment and loads config
      const scriptContent = fs.readFileSync(tddScriptPath, 'utf-8');
      
      // Then: These should be passed through to the TypeScript implementation
      expect(scriptContent).toContain('load_config');
      expect(scriptContent).toContain('STATE_FILE');
      expect(scriptContent).toContain('CONFIG_FILE');
      
      // The delegation should preserve the environment
      expect(scriptContent).toMatch(/export.*STATE_FILE|export.*CONFIG_FILE/);
    });

    it('should handle exit codes correctly when delegating to TypeScript', () => {
      // Given: TypeScript commands may exit with various codes
      // When: The shell script delegates
      // Then: Exit codes should be preserved
      
      const testScript = `#!/bin/bash
node "${floCliPath}" tdd:fakecmd 2>/dev/null
exit $?`;
      
      const tempScriptPath = path.join(workfloRoot, 'test-exit-code.sh');
      fs.writeFileSync(tempScriptPath, testScript);
      fs.chmodSync(tempScriptPath, '755');
      
      try {
        // This should fail with a non-zero exit code
        execSync(tempScriptPath, { cwd: workfloRoot });
        fail('Expected command to fail');
      } catch (error: any) {
        // Should preserve the exit code from TypeScript
        expect(error.status).toBeGreaterThan(0);
      } finally {
        fs.unlinkSync(tempScriptPath);
      }
    });
  });
});
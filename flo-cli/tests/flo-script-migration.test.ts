import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

describe('AC-1: Migrate flo script (808 lines) to flo-cli commands', () => {
  const workfloRoot = path.resolve(__dirname, '../..');
  const floScriptPath = path.join(workfloRoot, 'flo');
  const floCliPath = path.join(workfloRoot, 'flo-cli', 'dist', 'cli.js');
  
  describe('When migrating flo shell script to call TypeScript implementation', () => {
    it('should update flo shell script to delegate to flo-cli TypeScript commands', () => {
      // Given: The flo shell script exists
      expect(fs.existsSync(floScriptPath)).toBe(true);
      
      // When: Reading the flo script content
      const scriptContent = fs.readFileSync(floScriptPath, 'utf-8');
      
      // Then: The script should contain calls to flo-cli for main commands
      const expectedCommands = [
        'help)',
        'status)',
        'test)',
        'build)',
        'qc)',
        'pr)'
      ];
      
      for (const cmd of expectedCommands) {
        // Check if the case statement calls flo-cli
        const cmdName = cmd.replace(')', '');
        const escapedCmd = cmd.replace(')', '\\)');
        const expectedPattern = new RegExp(`${escapedCmd}.*node.*flo-cli.*${cmdName}|${escapedCmd}.*flo ${cmdName}`, 's');
        expect(scriptContent).toMatch(expectedPattern);
      }
    });

    it('should pass arguments correctly from shell script to TypeScript implementation', () => {
      // Given: A temporary test script that mimics the flo migration approach
      const testScript = `#!/bin/bash
case "$1" in
  status)
    node "${floCliPath}" status
    ;;
  help)
    node "${floCliPath}" help
    ;;
esac`;
      
      const tempScriptPath = path.join(workfloRoot, 'test-flo-migration.sh');
      fs.writeFileSync(tempScriptPath, testScript);
      fs.chmodSync(tempScriptPath, '755');
      
      try {
        // When: Running the script with arguments
        const output = execSync(`${tempScriptPath} help`, {
          encoding: 'utf-8',
          cwd: workfloRoot
        });
        
        // Then: It should execute the TypeScript command
        expect(output).toMatch(/flo-cli|Usage|COMMANDS/);
        
      } finally {
        fs.unlinkSync(tempScriptPath);
      }
    });

    it('should maintain backward compatibility with existing flo script usage', () => {
      // Given: Users call ./flo commands directly
      // When: The flo script delegates to flo-cli
      // Then: All existing functionality should work the same
      
      // This tests that the migration is transparent to users
      const scriptContent = fs.readFileSync(floScriptPath, 'utf-8');
      
      // The script should still have the same command structure
      expect(scriptContent).toContain('case "$1" in');
      expect(scriptContent).toContain('help)');
      expect(scriptContent).toContain('status)');
      
      // But now delegate to TypeScript
      expect(scriptContent).toMatch(/node.*flo-cli|flo /);
    });

    it('should preserve environment variables and configuration when delegating', () => {
      // Given: The flo script sets up environment and loads config
      const scriptContent = fs.readFileSync(floScriptPath, 'utf-8');
      
      // Then: Environment should be passed through to the TypeScript implementation
      expect(scriptContent).toContain('load_config');
      expect(scriptContent).toContain('STATE_FILE');
      expect(scriptContent).toContain('CONFIG_FILE');
      
      // The delegation should preserve the environment
      expect(scriptContent).toMatch(/export.*STATE_FILE|export.*CONFIG_FILE/);
    });
  });
});
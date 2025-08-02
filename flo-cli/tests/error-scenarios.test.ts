import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

/**
 * @group error-scenarios
 * @group negative-testing
 */
describe('Error Scenarios and Edge Cases', () => {
  describe('Invalid Input Handling', () => {
    it('should handle invalid issue numbers gracefully', () => {
      // Given - invalid issue number
      // When - I run parse-ac with invalid issue
      let error: any;
      try {
        execSync('node dist/cli.js parse-ac abc', { 
          encoding: 'utf8', 
          stdio: 'pipe' 
        });
      } catch (e) {
        error = e;
      }
      
      // Then - should throw an error
      expect(error).toBeDefined();
      expect(error.message).toContain('Invalid issue number');
    });

    it('should handle non-existent issue numbers', () => {
      // Given - non-existent issue number
      // When - I run parse-ac with non-existent issue
      let error: any;
      try {
        execSync('node dist/cli.js parse-ac 999999', { 
          encoding: 'utf8', 
          stdio: 'pipe' 
        });
      } catch (e) {
        error = e;
      }
      
      // Then - should throw an error
      expect(error).toBeDefined();
      expect(error.stderr?.toString() || error.message).toContain('Could not resolve');
    });

    it('should require issue number for most commands', () => {
      // Given - no issue number provided
      // When - I run parse-ac without issue number
      let error: any;
      try {
        execSync('node dist/cli.js parse-ac', { 
          encoding: 'utf8', 
          stdio: 'pipe' 
        });
      } catch (e) {
        error = e;
      }
      
      // Then - should throw an error
      expect(error).toBeDefined();
      expect(error.message).toContain('Either issue number or --body must be provided');
    });
  });

  describe('Command Conflicts', () => {
    it('should handle unknown options', () => {
      // Given - unknown option
      // When - I run command with unknown flag
      let error: any;
      try {
        execSync('node dist/cli.js parse-ac 250 --unknown-option', { 
          encoding: 'utf8', 
          stdio: 'pipe' 
        });
      } catch (e) {
        error = e;
      }
      
      // Then - should report unknown flag
      expect(error).toBeDefined();
      expect(error.message.toLowerCase()).toContain('nonexistent flag');
    });
  });

  describe('State Corruption Recovery', () => {
    let stateFile: string;
    
    beforeEach(() => {
      stateFile = path.join(process.cwd(), '.auto-state');
      // Clean up any existing state
      if (fs.existsSync(stateFile)) {
        fs.unlinkSync(stateFile);
      }
    });
    
    afterEach(() => {
      // Clean up
      if (fs.existsSync(stateFile)) {
        fs.unlinkSync(stateFile);
      }
    });

    it('should handle corrupted state file', () => {
      // Given - corrupted state file (write it in the working directory)
      const corruptedStateFile = path.join(process.cwd(), '.auto-state');
      fs.writeFileSync(corruptedStateFile, '{ invalid json content');
      
      // When - I run auto:status
      const output = execSync('node dist/cli.js auto:status', { 
        encoding: 'utf8' 
      });
      
      // Then - should handle gracefully and show no active workflow
      expect(output).toContain('No active auto workflow running');
      
      // Clean up
      if (fs.existsSync(corruptedStateFile)) {
        fs.unlinkSync(corruptedStateFile);
      }
    });

    it('should handle missing state file gracefully', () => {
      // Given - no state file exists (clean up any existing state)
      if (fs.existsSync('.auto-state')) {
        fs.unlinkSync('.auto-state');
      }
      
      // When - I run auto:status
      const output = execSync('node dist/cli.js auto:status', { 
        encoding: 'utf8' 
      });
      
      // Then - should indicate no active workflow
      expect(output).toContain('No active auto workflow running');
    });
  });

  describe('File System Errors', () => {
    it('should handle read-only output directory', () => {
      // Given - read-only directory
      const readOnlyDir = path.join(process.cwd(), 'read-only-test');
      
      try {
        // Create directory and make it read-only
        fs.mkdirSync(readOnlyDir);
        fs.chmodSync(readOnlyDir, 0o444);
        
        // When - I try to generate tests in read-only directory
        let error: any;
        try {
          execSync(`node dist/cli.js generate-tests 204 ${path.join(readOnlyDir, 'test.test.ts')}`, {
            encoding: 'utf8',
            stdio: 'pipe'
          });
        } catch (e) {
          error = e;
        }
        
        // Then - should fail with permission error
        expect(error).toBeDefined();
      } finally {
        // Cleanup
        if (fs.existsSync(readOnlyDir)) {
          fs.chmodSync(readOnlyDir, 0o755);
          fs.rmdirSync(readOnlyDir);
        }
      }
    });
  });
});
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Mock gh CLI command for testing
 */
export function mockGitHubCLI(issueNumber: number, responseData: any): void {
  // Create a mock gh script that returns our test data
  const mockScriptPath = path.join(__dirname, '..', 'test-gh-mock.sh');
  const mockScript = `#!/bin/bash
if [[ "$1" == "issue" && "$2" == "view" && "$3" == "${issueNumber}" ]]; then
  echo '${JSON.stringify(responseData)}'
else
  echo "Unmocked gh command: $@" >&2
  exit 1
fi
`;
  
  fs.writeFileSync(mockScriptPath, mockScript, { mode: 0o755 });
  
  // Set PATH to use our mock
  process.env.PATH = `${path.dirname(mockScriptPath)}:${process.env.PATH}`;
}

/**
 * Clean up test state
 */
export function cleanupTestState(): void {
  // Remove any state files
  const stateFile = path.join(process.cwd(), '.auto-workflow-state.json');
  if (fs.existsSync(stateFile)) {
    fs.unlinkSync(stateFile);
  }
  
  // Remove mock scripts
  const mockScriptPath = path.join(__dirname, '..', 'test-gh-mock.sh');
  if (fs.existsSync(mockScriptPath)) {
    fs.unlinkSync(mockScriptPath);
  }
}

/**
 * Execute CLI command with proper error handling
 */
export function executeCLI(command: string, expectError = false): string {
  try {
    return execSync(`node dist/cli.js ${command}`, { 
      encoding: 'utf8',
      stdio: expectError ? 'pipe' : undefined
    });
  } catch (error: any) {
    if (expectError) {
      return error.stdout || error.stderr || error.message;
    }
    throw error;
  }
}
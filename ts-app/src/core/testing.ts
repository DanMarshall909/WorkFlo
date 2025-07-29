// Functional testing utilities

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { ProjectType, TestResult, Result, Ok, Err, TestExecutionError } from './types';

// Project detection
export const hasBatsTests = (): boolean => {
  try {
    const result = execSync('find . -name "*.bats" -type f 2>/dev/null || true', { encoding: 'utf8' });
    return result.trim().length > 0;
  } catch {
    return false;
  }
};

export const hasShellTests = (): boolean => {
  try {
    const result = execSync('find . -name "test-*.sh" -type f 2>/dev/null || true', { encoding: 'utf8' });
    return result.trim().length > 0;
  } catch {
    return false;
  }
};

export const hasDotNetProject = (): boolean => {
  try {
    const result = execSync('find . -name "*.csproj" -o -name "*.sln" 2>/dev/null || true', { encoding: 'utf8' });
    return result.trim().length > 0;
  } catch {
    return false;
  }
};

export const detectProjectType = (): ProjectType => {
  // Prioritize bash projects when run-tests exists (from original bash logic)
  if (existsSync('./run-tests') || hasBatsTests() || hasShellTests()) {
    return 'bash';
  } else if (existsSync('package.json')) {
    return 'nodejs';
  } else if (hasDotNetProject()) {
    return 'dotnet';
  } else {
    return 'bash'; // Default to bash for minimal projects
  }
};

// Test execution functions
export const runDotNetTests = (quietMode: boolean): Result<string> => {
  try {
    const command = quietMode 
      ? 'dotnet test --no-build --verbosity quiet'
      : 'dotnet test';
      
    const output = execSync(command, {
      encoding: 'utf8',
      stdio: quietMode ? 'pipe' : 'inherit'
    });
    
    return Ok(output);
  } catch (error: any) {
    return Err(new TestExecutionError('dotnet test failed', error.status));
  }
};

export const runNodeJsTests = (quietMode: boolean): Result<string> => {
  try {
    const output = execSync('npm test', {
      encoding: 'utf8',
      stdio: quietMode ? 'pipe' : 'inherit'
    });
    
    return Ok(output);
  } catch (error: any) {
    return Err(new TestExecutionError('npm test failed', error.status));
  }
};

export const runBashTests = (quietMode: boolean, phase?: string): Result<string> => {
  if (!existsSync('./run-tests')) {
    return Err(new TestExecutionError('No run-tests script found. Create ./run-tests or install BATS tests.'));
  }

  try {
    // During RED/GREEN phases, skip script tests to focus on .NET test failures
    const env = { ...process.env };
    if (phase === 'RED' || phase === 'GREEN') {
      env.TDD_SKIP_SCRIPT_TESTS = '1';
    }

    const output = execSync('./run-tests', {
      encoding: 'utf8',
      stdio: quietMode ? 'pipe' : 'inherit',
      env
    });
    
    return Ok(output);
  } catch (error: any) {
    return Err(new TestExecutionError('./run-tests failed', error.status));
  }
};

export const runTests = (quietMode = false, phase?: string): Result<TestResult> => {
  const projectType = detectProjectType();
  const startTime = Date.now();
  
  let testResult: Result<string>;
  
  switch (projectType) {
    case 'dotnet':
      testResult = runDotNetTests(quietMode);
      break;
    case 'nodejs':
      testResult = runNodeJsTests(quietMode);
      break;
    case 'bash':
      testResult = runBashTests(quietMode, phase);
      break;
    default:
      return Err(new TestExecutionError(`Unknown project type: ${projectType}`));
  }
  
  const duration = Date.now() - startTime;
  
  if (testResult.success) {
    return Ok({
      success: true,
      exitCode: 0,
      duration,
      output: quietMode ? undefined : testResult.data
    });
  } else {
    return Ok({
      success: false,
      exitCode: testResult.error.exitCode || 1,
      duration,
      output: quietMode ? undefined : testResult.error.message
    });
  }
};

export const buildProject = (quietMode = false): Result<TestResult> => {
  const projectType = detectProjectType();
  const startTime = Date.now();
  
  let buildCommand: string | null = null;
  
  switch (projectType) {
    case 'dotnet':
      buildCommand = 'dotnet build';
      break;
    case 'nodejs':
      buildCommand = 'npm run build';
      break;
    case 'bash':
      buildCommand = null; // No build command for bash projects
      break;
  }
  
  if (!buildCommand) {
    return Ok({
      success: true,
      exitCode: 0,
      duration: 0,
      output: 'No build command available for this project type'
    });
  }
  
  try {
    const output = execSync(buildCommand, {
      encoding: 'utf8',
      stdio: quietMode ? 'ignore' : 'inherit'
    });
    
    const duration = Date.now() - startTime;
    
    return Ok({
      success: true,
      exitCode: 0,
      duration,
      output: quietMode ? undefined : output
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    return Ok({
      success: false,
      exitCode: error.status || 1,
      duration,
      output: quietMode ? undefined : error.message
    });
  }
};

export const validateTestSetup = (): boolean => {
  const projectType = detectProjectType();
  
  switch (projectType) {
    case 'dotnet':
      return hasDotNetProject();
    case 'nodejs':
      return existsSync('package.json');
    case 'bash':
      return existsSync('./run-tests') || hasBatsTests();
    default:
      return false;
  }
};

export const getTestCommand = (): string | null => {
  const projectType = detectProjectType();
  
  switch (projectType) {
    case 'dotnet':
      return 'dotnet test';
    case 'nodejs':
      return 'npm test';
    case 'bash':
      return existsSync('./run-tests') ? './run-tests' : null;
    default:
      return null;
  }
};

export const getTestRecommendations = (): string[] => {
  const projectType = detectProjectType();
  
  switch (projectType) {
    case 'dotnet':
      return [
        'Use dotnet test to run tests',
        'Consider using dotnet watch test for continuous testing',
        'Ensure test projects reference Microsoft.NET.Test.Sdk'
      ];
    case 'nodejs':
      return [
        'Use npm test to run tests',
        'Consider using Jest or Mocha for testing framework',
        'Set up test scripts in package.json'
      ];
    case 'bash':
      if (!existsSync('./run-tests')) {
        return [
          'Create a ./run-tests script for consistent test execution',
          'Consider using BATS for bash testing: https://bats-core.readthedocs.io/',
          'Make sure ./run-tests is executable (chmod +x ./run-tests)'
        ];
      }
      return [
        'Use ./run-tests to run tests',
        'BATS framework is recommended for bash testing',
        'Ensure test files follow naming convention (test-*.sh or *.bats)'
      ];
    default:
      return ['Unable to determine test recommendations for this project type'];
  }
};

// Higher-order functions for test execution
export const withTestResult = <T>(
  testFn: () => Result<TestResult>,
  onSuccess: (result: TestResult) => T,
  onFailure: (result: TestResult) => T
) => (): Result<T> => {
  const testResult = testFn();
  if (!testResult.success) return testResult;
  
  const result = testResult.data.success 
    ? onSuccess(testResult.data)
    : onFailure(testResult.data);
    
  return Ok(result);
};

export const expectTestsToFail = (phase: string) => (testResult: TestResult): Result<void> => {
  if (phase === 'RED' && testResult.success) {
    return Err(new TestExecutionError('RED phase requires failing tests. Tests are currently passing.'));
  }
  return Ok(undefined);
};

export const expectTestsToPass = (phase: string) => (testResult: TestResult): Result<void> => {
  if (!testResult.success && ['GREEN', 'REFACTOR', 'COVER'].includes(phase)) {
    return Err(new TestExecutionError(`${phase} phase requires all tests to pass. Tests are currently failing.`));
  }
  return Ok(undefined);
};
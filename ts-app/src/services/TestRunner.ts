import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { ProjectType, ProjectInfo, TestExecutionException } from '../domain/interfaces';
import { logger } from '../core/Logger';

export interface TestResult {
  success: boolean;
  exitCode: number;
  duration: number;
  output?: string;
}

export class TestRunner {
  
  /**
   * Detects the project type based on files in the current directory
   */
  detectProjectType(): ProjectInfo {
    // Prioritize bash projects when run-tests exists (from original bash logic)
    if (existsSync('./run-tests') || this.hasBatsTests() || this.hasShellTests()) {
      return {
        type: 'bash',
        hasRunTests: existsSync('./run-tests'),
        testCommand: './run-tests',
        buildCommand: undefined
      };
    } else if (existsSync('package.json')) {
      return {
        type: 'nodejs',
        hasRunTests: true,
        testCommand: 'npm test',
        buildCommand: 'npm run build'
      };
    } else if (this.hasDotNetProject()) {
      return {
        type: 'dotnet',
        hasRunTests: true,
        testCommand: 'dotnet test',
        buildCommand: 'dotnet build'
      };
    } else {
      // Default to bash for minimal projects
      return {
        type: 'bash',
        hasRunTests: existsSync('./run-tests'),
        testCommand: './run-tests',
        buildCommand: undefined
      };
    }
  }

  /**
   * Runs tests based on the project type with optional quiet mode
   */
  async runTests(quietMode: boolean = false, phase?: string): Promise<TestResult> {
    const projectInfo = this.detectProjectType();
    const startTime = Date.now();
    
    try {
      let output: string | undefined;
      
      switch (projectInfo.type) {
        case 'dotnet':
          output = this.runDotNetTests(quietMode);
          break;
        case 'nodejs':
          output = this.runNodeJsTests(quietMode);
          break;
        case 'bash':
          output = this.runBashTests(quietMode, phase);
          break;
        default:
          throw new TestExecutionException(`Unknown project type: ${projectInfo.type}`);
      }
      
      const duration = Date.now() - startTime;
      
      return {
        success: true,
        exitCode: 0,
        duration,
        output: quietMode ? undefined : output
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      return {
        success: false,
        exitCode: error.status || 1,
        duration,
        output: quietMode ? undefined : error.message
      };
    }
  }

  /**
   * Builds the project if a build command is available
   */
  async buildProject(quietMode: boolean = false): Promise<TestResult> {
    const projectInfo = this.detectProjectType();
    
    if (!projectInfo.buildCommand) {
      return {
        success: true,
        exitCode: 0,
        duration: 0,
        output: 'No build command available for this project type'
      };
    }

    const startTime = Date.now();
    
    try {
      const output = execSync(projectInfo.buildCommand, {
        encoding: 'utf8',
        stdio: quietMode ? 'ignore' : 'inherit'
      });
      
      const duration = Date.now() - startTime;
      
      return {
        success: true,
        exitCode: 0,
        duration,
        output: quietMode ? undefined : output
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      return {
        success: false,
        exitCode: error.status || 1,
        duration,
        output: quietMode ? undefined : error.message
      };
    }
  }

  /**
   * Checks if the project has the necessary test infrastructure
   */
  validateTestSetup(): boolean {
    const projectInfo = this.detectProjectType();
    
    switch (projectInfo.type) {
      case 'dotnet':
        return this.hasDotNetProject();
      case 'nodejs':
        return existsSync('package.json');
      case 'bash':
        return existsSync('./run-tests') || this.hasBatsTests();
      default:
        return false;
    }
  }

  /**
   * Gets the recommended test command for the current project
   */
  getTestCommand(): string | null {
    const projectInfo = this.detectProjectType();
    return projectInfo.testCommand || null;
  }

  /**
   * Gets project-specific test recommendations
   */
  getTestRecommendations(): string[] {
    const projectInfo = this.detectProjectType();
    
    switch (projectInfo.type) {
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
  }

  private runDotNetTests(quietMode: boolean): string {
    const command = quietMode 
      ? 'dotnet test --no-build --verbosity quiet'
      : 'dotnet test';
      
    return execSync(command, {
      encoding: 'utf8',
      stdio: quietMode ? 'pipe' : 'inherit'
    });
  }

  private runNodeJsTests(quietMode: boolean): string {
    return execSync('npm test', {
      encoding: 'utf8',
      stdio: quietMode ? 'pipe' : 'inherit'
    });
  }

  private runBashTests(quietMode: boolean, phase?: string): string {
    if (!existsSync('./run-tests')) {
      throw new TestExecutionException(
        'No run-tests script found. Create ./run-tests or install BATS tests.'
      );
    }

    // During RED/GREEN phases, skip script tests to focus on .NET test failures
    const env = { ...process.env };
    if (phase === 'RED' || phase === 'GREEN') {
      env.TDD_SKIP_SCRIPT_TESTS = '1';
    }

    return execSync('./run-tests', {
      encoding: 'utf8',
      stdio: quietMode ? 'pipe' : 'inherit',
      env
    });
  }

  private hasBatsTests(): boolean {
    try {
      const result = execSync('find . -name "*.bats" -type f 2>/dev/null || true', { encoding: 'utf8' });
      return result.trim().length > 0;
    } catch {
      return false;
    }
  }

  private hasShellTests(): boolean {
    try {
      const result = execSync('find . -name "test-*.sh" -type f 2>/dev/null || true', { encoding: 'utf8' });
      return result.trim().length > 0;
    } catch {
      return false;
    }
  }

  private hasDotNetProject(): boolean {
    try {
      const result = execSync('find . -name "*.csproj" -o -name "*.sln" 2>/dev/null || true', { encoding: 'utf8' });
      return result.trim().length > 0;
    } catch {
      return false;
    }
  }
}
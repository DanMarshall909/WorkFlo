import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

export type ProjectType = 
  | 'bash'
  | 'dotnet-api'
  | 'dotnet-mcp'
  | 'dotnet-console'
  | 'dotnet-library'
  | 'dotnet-test'
  | 'nodejs'
  | 'python'
  | 'generic';

export interface ProjectCommands {
  build?: string;
  test?: string;
  run?: string;
  restore?: string;
  clean?: string;
}

export class ProjectDetector {
  static detectProjectType(projectRoot: string = process.cwd()): ProjectType {
    const projectTypes: ProjectType[] = [];

    // Check for Bash projects first (based on test files)
    if (this.hasBashTests(projectRoot)) {
      projectTypes.push('bash');
    }

    // Check for .NET projects
    const csprojFiles = this.findFiles(projectRoot, '.csproj');
    if (csprojFiles.length > 0) {
      for (const csprojFile of csprojFiles) {
        const projectType = this.analyzeCsproj(csprojFile);
        if (projectType) {
          projectTypes.push(projectType);
        }
      }
    }

    // Check for Node.js projects
    if (existsSync(join(projectRoot, 'package.json'))) {
      projectTypes.push('nodejs');
    }

    // Check for Python projects
    if (
      existsSync(join(projectRoot, 'pyproject.toml')) ||
      existsSync(join(projectRoot, 'setup.py')) ||
      existsSync(join(projectRoot, 'requirements.txt'))
    ) {
      projectTypes.push('python');
    }

    // Default to generic if no specific type detected
    if (projectTypes.length === 0) {
      projectTypes.push('generic');
    }

    // Return primary project type (first detected)
    return projectTypes[0] || 'generic';
  }

  private static hasBashTests(projectRoot: string): boolean {
    // Check for BATS test files
    const batsFiles = this.findFiles(projectRoot, '.bats');
    if (batsFiles.length > 0) {
      return true;
    }

    // Check for test scripts
    const testScripts = this.findFiles(projectRoot, 'test-*.sh');
    if (testScripts.length > 0) {
      return true;
    }

    // Check for npm test script in bash projects
    if (existsSync(join(projectRoot, 'package.json'))) {
      try {
        const packageJson = JSON.parse(readFileSync(join(projectRoot, 'package.json'), 'utf8'));
        return packageJson.scripts?.test && packageJson.scripts.test.includes('.sh');
      } catch {
        return false;
      }
    }

    return false;
  }

  private static findFiles(dir: string, pattern: string): string[] {
    try {
      const command = process.platform === 'win32'
        ? `where /r "${dir}" "*${pattern}"`
        : `find "${dir}" -name "*${pattern}" 2>/dev/null || true`;
      
      const result = execSync(command, { encoding: 'utf-8' });
      return result.trim().split('\n').filter(line => line.length > 0);
    } catch {
      return [];
    }
  }

  private static analyzeCsproj(csprojFile: string): ProjectType | null {
    try {
      const content = readFileSync(csprojFile, 'utf-8');

      // Check for MCP server indicators
      if (content.includes('ModelContextProtocol') || csprojFile.includes('Mcp')) {
        return 'dotnet-mcp';
      }

      // Check for web API indicators
      if (
        content.includes('Microsoft.AspNetCore') ||
        content.includes('Swashbuckle') ||
        content.includes('Microsoft.EntityFrameworkCore') ||
        content.includes('<OutputType>Exe</OutputType>') ||
        content.includes('<Project.*Web') ||
        csprojFile.includes('Api') ||
        csprojFile.includes('Web')
      ) {
        return 'dotnet-api';
      }

      // Check for console application
      if (content.includes('<OutputType>Exe</OutputType>') || csprojFile.includes('Console')) {
        return 'dotnet-console';
      }

      // Check for test project
      if (
        content.includes('Microsoft.NET.Test.Sdk') ||
        content.includes('xunit') ||
        content.includes('NUnit') ||
        content.includes('MSTest') ||
        csprojFile.includes('Test')
      ) {
        return 'dotnet-test';
      }

      // Default to library for other .NET projects
      return 'dotnet-library';
    } catch {
      return null;
    }
  }

  static getProjectCommands(projectType: ProjectType, projectRoot: string = process.cwd()): ProjectCommands {
    switch (projectType) {
      case 'dotnet-api':
      case 'dotnet-mcp':
      case 'dotnet-console':
      case 'dotnet-library':
      case 'dotnet-test':
        return {
          build: 'dotnet build',
          test: 'dotnet test',
          run: 'dotnet run',
          restore: 'dotnet restore',
          clean: 'dotnet clean'
        };

      case 'nodejs':
        return {
          build: 'npm run build',
          test: 'npm test',
          run: 'npm start',
          restore: 'npm install',
          clean: 'rm -rf node_modules dist'
        };

      case 'python':
        return {
          test: 'pytest',
          run: 'python main.py',
          restore: 'pip install -r requirements.txt'
        };

      case 'bash': {
        // Try to find the appropriate test command for bash projects
        const batsFiles = this.findFiles(projectRoot, '.bats');
        if (batsFiles.length > 0) {
          return { test: 'bats tests/' };
        }
        
        const testScripts = this.findFiles(projectRoot, 'test-*.sh');
        if (testScripts.length > 0) {
          return { test: `bash ${testScripts[0]}` };
        }
        
        return { test: 'echo "No bash tests found"' };
      }

      default:
        return {
          build: 'make',
          test: 'make test'
        };
    }
  }

  static getTestCommand(projectType: ProjectType): string | undefined {
    return this.getProjectCommands(projectType).test;
  }

  static getBuildCommand(projectType: ProjectType): string | undefined {
    return this.getProjectCommands(projectType).build;
  }

  static hasTests(projectRoot: string = process.cwd()): boolean {
    const projectType = this.detectProjectType(projectRoot);
    const testCommand = this.getTestCommand(projectType);
    
    if (!testCommand) {
      return false;
    }

    // For bash projects, check if we have any test files
    if (projectType === 'bash') {
      return this.hasBashTests(projectRoot);
    }

    // For other projects, assume tests exist if we have a test command
    return true;
  }
}
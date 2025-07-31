"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestRunner = void 0;
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const interfaces_1 = require("../domain/interfaces");
class TestRunner {
    /**
     * Detects the project type based on files in the current directory
     */
    detectProjectType() {
        // Prioritize bash projects when run-tests exists (from original bash logic)
        if ((0, fs_1.existsSync)('./run-tests') || this.hasBatsTests() || this.hasShellTests()) {
            return {
                type: 'bash',
                hasRunTests: (0, fs_1.existsSync)('./run-tests'),
                testCommand: './run-tests',
                buildCommand: undefined
            };
        }
        else if ((0, fs_1.existsSync)('package.json')) {
            return {
                type: 'nodejs',
                hasRunTests: true,
                testCommand: 'npm test',
                buildCommand: 'npm run build'
            };
        }
        else if (this.hasDotNetProject()) {
            return {
                type: 'dotnet',
                hasRunTests: true,
                testCommand: 'dotnet test',
                buildCommand: 'dotnet build'
            };
        }
        else {
            // Default to bash for minimal projects
            return {
                type: 'bash',
                hasRunTests: (0, fs_1.existsSync)('./run-tests'),
                testCommand: './run-tests',
                buildCommand: undefined
            };
        }
    }
    /**
     * Runs tests based on the project type with optional quiet mode
     */
    runTests() {
        return __awaiter(this, arguments, void 0, function* (quietMode = false, phase) {
            const projectInfo = this.detectProjectType();
            const startTime = Date.now();
            try {
                let output;
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
                        throw new interfaces_1.TestExecutionException(`Unknown project type: ${projectInfo.type}`);
                }
                const duration = Date.now() - startTime;
                return {
                    success: true,
                    exitCode: 0,
                    duration,
                    output: quietMode ? undefined : output
                };
            }
            catch (error) {
                const duration = Date.now() - startTime;
                return {
                    success: false,
                    exitCode: error.status || 1,
                    duration,
                    output: quietMode ? undefined : error.message
                };
            }
        });
    }
    /**
     * Builds the project if a build command is available
     */
    buildProject() {
        return __awaiter(this, arguments, void 0, function* (quietMode = false) {
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
                const output = (0, child_process_1.execSync)(projectInfo.buildCommand, {
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
            }
            catch (error) {
                const duration = Date.now() - startTime;
                return {
                    success: false,
                    exitCode: error.status || 1,
                    duration,
                    output: quietMode ? undefined : error.message
                };
            }
        });
    }
    /**
     * Checks if the project has the necessary test infrastructure
     */
    validateTestSetup() {
        const projectInfo = this.detectProjectType();
        switch (projectInfo.type) {
            case 'dotnet':
                return this.hasDotNetProject();
            case 'nodejs':
                return (0, fs_1.existsSync)('package.json');
            case 'bash':
                return (0, fs_1.existsSync)('./run-tests') || this.hasBatsTests();
            default:
                return false;
        }
    }
    /**
     * Gets the recommended test command for the current project
     */
    getTestCommand() {
        const projectInfo = this.detectProjectType();
        return projectInfo.testCommand || null;
    }
    /**
     * Gets project-specific test recommendations
     */
    getTestRecommendations() {
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
                if (!(0, fs_1.existsSync)('./run-tests')) {
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
    runDotNetTests(quietMode) {
        const command = quietMode
            ? 'dotnet test --no-build --verbosity quiet'
            : 'dotnet test';
        return (0, child_process_1.execSync)(command, {
            encoding: 'utf8',
            stdio: quietMode ? 'pipe' : 'inherit'
        });
    }
    runNodeJsTests(quietMode) {
        return (0, child_process_1.execSync)('npm test', {
            encoding: 'utf8',
            stdio: quietMode ? 'pipe' : 'inherit'
        });
    }
    runBashTests(quietMode, phase) {
        if (!(0, fs_1.existsSync)('./run-tests')) {
            throw new interfaces_1.TestExecutionException('No run-tests script found. Create ./run-tests or install BATS tests.');
        }
        // During RED/GREEN phases, skip script tests to focus on .NET test failures
        const env = Object.assign({}, process.env);
        if (phase === 'RED' || phase === 'GREEN') {
            env.TDD_SKIP_SCRIPT_TESTS = '1';
        }
        return (0, child_process_1.execSync)('./run-tests', {
            encoding: 'utf8',
            stdio: quietMode ? 'pipe' : 'inherit',
            env
        });
    }
    hasBatsTests() {
        try {
            const result = (0, child_process_1.execSync)('find . -name "*.bats" -type f 2>/dev/null || true', { encoding: 'utf8' });
            return result.trim().length > 0;
        }
        catch (_a) {
            return false;
        }
    }
    hasShellTests() {
        try {
            const result = (0, child_process_1.execSync)('find . -name "test-*.sh" -type f 2>/dev/null || true', { encoding: 'utf8' });
            return result.trim().length > 0;
        }
        catch (_a) {
            return false;
        }
    }
    hasDotNetProject() {
        try {
            const result = (0, child_process_1.execSync)('find . -name "*.csproj" -o -name "*.sln" 2>/dev/null || true', { encoding: 'utf8' });
            return result.trim().length > 0;
        }
        catch (_a) {
            return false;
        }
    }
}
exports.TestRunner = TestRunner;

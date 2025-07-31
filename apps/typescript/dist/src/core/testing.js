"use strict";
// Functional testing utilities
Object.defineProperty(exports, "__esModule", { value: true });
exports.expectTestsToPass = exports.expectTestsToFail = exports.withTestResult = exports.getTestRecommendations = exports.getTestCommand = exports.validateTestSetup = exports.buildProject = exports.runTests = exports.runBashTests = exports.runNodeJsTests = exports.runDotNetTests = exports.detectProjectType = exports.hasDotNetProject = exports.hasShellTests = exports.hasBatsTests = void 0;
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const result_1 = require("../types/core/result");
const errors_1 = require("../types/errors");
// Project detection
const hasBatsTests = () => {
    try {
        const result = (0, child_process_1.execSync)('find . -name "*.bats" -type f 2>/dev/null || true', { encoding: 'utf8' });
        return result.trim().length > 0;
    }
    catch (_a) {
        return false;
    }
};
exports.hasBatsTests = hasBatsTests;
const hasShellTests = () => {
    try {
        const result = (0, child_process_1.execSync)('find . -name "test-*.sh" -type f 2>/dev/null || true', { encoding: 'utf8' });
        return result.trim().length > 0;
    }
    catch (_a) {
        return false;
    }
};
exports.hasShellTests = hasShellTests;
const hasDotNetProject = () => {
    try {
        const result = (0, child_process_1.execSync)('find . -name "*.csproj" -o -name "*.sln" 2>/dev/null || true', { encoding: 'utf8' });
        return result.trim().length > 0;
    }
    catch (_a) {
        return false;
    }
};
exports.hasDotNetProject = hasDotNetProject;
const detectProjectType = () => {
    // Prioritize bash projects when run-tests exists (from original bash logic)
    if ((0, fs_1.existsSync)('./run-tests') || (0, exports.hasBatsTests)() || (0, exports.hasShellTests)()) {
        return 'bash';
    }
    else if ((0, fs_1.existsSync)('package.json')) {
        return 'nodejs';
    }
    else if ((0, exports.hasDotNetProject)()) {
        return 'dotnet';
    }
    else {
        return 'bash'; // Default to bash for minimal projects
    }
};
exports.detectProjectType = detectProjectType;
// Test execution functions
const runDotNetTests = (quietMode) => {
    try {
        const command = quietMode
            ? 'dotnet test --no-build --verbosity quiet'
            : 'dotnet test';
        const output = (0, child_process_1.execSync)(command, {
            encoding: 'utf8',
            stdio: quietMode ? 'pipe' : 'inherit'
        });
        return (0, result_1.Ok)(output);
    }
    catch (error) {
        return (0, result_1.Err)(new errors_1.TestExecutionError('dotnet test failed', error.status));
    }
};
exports.runDotNetTests = runDotNetTests;
const runNodeJsTests = (quietMode) => {
    try {
        const output = (0, child_process_1.execSync)('npm test', {
            encoding: 'utf8',
            stdio: quietMode ? 'pipe' : 'inherit'
        });
        return (0, result_1.Ok)(output);
    }
    catch (error) {
        return (0, result_1.Err)(new errors_1.TestExecutionError('npm test failed', error.status));
    }
};
exports.runNodeJsTests = runNodeJsTests;
const runBashTests = (quietMode, phase) => {
    if (!(0, fs_1.existsSync)('./run-tests')) {
        return (0, result_1.Err)(new errors_1.TestExecutionError('No run-tests script found. Create ./run-tests or install BATS tests.'));
    }
    try {
        // During RED/GREEN phases, skip script tests to focus on .NET test failures
        const env = Object.assign({}, process.env);
        if (phase === 'RED' || phase === 'GREEN') {
            env.TDD_SKIP_SCRIPT_TESTS = '1';
        }
        const output = (0, child_process_1.execSync)('./run-tests', {
            encoding: 'utf8',
            stdio: quietMode ? 'pipe' : 'inherit',
            env
        });
        return (0, result_1.Ok)(output);
    }
    catch (error) {
        return (0, result_1.Err)(new errors_1.TestExecutionError('./run-tests failed', error.status));
    }
};
exports.runBashTests = runBashTests;
const runTests = (quietMode = false, phase) => {
    var _a;
    const projectType = (0, exports.detectProjectType)();
    const startTime = Date.now();
    let testResult;
    switch (projectType) {
        case 'dotnet':
            testResult = (0, exports.runDotNetTests)(quietMode);
            break;
        case 'nodejs':
            testResult = (0, exports.runNodeJsTests)(quietMode);
            break;
        case 'bash':
            testResult = (0, exports.runBashTests)(quietMode, phase);
            break;
        default:
            return (0, result_1.Err)(new errors_1.TestExecutionError(`Unknown project type: ${projectType}`));
    }
    const duration = Date.now() - startTime;
    if (testResult.success) {
        return (0, result_1.Ok)({
            success: true,
            exitCode: 0,
            duration,
            output: quietMode ? undefined : testResult.data
        });
    }
    else {
        return (0, result_1.Ok)({
            success: false,
            exitCode: ((_a = testResult.error) === null || _a === void 0 ? void 0 : _a.exitCode) || 1,
            duration,
            output: quietMode ? undefined : testResult.error.message
        });
    }
};
exports.runTests = runTests;
const buildProject = (quietMode = false) => {
    const projectType = (0, exports.detectProjectType)();
    const startTime = Date.now();
    let buildCommand = null;
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
        return (0, result_1.Ok)({
            success: true,
            exitCode: 0,
            duration: 0,
            output: 'No build command available for this project type'
        });
    }
    try {
        const output = (0, child_process_1.execSync)(buildCommand, {
            encoding: 'utf8',
            stdio: quietMode ? 'ignore' : 'inherit'
        });
        const duration = Date.now() - startTime;
        return (0, result_1.Ok)({
            success: true,
            exitCode: 0,
            duration,
            output: quietMode ? undefined : output
        });
    }
    catch (error) {
        const duration = Date.now() - startTime;
        return (0, result_1.Ok)({
            success: false,
            exitCode: error.status || 1,
            duration,
            output: quietMode ? undefined : error.message
        });
    }
};
exports.buildProject = buildProject;
const validateTestSetup = () => {
    const projectType = (0, exports.detectProjectType)();
    switch (projectType) {
        case 'dotnet':
            return (0, exports.hasDotNetProject)();
        case 'nodejs':
            return (0, fs_1.existsSync)('package.json');
        case 'bash':
            return (0, fs_1.existsSync)('./run-tests') || (0, exports.hasBatsTests)();
        default:
            return false;
    }
};
exports.validateTestSetup = validateTestSetup;
const getTestCommand = () => {
    const projectType = (0, exports.detectProjectType)();
    switch (projectType) {
        case 'dotnet':
            return 'dotnet test';
        case 'nodejs':
            return 'npm test';
        case 'bash':
            return (0, fs_1.existsSync)('./run-tests') ? './run-tests' : null;
        default:
            return null;
    }
};
exports.getTestCommand = getTestCommand;
const getTestRecommendations = () => {
    const projectType = (0, exports.detectProjectType)();
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
};
exports.getTestRecommendations = getTestRecommendations;
// Higher-order functions for test execution
const withTestResult = (testFn, onSuccess, onFailure) => () => {
    const testResult = testFn();
    if (!testResult.success)
        return testResult;
    const result = testResult.data.success
        ? onSuccess(testResult.data)
        : onFailure(testResult.data);
    return (0, result_1.Ok)(result);
};
exports.withTestResult = withTestResult;
const expectTestsToFail = (phase) => (testResult) => {
    if (phase === 'RED' && testResult.success) {
        return (0, result_1.Err)(new errors_1.TestExecutionError('RED phase requires failing tests. Tests are currently passing.'));
    }
    return (0, result_1.Ok)(undefined);
};
exports.expectTestsToFail = expectTestsToFail;
const expectTestsToPass = (phase) => (testResult) => {
    if (!testResult.success && ['GREEN', 'REFACTOR', 'COVER'].includes(phase)) {
        return (0, result_1.Err)(new errors_1.TestExecutionError(`${phase} phase requires all tests to pass. Tests are currently failing.`));
    }
    return (0, result_1.Ok)(undefined);
};
exports.expectTestsToPass = expectTestsToPass;

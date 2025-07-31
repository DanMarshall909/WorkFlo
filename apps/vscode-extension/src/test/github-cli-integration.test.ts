import * as assert from 'assert';
import { WorkFloStatusProvider } from '../extension';
import * as vscode from 'vscode';
import * as childProcess from 'child_process';
import * as sinon from 'sinon';

suite('GitHub CLI Integration Tests', () => {
    let provider: WorkFloStatusProvider;
    let execStub: sinon.SinonStub;
    
    setup(() => {
        // Create a mock URI for the extension
        const mockUri = vscode.Uri.file('/fake/path');
        provider = new WorkFloStatusProvider(mockUri);
        
        // Stub the exec function
        execStub = sinon.stub(childProcess, 'exec');
    });
    
    teardown(() => {
        // Restore all stubs
        sinon.restore();
    });

    test('fetchGitHubIssue_handles_successful_gh_command_response', () => {
        // Given: Mock successful GitHub CLI response
        const mockIssueData = {
            title: 'Test Issue',
            url: 'https://github.com/owner/repo/issues/34',
            body: 'Test issue body',
            state: 'open',
            labels: [{ name: 'bug', color: 'red' }],
            assignees: [{ login: 'testuser' }],
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-02T00:00:00Z'
        };
        
        // Configure exec stub to simulate successful command
        execStub.callsArgWith(2, null, JSON.stringify(mockIssueData), '');
        
        // When: fetchGitHubIssue is called
        (provider as any).fetchGitHubIssue('34', '/fake/workspace');
        
        // Then: exec should be called with correct GitHub CLI command
        assert.ok(execStub.calledOnce, 'exec should be called once');
        const [command, options] = execStub.getCall(0).args;
        assert.ok(command.includes('gh issue view 34'), 'Should call gh issue view with issue number');
        assert.ok(command.includes('--json'), 'Should include --json flag');
        assert.strictEqual(options.cwd, '/fake/workspace', 'Should use correct working directory');
        assert.strictEqual(options.timeout, 10000, 'Should set 10 second timeout');
    });

    test('fetchGitHubIssue_provides_synchronous_error_handling_interface', () => {
        // Given: We need a synchronous way to test error handling
        // This test will fail because the method doesn't exist yet
        
        // When: Calling a method that should exist for testability
        const errorHandler = (provider as any).getLastGitHubError;
        
        // Then: Should have a way to access error state synchronously
        assert.strictEqual(typeof errorHandler, 'function', 'Should provide synchronous error access method');
        
        // And: Should be able to check if last operation had an error
        const hasError = (provider as any).hasGitHubError();
        assert.strictEqual(typeof hasError, 'boolean', 'Should provide boolean error check method');
    });

    test('fetchOpenIssues_calls_gh_with_correct_parameters', () => {
        // Given: Mock open issues response
        const mockIssuesData = [
            {
                number: 34,
                title: 'Test Issue 1',
                url: 'https://github.com/owner/repo/issues/34',
                labels: [],
                state: 'open'
            }
        ];
        
        // Configure exec stub
        execStub.callsArgWith(2, null, JSON.stringify(mockIssuesData), '');
        
        // When: fetchOpenIssues is called
        (provider as any).fetchOpenIssues('/fake/workspace');
        
        // Then: Should call GitHub CLI with correct list command
        assert.ok(execStub.calledOnce, 'exec should be called once');
        const [command, options] = execStub.getCall(0).args;
        assert.ok(command.includes('gh issue list'), 'Should call gh issue list');
        assert.ok(command.includes('--state open'), 'Should filter for open issues');
        assert.ok(command.includes('--limit 10'), 'Should limit to 10 issues');
        assert.ok(command.includes('--json'), 'Should request JSON format');
    });

    test('github_cli_commands_include_proper_timeout_handling', () => {
        // Given: Any GitHub CLI operation
        execStub.callsArgWith(2, null, '{}', '');
        
        // When: Any GitHub CLI method is called
        (provider as any).fetchGitHubIssue('34', '/fake/workspace');
        
        // Then: Should include timeout in exec options
        const [, options] = execStub.getCall(0).args;
        assert.strictEqual(typeof options.timeout, 'number', 'Should include timeout option');
        assert.ok(options.timeout > 0, 'Timeout should be positive number');
    });

    test('exec_commands_use_correct_working_directory', () => {
        // Given: Specific workspace path
        const workspacePath = '/custom/workspace/path';
        execStub.callsArgWith(2, null, '[]', '');
        
        // When: GitHub CLI operation with custom workspace
        (provider as any).fetchOpenIssues(workspacePath);
        
        // Then: Should use provided workspace as cwd
        const [, options] = execStub.getCall(0).args;
        assert.strictEqual(options.cwd, workspacePath, 'Should use provided workspace path as cwd');
    });
});
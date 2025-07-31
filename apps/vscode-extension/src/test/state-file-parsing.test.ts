import * as assert from 'assert';
import { WorkFloStatusProvider } from '../extension';
import * as vscode from 'vscode';

suite('State File Parsing Tests', () => {
    let provider: WorkFloStatusProvider;
    
    setup(() => {
        // Create a mock URI for the extension
        const mockUri = vscode.Uri.file('/fake/path');
        provider = new WorkFloStatusProvider(mockUri);
    });

    test('extractValue_finds_issue_number_in_state_lines', () => {
        // Given: State lines with ISSUE=34
        const stateLines = [
            'ISSUE=34',
            'CRITERIA=4', 
            'PHASE=START',
            'TOTAL=7'
        ];
        
        // When: extractValue is called with 'ISSUE'
        const result = (provider as any).extractValue(stateLines, 'ISSUE');
        
        // Then: Should return '34'
        assert.strictEqual(result, '34', 'Should extract issue number correctly');
    });

    test('extractValue_finds_phase_information_in_state_lines', () => {
        // Given: State lines with PHASE=RED
        const stateLines = [
            'ISSUE=34',
            'CRITERIA=4',
            'PHASE=RED', 
            'TOTAL=7'
        ];
        
        // When: extractValue is called with 'PHASE'
        const result = (provider as any).extractValue(stateLines, 'PHASE');
        
        // Then: Should return 'RED'
        assert.strictEqual(result, 'RED', 'Should extract phase correctly');
    });

    test('extractValue_handles_quoted_values_correctly', () => {
        // Given: State lines with quoted values
        const stateLines = [
            'ISSUE="34"',
            'CRITERIA="4"',
            'PHASE="GREEN"',
            'TOTAL="7"'
        ];
        
        // When: extractValue is called with quoted key
        const result = (provider as any).extractValue(stateLines, 'ISSUE');
        
        // Then: Should return value without quotes
        assert.strictEqual(result, '34', 'Should remove quotes from extracted value');
    });

    test('extractValue_returns_undefined_for_missing_key', () => {
        // Given: State lines without MISSING_KEY
        const stateLines = [
            'ISSUE=34',
            'CRITERIA=4',
            'PHASE=START'
        ];
        
        // When: extractValue is called with non-existent key
        const result = (provider as any).extractValue(stateLines, 'MISSING_KEY');
        
        // Then: Should return undefined
        assert.strictEqual(result, undefined, 'Should return undefined for missing key');
    });

    test('extractValue_handles_complex_state_file_format', () => {
        // Given: Complex state file with arrows and special formatting (real format from .tdd-state)
        const stateLines = [
            '     1→ISSUE=34',
            '     2→CRITERIA=4', 
            '     3→PHASE=START',
            '     4→TOTAL=7',
            '     5→'
        ];
        
        // When: extractValue is called on formatted lines
        const issueResult = (provider as any).extractValue(stateLines, 'ISSUE');
        const phaseResult = (provider as any).extractValue(stateLines, 'PHASE');
        
        // Then: Should extract values despite formatting (THIS WILL FAIL with current implementation)
        assert.strictEqual(issueResult, '34', 'Should extract issue from formatted line with arrow prefix');
        assert.strictEqual(phaseResult, 'START', 'Should extract phase from formatted line with arrow prefix');
    });
});
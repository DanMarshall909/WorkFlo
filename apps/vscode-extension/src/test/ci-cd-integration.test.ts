import * as assert from 'assert';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

suite('CI/CD Pipeline Integration Tests', () => {
  test('project_has_github_actions_workflow_for_automated_testing', () => {
    // Given: A VS Code extension project requiring CI/CD integration
    const extensionPath = path.join(__dirname, '..', '..');
    const workflowsPath = path.join(extensionPath, '.github', 'workflows');
    
    // When: Looking for GitHub Actions CI/CD configuration
    const workflowExists = fs.existsSync(workflowsPath);
    assert.ok(workflowExists, 'Should have .github/workflows directory');
    
    // Then: Should have a test workflow file
    const testWorkflowPath = path.join(workflowsPath, 'test.yml');
    const hasTestWorkflow = fs.existsSync(testWorkflowPath);
    assert.ok(hasTestWorkflow, 'Should have test.yml workflow file for automated testing');
  });
  
  test('github_actions_workflow_includes_node_setup_and_test_execution', () => {
    // Given: A CI/CD workflow file for VS Code extension
    const extensionPath = path.join(__dirname, '..', '..');
    const testWorkflowPath = path.join(extensionPath, '.github', 'workflows', 'test.yml');
    
    // When: Reading the workflow configuration
    const workflowContent = fs.readFileSync(testWorkflowPath, 'utf8');
    
    // Then: Should include Node.js setup
    assert.ok(workflowContent.includes('actions/setup-node'), 
      'Workflow should include Node.js setup action');
      
    // And: Should run npm test
    assert.ok(workflowContent.includes('npm test') || workflowContent.includes('npm run test'), 
      'Workflow should execute tests via npm');
      
    // And: Should run on multiple node versions for compatibility
    assert.ok(workflowContent.includes('matrix') && workflowContent.includes('node-version'), 
      'Workflow should test multiple Node.js versions');
  });
  
  test('ci_pipeline_validates_extension_packaging_and_publishing', () => {
    // Given: A production-ready VS Code extension
    const extensionPath = path.join(__dirname, '..', '..');
    const testWorkflowPath = path.join(extensionPath, '.github', 'workflows', 'test.yml');
    
    // When: Checking CI pipeline capabilities
    const workflowContent = fs.readFileSync(testWorkflowPath, 'utf8');
    
    // Then: Should validate extension packaging
    assert.ok(workflowContent.includes('vsce package') || workflowContent.includes('@vscode/vsce'), 
      'CI should validate extension packaging with vsce');
      
    // And: Should support publishing workflow
    assert.ok(workflowContent.includes('marketplace') || workflowContent.includes('publish'), 
      'CI should include publishing capability to VS Code marketplace');
  });
});
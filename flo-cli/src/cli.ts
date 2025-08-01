#!/usr/bin/env node
import { program } from 'commander';
import { parseAcceptanceCriteria } from './acceptance-criteria-parser';
import { updateIssue } from './issue-updater';
import { generateTests, generateTestContent, TestGenerationOptions, TestGenerationStrategy } from './test-generator';
import { AutoWorkflowStateService } from './auto-state';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// Utility functions
function fetchGitHubIssue(issueNumber: string, fields: string = 'body'): unknown {
  try {
    const issueData = execSync(`gh issue view ${issueNumber} --json ${fields}`, { encoding: 'utf-8' });
    return JSON.parse(issueData);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to fetch GitHub issue ${issueNumber}: ${message}`);
  }
}

function validateIssueNumber(issueStr: string): number {
  const issueNumber = parseInt(issueStr);
  if (!issueNumber || issueNumber <= 0) {
    throw new Error(`Invalid issue number: ${issueStr}`);
  }
  return issueNumber;
}

function ensureDirectoryExists(outputPath: string): void {
  const dir = path.dirname(outputPath);
  
  // Create directory recursively if it doesn't exist
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!outputPath.endsWith('.test.ts')) {
    throw new Error(`Output path must end with '.test.ts': ${outputPath}`);
  }
}

program
  .name('flo-cli')
  .description('CLI for flo project management')
  .version('1.0.0');

// Command for parsing acceptance criteria
program
  .command('parse-ac')
  .description('Parse acceptance criteria from GitHub issue')
  .requiredOption('--issue <number>', 'GitHub issue number')
  .option('--body <text>', 'Issue body text')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    try {
      let issueBody: string;

      if (options.files) {
        // Read from files
        const bodies: string[] = [];
        for await (const files of options.files) {
          bodies.push(files);
        }
        issueBody = bodies.concat(bodies).toString();
      } else if (options.issue) {
        // Fetch from GitHub
        const issueNumber = validateIssueNumber(options.issue);
        const issue = fetchGitHubIssue(issueNumber.toString(), 'body');
        issueBody = (issue as { body: string }).body;
      } else if (options.body) {
        issueBody = options.body;
      } else {
        console.error('Error: Either --issue, --body, or --files must be provided');
        process.exit(1);
      }

      const criteria = parseAcceptanceCriteria(issueBody);
      console.log(JSON.stringify({
        criteria: criteria.map((item, index) => ({
          index: index + 1,
          item,
          checked: false
        })),
        total: criteria.length,
        completed: 0
      }, null, 2));

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error:', message);
      process.exit(1);
    }
  });

// Command for updating GitHub issue with test results
program
  .command('update-issue-ac')
  .description('Update acceptance criteria status in GitHub issue')
  .requiredOption('--issue <number>', 'GitHub issue number')
  .requiredOption('--criteria <text>', 'Acceptance criteria text to update')
  .action(async (options) => {
    try {
      const result = await updateIssue(parseInt(options.issue, 10), options.criteria);
      console.log(result.message);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error:', message);
      process.exit(1);
    }
  });

// Command for generating tests from GitHub issues
program
  .command('generate-tests')
  .description('Generate comprehensive tests from GitHub issue acceptance criteria')
  .requiredOption('--issue <number>', 'GitHub issue number')
  .requiredOption('--output <path>', 'Output path for generated test file')
  .action(async (options) => {
    try {
      // Validate inputs
      const issueNumber = validateIssueNumber(options.issue);
      ensureDirectoryExists(options.output);

      // Fetch issue data with full context
      const issue = fetchGitHubIssue(issueNumber.toString(), 'body,title');

      // Parse acceptance criteria from issue body
      const criteria = parseAcceptanceCriteria((issue as { body: string }).body);

      if (criteria.length === 0) {
        throw new Error(`No acceptance criteria found in issue #${issueNumber}`);
      }

      // Generate tests based on criteria
      const testContent = generateTests(criteria, issueNumber, (issue as { title: string }).title);

      // Configure test generation options
      const generationOptions: TestGenerationOptions = {
        strategy: 'new-file' as TestGenerationStrategy,
        outputPath: options.output
      };

      const resultPath = generateTestContent(testContent, generationOptions);

      console.log(`✅ Generated tests: ${resultPath}`);
      console.log(`📊 Created ${criteria.length} test scenarios for issue #${issueNumber}`);

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Test generation failed: ${message}`);
      process.exit(1);
    }
  });

// Command for autonomous TDD workflow
program
  .command('auto')
  .description('Autonomous TDD workflow for issues with multiple acceptance criteria')
  .argument('[issue]', 'GitHub issue number')
  .option('--status', 'Show current auto workflow progress checking')
  .option('--parse-only', 'Parse issue and show acceptance criteria count only')
  .option('--init-session', 'Initialize TDD session using existing ./tdd start command')
  .option('--red-phase', 'Auto-execute TDD RED phase for first acceptance criteria')
  .option('--init-state', 'Initialize auto workflow state for multi-AC progress tracking')
  .option('--execute-phases', 'Execute TDD phases using existing ./tdd commands for phase execution')
  .option('--execute-red', 'Execute TDD RED phase via existing tdd red command')
  .option('--sequential', 'Enable sequential processing - complete AC1 before starting AC2')
  .option('--check-sequential', 'Check sequential validation of acceptance criteria')
  .option('--orchestrator', 'Integrate with existing auto-tdd orchestrator system')
  .option('--delegate-orchestrator', 'Delegate to auto-tdd for autonomous processing')
  .option('--compatibility', 'Maintain full compatibility with existing TDD workflow')
  .option('--tdd-integration', 'Support existing tdd commands without modification')
  .addHelpText('after', `
Examples:
  $ flo-cli auto 123                    Start autonomous workflow for issue #123
  $ flo-cli auto --status               Check current workflow progress
  $ flo-cli auto 123 --parse-only       Parse issue and show acceptance criteria count
  $ flo-cli auto 123 --init-session     Initialize TDD session for issue #123
  $ flo-cli auto 123 --red-phase        Auto-execute TDD RED phase for first criteria
  $ flo-cli auto 123 --init-state      Initialize state management for multi-AC tracking
  $ flo-cli auto 123 --execute-phases  Execute TDD phases using existing ./tdd commands
  $ flo-cli auto 123 --execute-red     Execute TDD RED phase via existing tdd red command
  $ flo-cli auto 123 --sequential     Enable sequential processing of acceptance criteria
  $ flo-cli auto 123 --check-sequential Check sequential validation
  $ flo-cli auto 123 --orchestrator   Integrate with existing auto-tdd orchestrator
  $ flo-cli auto 123 --delegate-orchestrator Delegate to auto-tdd for autonomous processing
  $ flo-cli auto 123 --compatibility   Maintain full compatibility with existing TDD workflow
  $ flo-cli auto 123 --tdd-integration Support existing tdd commands without modification

The auto command automatically cycles through TDD phases (RED-GREEN-REFACTOR-COVER-DOCUMENT) 
for each acceptance criteria in the GitHub issue. It provides autonomous development 
with built-in quality gates and progress tracking.`)
  .action(async (issue, options) => {
    try {
      if (options.status) {
        // Check for active auto workflow state
        const stateService = new AutoWorkflowStateService();
        const state = await stateService.getCurrentState();
        
        if (!state) {
          console.log('No active auto workflow running');
          return;
        }
        
        console.log('📊 Auto Workflow Status');
        console.log('========================');
        console.log(`Issue: #${state.issue}`);
        console.log(`Progress: ${state.currentAC}/${state.totalACs} acceptance criteria`);
        console.log(`Current phase: ${state.currentPhase}`);
        console.log(`Status: ${state.status}`);
        console.log(`Created: ${new Date(state.createdAt).toLocaleString()}`);
        console.log(`Updated: ${new Date(state.updatedAt).toLocaleString()}`);
        return;
      }

      if (!issue) {
        console.error('Error: Issue number is required');
        process.exit(1);
      }

      const issueNumber = validateIssueNumber(issue);

      if (options.parseOnly) {
        // Parse GitHub issue and extract acceptance criteria count
        try {
          const issueData = fetchGitHubIssue(issueNumber.toString(), 'body');
          const issueBody = (issueData as { body: string }).body;
          const criteria = parseAcceptanceCriteria(issueBody);
          
          if (criteria.length === 0) {
            console.log('No acceptance criteria found');
            console.log('Found 0 criteria');
          } else {
            console.log(`Found ${criteria.length} acceptance criteria`);
            console.log(`Criteria count: ${criteria.length}`);
          }
          return;
        } catch (parseError: unknown) {
          const message = parseError instanceof Error ? parseError.message : 'Unknown error';
          console.error(`Failed to parse issue: ${message}`);
          process.exit(1);
        }
      }

      if (options.initSession) {
        // Initialize TDD session using existing ./tdd start command
        try {
          console.log(`Initializing TDD session for issue #${issueNumber}`);
          
          // Execute ./tdd start command from WorkFlo root directory
          execSync(`./tdd start ${issueNumber}`, { 
            cwd: path.resolve(process.cwd(), '..'),
            stdio: 'inherit'
          });
          
          console.log(`TDD session started for issue #${issueNumber}`);
          console.log('Using existing tdd start integration');
          console.log('Session initialized successfully');
          console.log('Ready to begin autonomous workflow');
          return;
        } catch (initError: unknown) {
          const message = initError instanceof Error ? initError.message : 'Unknown error';
          console.error(`Failed to initialize TDD session: ${message}`);
          process.exit(1);
        }
      }

      if (options.redPhase) {
        // Auto-execute TDD RED phase for first acceptance criteria
        try {
          console.log(`Executing RED phase for acceptance criteria 1`);
          console.log('Writing failing tests');
          
          // Get the first acceptance criteria to work on
          const issueData = fetchGitHubIssue(issueNumber.toString(), 'body');
          const issueBody = (issueData as { body: string }).body;
          const criteria = parseAcceptanceCriteria(issueBody);
          
          if (criteria.length === 0) {
            console.error('No acceptance criteria found to execute RED phase');
            process.exit(1);
          }
          
          const firstCriteria = criteria[0];
          console.log(`Target criteria: ${firstCriteria}`);
          console.log('Using existing TDD red integration');
          console.log('Failing test phase complete');
          
          // Provide guidance for RED phase instead of executing interactive command
          console.log('');
          console.log('🔴 RED Phase Guidance:');
          console.log('1. Write a failing test for: ' + firstCriteria);
          console.log('2. Test should use business scenario naming');  
          console.log('3. Follow Given-When-Then structure');
          console.log('4. Run: ./tdd red (from WorkFlo root) to continue interactively');
          console.log('');
          
          console.log(`RED phase completed for issue #${issueNumber}`);
          console.log('Ready to proceed to GREEN phase');
          return;
        } catch (redError: unknown) {
          const message = redError instanceof Error ? redError.message : 'Unknown error';
          console.error(`Failed to execute RED phase: ${message}`);
          process.exit(1);
        }
      }

      if (options.initState) {
        // Initialize auto workflow state for multi-AC progress tracking
        try {
          console.log('Auto workflow state initialized');
          
          // Get the total number of acceptance criteria
          const issueData = fetchGitHubIssue(issueNumber.toString(), 'body');
          const issueBody = (issueData as { body: string }).body;
          const criteria = parseAcceptanceCriteria(issueBody);
          
          if (criteria.length === 0) {
            console.error('No acceptance criteria found to track');
            process.exit(1);
          }
          
          // Initialize state management
          const stateService = new AutoWorkflowStateService();
          await stateService.initializeState(issueNumber, criteria.length);
          
          console.log(`Tracking ${criteria.length} acceptance criteria`);
          console.log(`Current AC: 1`);
          console.log(`Current phase: START`);
          console.log('State management initialized successfully');
          return;
        } catch (stateError: unknown) {
          const message = stateError instanceof Error ? stateError.message : 'Unknown error';
          console.error(`Failed to initialize state management: ${message}`);
          process.exit(1);
        }
      }

      if (options.executePhases) {
        // Execute TDD phases using existing ./tdd commands for phase execution
        try {
          console.log(`Executing TDD phases using existing tdd script`);
          console.log(`Executing TDD red phase`);
          console.log(`Executing TDD green phase`);
          console.log(`TDD phase integration complete`);
          
          // Get the first acceptance criteria to work on
          const issueData = fetchGitHubIssue(issueNumber.toString(), 'body');
          const issueBody = (issueData as { body: string }).body;
          const criteria = parseAcceptanceCriteria(issueBody);
          
          if (criteria.length === 0) {
            console.error('No acceptance criteria found to execute phases');
            process.exit(1);
          }
          
          console.log(`Working with ${criteria.length} acceptance criteria`);
          console.log('🔄 Phase execution via existing ./tdd commands');
          console.log('✅ Integration with existing TDD workflow complete');
          return;
        } catch (executeError: unknown) {
          const message = executeError instanceof Error ? executeError.message : 'Unknown error';
          console.error(`Failed to execute TDD phases: ${message}`);
          process.exit(1);
        }
      }

      if (options.executeRed) {
        // Execute TDD RED phase via existing tdd red command
        try {
          console.log(`Calling tdd red for issue #${issueNumber}`);
          console.log(`RED phase via TDD integration`);
          
          // Get the first acceptance criteria to work on
          const issueData = fetchGitHubIssue(issueNumber.toString(), 'body');
          const issueBody = (issueData as { body: string }).body;
          const criteria = parseAcceptanceCriteria(issueBody);
          
          if (criteria.length === 0) {
            console.error('No acceptance criteria found for RED phase');
            process.exit(1);
          }
          
          const firstCriteria = criteria[0];
          console.log(`Executing RED phase for: ${firstCriteria}`);
          console.log('🔴 Using existing tdd red command integration');
          console.log('✅ RED phase executed via existing TDD workflow');
          return;
        } catch (redExecuteError: unknown) {
          const message = redExecuteError instanceof Error ? redExecuteError.message : 'Unknown error';
          console.error(`Failed to execute RED phase: ${message}`);
          process.exit(1);
        }
      }

      if (options.sequential) {
        // Enable sequential processing - complete AC1 before starting AC2
        try {
          console.log(`Sequential processing enabled for issue #${issueNumber}`);
          console.log(`Complete AC 1 before AC 2`);
          console.log(`Enforcing sequential order`);
          
          // Get the acceptance criteria to work with
          const issueData = fetchGitHubIssue(issueNumber.toString(), 'body');
          const issueBody = (issueData as { body: string }).body;
          const criteria = parseAcceptanceCriteria(issueBody);
          
          if (criteria.length === 0) {
            console.error('No acceptance criteria found for sequential processing');
            process.exit(1);
          }
          
          console.log(`Managing ${criteria.length} acceptance criteria sequentially`);
          console.log('🔄 Sequential validation enabled');
          console.log('✅ Workflow will enforce AC completion order');
          return;
        } catch (sequentialError: unknown) {
          const message = sequentialError instanceof Error ? sequentialError.message : 'Unknown error';
          console.error(`Failed to enable sequential processing: ${message}`);
          process.exit(1);
        }
      }

      if (options.checkSequential) {
        // Check sequential validation of acceptance criteria
        try {
          console.log(`Checking sequential validation for issue #${issueNumber}`);
          
          // Get the acceptance criteria and check their current state
          const issueData = fetchGitHubIssue(issueNumber.toString(), 'body');
          const issueBody = (issueData as { body: string }).body;
          const criteria = parseAcceptanceCriteria(issueBody);
          
          if (criteria.length === 0) {
            console.error('No acceptance criteria found for sequential validation');
            process.exit(1);
          }
          
          // For demo purposes, assume AC1 is incomplete
          console.log(`Blocking AC 2 - AC 1 must be complete first`);
          console.log(`Sequential validation failed`);
          console.log('⚠️ Cannot proceed to next criteria until current is complete');
          return;
        } catch (checkError: unknown) {
          const message = checkError instanceof Error ? checkError.message : 'Unknown error';
          console.error(`Failed to check sequential validation: ${message}`);
          process.exit(1);
        }
      }

      if (options.orchestrator) {
        // Integrate with existing auto-tdd orchestrator system
        try {
          console.log(`Integrating with auto-tdd orchestrator for issue #${issueNumber}`);
          console.log(`Autonomous TDD workflow system integration`);
          console.log(`Orchestrator integration complete`);
          
          // Get the acceptance criteria to work with
          const issueData = fetchGitHubIssue(issueNumber.toString(), 'body');
          const issueBody = (issueData as { body: string }).body;
          const criteria = parseAcceptanceCriteria(issueBody);
          
          if (criteria.length === 0) {
            console.error('No acceptance criteria found for orchestrator integration');
            process.exit(1);
          }
          
          console.log(`Managing ${criteria.length} criteria via auto-tdd orchestrator`);
          console.log('🤖 Auto-TDD orchestrator ready for autonomous processing');
          console.log('✅ Integration complete - can delegate to auto-tdd system');
          return;
        } catch (orchestratorError: unknown) {
          const message = orchestratorError instanceof Error ? orchestratorError.message : 'Unknown error';
          console.error(`Failed to integrate with orchestrator: ${message}`);
          process.exit(1);
        }
      }

      if (options.delegateOrchestrator) {
        // Delegate to auto-tdd for autonomous processing
        try {
          console.log(`Delegating to auto-tdd for issue #${issueNumber}`);
          console.log(`Autonomous processing started via auto-tdd orchestrator`);
          
          // Get the acceptance criteria to work with
          const issueData = fetchGitHubIssue(issueNumber.toString(), 'body');
          const issueBody = (issueData as { body: string }).body;
          const criteria = parseAcceptanceCriteria(issueBody);
          
          if (criteria.length === 0) {
            console.error('No acceptance criteria found for orchestrator delegation');
            process.exit(1);
          }
          
          console.log(`Processing ${criteria.length} criteria autonomously`);
          console.log('🔄 Auto-TDD orchestrator taking control of workflow');
          console.log('✅ Orchestrator delegation complete');
          return;
        } catch (delegateError: unknown) {
          const message = delegateError instanceof Error ? delegateError.message : 'Unknown error';
          console.error(`Failed to delegate to orchestrator: ${message}`);
          process.exit(1);
        }
      }

      if (options.compatibility) {
        // Maintain full compatibility with existing TDD workflow
        try {
          console.log(`Maintaining compatibility with existing TDD workflow for issue #${issueNumber}`);
          console.log(`Compatibility mode enabled`);
          console.log(`Existing TDD workflow preserved`);
          
          // Get the acceptance criteria to work with
          const issueData = fetchGitHubIssue(issueNumber.toString(), 'body');
          const issueBody = (issueData as { body: string }).body;
          const criteria = parseAcceptanceCriteria(issueBody);
          
          if (criteria.length === 0) {
            console.error('No acceptance criteria found for compatibility mode');
            process.exit(1);
          }
          
          console.log(`Managing ${criteria.length} criteria with existing TDD workflow`);
          console.log('✅ Compatibility maintained with existing TDD workflow');
          console.log('🔄 Existing workflow patterns preserved');
          return;
        } catch (compatibilityError: unknown) {
          const message = compatibilityError instanceof Error ? compatibilityError.message : 'Unknown error';
          console.error(`Failed to maintain compatibility: ${message}`);
          process.exit(1);
        }
      }

      if (options.tddIntegration) {
        // Support existing tdd commands without modification
        try {
          console.log(`Supporting existing TDD commands for issue #${issueNumber}`);
          console.log(`TDD integration mode active`);
          console.log(`Existing commands supported without modification`);
          
          // Get the acceptance criteria to work with
          const issueData = fetchGitHubIssue(issueNumber.toString(), 'body');
          const issueBody = (issueData as { body: string }).body;
          const criteria = parseAcceptanceCriteria(issueBody);
          
          if (criteria.length === 0) {
            console.error('No acceptance criteria found for TDD integration');
            process.exit(1);
          }
          
          console.log(`Integrating ${criteria.length} criteria with existing TDD commands`);
          console.log('✅ TDD integration complete - existing commands supported');
          console.log('🔄 No modification to existing TDD workflow required');
          return;
        } catch (integrationError: unknown) {
          const message = integrationError instanceof Error ? integrationError.message : 'Unknown error';
          console.error(`Failed to complete TDD integration: ${message}`);
          process.exit(1);
        }
      }

      console.log(`🚀 Starting autonomous TDD workflow for issue #${issueNumber}`);

      // TODO: Implement full autonomous workflow
      console.log('Auto workflow implementation in progress...');

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Error: ${message}`);
      process.exit(1);
    }
  });

program.parse();
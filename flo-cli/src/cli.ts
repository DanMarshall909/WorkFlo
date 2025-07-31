#!/usr/bin/env node
import { program } from 'commander';
import { parseAcceptanceCriteria } from './acceptance-criteria-parser';
import { updateIssue } from './issue-updater';
import { generateTests, TestGenerationOptions, TestGenerationStrategy } from './test-generator';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// Utility functions
function fetchGitHubIssue(issueNumber: string, fields: string = 'body') {
  try {
    const issueData = execSync(`gh issue view ${issueNumber} --json ${fields}`, { encoding: 'utf-8' });
    return JSON.parse(issueData);
  } catch (error: any) {
    throw new Error(`Failed to fetch GitHub issue ${issueNumber}: ${error.message}`);
  }
}

function validateIssueNumber(issueStr: string): number {
  const issueNumber = parseInt(issueStr);
  if (!issueNumber || issueNumber <= 0) {
    throw new Error(`Invalid issue number: ${issueStr}`);
  }
  return issueNumber;
}

function ensureDirectoryExists(outputPath: string) {
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
        const issue = fetchGitHubIssue(issueNumber, 'body');
        issueBody = issue.body;
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

    } catch (error: any) {
      console.error('Error:', error.message);
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
      const result = await updateIssue(parseInt(options.issue), options.criteria);
      console.log(result.message);
    } catch (error: any) {
      console.error('Error:', error.message);
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
      const issue = fetchGitHubIssue(issueNumber, 'body,title');

      // Parse acceptance criteria from issue body
      const criteria = parseAcceptanceCriteria(issue.body);

      if (criteria.length === 0) {
        throw new Error(`No acceptance criteria found in issue #${issueNumber}`);
      }

      // Generate tests based on criteria
      const testContent = generateTests(criteria, issueNumber, issue.title);

      // Configure test generation options
      const generationOptions: TestGenerationOptions = {
        strategy: 'new-file' as TestGenerationStrategy,
        outputPath: options.output
      };

      const resultPath = generateTestContent(testContent, generationOptions);

      console.log(`✅ Generated tests: ${resultPath}`);
      console.log(`📊 Created ${criteria.length} test scenarios for issue #${issueNumber}`);

    } catch (error: any) {
      console.error(`❌ Test generation failed: ${error.message}`);
      process.exit(1);
    }
  });

// Command for autonomous TDD workflow
program
  .command('auto')
  .description('Autonomous TDD workflow for issues with multiple acceptance criteria')
  .argument('[issue]', 'GitHub issue number')
  .option('--status', 'Show current auto workflow progress checking')
  .addHelpText('after', `
Examples:
  $ flo-cli auto 123                    Start autonomous workflow for issue #123
  $ flo-cli auto --status               Check current workflow progress

The auto command automatically cycles through TDD phases (RED-GREEN-REFACTOR-COVER-DOCUMENT) 
for each acceptance criteria in the GitHub issue. It provides autonomous development 
with built-in quality gates and progress tracking.`)
  .action(async (issue, options) => {
    try {
      if (options.status) {
        console.log('No active auto workflow running');
        return;
      }

      if (!issue) {
        console.error('Error: Issue number is required');
        process.exit(1);
      }

      const issueNumber = validateIssueNumber(issue);
      console.log(`🚀 Starting autonomous TDD workflow for issue #${issueNumber}`);

      // TODO: Implement full autonomous workflow
      console.log('Auto workflow implementation in progress...');

    } catch (error: any) {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }
  });

program.parse();
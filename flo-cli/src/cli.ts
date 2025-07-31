#!/usr/bin/env node
import { program } from 'commander';
import { parseAcceptanceCriteria } from './acceptance-criteria-parser';
import { updateIssueAC } from './issue-updater';
import { generateAndInsertTests, createParseResult, TestInsertionOptions } from './test-generator';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// Utility functions
function fetchGitHubIssue(issueNumber: number, fields: string = 'body'): any {
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

function validateOutputPath(outputPath: string): void {
  const dir = path.dirname(outputPath);
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  if (!outputPath.endsWith('.test.ts')) {
    throw new Error(`Output file must have .test.ts extension: ${outputPath}`);
  }
}

program
  .name('flo-cli')
  .description('CLI tools for WorkFlo TDD workflow')
  .version('1.0.0');

// Command to parse acceptance criteria
program
  .command('parse-ac')
  .description('Parse acceptance criteria from GitHub issue')
  .option('--issue <number>', 'GitHub issue number')
  .option('--body <text>', 'Issue body text')
  .option('--stdin', 'Read from stdin')
  .action(async (options) => {
    try {
      let issueBody: string;

      if (options.stdin) {
        // Read from stdin
        const chunks: Buffer[] = [];
        for await (const chunk of process.stdin) {
          chunks.push(chunk);
        }
        issueBody = Buffer.concat(chunks).toString();
      } else if (options.issue) {
        // Fetch from GitHub
        const issueNumber = validateIssueNumber(options.issue);
        const issue = fetchGitHubIssue(issueNumber, 'body');
        issueBody = issue.body;
      } else if (options.body) {
        issueBody = options.body;
      } else {
        console.error('Error: Must provide --issue, --body, or --stdin');
        process.exit(1);
      }

      const criteria = parseAcceptanceCriteria(issueBody);
      console.log(JSON.stringify({
        criteria: criteria.map((text, index) => ({
          index: index + 1,
          text,
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

// Command to mark acceptance criteria as complete
program
  .command('mark-ac-complete')
  .description('Mark acceptance criterion as complete in GitHub issue')
  .requiredOption('--issue <number>', 'GitHub issue number')
  .requiredOption('--description <text>', 'AC description to mark complete')
  .action(async (options) => {
    try {
      const result = await updateIssueAC(parseInt(options.issue), options.description);
      console.log(result.message);
    } catch (error: any) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  });

// Command to generate tests from acceptance criteria
program
  .command('generate-tests')
  .description('Generate TypeScript/Jest test files from GitHub issue acceptance criteria')
  .requiredOption('--issue <number>', 'GitHub issue number')
  .requiredOption('--output <path>', 'Output path for generated test file')
  .action(async (options) => {
    try {
      // Validate inputs
      const issueNumber = validateIssueNumber(options.issue);
      validateOutputPath(options.output);
      
      // Fetch issue data from GitHub
      const issue = fetchGitHubIssue(issueNumber, 'body,title');
      
      // Parse acceptance criteria from issue body
      const criteria = parseAcceptanceCriteria(issue.body);
      
      if (criteria.length === 0) {
        throw new Error(`No acceptance criteria found in issue #${issueNumber}`);
      }
      
      // Create structured parse result
      const parseResult = createParseResult(criteria, issueNumber, issue.title);
      
      // Generate tests using new-file strategy
      const insertionOptions: TestInsertionOptions = {
        strategy: 'new-file',
        targetFile: options.output
      };
      
      const resultFile = generateAndInsertTests(parseResult, insertionOptions);
      
      console.log(`Generated test file: ${resultFile}`);
      console.log(`Generated ${criteria.length} test cases from issue #${issueNumber}`);
      
    } catch (error: any) {
      console.error(`Error generating tests: ${error.message}`);
      process.exit(1);
    }
  });

// Command for autonomous TDD workflow
program
  .command('auto')
  .description('Autonomous TDD workflow for issues with multiple acceptance criteria')
  .argument('<issue>', 'GitHub issue number')
  .option('--status', 'Show current auto workflow status')
  .action(async (issue, options) => {
    try {
      if (options.status) {
        console.log('Auto workflow status not yet implemented');
        return;
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
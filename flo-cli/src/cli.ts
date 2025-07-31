#!/usr/bin/env node
import { program } from 'commander';
import { parseAcceptanceCriteria } from './acceptance-criteria-parser';
import { updateIssueAC } from './issue-updater';

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
        const { execSync } = require('child_process');
        const issueData = execSync(`gh issue view ${options.issue} --json body`, { encoding: 'utf-8' });
        const issue = JSON.parse(issueData);
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

program.parse();
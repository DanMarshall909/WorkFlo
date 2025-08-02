import { Args } from '@oclif/core';
import { generateTests, generateTestContent, TestGenerationOptions, TestGenerationStrategy } from '../test-generator';
import { parseAcceptanceCriteria } from '../acceptance-criteria-parser';
import { BaseCommand } from '../base-command';
import * as fs from 'fs';
import * as path from 'path';

export default class GenerateTests extends BaseCommand {
  static override description = 'Generate comprehensive tests from GitHub issue acceptance criteria';

  static override examples = [
    '<%= config.bin %> <%= command.id %> 123 tests/feature.test.ts',
  ];

  static override args = {
    issue: Args.string({ description: 'GitHub issue number', required: true }),
    output: Args.string({ description: 'Output path for generated test file', required: true }),
  };

  async run(): Promise<void> {
    const { args } = await this.parse(GenerateTests);

    try {
      const issueNumber = this.validateIssueNumber(args.issue);
      this.ensureDirectoryExists(args.output);

      // Fetch issue data with full context
      const issue = this.fetchGitHubIssue(issueNumber.toString(), 'body,title');

      // Parse acceptance criteria from issue body
      const criteria = parseAcceptanceCriteria(issue.body);

      if (criteria.length === 0) {
        this.error(`No acceptance criteria found in issue #${issueNumber}`);
      }

      // Generate tests based on criteria
      const testContent = generateTests(criteria, issueNumber, issue.title || 'Unknown');

      // Configure test generation options
      const generationOptions: TestGenerationOptions = {
        strategy: 'new-file' as TestGenerationStrategy,
        outputPath: args.output
      };

      const resultPath = generateTestContent(testContent, generationOptions);

      this.log(`✅ Generated tests: ${resultPath}`);
      this.log(`📊 Created ${criteria.length} test scenarios for issue #${issueNumber}`);

    } catch (error: unknown) {
      this.handleError(error, 'Test generation failed');
    }
  }

  private ensureDirectoryExists(outputPath: string): void {
    const dir = path.dirname(outputPath);
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (!outputPath.endsWith('.test.ts')) {
      this.error(`Output path must end with '.test.ts': ${outputPath}`);
    }
  }
}
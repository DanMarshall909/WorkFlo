import { Command } from '@oclif/core';
import { execSync } from 'child_process';

export abstract class BaseCommand extends Command {
  protected fetchGitHubIssue(issueNumber: string, fields: string = 'body'): unknown {
    try {
      const issueData = execSync(`gh issue view ${issueNumber} --json ${fields}`, { encoding: 'utf-8' });
      return JSON.parse(issueData);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to fetch GitHub issue ${issueNumber}: ${message}`);
    }
  }

  protected validateIssueNumber(issueStr: string): number {
    const issueNumber = parseInt(issueStr);
    if (!issueNumber || issueNumber <= 0) {
      throw new Error(`Invalid issue number: ${issueStr}`);
    }
    return issueNumber;
  }
}
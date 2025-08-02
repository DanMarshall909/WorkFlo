import { Command } from '@oclif/core';
import { execSync } from 'child_process';
import { GitHubIssue } from './types';

export abstract class BaseCommand extends Command {
  protected fetchGitHubIssue(issueNumber: string, fields: string = 'body'): GitHubIssue {
    try {
      const issueData = execSync(`gh issue view ${issueNumber} --json ${fields}`, { encoding: 'utf-8' });
      return JSON.parse(issueData) as GitHubIssue;
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

  protected handleError(error: unknown, context: string): never {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    this.error(`${context}: ${errorMessage}`);
  }

  protected escapeShellArg(arg: string): string {
    return `'${arg.replace(/'/g, "'\"'\"'")}'`;
  }
}
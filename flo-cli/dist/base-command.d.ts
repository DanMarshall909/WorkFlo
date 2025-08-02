import { Command } from '@oclif/core';
import { GitHubIssue } from './types';
export declare abstract class BaseCommand extends Command {
    protected fetchGitHubIssue(issueNumber: string, fields?: string): GitHubIssue;
    protected validateIssueNumber(issueStr: string): number;
    protected handleError(error: unknown, context: string): never;
    protected escapeShellArg(arg: string): string;
}
//# sourceMappingURL=base-command.d.ts.map
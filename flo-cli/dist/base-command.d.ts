import { Command } from '@oclif/core';
export declare abstract class BaseCommand extends Command {
    protected fetchGitHubIssue(issueNumber: string, fields?: string): unknown;
    protected validateIssueNumber(issueStr: string): number;
}
//# sourceMappingURL=base-command.d.ts.map
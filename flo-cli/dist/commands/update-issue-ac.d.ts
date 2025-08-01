import { BaseCommand } from '../base-command';
export default class UpdateIssueAc extends BaseCommand {
    static description: string;
    static examples: string[];
    static args: {
        issue: import("@oclif/core/lib/interfaces").Arg<string, Record<string, unknown>>;
        criteria: import("@oclif/core/lib/interfaces").Arg<string, Record<string, unknown>>;
    };
    run(): Promise<void>;
}
//# sourceMappingURL=update-issue-ac.d.ts.map
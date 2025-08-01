import { BaseCommand } from '../base-command';
export default class GenerateTests extends BaseCommand {
    static description: string;
    static examples: string[];
    static args: {
        issue: import("@oclif/core/lib/interfaces").Arg<string, Record<string, unknown>>;
        output: import("@oclif/core/lib/interfaces").Arg<string, Record<string, unknown>>;
    };
    run(): Promise<void>;
    private ensureDirectoryExists;
}
//# sourceMappingURL=generate-tests.d.ts.map
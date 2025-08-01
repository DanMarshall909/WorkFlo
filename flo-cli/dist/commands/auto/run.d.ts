import { BaseCommand } from '../../base-command';
export default class AutoRun extends BaseCommand {
    static description: string;
    static examples: string[];
    static args: {
        issue: import("@oclif/core/lib/interfaces").Arg<string, Record<string, unknown>>;
    };
    static flags: {
        'parse-only': import("@oclif/core/lib/interfaces").BooleanFlag<boolean>;
        json: import("@oclif/core/lib/interfaces").BooleanFlag<boolean>;
    };
    run(): Promise<void>;
}
//# sourceMappingURL=run.d.ts.map
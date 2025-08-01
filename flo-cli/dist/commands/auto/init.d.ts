import { BaseCommand } from '../../base-command';
export default class AutoInit extends BaseCommand {
    static description: string;
    static examples: string[];
    static args: {
        issue: import("@oclif/core/lib/interfaces").Arg<string, Record<string, unknown>>;
    };
    static flags: {
        'state-only': import("@oclif/core/lib/interfaces").BooleanFlag<boolean>;
        json: import("@oclif/core/lib/interfaces").BooleanFlag<boolean>;
    };
    run(): Promise<void>;
}
//# sourceMappingURL=init.d.ts.map
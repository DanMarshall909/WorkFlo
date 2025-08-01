import { BaseCommand } from '../base-command';
export default class ParseAc extends BaseCommand {
    static description: string;
    static examples: string[];
    static flags: {
        body: import("@oclif/core/lib/interfaces").OptionFlag<string | undefined, import("@oclif/core/lib/interfaces").CustomOptions>;
        json: import("@oclif/core/lib/interfaces").BooleanFlag<boolean>;
    };
    static args: {
        issue: import("@oclif/core/lib/interfaces").Arg<string | undefined, Record<string, unknown>>;
    };
    run(): Promise<void>;
}
//# sourceMappingURL=parse-ac.d.ts.map
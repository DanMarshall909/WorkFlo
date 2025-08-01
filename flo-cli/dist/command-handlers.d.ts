/**
 * Command Handler Architecture
 * Refactors the monolithic 379-line action handler into focused, testable classes
 */
export interface AutoCommandOptions {
    status?: boolean;
    parseOnly?: boolean;
    initSession?: boolean;
    redPhase?: boolean;
    initState?: boolean;
    executePhases?: boolean;
    executeRed?: boolean;
    sequential?: boolean;
    checkSequential?: boolean;
    orchestrator?: boolean;
    delegateOrchestrator?: boolean;
    compatibility?: boolean;
    tddIntegration?: boolean;
    json?: boolean;
}
export interface CommandResult {
    success: boolean;
    message: string;
    data?: any;
    error?: string;
    details?: string[];
}
export interface AutoCommandHandler {
    canHandle(options: AutoCommandOptions): boolean;
    execute(issueNumber: number, options: AutoCommandOptions): Promise<CommandResult>;
}
export declare function outputResult(data: CommandResult, options: AutoCommandOptions): void;
export declare class StatusCommandHandler implements AutoCommandHandler {
    canHandle(options: AutoCommandOptions): boolean;
    execute(_issueNumber: number, _options: AutoCommandOptions): Promise<CommandResult>;
}
export declare class ParseOnlyCommandHandler implements AutoCommandHandler {
    canHandle(options: AutoCommandOptions): boolean;
    execute(issueNumber: number, _options: AutoCommandOptions): Promise<CommandResult>;
}
export declare class InitSessionCommandHandler implements AutoCommandHandler {
    canHandle(options: AutoCommandOptions): boolean;
    execute(issueNumber: number, _options: AutoCommandOptions): Promise<CommandResult>;
}
export declare class CommandRouter {
    private handlers;
    route(issueNumber: number, options: AutoCommandOptions): Promise<CommandResult>;
}
//# sourceMappingURL=command-handlers.d.ts.map
/**
 * Auto workflow state management with filesystem-independent interface
 */
export interface AutoWorkflowState {
    issue: number;
    totalACs: number;
    currentAC: number;
    currentPhase: 'START' | 'RED' | 'GREEN' | 'REFACTOR' | 'COVER' | 'DOCUMENT';
    status: 'running' | 'completed' | 'failed';
    createdAt: string;
    updatedAt: string;
}
export interface StateManager {
    save(state: AutoWorkflowState): Promise<void>;
    load(): Promise<AutoWorkflowState | null>;
    exists(): Promise<boolean>;
    clear(): Promise<void>;
}
/**
 * Filesystem-based state manager implementation
 */
export declare class FileSystemStateManager implements StateManager {
    private readonly stateFile;
    save(state: AutoWorkflowState): Promise<void>;
    load(): Promise<AutoWorkflowState | null>;
    exists(): Promise<boolean>;
    clear(): Promise<void>;
}
/**
 * Auto workflow state service
 */
export declare class AutoWorkflowStateService {
    private stateManager;
    constructor(stateManager?: StateManager);
    initializeState(issue: number, totalACs: number): Promise<AutoWorkflowState>;
    getCurrentState(): Promise<AutoWorkflowState | null>;
    updatePhase(phase: AutoWorkflowState['currentPhase']): Promise<void>;
    moveToNextAC(): Promise<void>;
    markFailed(): Promise<void>;
    clearState(): Promise<void>;
    hasActiveWorkflow(): Promise<boolean>;
}
//# sourceMappingURL=auto-state.d.ts.map
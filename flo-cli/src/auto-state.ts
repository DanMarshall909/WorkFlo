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
export class FileSystemStateManager implements StateManager {
  private readonly stateFile = '.auto-workflow-state.json';

  async save(state: AutoWorkflowState): Promise<void> {
    const fs = await import('fs/promises');
    const updatedState = {
      ...state,
      updatedAt: new Date().toISOString()
    };
    await fs.writeFile(this.stateFile, JSON.stringify(updatedState, null, 2));
  }

  async load(): Promise<AutoWorkflowState | null> {
    try {
      const fs = await import('fs/promises');
      const content = await fs.readFile(this.stateFile, 'utf-8');
      return JSON.parse(content) as AutoWorkflowState;
    } catch (error: unknown) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        return null; // File doesn't exist
      }
      throw error;
    }
  }

  async exists(): Promise<boolean> {
    try {
      const fs = await import('fs/promises');
      await fs.access(this.stateFile);
      return true;
    } catch {
      return false;
    }
  }

  async clear(): Promise<void> {
    try {
      const fs = await import('fs/promises');
      await fs.unlink(this.stateFile);
    } catch (error: unknown) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        return; // File already doesn't exist
      }
      throw error;
    }
  }
}

/**
 * Auto workflow state service
 */
export class AutoWorkflowStateService {
  constructor(private stateManager: StateManager = new FileSystemStateManager()) {}

  async initializeState(issue: number, totalACs: number): Promise<AutoWorkflowState> {
    const state: AutoWorkflowState = {
      issue,
      totalACs,
      currentAC: 1,
      currentPhase: 'START',
      status: 'running',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await this.stateManager.save(state);
    return state;
  }

  async getCurrentState(): Promise<AutoWorkflowState | null> {
    return await this.stateManager.load();
  }

  async updatePhase(phase: AutoWorkflowState['currentPhase']): Promise<void> {
    const state = await this.getCurrentState();
    if (state) {
      state.currentPhase = phase;
      await this.stateManager.save(state);
    }
  }

  async moveToNextAC(): Promise<void> {
    const state = await this.getCurrentState();
    if (state) {
      state.currentAC += 1;
      state.currentPhase = 'START';
      
      if (state.currentAC > state.totalACs) {
        state.status = 'completed';
      }
      
      await this.stateManager.save(state);
    }
  }

  async markFailed(): Promise<void> {
    const state = await this.getCurrentState();
    if (state) {
      state.status = 'failed';
      await this.stateManager.save(state);
    }
  }

  async clearState(): Promise<void> {
    await this.stateManager.clear();
  }

  async hasActiveWorkflow(): Promise<boolean> {
    return await this.stateManager.exists();
  }
}
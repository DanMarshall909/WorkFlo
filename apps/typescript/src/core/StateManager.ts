import { existsSync, readFileSync, writeFileSync, unlinkSync } from 'fs';

export interface TddState {
  ISSUE: string;
  CRITERIA: number;
  PHASE: 'START' | 'RED' | 'GREEN' | 'REFACTOR' | 'COVER';
  TOTAL: number;
}

export class StateManager {
  private readonly stateFile: string;

  constructor(stateFile: string = '.tdd-state') {
    this.stateFile = stateFile;
  }

  hasActiveSession(): boolean {
    return existsSync(this.stateFile);
  }

  loadState(): TddState | null {
    if (!existsSync(this.stateFile)) {
      return null;
    }

    try {
      const stateContent = readFileSync(this.stateFile, 'utf8');
      const state: any = {};
      
      stateContent.split('\n').forEach(line => {
        const match = line.match(/^(\w+)=(.+)$/);
        if (match) {
          const [, key, value] = match;
          const numValue = Number(value);
          state[key] = isNaN(numValue) ? value : numValue;
        }
      });
      
      // Validate required fields
      if (state.ISSUE && typeof state.CRITERIA === 'number' && 
          state.PHASE && typeof state.TOTAL === 'number') {
        return state as TddState;
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  saveState(state: TddState): void {
    const stateContent = `ISSUE=${state.ISSUE}
CRITERIA=${state.CRITERIA}
PHASE=${state.PHASE}
TOTAL=${state.TOTAL}
`;
    writeFileSync(this.stateFile, stateContent);
  }

  clearState(): void {
    if (existsSync(this.stateFile)) {
      unlinkSync(this.stateFile);
    }
  }

  updateCriteria(criteria: number): void {
    const state = this.loadState();
    if (state) {
      state.CRITERIA = criteria;
      this.saveState(state);
    }
  }

  updatePhase(phase: TddState['PHASE']): void {
    const state = this.loadState();
    if (state) {
      state.PHASE = phase;
      this.saveState(state);
    }
  }

  getCurrentCriteria(): number | null {
    const state = this.loadState();
    return state?.CRITERIA ?? null;
  }

  getCurrentPhase(): TddState['PHASE'] | null {
    const state = this.loadState();
    return state?.PHASE ?? null;
  }

  getCurrentIssue(): string | null {
    const state = this.loadState();
    return state?.ISSUE ?? null;
  }

  getTotalCriteria(): number | null {
    const state = this.loadState();
    return state?.TOTAL ?? null;
  }

  isComplete(): boolean {
    const state = this.loadState();
    if (!state) return false;
    return state.CRITERIA > state.TOTAL;
  }
}
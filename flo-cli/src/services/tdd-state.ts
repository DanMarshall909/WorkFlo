import { existsSync, readFileSync, writeFileSync, unlinkSync } from 'fs';

export type TddPhase = 'START' | 'RED' | 'GREEN' | 'REFACTOR' | 'COVER';

export interface TddState {
  issue: number;
  criteria: number;
  phase: TddPhase;
  total: number;
}

export class TddStateService {
  private static readonly STATE_FILE = '.tdd-state';

  static loadState(): TddState | null {
    if (!existsSync(this.STATE_FILE)) {
      return null;
    }

    try {
      const content = readFileSync(this.STATE_FILE, 'utf-8');
      const lines = content.trim().split('\n');
      const state: Partial<TddState> = {};

      for (const line of lines) {
        const [key, value] = line.split('=');
        if (!key || !value) continue;
        switch (key) {
          case 'ISSUE':
            state.issue = parseInt(value!);
            break;
          case 'CRITERIA':
            state.criteria = parseInt(value!);
            break;
          case 'PHASE':
            state.phase = value! as TddPhase;
            break;
          case 'TOTAL':
            state.total = parseInt(value!);
            break;
        }
      }

      // Validate required fields
      if (state.issue && state.criteria && state.phase && state.total) {
        return state as TddState;
      }

      return null;
    } catch {
      return null;
    }
  }

  static saveState(state: TddState): void {
    const content = [
      `ISSUE=${state.issue}`,
      `CRITERIA=${state.criteria}`,
      `PHASE=${state.phase}`,
      `TOTAL=${state.total}`
    ].join('\n');

    writeFileSync(this.STATE_FILE, content);
  }

  static clearState(): void {
    if (existsSync(this.STATE_FILE)) {
      unlinkSync(this.STATE_FILE);
    }
  }

  static getCurrentIssue(): number | null {
    const state = this.loadState();
    return state?.issue || null;
  }

  static updatePhase(newPhase: TddPhase): void {
    const state = this.loadState();
    if (state) {
      state.phase = newPhase;
      this.saveState(state);
    }
  }

  static nextCriteria(): boolean {
    const state = this.loadState();
    if (!state) {
      return false;
    }

    state.criteria++;
    if (state.criteria > state.total) {
      return false; // All criteria completed
    }

    state.phase = 'START';
    this.saveState(state);
    return true;
  }
}
// Functional state management

import { existsSync, readFileSync, writeFileSync, unlinkSync } from 'fs';
import { TddState, TddPhase, Result, Ok, Err } from './types';

export const parseStateContent = (content: string): Partial<TddState> => {
  const state: any = {};
  
  content.split('\n').forEach(line => {
    const match = line.match(/^(\w+)=(.+)$/);
    if (match) {
      const [, key, value] = match;
      const numValue = Number(value);
      state[key] = isNaN(numValue) ? value : numValue;
    }
  });
  
  return state;
};

export const validateState = (partial: Partial<TddState>): Result<TddState> => {
  if (!partial.issue || typeof partial.criteria !== 'number' || 
      !partial.phase || typeof partial.total !== 'number') {
    return Err(new Error('Invalid state format'));
  }
  
  return Ok(partial as TddState);
};

export const loadState = (stateFile: string): Result<TddState | null> => {
  try {
    if (!existsSync(stateFile)) {
      return Ok(null);
    }

    const content = readFileSync(stateFile, 'utf8');
    const parsed = parseStateContent(content);
    const validationResult = validateState(parsed);
    
    if (validationResult.success) {
      return Ok(validationResult.data);
    } else {
      return Ok(null); // Invalid state treated as no state
    }
  } catch (error) {
    return Err(new Error(`Failed to load state: ${error}`));
  }
};

export const formatStateForSave = (state: TddState): string => {
  return `ISSUE=${state.issue}
CRITERIA=${state.criteria}
PHASE=${state.phase}
TOTAL=${state.total}
`;
};

export const saveState = (stateFile: string, state: TddState): Result<void> => {
  try {
    const content = formatStateForSave(state);
    writeFileSync(stateFile, content);
    return Ok(undefined);
  } catch (error) {
    return Err(new Error(`Failed to save state: ${error}`));
  }
};

export const clearState = (stateFile: string): Result<void> => {
  try {
    if (existsSync(stateFile)) {
      unlinkSync(stateFile);
    }
    return Ok(undefined);
  } catch (error) {
    return Err(new Error(`Failed to clear state: ${error}`));
  }
};

export const hasActiveSession = (stateFile: string): boolean => {
  return existsSync(stateFile);
};

// State transformation functions
export const updateCriteria = (state: TddState, criteria: number): TddState => {
  return { ...state, criteria };
};

export const updatePhase = (state: TddState, phase: TddPhase): TddState => {
  return { ...state, phase };
};

export const nextCriteria = (state: TddState): TddState => {
  return { ...state, criteria: state.criteria + 1, phase: 'START' };
};

export const isComplete = (state: TddState): boolean => {
  return state.criteria > state.total;
};

// State pipeline functions  
export const fromFile = (stateFile: string) => (): Result<TddState | null> => {
  return loadState(stateFile);
};

export const toFile = (stateFile: string) => (state: TddState): Result<TddState> => {
  const saveResult = saveState(stateFile, state);
  return saveResult.success ? Ok(state) : saveResult;
};

export const requireActive = (state: TddState | null): Result<TddState> => {
  if (!state) {
    return Err(new Error('No active TDD session. Run: tdd start <issue>'));
  }
  return Ok(state);
};

export const createInitialState = (issue: string, total: number): TddState => {
  return {
    issue,
    criteria: 1,
    phase: 'START',
    total
  };
};
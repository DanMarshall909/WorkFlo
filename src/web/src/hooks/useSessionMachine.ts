/**
 * useSessionMachine Hook - State Machine for Session Management
 * 
 * Implements a useReducer-based state machine for session timer states.
 * Follows the state pattern: idle → active → paused → completed
 */

import { useReducer, useCallback } from 'react';

// Session state types
export type SessionState = 'idle' | 'active' | 'paused' | 'completed';

// Session machine actions
export type SessionAction = 
  | { type: 'START' }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'COMPLETE' }
  | { type: 'RESET' };

// Session machine state shape
export interface SessionMachineState {
  state: SessionState;
  startTime?: Date;
  pausedTime?: Date;
  duration: number; // in milliseconds
}

// Initial state
const initialState: SessionMachineState = {
  state: 'idle',
  duration: 0,
};

// Session machine reducer
function sessionMachineReducer(
  state: SessionMachineState, 
  action: SessionAction
): SessionMachineState {
  switch (action.type) {
    case 'START':
      if (state.state !== 'idle') return state;
      return {
        ...state,
        state: 'active',
        startTime: new Date(),
        pausedTime: undefined,
      };

    case 'PAUSE':
      if (state.state !== 'active') return state;
      return {
        ...state,
        state: 'paused',
        pausedTime: new Date(),
      };

    case 'RESUME':
      if (state.state !== 'paused') return state;
      return {
        ...state,
        state: 'active',
        pausedTime: undefined,
      };

    case 'COMPLETE':
      if (state.state !== 'active') return state;
      return {
        ...state,
        state: 'completed',
      };

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}

// Hook return type
export interface UseSessionMachine {
  state: SessionState;
  canStart: boolean;
  canPause: boolean;
  canResume: boolean;
  canComplete: boolean;
  canReset: boolean;
  start: () => void;
  pause: () => void;
  resume: () => void;
  complete: () => void;
  reset: () => void;
  duration: number;
  startTime?: Date;
  pausedTime?: Date;
}

/**
 * useSessionMachine Hook
 * 
 * Provides state machine functionality for session timer management.
 * Uses useReducer for predictable state transitions and useCallback for optimized actions.
 */
export function useSessionMachine(): UseSessionMachine {
  const [sessionState, dispatch] = useReducer(sessionMachineReducer, initialState);

  // Optimized action creators using useCallback
  const start = useCallback(() => dispatch({ type: 'START' }), []);
  const pause = useCallback(() => dispatch({ type: 'PAUSE' }), []);
  const resume = useCallback(() => dispatch({ type: 'RESUME' }), []);
  const complete = useCallback(() => dispatch({ type: 'COMPLETE' }), []);
  const reset = useCallback(() => dispatch({ type: 'RESET' }), []);

  // Computed state properties (derived state)
  const canStart = sessionState.state === 'idle';
  const canPause = sessionState.state === 'active';
  const canResume = sessionState.state === 'paused';
  const canComplete = sessionState.state === 'active';
  const canReset = sessionState.state !== 'idle';

  return {
    state: sessionState.state,
    canStart,
    canPause,
    canResume,
    canComplete,
    canReset,
    start,
    pause,
    resume,
    complete,
    reset,
    duration: sessionState.duration,
    startTime: sessionState.startTime,
    pausedTime: sessionState.pausedTime,
  };
}
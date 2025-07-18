/**
 * SessionTimer - Pure Display Component
 * 
 * Pure functional component for displaying session timer state
 * No internal state - receives all data via props
 * Optimized with React.memo and memoized calculations
 */

import React, { useMemo } from 'react';
import { SessionState } from '../../lib/types/session';

export interface SessionTimerProps {
  elapsedTime: number;
  remainingTime: number;
  isRunning: boolean;
  state: SessionState;
}

/**
 * Formats milliseconds to MM:SS format
 */
const formatTime = (milliseconds: number): string => {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * Gets display message based on timer state
 */
const getStateMessage = (state: SessionState): string => {
  switch (state) {
    case SessionState.IDLE:
      return 'Ready to start';
    case SessionState.ACTIVE:
      return 'In Progress';
    case SessionState.PAUSED:
      return 'Paused';
    case SessionState.COMPLETED:
      return 'Completed!';
    default:
      return 'Ready to start';
  }
};

/**
 * SessionTimer Component
 * 
 * Pure functional component that displays timer state
 * Uses existing session types for consistency
 * Optimized with React.memo and useMemo for expensive calculations
 */
const SessionTimerComponent: React.FC<SessionTimerProps> = ({
  elapsedTime,
  remainingTime,
  isRunning,
  state,
}) => {
  // Memoize expensive time formatting calculation
  const displayTime = useMemo(() => {
    if (state === SessionState.IDLE || state === SessionState.COMPLETED) {
      return '00:00';
    }
    return formatTime(remainingTime);
  }, [remainingTime, state]);

  // Memoize state message calculation
  const stateMessage = useMemo(() => getStateMessage(state), [state]);

  return (
    <div className="text-center">
      <div className="text-4xl font-mono font-bold mb-2">
        {displayTime}
      </div>
      <div className="text-lg text-gray-600">
        {stateMessage}
      </div>
    </div>
  );
};

/**
 * Export with React.memo for performance optimization
 * Only re-renders when props actually change
 */
export const SessionTimer = React.memo(SessionTimerComponent);
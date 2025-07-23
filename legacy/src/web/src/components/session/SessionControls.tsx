/**
 * SessionControls - Pure Control Component
 * 
 * Pure functional component for session control buttons
 * No internal state - receives all callbacks via props
 * Optimized with React.memo and useCallback for performance
 */

import React, { useCallback, useMemo } from 'react';
import { SessionState } from '../../lib/types/session';

export interface SessionControlsProps {
  state: SessionState;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}

/**
 * Common button styling for consistency
 */
const baseButtonClasses = "px-4 py-2 text-white rounded font-medium transition-colors";

/**
 * Button variants for different actions
 */
const buttonVariants = {
  primary: "bg-blue-500 hover:bg-blue-600",
  warning: "bg-yellow-500 hover:bg-yellow-600",
} as const;

/**
 * SessionControls Component
 * 
 * Pure functional component that provides session control buttons
 * Uses external state management for all session operations
 * Optimized with React.memo and memoized button rendering
 */
const SessionControlsComponent: React.FC<SessionControlsProps> = ({
  state,
  onStart,
  onPause,
  onResume,
  onStop,
}) => {
  // Memoize button rendering function to prevent recreation on each render
  const renderButton = useCallback((
    text: string, 
    onClick: () => void, 
    variant: keyof typeof buttonVariants = 'primary'
  ) => (
    <button
      onClick={onClick}
      className={`${baseButtonClasses} ${buttonVariants[variant]}`}
    >
      {text}
    </button>
  ), []);

  // Memoize the buttons to render based on current state
  const buttonsToRender = useMemo(() => {
    const buttons: JSX.Element[] = [];
    
    if (state === SessionState.IDLE) {
      buttons.push(<button key="start" onClick={onStart} className={`${baseButtonClasses} ${buttonVariants.primary}`}>Start</button>);
    }
    if (state === SessionState.ACTIVE) {
      buttons.push(<button key="pause" onClick={onPause} className={`${baseButtonClasses} ${buttonVariants.warning}`}>Pause</button>);
    }
    if (state === SessionState.PAUSED) {
      buttons.push(<button key="resume" onClick={onResume} className={`${baseButtonClasses} ${buttonVariants.primary}`}>Resume</button>);
    }
    
    return buttons;
  }, [state, onStart, onPause, onResume]);

  return (
    <div className="flex gap-2 justify-center">
      {buttonsToRender}
    </div>
  );
};

/**
 * Export with React.memo for performance optimization
 * Only re-renders when props actually change
 */
export const SessionControls = React.memo(SessionControlsComponent);
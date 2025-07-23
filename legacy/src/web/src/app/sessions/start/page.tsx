/**
 * Sessions Start Page
 * 
 * Page for starting new focus sessions with timer interface
 * Integrates session timer components with page-level state management
 */

'use client';

import React, { useState } from 'react';
import { SessionTimer } from '../../../components/session/SessionTimer';
import { SessionControls } from '../../../components/session/SessionControls';
import { DurationSelector } from '../../../components/session/DurationSelector';
import { SessionState } from '../../../lib/types/session';

export default function SessionsStartPage() {
  const [selectedDuration, setSelectedDuration] = useState(25);
  const [sessionState, setSessionState] = useState(SessionState.IDLE);
  
  // Calculate time values for display
  const durationMs = selectedDuration * 60 * 1000;
  const elapsedTime = 0;
  const remainingTime = durationMs;

  const handleStart = () => {
    setSessionState(SessionState.ACTIVE);
  };

  const handlePause = () => {
    setSessionState(SessionState.PAUSED);
  };

  const handleResume = () => {
    setSessionState(SessionState.ACTIVE);
  };

  const handleStop = () => {
    setSessionState(SessionState.IDLE);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto space-y-8">
        <h1 className="text-2xl font-bold text-center">Start Focus Session</h1>
        
        <div className="space-y-6">
          <DurationSelector
            selectedDuration={selectedDuration}
            onDurationChange={setSelectedDuration}
          />
          
          <SessionTimer
            elapsedTime={elapsedTime}
            remainingTime={remainingTime}
            isRunning={sessionState === SessionState.ACTIVE}
            state={sessionState}
          />
          
          <SessionControls
            state={sessionState}
            onStart={handleStart}
            onPause={handlePause}
            onResume={handleResume}
            onStop={handleStop}
          />
        </div>
      </div>
    </div>
  );
}
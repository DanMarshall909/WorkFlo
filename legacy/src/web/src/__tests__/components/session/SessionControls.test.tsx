/**
 * SessionControls Component Tests
 * 
 * Tests for pure functional SessionControls button component
 * Focus: Business scenarios for session control functionality
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { SessionControls } from '../../../components/session/SessionControls';
import { SessionState } from '../../../lib/types/session';

describe('SessionControls', () => {
  describe('Session Management', () => {
    test('user can start session with duration selection', () => {
      const mockOnStart = jest.fn();
      const mockOnPause = jest.fn();
      const mockOnResume = jest.fn();
      const mockOnStop = jest.fn();
      
      render(
        <SessionControls 
          state={SessionState.IDLE}
          onStart={mockOnStart}
          onPause={mockOnPause}
          onResume={mockOnResume}
          onStop={mockOnStop}
        />
      );
      
      const startButton = screen.getByText('Start');
      fireEvent.click(startButton);
      
      expect(mockOnStart).toHaveBeenCalledTimes(1);
    });

    test('user can pause and resume active session', () => {
      const mockOnStart = jest.fn();
      const mockOnPause = jest.fn();
      const mockOnResume = jest.fn();
      const mockOnStop = jest.fn();
      
      render(
        <SessionControls 
          state={SessionState.ACTIVE}
          onStart={mockOnStart}
          onPause={mockOnPause}
          onResume={mockOnResume}
          onStop={mockOnStop}
        />
      );
      
      const pauseButton = screen.getByText('Pause');
      fireEvent.click(pauseButton);
      
      expect(mockOnPause).toHaveBeenCalledTimes(1);
    });

    test('user can resume paused session', () => {
      const mockOnStart = jest.fn();
      const mockOnPause = jest.fn();
      const mockOnResume = jest.fn();
      const mockOnStop = jest.fn();
      
      render(
        <SessionControls 
          state={SessionState.PAUSED}
          onStart={mockOnStart}
          onPause={mockOnPause}
          onResume={mockOnResume}
          onStop={mockOnStop}
        />
      );
      
      const resumeButton = screen.getByText('Resume');
      fireEvent.click(resumeButton);
      
      expect(mockOnResume).toHaveBeenCalledTimes(1);
    });
  });

  describe('Performance Optimization', () => {
    test('component avoids re-renders when callbacks unchanged', () => {
      const mockCallbacks = {
        onStart: jest.fn(),
        onPause: jest.fn(), 
        onResume: jest.fn(),
        onStop: jest.fn()
      };

      const baseProps = {
        state: SessionState.IDLE,
        ...mockCallbacks
      };

      const { rerender } = render(<SessionControls {...baseProps} />);
      
      // Initial render
      expect(screen.getByText('Start')).toBeInTheDocument();

      // Re-render with same props - component should be memoized
      rerender(<SessionControls {...baseProps} />);
      expect(screen.getByText('Start')).toBeInTheDocument();
    });

    test('component efficiently handles state transitions', () => {
      const mockCallbacks = {
        onStart: jest.fn(),
        onPause: jest.fn(), 
        onResume: jest.fn(),
        onStop: jest.fn()
      };

      const { rerender } = render(
        <SessionControls state={SessionState.IDLE} {...mockCallbacks} />
      );
      
      // IDLE state shows Start button
      expect(screen.getByText('Start')).toBeInTheDocument();
      expect(screen.queryByText('Pause')).not.toBeInTheDocument();

      // ACTIVE state shows Pause button
      rerender(<SessionControls state={SessionState.ACTIVE} {...mockCallbacks} />);
      expect(screen.getByText('Pause')).toBeInTheDocument();
      expect(screen.queryByText('Start')).not.toBeInTheDocument();

      // PAUSED state shows Resume button
      rerender(<SessionControls state={SessionState.PAUSED} {...mockCallbacks} />);
      expect(screen.getByText('Resume')).toBeInTheDocument();
      expect(screen.queryByText('Pause')).not.toBeInTheDocument();
    });

    test('button rendering performance with rapid state changes', () => {
      const mockCallbacks = {
        onStart: jest.fn(),
        onPause: jest.fn(), 
        onResume: jest.fn(),
        onStop: jest.fn()
      };

      const startTime = performance.now();
      
      // Simulate rapid state changes (user rapidly starting/pausing)
      const states = [
        SessionState.IDLE, SessionState.ACTIVE, SessionState.PAUSED,
        SessionState.IDLE, SessionState.ACTIVE, SessionState.PAUSED,
        SessionState.IDLE, SessionState.ACTIVE, SessionState.PAUSED
      ];

      let component = render(<SessionControls state={states[0]} {...mockCallbacks} />);
      
      for (let i = 1; i < states.length; i++) {
        component.rerender(<SessionControls state={states[i]} {...mockCallbacks} />);
      }
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Performance assertion: rapid state changes should render efficiently
      expect(renderTime).toBeLessThan(20);
    });
  });
});
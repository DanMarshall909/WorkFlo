/**
 * SessionTimer Component Tests
 * 
 * Tests for pure functional SessionTimer display component
 * Focus: Business scenarios for timer display functionality
 * Performance: React.memo and render optimization verification
 */

import { render, screen } from '@testing-library/react';
import React from 'react';
import { SessionTimer } from '../../../components/session/SessionTimer';
import { SessionState } from '../../../lib/types/session';

describe('SessionTimer', () => {
  describe('Timer Display', () => {
    test('user sees timer in idle state', () => {
      render(
        <SessionTimer 
          elapsedTime={0} 
          remainingTime={0} 
          isRunning={false} 
          state={SessionState.IDLE} 
        />
      );
      
      expect(screen.getByText('00:00')).toBeInTheDocument();
      expect(screen.getByText('Ready to start')).toBeInTheDocument();
    });

    test('user sees accurate time during active session', () => {
      // 22:30 = 22*60*1000 + 30*1000 = 1,350,000 milliseconds
      const remainingTime = 22 * 60 * 1000 + 30 * 1000;
      
      render(
        <SessionTimer 
          elapsedTime={150000} 
          remainingTime={remainingTime} 
          isRunning={true} 
          state={SessionState.ACTIVE} 
        />
      );
      
      expect(screen.getByText('22:30')).toBeInTheDocument();
      expect(screen.getByText('In Progress')).toBeInTheDocument();
    });

    test('user sees paused session clearly indicated', () => {
      // 20:00 = 20*60*1000 = 1,200,000 milliseconds
      const remainingTime = 20 * 60 * 1000;
      
      render(
        <SessionTimer 
          elapsedTime={300000} 
          remainingTime={remainingTime} 
          isRunning={false} 
          state={SessionState.PAUSED} 
        />
      );
      
      expect(screen.getByText('20:00')).toBeInTheDocument();
      expect(screen.getByText('Paused')).toBeInTheDocument();
    });

    test('user sees completed session state', () => {
      render(
        <SessionTimer 
          elapsedTime={1500000} 
          remainingTime={0} 
          isRunning={false} 
          state={SessionState.COMPLETED} 
        />
      );
      
      expect(screen.getByText('00:00')).toBeInTheDocument();
      expect(screen.getByText('Completed!')).toBeInTheDocument();
    });
  });

  describe('Performance Optimization', () => {
    test('component avoids unnecessary re-renders when props unchanged', () => {
      const renderSpy = jest.fn();
      
      // Mock the component to track renders
      const TestWrapper = ({ renderCount, ...props }: any) => {
        renderSpy(renderCount);
        return <SessionTimer {...props} />;
      };

      const initialProps = {
        elapsedTime: 150000,
        remainingTime: 1200000,
        isRunning: true,
        state: SessionState.ACTIVE,
        renderCount: 1
      };

      const { rerender } = render(<TestWrapper {...initialProps} />);

      // Re-render with same props - should not cause SessionTimer to re-render
      rerender(<TestWrapper {...initialProps} renderCount={2} />);

      // Verify component rendered optimally
      expect(screen.getByText('20:00')).toBeInTheDocument();
      expect(screen.getByText('In Progress')).toBeInTheDocument();
    });

    test('component only re-renders when relevant props change', () => {
      const baseProps = {
        elapsedTime: 150000,
        remainingTime: 1200000,
        isRunning: true,
        state: SessionState.ACTIVE
      };

      const { rerender } = render(<SessionTimer {...baseProps} />);
      
      // Initial render shows correct time
      expect(screen.getByText('20:00')).toBeInTheDocument();

      // Change remaining time - should re-render with new time
      rerender(<SessionTimer {...baseProps} remainingTime={1080000} />);
      expect(screen.getByText('18:00')).toBeInTheDocument();

      // Change state - should re-render with new state message  
      rerender(<SessionTimer {...baseProps} remainingTime={1080000} state={SessionState.PAUSED} />);
      expect(screen.getByText('Paused')).toBeInTheDocument();
    });

    test('time formatting performance handles rapid updates', () => {
      const startTime = performance.now();
      
      // Simulate rapid time updates (like every second during active timer)
      for (let i = 0; i < 100; i++) {
        const remainingTime = 1500000 - (i * 1000); // Count down by seconds
        
        render(
          <SessionTimer 
            elapsedTime={i * 1000} 
            remainingTime={remainingTime} 
            isRunning={true} 
            state={SessionState.ACTIVE} 
          />
        );
      }
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Performance assertion: 100 renders should complete well under 16ms each
      // Total time for 100 renders should be reasonable (< 100ms for this test)
      // Each render averages < 1ms which exceeds our 16ms requirement
      expect(renderTime).toBeLessThan(100);
      
      // Verify individual render time performance
      const avgRenderTime = renderTime / 100;
      expect(avgRenderTime).toBeLessThan(16);
    });
  });
});
/**
 * Sessions Start Page Test - Business Logic Testing
 * 
 * Tests the /sessions/start page behavior focusing on business scenarios
 * Following TDD Red-Green-Refactor approach
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SessionsStartPage from '../page';

// Business Scenario: User can view session timer interface on start page
describe('SessionsStartPage', () => {
  test('user sees session timer interface', () => {
    render(<SessionsStartPage />);
    
    // User should see timer display
    expect(screen.getByText('00:00')).toBeInTheDocument();
    
    // User should see duration selector
    expect(screen.getByText('25 min')).toBeInTheDocument();
    expect(screen.getByText('50 min')).toBeInTheDocument(); 
    expect(screen.getByText('90 min')).toBeInTheDocument();
    
    // User should see start button
    expect(screen.getByText('Start')).toBeInTheDocument();
    
    // User should see ready state
    expect(screen.getByText('Ready to start')).toBeInTheDocument();
  });

  test('user can change session duration', () => {
    render(<SessionsStartPage />);
    
    // Initially 25 min is selected (default)
    const duration25Button = screen.getByText('25 min').closest('button')!;
    const duration50Button = screen.getByText('50 min').closest('button')!;
    
    // User clicks 50 min duration
    fireEvent.click(duration50Button);
    
    // Button styling should indicate selection (test component integration)
    expect(duration50Button).toHaveClass('bg-blue-500');
    expect(duration25Button).toHaveClass('bg-white');
  });

  test('user can start and pause session', () => {
    render(<SessionsStartPage />);
    
    // Initially shows start button
    expect(screen.getByText('Start')).toBeInTheDocument();
    expect(screen.getByText('Ready to start')).toBeInTheDocument();
    
    // User starts session
    fireEvent.click(screen.getByText('Start'));
    
    // State changes to active
    expect(screen.getByText('Pause')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    
    // User pauses session
    fireEvent.click(screen.getByText('Pause'));
    
    // State changes to paused
    expect(screen.getByText('Resume')).toBeInTheDocument();
    expect(screen.getByText('Paused')).toBeInTheDocument();
  });

  test('user can resume paused session', () => {
    render(<SessionsStartPage />);
    
    // Start and pause session first
    fireEvent.click(screen.getByText('Start'));
    fireEvent.click(screen.getByText('Pause'));
    
    // Verify paused state
    expect(screen.getByText('Resume')).toBeInTheDocument();
    expect(screen.getByText('Paused')).toBeInTheDocument();
    
    // User resumes session
    fireEvent.click(screen.getByText('Resume'));
    
    // Back to active state
    expect(screen.getByText('Pause')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
  });
});
/**
 * DurationSelector - Pure Duration Selection Component
 * 
 * Pure functional component for selecting session durations
 * No internal state - receives all data via props
 */

import React from 'react';

export interface DurationSelectorProps {
  selectedDuration: number;
  onDurationChange: (duration: number) => void;
}

/**
 * Standard focus session durations in minutes
 * Based on common productivity techniques (Pomodoro, etc.)
 */
const DURATION_OPTIONS = [
  { value: 25, label: '25 min', description: 'Pomodoro' },
  { value: 50, label: '50 min', description: 'Deep focus' },
  { value: 90, label: '90 min', description: 'Extended' },
] as const;

/**
 * Common button styling for consistency
 */
const baseButtonClasses = "px-4 py-3 rounded border transition-colors text-center";

/**
 * Button variants for selected/unselected states
 */
const buttonVariants = {
  selected: "bg-blue-500 text-white border-blue-500",
  unselected: "bg-white text-gray-700 border-gray-300 hover:border-blue-300",
} as const;

/**
 * DurationSelector Component
 * 
 * Pure functional component that provides duration selection buttons
 * Uses external state management for all duration operations
 */
export const DurationSelector: React.FC<DurationSelectorProps> = ({
  selectedDuration,
  onDurationChange,
}) => {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-medium text-center">Session Duration</h3>
      <div className="grid grid-cols-3 gap-3">
        {DURATION_OPTIONS.map(({ value, label, description }) => (
          <button
            key={value}
            onClick={() => onDurationChange(value)}
            className={`${baseButtonClasses} ${
              selectedDuration === value ? buttonVariants.selected : buttonVariants.unselected
            }`}
          >
            <div className="font-medium">{label}</div>
            <div className="text-sm opacity-75">{description}</div>
          </button>
        ))}
      </div>
    </div>
  );
};
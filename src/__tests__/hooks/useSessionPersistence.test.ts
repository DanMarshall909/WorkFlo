/**
 * useSessionPersistence Tests - Business Rules Only
 */

import { renderHook, act } from '@testing-library/react';
import { useSessionPersistence } from '../../hooks/useSessionPersistence';

// Mock localStorage for business rule testing
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

describe('useSessionPersistence - Business Rules', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Data Loss Prevention', () => {
    it('should save session data to prevent loss during interruptions', () => {
      const { result } = renderHook(() => 
        useSessionPersistence({ key: 'session-data', debounceMs: 0 })
      );

      const sessionData = {
        id: 'session-123',
        title: 'Important Work',
        elapsedTime: 1500000, // 25 minutes
        state: 'active'
      };

      act(() => {
        result.current.save(sessionData);
      });

      // Business Rule: Session data is persisted to prevent loss
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'session-data',
        JSON.stringify(sessionData)
      );
    });

    it('should load persisted session data after page refresh', () => {
      const persistedData = {
        id: 'session-123',
        title: 'Recovered Work',
        elapsedTime: 900000, // 15 minutes
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(persistedData));

      const { result } = renderHook(() => 
        useSessionPersistence({ key: 'session-data' })
      );

      const loadedData = result.current.load();

      // Business Rule: Previously saved session can be recovered
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('session-data');
      expect(loadedData).toEqual(persistedData);
    });

    it('should clear session data when session ends', () => {
      const { result } = renderHook(() => 
        useSessionPersistence({ key: 'session-data' })
      );

      act(() => {
        result.current.clear();
      });

      // Business Rule: Session data is cleared when no longer needed
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('session-data');
    });
  });

  describe('Error Recovery', () => {
    it('should handle corrupted data gracefully', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid-json{');

      const { result } = renderHook(() => 
        useSessionPersistence({ key: 'session-data' })
      );

      const loadedData = result.current.load();

      // Business Rule: Corrupted data doesn't crash the application
      expect(loadedData).toBeNull();
    });

    it('should handle storage errors gracefully', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      const { result } = renderHook(() => 
        useSessionPersistence({ key: 'session-data', debounceMs: 0 })
      );

      expect(() => {
        act(() => {
          result.current.save({ test: 'data' });
        });
      }).not.toThrow();

      // Business Rule: Storage errors don't crash the application
    });
  });
});
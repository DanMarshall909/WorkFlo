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

describe('useSessionPersistence', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Data Persistence', () => {
    describe('preventing data loss', () => {
      it('user data survives interruptions', (done) => {
        const { result } = renderHook(() => 
          useSessionPersistence({ key: 'session-data', debounceMs: 10 })
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

      // Business Rule: Session data is persisted to prevent loss (after debounce)
      setTimeout(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'session-data',
          JSON.stringify(sessionData)
        );
        done();
      }, 20);
    });

    it('user session continues after page refresh', () => {
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

    it('user privacy protected when session ends', () => {
      const { result } = renderHook(() => 
        useSessionPersistence({ key: 'session-data' })
      );

      act(() => {
        result.current.remove();
      });

      // Business Rule: Session data is cleared when no longer needed
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('session-data');
    });

    it('user experience unaffected by missing data', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const { result } = renderHook(() => 
        useSessionPersistence({ key: 'session-data' })
      );

      const loadedData = result.current.load();

      // Business Rule: Missing data returns null (no crash)
      expect(loadedData).toBeNull();
    });

    it('user can control data persistence', () => {
      const { result } = renderHook(() => 
        useSessionPersistence({ key: 'session-data', enabled: false })
      );

      act(() => {
        result.current.save({ test: 'data' });
      });

      // Business Rule: When disabled, no data should be saved
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();

      const loadedData = result.current.load();
      // Business Rule: When disabled, always return null
      expect(loadedData).toBeNull();
    });

    it('user knows if persistence available', () => {
      const { result } = renderHook(() => 
        useSessionPersistence({ key: 'session-data' })
      );

      // Business Rule: Should detect localStorage support
      expect(result.current.isSupported).toBe(true);
    });
    });
  });

  describe('Error Recovery', () => {
    it('corrupted data does not break experience', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid-json{');

      const { result } = renderHook(() => 
        useSessionPersistence({ key: 'session-data' })
      );

      const loadedData = result.current.load();

      // Business Rule: Corrupted data doesn't crash the application
      expect(loadedData).toBeNull();
    });

    it('storage failures do not lose current work', () => {
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

    it('cleanup failures do not affect new sessions', () => {
      mockLocalStorage.removeItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const { result } = renderHook(() => 
        useSessionPersistence({ key: 'session-data' })
      );

      expect(() => {
        act(() => {
          result.current.remove();
        });
      }).not.toThrow();

      // Business Rule: Clear errors don't crash the application
    });
  });

  describe('Performance Optimization', () => {
    it('rapid changes save without performance issues', (done) => {
      const { result } = renderHook(() => 
        useSessionPersistence({ key: 'session-data', debounceMs: 100 })
      );

      // Business Rule: Multiple rapid saves should be debounced
      act(() => {
        result.current.save({ attempt: 1 });
        result.current.save({ attempt: 2 });
        result.current.save({ attempt: 3 });
      });

      // Should not save immediately due to debouncing
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();

      // Should save after debounce period
      setTimeout(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(1);
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'session-data',
          JSON.stringify({ attempt: 3 })
        );
        done();
      }, 150);
    });

    it('older browsers remain functional', () => {
      // Remove localStorage support
      const originalLocalStorage = window.localStorage;
      delete (window as any).localStorage;

      const { result } = renderHook(() => 
        useSessionPersistence({ key: 'session-data' })
      );

      // Business Rule: Should detect lack of localStorage support
      expect(result.current.isSupported).toBe(false);

      // Business Rule: Operations should not crash on unsupported browsers
      expect(() => {
        act(() => {
          result.current.save({ test: 'data' });
          result.current.load();
          result.current.remove();
        });
      }).not.toThrow();

      // Restore
      (window as any).localStorage = originalLocalStorage;
    });
  });
});
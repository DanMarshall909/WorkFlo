import { IStorageService } from '../container';

/**
 * Browser Storage Service using localStorage with fallback
 *
 * This service provides a consistent interface for browser storage
 * with privacy-conscious defaults and error handling.
 */
export class BrowserStorageService implements IStorageService {
  private isStorageAvailable: boolean;
  private memoryFallback: Map<string, any> = new Map();

  constructor() {
    this.isStorageAvailable = this.checkStorageAvailability();
  }

  private checkStorageAvailability(): boolean {
    try {
      if (typeof window === 'undefined') return false;

      const test = '__storage_test__';
      localStorage.setItem(test, 'test');
      localStorage.removeItem(test);
      return true;
    } catch {
      console.warn('[BrowserStorageService] localStorage not available, using memory fallback');
      return false;
    }
  }

  get<T>(key: string): T | null {
    try {
      if (this.isStorageAvailable) {
        const item = localStorage.getItem(key);
        if (item === null) return null;
        return JSON.parse(item);
      } else {
        return this.memoryFallback.get(key) || null;
      }
    } catch (error) {
      console.error(`[BrowserStorageService] Failed to get item '${key}':`, error);
      return null;
    }
  }

  set(key: string, value: any): void {
    try {
      if (this.isStorageAvailable) {
        localStorage.setItem(key, JSON.stringify(value));
      } else {
        this.memoryFallback.set(key, value);
      }
    } catch (error) {
      console.error(`[BrowserStorageService] Failed to set item '${key}':`, error);
      // Fallback to memory storage if localStorage fails
      this.memoryFallback.set(key, value);
    }
  }

  remove(key: string): void {
    try {
      if (this.isStorageAvailable) {
        localStorage.removeItem(key);
      } else {
        this.memoryFallback.delete(key);
      }
    } catch (error) {
      console.error(`[BrowserStorageService] Failed to remove item '${key}':`, error);
    }
  }

  clear(): void {
    try {
      if (this.isStorageAvailable) {
        localStorage.clear();
      } else {
        this.memoryFallback.clear();
      }
    } catch (error) {
      console.error('[BrowserStorageService] Failed to clear storage:', error);
    }
  }

  // Additional utility methods
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  keys(): string[] {
    try {
      if (this.isStorageAvailable) {
        return Object.keys(localStorage);
      } else {
        return Array.from(this.memoryFallback.keys());
      }
    } catch (error) {
      console.error('[BrowserStorageService] Failed to get keys:', error);
      return [];
    }
  }

  size(): number {
    try {
      if (this.isStorageAvailable) {
        return localStorage.length;
      } else {
        return this.memoryFallback.size;
      }
    } catch (error) {
      console.error('[BrowserStorageService] Failed to get size:', error);
      return 0;
    }
  }
}

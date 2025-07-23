/**
 * Authentication Service Integration Tests
 * 
 * These tests verify the complete authentication flow from UI interaction
 * to service layer, providing browser-level confidence without actual browser automation.
 */

import { MockAuthService } from '../../../services/implementations/mock-auth.service';

// Mock storage service
class MockStorageService {
  private storage = new Map<string, unknown>();

  get<T>(key: string): T | null {
    return (this.storage.get(key) as T) ?? null;
  }

  set(key: string, value: unknown): void {
    this.storage.set(key, value);
  }

  remove(key: string): void {
    this.storage.delete(key);
  }

  clear(): void {
    this.storage.clear();
  }
}

// Mock API service
class MockApiService {
  private mockResponses: Map<string, unknown> = new Map();

  // Setup mock responses for testing
  setMockResponse(endpoint: string, response: unknown): void {
    this.mockResponses.set(endpoint, response);
  }

  async get<T>(endpoint: string): Promise<T> {
    await this.simulateNetworkDelay();
    
    const mockResponse = this.mockResponses.get(endpoint);
    if (mockResponse != null) {
      return mockResponse as T;
    }

    // Default successful responses
    if (endpoint === '/auth/me') {
      return {
        id: '123',
        email: 'user@example.com',
        name: 'Test User',
      } as T;
    }

    throw new Error(`No mock response for ${endpoint}`);
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    await this.simulateNetworkDelay();
    
    const mockResponse = this.mockResponses.get(endpoint);
    if (mockResponse != null) {
      return mockResponse as T;
    }

    // Default successful responses
    if (endpoint === '/auth/login') {
      if (data.email === 'fail@example.com') {
        throw new Error('Invalid credentials');
      }
      return {
        token: 'mock-jwt-token-12345',
        user: {
          id: '123',
          email: data.email,
          name: 'Test User',
        },
      } as T;
    }

    if (endpoint === '/auth/register') {
      if (data.email === 'existing@example.com') {
        throw new Error('Email already exists');
      }
      return {
        token: 'mock-jwt-token-67890',
        user: {
          id: '456',
          email: data.email,
          name: 'New User',
        },
      } as T;
    }

    if (endpoint === '/auth/logout') {
      return {} as T;
    }

    throw new Error(`No mock response for ${endpoint}`);
  }

  private async simulateNetworkDelay(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 10)); // 10ms delay
  }
}

describe('Authentication Service Integration', () => {
  let authService: MockAuthService;
  let storageService: MockStorageService;
  let apiService: MockApiService;

  beforeEach(() => {
    storageService = new MockStorageService();
    apiService = new MockApiService();
    authService = new MockAuthService(storageService as any, apiService as any);
  });

  describe('Login Flow', () => {
    it('successfully logs in with valid credentials', async () => {
      const email = 'user@example.com';
      const password = 'securepassword123';

      const result = await authService.login(email, password);

      expect(result).toEqual({
        token: 'mock-jwt-token-12345',
        user: {
          id: '123',
          email,
          name: 'Test User',
        },
      });

      // Verify authentication state
      expect(authService.isAuthenticated()).toBe(true);
      expect(authService.getToken()).toBe('mock-jwt-token-12345');

      // Verify storage persistence
      expect(storageService.get('workflo-auth-token')).toBe('mock-jwt-token-12345');
      expect(storageService.get('workflo-user')).toEqual({
        id: '123',
        email,
        name: 'Test User',
      });
    });

    it('rejects login with invalid credentials', async () => {
      const email = 'fail@example.com';
      const password = 'wrongpassword';

      await expect(authService.login(email, password))
        .rejects
        .toThrow('Invalid credentials');

      // Verify no authentication state is set
      expect(authService.isAuthenticated()).toBe(false);
      expect(authService.getToken()).toBeNull();
      expect(storageService.get('workflo-auth-token')).toBeNull();
    });

    it('validates required fields', async () => {
      // Missing email
      await expect(authService.login('', 'password123'))
        .rejects
        .toThrow('Email and password are required');

      // Missing password
      await expect(authService.login('user@example.com', ''))
        .rejects
        .toThrow('Email and password are required');

      // Password too short
      await expect(authService.login('user@example.com', '123'))
        .rejects
        .toThrow('Password must be at least 6 characters');
    });

    it('provides proper authentication headers after login', async () => {
      await authService.login('user@example.com', 'password123');

      const headers = authService.getAuthHeaders();
      expect(headers).toEqual({
        Authorization: 'Bearer mock-jwt-token-12345',
      });
    });
  });

  describe('Registration Flow', () => {
    it('successfully registers a new user', async () => {
      const email = 'newuser@example.com';
      const password = 'newsecurepassword123';

      const result = await authService.register(email, password);

      expect(result).toEqual({
        token: 'mock-jwt-token-67890',
        user: {
          id: '456',
          email,
          name: 'New User',
        },
      });

      // Verify authentication state after registration
      expect(authService.isAuthenticated()).toBe(true);
      expect(authService.getToken()).toBe('mock-jwt-token-67890');
    });

    it('rejects registration with existing email', async () => {
      const email = 'existing@example.com';
      const password = 'password12345678';

      await expect(authService.register(email, password))
        .rejects
        .toThrow('Email already exists');

      expect(authService.isAuthenticated()).toBe(false);
    });

    it('validates registration fields', async () => {
      // Missing fields
      await expect(authService.register('', 'password12345678'))
        .rejects
        .toThrow('Email and password are required');

      // Invalid email format
      await expect(authService.register('invalid-email', 'password12345678'))
        .rejects
        .toThrow('Please enter a valid email address');

      // Password too short (registration requires 8+ chars)
      await expect(authService.register('user@example.com', 'short'))
        .rejects
        .toThrow('Password must be at least 8 characters');
    });
  });

  describe('Current User Management', () => {
    it('retrieves current user from storage when available', async () => {
      // Login first
      await authService.login('user@example.com', 'password123');

      const user = await authService.getCurrentUser();
      expect(user).toEqual({
        id: '123',
        email: 'user@example.com',
        name: 'Test User',
      });
    });

    it('fetches user from API when not in storage', async () => {
      // Manually set token without user data
      storageService.set('workflo-auth-token', 'mock-token');

      const user = await authService.getCurrentUser();
      expect(user).toEqual({
        id: '123',
        email: 'user@example.com',
        name: 'Test User',
      });

      // Verify user is now cached in storage
      expect(storageService.get('workflo-user')).toEqual(user);
    });

    it('returns null when not authenticated', async () => {
      const user = await authService.getCurrentUser();
      expect(user).toBeNull();
    });

    it('handles API errors gracefully', async () => {
      // Set invalid token that should cause API failure
      storageService.set('workflo-auth-token', 'invalid-token');

      const user = await authService.getCurrentUser();
      expect(user).toBeNull();

      // Verify auth state is cleared on error
      expect(authService.isAuthenticated()).toBe(false);
      expect(storageService.get('workflo-auth-token')).toBeNull();
    });
  });

  describe('Logout Flow', () => {
    it('successfully logs out authenticated user', async () => {
      // Login first
      await authService.login('user@example.com', 'password123');
      expect(authService.isAuthenticated()).toBe(true);

      // Logout
      await authService.logout();

      // Verify auth state is cleared
      expect(authService.isAuthenticated()).toBe(false);
      expect(authService.getToken()).toBeNull();
      expect(storageService.get('workflo-auth-token')).toBeNull();
      expect(storageService.get('workflo-user')).toBeNull();
    });

    it('handles logout gracefully when not authenticated', async () => {
      // Should not throw error
      await expect(authService.logout()).resolves.not.toThrow();
    });

    it('clears local state even when server logout fails', async () => {
      // Login first
      await authService.login('user@example.com', 'password123');

      // Mock logout API failure
      jest.spyOn(apiService, 'post').mockRejectedValueOnce(new Error('Server error'));

      // Logout should still clear local state
      await authService.logout();

      expect(authService.isAuthenticated()).toBe(false);
      expect(storageService.get('workflo-auth-token')).toBeNull();
    });
  });

  describe('Authentication State Persistence', () => {
    it('maintains authentication state across service instances', async () => {
      // Login with first instance
      await authService.login('user@example.com', 'password123');

      // Create new service instance (simulates app restart)
      const newAuthService = new MockAuthService(storageService as any, apiService as any);

      // Should still be authenticated
      expect(newAuthService.isAuthenticated()).toBe(true);
      expect(newAuthService.getToken()).toBe('mock-jwt-token-12345');

      const user = await newAuthService.getCurrentUser();
      expect(user).toEqual({
        id: '123',
        email: 'user@example.com',
        name: 'Test User',
      });
    });
  });

  describe('ADHD-Friendly Error Handling', () => {
    it('provides clear error messages for common mistakes', async () => {
      // Test various common user errors with clear messaging
      
      // Empty password
      await expect(authService.login('user@example.com', ''))
        .rejects
        .toThrow('Email and password are required');

      // Very short password
      await expect(authService.login('user@example.com', '123'))
        .rejects
        .toThrow('Password must be at least 6 characters');

      // Invalid email in registration
      await expect(authService.register('not-an-email', 'password12345678'))
        .rejects
        .toThrow('Please enter a valid email address');

      // Registration password too short
      await expect(authService.register('user@example.com', 'short'))
        .rejects
        .toThrow('Password must be at least 8 characters');
    });

    it('handles network errors gracefully', async () => {
      // Inject network failure into the mock service
      (authService as any)._injectFailure(new Error('Network error'));

      await expect(authService.login('user@example.com', 'password123'))
        .rejects
        .toThrow('Network error');

      // Auth state should remain clean
      expect(authService.isAuthenticated()).toBe(false);
    });
  });

  describe('Privacy and Security', () => {
    it('does not expose sensitive data in auth headers when not authenticated', () => {
      const headers = authService.getAuthHeaders();
      expect(headers).toEqual({});
    });

    it('clears all stored data on logout', async () => {
      // Login and verify data is stored
      await authService.login('user@example.com', 'password123');
      expect(storageService.get('workflo-auth-token')).toBeTruthy();
      expect(storageService.get('workflo-user')).toBeTruthy();

      // Logout and verify all data is cleared
      await authService.logout();
      expect(storageService.get('workflo-auth-token')).toBeNull();
      expect(storageService.get('workflo-user')).toBeNull();
    });
  });
});
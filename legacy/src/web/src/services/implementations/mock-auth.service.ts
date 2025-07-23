import { IAuthService, IStorageService, IApiService } from '../container';

/**
 * Mock Authentication Service for Testing
 *
 * This service provides a mock implementation of authentication
 * for testing purposes without actual backend dependencies.
 */
export class MockAuthService implements IAuthService {
  private storageService: IStorageService;
  private apiService: IApiService;
  private readonly TOKEN_KEY = 'workflo-auth-token';
  private readonly USER_KEY = 'workflo-user';
  private shouldFailNext: boolean = false;
  private failureError: Error | null = null;

  constructor(storageService: IStorageService, apiService: IApiService) {
    this.storageService = storageService;
    this.apiService = apiService;
  }

  // Test helper method to inject failures
  _injectFailure(error: Error): void {
    this.shouldFailNext = true;
    this.failureError = error;
  }

  async login(email: string, password: string): Promise<{ token: string; user: any }> {
    // Check for injected failure
    if (this.shouldFailNext && this.failureError) {
      this.shouldFailNext = false;
      const error = this.failureError;
      this.failureError = null;
      throw error;
    }

    // Client-side validation
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    // Mock API call with artificial delay
    await this.simulateNetworkDelay();

    // Mock failure for specific test email
    if (email === 'fail@example.com') {
      throw new Error('Invalid credentials');
    }

    // Mock successful response
    const response = {
      token: 'mock-jwt-token-12345',
      user: {
        id: '123',
        email,
        name: 'Test User',
      },
    };

    // Store authentication data
    this.storageService.set(this.TOKEN_KEY, response.token);
    this.storageService.set(this.USER_KEY, response.user);

    return response;
  }

  async logout(): Promise<void> {
    // Mock API call
    await this.simulateNetworkDelay();

    // Clear all stored authentication data
    this.storageService.remove(this.TOKEN_KEY);
    this.storageService.remove(this.USER_KEY);
  }

  async register(email: string, password: string, confirmPassword?: string): Promise<{ token: string; user: any }> {
    // Client-side validation
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    if (!this.isValidEmail(email)) {
      throw new Error('Please enter a valid email address');
    }

    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }

    // Mock API call with artificial delay
    await this.simulateNetworkDelay();

    // Mock failure for specific test email
    if (email === 'existing@example.com') {
      throw new Error('Email already exists');
    }

    // Mock successful response
    const response = {
      token: 'mock-jwt-token-67890',
      user: {
        id: '456',
        email,
        name: 'New User',
      },
    };

    // Store authentication data
    this.storageService.set(this.TOKEN_KEY, response.token);
    this.storageService.set(this.USER_KEY, response.user);

    return response;
  }

  async getCurrentUser(): Promise<any | null> {
    if (!this.isAuthenticated()) {
      return null;
    }

    // First try to get user from storage
    const cachedUser = this.storageService.get(this.USER_KEY);
    if (cachedUser) {
      return cachedUser;
    }

    // Mock API call to fetch user
    try {
      await this.simulateNetworkDelay();
      
      // Check for the specific test case that should fail
      const token = this.getToken();
      if (token === 'invalid-token') {
        throw new Error('Unauthorized');
      }
      
      const user = {
        id: '123',
        email: 'user@example.com',
        name: 'Test User',
      };

      this.storageService.set(this.USER_KEY, user);
      return user;
    } catch (error) {
      // If API call fails, clear auth state
      this.storageService.remove(this.TOKEN_KEY);
      this.storageService.remove(this.USER_KEY);
      return null;
    }
  }

  isAuthenticated(): boolean {
    const token = this.storageService.get<string>(this.TOKEN_KEY);
    return !!token;
  }

  getToken(): string | null {
    return this.storageService.get<string>(this.TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    // Mock implementation - not used in tests
    return null;
  }

  // Helper method for API requests that need authentication
  getAuthHeaders(): Record<string, string> {
    const token = this.getToken();
    if (!token) {
      return {};
    }

    return {
      Authorization: `Bearer ${token}`,
    };
  }

  // Private helper methods
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private async simulateNetworkDelay(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 10)); // 10ms delay
  }
}
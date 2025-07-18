import { IAuthService, IStorageService, IApiService } from '../container';

/**
 * Real Authentication Service for Anchor
 *
 * This service handles JWT-based authentication with automatic token refresh,
 * secure storage, and proper error handling.
 */
export class AuthService implements IAuthService {
  private storageService: IStorageService;
  private apiService: IApiService;
  private readonly TOKEN_KEY = 'anchor-auth-token';
  private readonly REFRESH_TOKEN_KEY = 'anchor-refresh-token';
  private readonly USER_KEY = 'anchor-user';
  private readonly TOKEN_EXPIRY_KEY = 'anchor-token-expiry';
  private refreshPromise: Promise<void> | null = null;

  constructor(storageService: IStorageService, apiService: IApiService) {
    this.storageService = storageService;
    this.apiService = apiService;
  }

  async login(email: string, password: string): Promise<{ token: string; user: any }> {
    try {
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

      // Call backend API
      const response = await this.apiService.post<{ 
        token: string; 
        refreshToken: string; 
        expiresIn: number; 
        user: any 
      }>('/api/auth/login', {
        email,
        password,
      });

      // Store authentication data securely
      this.storeAuthData(response.token, response.refreshToken, response.expiresIn, response.user);

      return { token: response.token, user: response.user };
    } catch (error) {
      console.error('[AuthService] Login failed:', error);
      // Clear any existing auth data on failed login
      this.clearAuthData();
      throw this.handleAuthError(error);
    }
  }

  async logout(): Promise<void> {
    try {
      const token = this.getToken();
      
      // Notify server of logout (with current token if available)
      if (token) {
        try {
          await this.apiService.post('/api/auth/logout', {
            refreshToken: this.getRefreshToken(),
          });
        } catch (error) {
          console.warn('[AuthService] Server logout failed, continuing with local logout:', error);
        }
      }

      // Clear all stored authentication data
      this.clearAuthData();
    } catch (error) {
      console.error('[AuthService] Logout failed:', error);
      // Always clear local data even if server call fails
      this.clearAuthData();
    }
  }

  async register(email: string, password: string, confirmPassword?: string): Promise<{ token: string; user: any }> {
    try {
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

      // Call backend API
      const response = await this.apiService.post<{ 
        token: string; 
        refreshToken: string; 
        expiresIn: number; 
        user: any 
      }>('/api/auth/register', {
        email,
        password,
        confirmPassword: confirmPassword || password,
      });

      // Store authentication data securely
      this.storeAuthData(response.token, response.refreshToken, response.expiresIn, response.user);

      return { token: response.token, user: response.user };
    } catch (error) {
      console.error('[AuthService] Registration failed:', error);
      // Clear any existing auth data on failed registration
      this.clearAuthData();
      throw this.handleAuthError(error);
    }
  }

  async getCurrentUser(): Promise<any | null> {
    try {
      if (!this.isAuthenticated()) {
        return null;
      }

      // Ensure token is valid and refresh if needed
      await this.ensureValidToken();

      // First try to get user from storage
      const cachedUser = this.storageService.get(this.USER_KEY);
      if (cachedUser) {
        return cachedUser;
      }

      // If not in storage, fetch from API with auth headers
      const user = await this.apiService.get('/api/auth/me');
      this.storageService.set(this.USER_KEY, user);
      return user;
    } catch (error) {
      console.error('[AuthService] Failed to get current user:', error);
      // If API call fails, clear invalid auth state
      await this.logout();
      return null;
    }
  }

  isAuthenticated(): boolean {
    const token = this.storageService.get<string>(this.TOKEN_KEY);
    const expiry = this.storageService.get<number>(this.TOKEN_EXPIRY_KEY);
    
    if (!token || !expiry) {
      return false;
    }

    // Check if token is expired
    if (Date.now() >= expiry) {
      this.clearAuthData();
      return false;
    }

    return true;
  }

  getToken(): string | null {
    return this.storageService.get<string>(this.TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return this.storageService.get<string>(this.REFRESH_TOKEN_KEY);
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

  private isStrongPassword(password: string): boolean {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    return hasUpperCase && hasLowerCase && hasNumbers;
  }

  private storeAuthData(token: string, refreshToken: string, expiresIn: number, user: any): void {
    const expiryTime = Date.now() + (expiresIn * 1000);
    
    this.storageService.set(this.TOKEN_KEY, token);
    this.storageService.set(this.REFRESH_TOKEN_KEY, refreshToken);
    this.storageService.set(this.TOKEN_EXPIRY_KEY, expiryTime);
    this.storageService.set(this.USER_KEY, user);
  }

  private clearAuthData(): void {
    this.storageService.remove(this.TOKEN_KEY);
    this.storageService.remove(this.REFRESH_TOKEN_KEY);
    this.storageService.remove(this.TOKEN_EXPIRY_KEY);
    this.storageService.remove(this.USER_KEY);
  }

  private async ensureValidToken(): Promise<void> {
    const token = this.getToken();
    const expiry = this.storageService.get<number>(this.TOKEN_EXPIRY_KEY);
    
    if (!token || !expiry) {
      throw new Error('No authentication token found');
    }

    // Check if token expires in the next 5 minutes
    const fiveMinutesFromNow = Date.now() + (5 * 60 * 1000);
    if (expiry <= fiveMinutesFromNow) {
      await this.refreshToken();
    }
  }

  private async refreshToken(): Promise<void> {
    // Prevent multiple simultaneous refresh attempts
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.performTokenRefresh();
    
    try {
      await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async performTokenRefresh(): Promise<void> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await this.apiService.post<{
        token: string;
        refreshToken: string;
        expiresIn: number;
      }>('/api/auth/refresh', {
        refreshToken,
      });

      // Update stored tokens
      const currentUser = this.storageService.get(this.USER_KEY);
      this.storeAuthData(response.token, response.refreshToken, response.expiresIn, currentUser);
    } catch (error) {
      console.error('[AuthService] Token refresh failed:', error);
      // Clear auth data and force re-login
      this.clearAuthData();
      throw new Error('Authentication session expired. Please login again.');
    }
  }

  private handleAuthError(error: any): Error {
    if (error.response?.status === 401) {
      return new Error('Invalid email or password');
    }
    if (error.response?.status === 409) {
      return new Error('An account with this email already exists');
    }
    if (error.response?.status === 429) {
      return new Error('Too many attempts. Please try again later.');
    }
    if (error.response?.status >= 500) {
      return new Error('Server error. Please try again later.');
    }
    
    return error instanceof Error ? error : new Error('Authentication failed');
  }
}

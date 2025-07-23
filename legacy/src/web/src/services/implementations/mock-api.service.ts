import { IApiService } from '../container';

/**
 * Mock API Service for development and testing
 *
 * This service simulates API calls with realistic delays and responses.
 * In production, this would be replaced with a real HTTP client.
 */
export class MockApiService implements IApiService {
  private baseUrl: string;
  private defaultDelay: number;

  constructor(baseUrl: string = '/api', defaultDelay: number = 300) {
    this.baseUrl = baseUrl;
    this.defaultDelay = defaultDelay;
  }

  private async delay(ms: number = this.defaultDelay): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async simulateNetworkCall<T>(response: T, delay?: number): Promise<T> {
    await this.delay(delay);

    // Simulate occasional network errors (5% chance)
    if (Math.random() < 0.05) {
      throw new Error('Network error: Connection timeout');
    }

    return response;
  }

  async get<T>(endpoint: string): Promise<T> {
    console.log(`[MockApiService] GET ${this.baseUrl}${endpoint}`);

    // Mock responses based on endpoint
    if (endpoint === '/tasks') {
      return this.simulateNetworkCall([
        {
          id: '1',
          title: 'Complete project documentation',
          description: 'Write comprehensive API documentation',
          completed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          title: 'Review pull requests',
          description: 'Review and approve pending PRs',
          completed: true,
          createdAt: new Date().toISOString(),
        },
      ] as T);
    }

    if (endpoint === '/sessions/current') {
      return this.simulateNetworkCall(null as T);
    }

    if (endpoint === '/auth/me') {
      return this.simulateNetworkCall({
        id: 'user-123',
        email: 'user@example.com',
        name: 'Test User',
      } as T);
    }

    return this.simulateNetworkCall({} as T);
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    console.log(`[MockApiService] POST ${this.baseUrl}${endpoint}`, data);

    if (endpoint === '/auth/login') {
      return this.simulateNetworkCall({
        token: 'mock-jwt-token',
        user: {
          id: 'user-123',
          email: data.email,
          name: 'Test User',
        },
      } as T);
    }

    if (endpoint === '/tasks') {
      return this.simulateNetworkCall({
        id: Date.now().toString(),
        ...data,
        completed: false,
        createdAt: new Date().toISOString(),
      } as T);
    }

    if (endpoint === '/sessions') {
      return this.simulateNetworkCall({
        id: Date.now().toString(),
        taskId: data.taskId,
        duration: data.duration,
        startedAt: new Date().toISOString(),
        status: 'active',
      } as T);
    }

    return this.simulateNetworkCall(data as T);
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    console.log(`[MockApiService] PUT ${this.baseUrl}${endpoint}`, data);

    return this.simulateNetworkCall({
      ...data,
      updatedAt: new Date().toISOString(),
    } as T);
  }

  async delete<T>(endpoint: string): Promise<T> {
    console.log(`[MockApiService] DELETE ${this.baseUrl}${endpoint}`);

    return this.simulateNetworkCall({ success: true } as T);
  }
}

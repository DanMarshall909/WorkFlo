import { IApiService } from '../container';

/**
 * Real API Service connecting to WorkFlo backend
 * Provides HTTP client functionality with proper error handling and authentication
 */
export class WorkFloApiService implements IApiService {
  private readonly baseUrl: string;
  private tokenProvider?: () => string | null;

  constructor(baseUrl: string = 'http://localhost:5000') {
    this.baseUrl = baseUrl;
  }

  setTokenProvider(provider: () => string | null): void {
    this.tokenProvider = provider;
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.makeRequest<T>('GET', endpoint);
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    return this.makeRequest<T>('POST', endpoint, data);
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    return this.makeRequest<T>('PUT', endpoint, data);
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.makeRequest<T>('DELETE', endpoint);
  }

  private async makeRequest<T>(
    method: string,
    endpoint: string,
    data?: any
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Add authentication header if token is available
    const token = this.tokenProvider?.();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
      method,
      headers,
      mode: 'cors',
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      config.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          // If JSON parsing fails, try text
          try {
            const errorText = await response.text();
            if (errorText) errorMessage = errorText;
          } catch {
            // If both fail, use status code
          }
        }
        
        const error = new Error(errorMessage) as any;
        error.response = { status: response.status, statusText: response.statusText };
        throw error;
      }

      // Handle empty responses (like 204 No Content)
      if (response.status === 204 || response.headers.get('content-length') === '0') {
        return {} as T;
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error(`API request failed: ${method} ${url}`, error);
      throw error;
    }
  }
}
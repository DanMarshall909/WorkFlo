/**
 * Dependency Injection Container for Anchor Web Application
 *
 * This container manages all service dependencies and provides a clean
 * interface for injecting behaviors into React components.
 */

// Service interfaces for dependency injection
export interface IApiService {
  get<T>(endpoint: string): Promise<T>;
  post<T>(endpoint: string, data: any): Promise<T>;
  put<T>(endpoint: string, data: any): Promise<T>;
  delete<T>(endpoint: string): Promise<T>;
  setTokenProvider?(provider: () => string | null): void;
}

export interface IAuthService {
  login(email: string, password: string): Promise<{ token: string; user: any }>;
  logout(): Promise<void>;
  register(email: string, password: string, confirmPassword?: string): Promise<{ token: string; user: any }>;
  getCurrentUser(): Promise<any | null>;
  isAuthenticated(): boolean;
}

export interface ITaskService {
  getTasks(): Promise<any[]>;
  createTask(task: any): Promise<any>;
  updateTask(id: string, task: any): Promise<any>;
  deleteTask(id: string): Promise<void>;
  completeTask(id: string): Promise<any>;
}

export interface ISessionService {
  startSession(taskId: string, duration: number): Promise<any>;
  stopSession(sessionId: string): Promise<void>;
  getCurrentSession(): Promise<any | null>;
  getSessionHistory(): Promise<any[]>;
}

export interface INotificationService {
  showSuccess(message: string): void;
  showError(message: string): void;
  showWarning(message: string): void;
  showInfo(message: string): void;
  requestPermission(): Promise<boolean>;
  sendNotification(title: string, message: string): void;
}

export interface IAnalyticsService {
  track(event: string, properties?: Record<string, any>): void;
  identify(userId: string, traits?: Record<string, any>): void;
  page(name: string, properties?: Record<string, any>): void;
}

export interface IStorageService {
  get<T>(key: string): T | null;
  set(key: string, value: any): void;
  remove(key: string): void;
  clear(): void;
}

export interface ISignalRService {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  on<T>(event: string, callback: (data: T) => void): void;
  off(event: string, callback?: Function): void;
  send(event: string, data: any): Promise<void>;
  isConnected(): boolean;
}

export interface IThemeService {
  getCurrentTheme(): 'light' | 'dark' | 'system';
  setTheme(theme: 'light' | 'dark' | 'system'): void;
  toggleTheme(): void;
  getThemeConfig(): any;
}

// Service container interface
export interface IServiceContainer {
  apiService: IApiService;
  authService: IAuthService;
  taskService: ITaskService;
  sessionService: ISessionService;
  notificationService: INotificationService;
  analyticsService: IAnalyticsService;
  storageService: IStorageService;
  signalRService: ISignalRService;
  themeService: IThemeService;
}

// Service registration type
export type ServiceFactory<T> = (container: Partial<IServiceContainer>) => T;

// Service container implementation
class ServiceContainer implements IServiceContainer {
  private services: Map<string, any> = new Map();
  private factories: Map<string, ServiceFactory<any>> = new Map();

  // Lazy initialization of services
  private getService<T>(key: string): T {
    if (!this.services.has(key)) {
      const factory = this.factories.get(key);
      if (!factory) {
        throw new Error(`Service '${key}' not registered`);
      }
      this.services.set(key, factory(this));
    }
    return this.services.get(key);
  }

  // Register a service factory
  register<T>(key: string, factory: ServiceFactory<T>): void {
    this.factories.set(key, factory);
  }

  // Service getters with lazy initialization
  get apiService(): IApiService {
    return this.getService('apiService');
  }

  get authService(): IAuthService {
    return this.getService('authService');
  }

  get taskService(): ITaskService {
    return this.getService('taskService');
  }

  get sessionService(): ISessionService {
    return this.getService('sessionService');
  }

  get notificationService(): INotificationService {
    return this.getService('notificationService');
  }

  get analyticsService(): IAnalyticsService {
    return this.getService('analyticsService');
  }

  get storageService(): IStorageService {
    return this.getService('storageService');
  }

  get signalRService(): ISignalRService {
    return this.getService('signalRService');
  }

  get themeService(): IThemeService {
    return this.getService('themeService');
  }

  // Reset all services (useful for testing)
  reset(): void {
    this.services.clear();
  }

  // Override a service (useful for testing)
  override<T>(key: string, service: T): void {
    this.services.set(key, service);
  }
}

// Global container instance
export const container = new ServiceContainer();

// Helper function to create a service provider hook
export function createServiceHook<T>(serviceKey: string) {
  return function useService(): T {
    return (container as any)[serviceKey];
  };
}

// React hook for accessing services
export function useServices(): IServiceContainer {
  return container;
}

// Service registration
import { AnchorApiService } from './implementations/anchor-api.service';
import { TaskService } from './implementations/task.service';
import { AuthService } from './implementations/auth.service';
import { BrowserStorageService } from './implementations/browser-storage.service';
import { NotificationService } from './implementations/notification.service';

// Register default services
container.register('storageService', () => new BrowserStorageService());
container.register('apiService', () => new AnchorApiService(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5016'));
container.register('taskService', (container) => new TaskService(container.apiService!));
container.register('authService', (container) => new AuthService(container.storageService!, container.apiService!));
container.register('notificationService', () => new NotificationService());

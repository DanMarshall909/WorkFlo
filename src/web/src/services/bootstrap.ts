/**
 * Service Bootstrap Configuration
 *
 * This file registers all service implementations with the container
 * and provides different configurations for development, testing, and production.
 */

import { container } from './container';
import { MockApiService } from './implementations/mock-api.service';
import { AuthService } from './implementations/auth.service';
import { BrowserStorageService } from './implementations/browser-storage.service';

// Environment-based service registration
export function bootstrapServices(
  environment: 'development' | 'production' | 'test' = 'development'
) {
  console.log(`[ServiceBootstrap] Initializing services for ${environment} environment`);

  // Storage Service - same for all environments
  container.register('storageService', () => new BrowserStorageService());

  // API Service - different implementations per environment
  if (environment === 'development' || environment === 'test') {
    container.register('apiService', () => new MockApiService());
  } else {
    // In production, this would be a real HTTP client
    container.register(
      'apiService',
      () => new MockApiService(process.env.NEXT_PUBLIC_API_URL || '/api')
    );
  }

  // Auth Service - depends on storage and API services
  container.register('authService', c => {
    const authService = new AuthService(c.storageService!, c.apiService!);
    
    // Wire up token provider for automatic auth headers
    c.apiService!.setTokenProvider?.(() => authService.getToken());
    
    return authService;
  });

  // Task Service - uses API service
  container.register('taskService', c => ({
    async getTasks() {
      return c.apiService!.get('/tasks');
    },
    async createTask(task: any) {
      return c.apiService!.post('/tasks', task);
    },
    async updateTask(id: string, task: any) {
      return c.apiService!.put(`/tasks/${id}`, task);
    },
    async deleteTask(id: string) {
      return c.apiService!.delete(`/tasks/${id}`);
    },
    async completeTask(id: string) {
      return c.apiService!.put(`/tasks/${id}/complete`, {});
    },
  }));

  // Session Service - uses API service
  container.register('sessionService', c => ({
    async startSession(taskId: string, duration: number) {
      return c.apiService!.post('/sessions', { taskId, duration });
    },
    async stopSession(sessionId: string) {
      return c.apiService!.put(`/sessions/${sessionId}/stop`, {});
    },
    async getCurrentSession() {
      return c.apiService!.get('/sessions/current');
    },
    async getSessionHistory() {
      return c.apiService!.get('/sessions/history');
    },
  }));

  // Notification Service - browser-based
  container.register('notificationService', () => ({
    showSuccess(message: string) {
      console.log(`[Success] ${message}`);
      // In production, this would use a toast library
    },
    showError(message: string) {
      console.error(`[Error] ${message}`);
    },
    showWarning(message: string) {
      console.warn(`[Warning] ${message}`);
    },
    showInfo(message: string) {
      console.info(`[Info] ${message}`);
    },
    async requestPermission() {
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
      }
      return false;
    },
    sendNotification(title: string, message: string) {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body: message });
      }
    },
  }));

  // Analytics Service - privacy-first (disabled by default)
  container.register('analyticsService', () => ({
    track(event: string, properties?: Record<string, any>) {
      if (environment === 'development') {
        console.log(`[Analytics] Track: ${event}`, properties);
      }
      // In production, implement privacy-preserving analytics
    },
    identify(userId: string, traits?: Record<string, any>) {
      if (environment === 'development') {
        console.log(`[Analytics] Identify: ${userId}`, traits);
      }
    },
    page(name: string, properties?: Record<string, any>) {
      if (environment === 'development') {
        console.log(`[Analytics] Page: ${name}`, properties);
      }
    },
  }));

  // SignalR Service - real-time communication
  container.register('signalRService', () => ({
    async connect() {
      console.log('[SignalR] Connecting...');
      // In production, implement real SignalR connection
    },
    async disconnect() {
      console.log('[SignalR] Disconnecting...');
    },
    on<T>(event: string, callback: (data: T) => void) {
      console.log(`[SignalR] Listening for ${event}`);
    },
    off(event: string, callback?: Function) {
      console.log(`[SignalR] Stopped listening for ${event}`);
    },
    async send(event: string, data: any) {
      console.log(`[SignalR] Send ${event}:`, data);
    },
    isConnected() {
      return false; // Mock implementation
    },
  }));

  // Theme Service - integrated with theme provider
  container.register('themeService', c => ({
    getCurrentTheme() {
      return c.storageService!.get<'light' | 'dark' | 'system'>('anchor-theme') || 'system';
    },
    setTheme(theme: 'light' | 'dark' | 'system') {
      c.storageService!.set('anchor-theme', theme);
      // Trigger theme change event
      window.dispatchEvent(new CustomEvent('theme-change', { detail: theme }));
    },
    toggleTheme() {
      const current = this.getCurrentTheme();
      const next = current === 'light' ? 'dark' : current === 'dark' ? 'system' : 'light';
      this.setTheme(next);
    },
    getThemeConfig() {
      // Return current theme configuration
      return { theme: this.getCurrentTheme() };
    },
  }));

  console.log('[ServiceBootstrap] Services initialized successfully');
}

// Auto-bootstrap for browser environment
if (typeof window !== 'undefined') {
  const environment = process.env.NODE_ENV === 'production' ? 'production' : 'development';
  bootstrapServices(environment as any);
}

// Export for manual initialization (useful for testing)
export { container };

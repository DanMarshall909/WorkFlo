/**
 * React Hooks for Service Dependency Injection
 *
 * These hooks provide clean access to injected services throughout
 * the React component tree.
 */

import { container, IServiceContainer } from '@/services/container';
import { useCallback, useEffect, useState } from 'react';

// Main hook for accessing the entire service container
export function useServices(): IServiceContainer {
  return container;
}

// Individual service hooks for better component isolation
export function useApiService() {
  return container.apiService;
}

export function useAuthService() {
  return container.authService;
}

export function useTaskService() {
  return container.taskService;
}

export function useSessionService() {
  return container.sessionService;
}

export function useNotificationService() {
  return container.notificationService;
}

export function useAnalyticsService() {
  return container.analyticsService;
}

export function useStorageService() {
  return container.storageService;
}

export function useSignalRService() {
  return container.signalRService;
}

export function useThemeService() {
  return container.themeService;
}

// Composite hooks for common patterns
export function useAuth() {
  const authService = useAuthService();
  const notificationService = useNotificationService();
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
        setIsAuthenticated(!!currentUser);
      } catch (error) {
        console.error('Failed to check authentication:', error);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [authService]);

  const login = useCallback(
    async (email: string, password: string) => {
      setIsLoading(true);
      try {
        const response = await authService.login(email, password);
        setUser(response.user);
        setIsAuthenticated(true);
        notificationService.showSuccess('Successfully signed in!');
        return response;
      } catch (error: any) {
        notificationService.showError(error.message || 'Login failed');
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [authService, notificationService]
  );

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await authService.logout();
      setUser(null);
      setIsAuthenticated(false);
      notificationService.showInfo('Successfully signed out');
    } catch (error: any) {
      notificationService.showError(error.message || 'Logout failed');
    } finally {
      setIsLoading(false);
    }
  }, [authService, notificationService]);

  const register = useCallback(
    async (email: string, password: string) => {
      setIsLoading(true);
      try {
        const response = await authService.register(email, password);
        setUser(response.user);
        setIsAuthenticated(true);
        notificationService.showSuccess('Account created successfully!');
        return response;
      } catch (error: any) {
        notificationService.showError(error.message || 'Registration failed');
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [authService, notificationService]
  );

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    register,
  };
}

export function useTasks() {
  const taskService = useTaskService();
  const notificationService = useNotificationService();
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedTasks = await taskService.getTasks();
      setTasks(fetchedTasks);
    } catch (error: any) {
      notificationService.showError(error.message || 'Failed to load tasks');
    } finally {
      setIsLoading(false);
    }
  }, [taskService, notificationService]);

  const createTask = useCallback(
    async (task: any) => {
      try {
        const newTask = await taskService.createTask(task);
        setTasks(prev => [...prev, newTask]);
        notificationService.showSuccess('Task created successfully!');
        return newTask;
      } catch (error: any) {
        notificationService.showError(error.message || 'Failed to create task');
        throw error;
      }
    },
    [taskService, notificationService]
  );

  const updateTask = useCallback(
    async (id: string, updates: any) => {
      try {
        const updatedTask = await taskService.updateTask(id, updates);
        setTasks(prev => prev.map(task => (task.id === id ? updatedTask : task)));
        notificationService.showSuccess('Task updated successfully!');
        return updatedTask;
      } catch (error: any) {
        notificationService.showError(error.message || 'Failed to update task');
        throw error;
      }
    },
    [taskService, notificationService]
  );

  const deleteTask = useCallback(
    async (id: string) => {
      try {
        await taskService.deleteTask(id);
        setTasks(prev => prev.filter(task => task.id !== id));
        notificationService.showSuccess('Task deleted successfully!');
      } catch (error: any) {
        notificationService.showError(error.message || 'Failed to delete task');
        throw error;
      }
    },
    [taskService, notificationService]
  );

  const completeTask = useCallback(
    async (id: string) => {
      try {
        const completedTask = await taskService.completeTask(id);
        setTasks(prev => prev.map(task => (task.id === id ? completedTask : task)));
        notificationService.showSuccess('Task completed! Great work! 🎉');
        return completedTask;
      } catch (error: any) {
        notificationService.showError(error.message || 'Failed to complete task');
        throw error;
      }
    },
    [taskService, notificationService]
  );

  // Load tasks on mount
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return {
    tasks,
    isLoading,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    completeTask,
  };
}

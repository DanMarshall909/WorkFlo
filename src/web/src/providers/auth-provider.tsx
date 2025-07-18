'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useServices } from '@/services/container';

interface User {
  id: string;
  email: string;
  name?: string;
  createdAt: string;
  preferences?: Record<string, any>;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { authService, notificationService } = useServices();
  const router = useRouter();
  
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  // Initialize authentication state on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (authService.isAuthenticated()) {
          const currentUser = await authService.getCurrentUser();
          if (currentUser) {
            setUser(currentUser);
          } else {
            // Token is invalid, clear auth state
            await authService.logout();
          }
        }
      } catch (error) {
        console.error('[AuthProvider] Failed to initialize auth:', error);
        // Clear any invalid auth state
        await authService.logout();
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [authService]);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      const { user: newUser } = await authService.login(email, password);
      setUser(newUser);
      notificationService.showSuccess('Login successful! Welcome back to Anchor.');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      notificationService.showError(errorMessage);
      throw error; // Re-throw for component handling
    }
  };

  const register = async (email: string, password: string): Promise<void> => {
    try {
      const { user: newUser } = await authService.register(email, password);
      setUser(newUser);
      notificationService.showSuccess('Account created successfully! Welcome to Anchor.');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      notificationService.showError(errorMessage);
      throw error; // Re-throw for component handling
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await authService.logout();
      setUser(null);
      notificationService.showInfo('You have been logged out successfully.');
      router.push('/auth/login');
    } catch (error) {
      console.error('[AuthProvider] Logout failed:', error);
      // Even if logout fails, clear local state
      setUser(null);
      router.push('/auth/login');
    }
  };

  const refreshUser = async (): Promise<void> => {
    try {
      if (!authService.isAuthenticated()) {
        setUser(null);
        return;
      }

      const currentUser = await authService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
      } else {
        await logout();
      }
    } catch (error) {
      console.error('[AuthProvider] Failed to refresh user:', error);
      await logout();
    }
  };

  const contextValue: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
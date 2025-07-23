import React, { ReactElement, ReactNode, createContext, useContext } from 'react';
import { render, RenderOptions } from '@testing-library/react';

// Create a mock AuthContext for testing
const MockAuthContext = createContext({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  login: jest.fn(() => Promise.resolve()),
  register: jest.fn(() => Promise.resolve()),
  logout: jest.fn(() => Promise.resolve()),
  refreshUser: jest.fn(() => Promise.resolve()),
});

// Mock AuthProvider for tests
function MockAuthProvider({ children }: { children: ReactNode }) {
  return (
    <MockAuthContext.Provider value={{
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: jest.fn(() => Promise.resolve()),
      register: jest.fn(() => Promise.resolve()),
      logout: jest.fn(() => Promise.resolve()),
      refreshUser: jest.fn(() => Promise.resolve()),
    }}>
      {children}
    </MockAuthContext.Provider>
  );
}

// Mock the auth provider module
jest.mock('@/providers/auth-provider', () => ({
  AuthProvider: ({ children }: { children: ReactNode }) => children,
  useAuth: () => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    login: jest.fn(() => Promise.resolve()),
    register: jest.fn(() => Promise.resolve()),
    logout: jest.fn(() => Promise.resolve()),
    refreshUser: jest.fn(() => Promise.resolve()),
  }),
}));

// Custom render function that includes providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[];
}

interface AllTheProvidersProps {
  children: ReactNode;
}

const AllTheProviders = ({ children }: AllTheProvidersProps) => {
  return (
    <MockAuthProvider>
      {children}
    </MockAuthProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: CustomRenderOptions
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything
export * from '@testing-library/react';

// Override render method
export { customRender as render };
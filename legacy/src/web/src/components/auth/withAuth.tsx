'use client';

import { ComponentType, ReactNode } from 'react';
import AuthGuard from './AuthGuard';

interface WithAuthOptions {
  redirectTo?: string;
  requireAuth?: boolean;
  fallback?: ReactNode;
}

/**
 * Higher-order component that wraps a component with authentication guards
 * 
 * @param WrappedComponent - The component to protect
 * @param options - Authentication options
 * @returns Protected component
 */
export function withAuth<P extends object>(
  WrappedComponent: ComponentType<P>,
  options: WithAuthOptions = {}
) {
  const {
    redirectTo = '/auth/login',
    requireAuth = true,
    fallback,
  } = options;

  function AuthenticatedComponent(props: P) {
    return (
      <AuthGuard
        redirectTo={redirectTo}
        requireAuth={requireAuth}
        fallback={fallback}
      >
        <WrappedComponent {...props} />
      </AuthGuard>
    );
  }

  // Set display name for debugging
  const wrappedComponentName = WrappedComponent.displayName || WrappedComponent.name || 'Component';
  AuthenticatedComponent.displayName = `withAuth(${wrappedComponentName})`;

  return AuthenticatedComponent;
}

/**
 * Protect a page component that requires authentication
 */
export function withProtectedPage<P extends object>(Component: ComponentType<P>) {
  return withAuth(Component, { requireAuth: true });
}

/**
 * Protect a page component that should only be accessible to unauthenticated users
 * (e.g., login, register pages)
 */
export function withGuestPage<P extends object>(Component: ComponentType<P>) {
  return withAuth(Component, { 
    requireAuth: false,
    redirectTo: '/tasks',
  });
}
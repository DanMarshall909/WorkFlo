'use client';

import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';

interface AuthGuardProps {
  children: ReactNode;
  redirectTo?: string;
  requireAuth?: boolean;
  fallback?: ReactNode;
}

export default function AuthGuard({ 
  children, 
  redirectTo = '/auth/login',
  requireAuth = true,
  fallback = <AuthGuardLoading />
}: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return; // Don't redirect while loading

    if (requireAuth && !isAuthenticated) {
      // User needs to be authenticated but isn't
      router.push(redirectTo);
    } else if (!requireAuth && isAuthenticated) {
      // User is authenticated but shouldn't be (e.g., login/register pages)
      router.push('/tasks'); // Default authenticated route
    }
  }, [isAuthenticated, isLoading, requireAuth, redirectTo, router]);

  // Show loading state while determining auth status
  if (isLoading) {
    return <>{fallback}</>;
  }

  // Show loading state while redirecting
  if (requireAuth && !isAuthenticated) {
    return <>{fallback}</>;
  }

  // Show loading state while redirecting authenticated users away from auth pages
  if (!requireAuth && isAuthenticated) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

function AuthGuardLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4 animate-pulse">
          <span className="text-on-primary font-bold text-xl">A</span>
        </div>
        <div className="space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-on-surface-variant">Loading...</p>
        </div>
      </div>
    </div>
  );
}
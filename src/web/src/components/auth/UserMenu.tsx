'use client';

import { useState } from 'react';
import { useAuth } from '@/providers/auth-provider';
import Link from 'next/link';

export default function UserMenu() {
  const { user, logout, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center space-x-4">
        <Link
          href="/auth/login"
          className="text-on-surface-variant hover:text-on-surface transition-colors"
        >
          Sign in
        </Link>
        <Link
          href="/auth/register"
          className="btn-primary text-sm"
        >
          Sign up
        </Link>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 p-2 rounded-lg hover:bg-surface-variant transition-colors"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
          <span className="text-on-primary font-medium text-sm">
            {user.email.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="hidden sm:block text-left">
          <p className="text-sm font-medium text-on-surface">
            {user.name || user.email.split('@')[0]}
          </p>
          <p className="text-xs text-on-surface-variant">{user.email}</p>
        </div>
        <svg
          className={`w-4 h-4 text-on-surface-variant transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu */}
          <div className="absolute right-0 mt-2 w-56 bg-surface border border-border rounded-lg shadow-medium z-20">
            <div className="p-4 border-b border-border">
              <p className="text-sm font-medium text-on-surface">
                {user.name || user.email.split('@')[0]}
              </p>
              <p className="text-xs text-on-surface-variant">{user.email}</p>
            </div>

            <div className="py-2">
              <Link
                href="/tasks"
                className="block px-4 py-2 text-sm text-on-surface hover:bg-surface-variant transition-colors"
                onClick={() => setIsOpen(false)}
              >
                My Tasks
              </Link>
              <Link
                href="/sessions"
                className="block px-4 py-2 text-sm text-on-surface hover:bg-surface-variant transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Sessions
              </Link>
              <Link
                href="/profile"
                className="block px-4 py-2 text-sm text-on-surface hover:bg-surface-variant transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Profile
              </Link>
              <Link
                href="/settings"
                className="block px-4 py-2 text-sm text-on-surface hover:bg-surface-variant transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Settings
              </Link>
            </div>

            <div className="border-t border-border py-2">
              <button
                onClick={() => {
                  setIsOpen(false);
                  logout();
                }}
                className="block w-full text-left px-4 py-2 text-sm text-error hover:bg-surface-variant transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
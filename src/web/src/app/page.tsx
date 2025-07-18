'use client';

import Link from 'next/link';
import { ArrowRight, Brain, Shield, Zap } from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';
import UserMenu from '@/components/auth/UserMenu';

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();

  // Show different content for authenticated users
  if (!isLoading && isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto p-6">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="heading-primary mb-2">Welcome back to Anchor</h1>
              <p className="text-description">Ready to focus and get things done?</p>
            </div>
            <UserMenu />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card card-padding">
              <h2 className="heading-secondary mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <Link href="/tasks" className="btn-gradient-primary w-full justify-center">
                  View My Tasks
                </Link>
                <Link href="/tasks/create" className="btn-secondary w-full justify-center">
                  Create New Task
                </Link>
                <Link href="/sessions/start" className="btn-outline w-full justify-center">
                  Start Focus Session
                </Link>
              </div>
            </div>

            <div className="card card-padding">
              <h2 className="heading-secondary mb-4">Focus Tips</h2>
              <ul className="space-y-2 text-sm text-on-surface-variant">
                <li>• Start with your energy level in mind</li>
                <li>• Break large tasks into smaller chunks</li>
                <li>• Use timers to maintain focus</li>
                <li>• Celebrate small wins</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-calm-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-focus-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <h1 className="text-xl font-semibold text-calm-900">Anchor</h1>
            </div>
            <nav className="flex space-x-4">
              <Link
                href="/auth/login"
                className="text-calm-600 hover:text-calm-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/auth/register"
                className="bg-focus-500 hover:bg-focus-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Get Started
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="bg-gradient-to-br from-focus-50 to-deep-50 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-4xl font-bold text-calm-900 mb-6">
                Task Management Built for
                <span className="text-focus-600"> ADHD Minds</span>
              </h2>
              <p className="text-xl text-calm-600 mb-8 max-w-3xl mx-auto">
                Stay grounded and focused with privacy-first productivity tools designed
                specifically for neurodivergent thinking patterns.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/auth/register"
                  className="inline-flex items-center px-6 py-3 bg-focus-500 hover:bg-focus-600 text-white font-medium rounded-lg transition-colors"
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <Link
                  href="#features"
                  className="inline-flex items-center px-6 py-3 border border-calm-300 hover:border-calm-400 text-calm-700 font-medium rounded-lg transition-colors"
                >
                  Learn More
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h3 className="text-3xl font-bold text-calm-900 mb-4">Designed for Your Brain</h3>
              <p className="text-lg text-calm-600 max-w-2xl mx-auto">
                Every feature is built with ADHD challenges and strengths in mind.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Progressive Nudging */}
              <div className="text-center p-6 rounded-lg border border-calm-200 hover:border-focus-300 transition-colors">
                <div className="w-12 h-12 bg-energy-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Zap className="h-6 w-6 text-energy-600" />
                </div>
                <h4 className="text-xl font-semibold text-calm-900 mb-3">Gentle Nudging</h4>
                <p className="text-calm-600">
                  Progressive reminders that respect hyperfocus states while gently redirecting when
                  you drift off task.
                </p>
              </div>

              {/* ADHD-Friendly Design */}
              <div className="text-center p-6 rounded-lg border border-calm-200 hover:border-focus-300 transition-colors">
                <div className="w-12 h-12 bg-deep-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Brain className="h-6 w-6 text-deep-600" />
                </div>
                <h4 className="text-xl font-semibold text-calm-900 mb-3">Neurodivergent UI</h4>
                <p className="text-calm-600">
                  High contrast, reduced motion, and clear visual hierarchy designed to minimize
                  cognitive load and distractions.
                </p>
              </div>

              {/* Privacy First */}
              <div className="text-center p-6 rounded-lg border border-calm-200 hover:border-focus-300 transition-colors">
                <div className="w-12 h-12 bg-focus-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-6 w-6 text-focus-600" />
                </div>
                <h4 className="text-xl font-semibold text-calm-900 mb-3">Privacy Protected</h4>
                <p className="text-calm-600">
                  Your data stays local by default. Optional sync with end-to-end encryption. No
                  tracking, no ads, no data mining.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-calm-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h3 className="text-3xl font-bold text-calm-900 mb-4">Ready to Stay Anchored?</h3>
            <p className="text-lg text-calm-600 mb-8 max-w-2xl mx-auto">
              Join thousands of ADHD minds who have found their focus with Anchor.
            </p>
            <Link
              href="/auth/register"
              className="inline-flex items-center px-8 py-4 bg-focus-500 hover:bg-focus-600 text-white font-semibold rounded-lg text-lg transition-colors"
            >
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-calm-900 text-calm-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-6 h-6 bg-focus-500 rounded-md flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <span className="font-semibold">Anchor</span>
            </div>
            <p className="text-sm">Made with ❤️ for neurodivergent minds. Privacy-first, always.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

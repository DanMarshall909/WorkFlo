import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/providers/theme-provider';
import { AuthProvider } from '@/providers/auth-provider';
import { VERSION_INFO } from '@/lib/version';
import '@/services/bootstrap'; // Initialize services
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Anchor - ADHD-Friendly Task Management',
  description: 'Privacy-first productivity tool designed specifically for ADHD minds',
  keywords: ['ADHD', 'productivity', 'task management', 'privacy', 'focus'],
  authors: [{ name: 'Anchor Team' }],
  generator: `Anchor v${VERSION_INFO.version}`,
  robots: {
    index: false, // Privacy-first: no indexing
    follow: false,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Anchor',
  },
  formatDetection: {
    telephone: false, // Prevent auto-linking phone numbers
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Prevent zoom on mobile for consistent UI
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#22c55e' },
    { media: '(prefers-color-scheme: dark)', color: '#4ade80' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body
        className={`${inter.className} h-full bg-background text-on-background antialiased safe-all`}
      >
        <ThemeProvider defaultTheme="system">
          <AuthProvider>
            {/* Skip link for accessibility */}
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-on-primary px-4 py-2 rounded-md z-modal touch-target"
            >
              Skip to main content
            </a>

            <div id="main-content" className="h-full min-h-screen">
              {children}
            </div>

            {/* Root portal for modals and toasts */}
            <div id="portal-root" />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

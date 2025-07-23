/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    screens: {
      // Mobile devices
      'xs': '375px',   // Small phones (iPhone SE, etc.)
      'sm': '640px',   // Large phones / small tablets
      
      // Tablets
      'md': '768px',   // Standard tablets (iPad, etc.)
      'lg': '1024px',  // Large tablets / small laptops
      
      // Laptops and desktops
      'xl': '1280px',  // Standard laptops
      '2xl': '1536px', // Large laptops / small desktops
      '3xl': '1792px', // Large desktops
      '4xl': '2048px', // Ultra-wide monitors
      
      // Height-based breakpoints for mobile landscape/portrait
      'h-sm': { 'raw': '(min-height: 640px)' },
      'h-md': { 'raw': '(min-height: 768px)' },
      'h-lg': { 'raw': '(min-height: 1024px)' },
      
      // Specific device targeting
      'mobile-s': { 'raw': '(max-width: 374px)' }, // Very small phones
      'mobile-m': { 'raw': '(min-width: 375px) and (max-width: 424px)' }, // Standard phones
      'mobile-l': { 'raw': '(min-width: 425px) and (max-width: 767px)' }, // Large phones
      'tablet': { 'raw': '(min-width: 768px) and (max-width: 1023px)' }, // Tablets only
      'laptop': { 'raw': '(min-width: 1024px) and (max-width: 1439px)' }, // Laptops only
      'desktop': { 'raw': '(min-width: 1440px)' }, // Large screens
      
      // Orientation-specific
      'portrait': { 'raw': '(orientation: portrait)' },
      'landscape': { 'raw': '(orientation: landscape)' },
      
      // Touch vs non-touch devices
      'touch': { 'raw': '(hover: none) and (pointer: coarse)' },
      'no-touch': { 'raw': '(hover: hover) and (pointer: fine)' },
    },
    extend: {
      // ADHD-friendly color palette with CSS variables for theming
      colors: {
        // Theme-aware colors using CSS variables
        background: 'var(--color-background)',
        surface: 'var(--color-surface)',
        'surface-variant': 'var(--color-surfaceVariant)',
        
        'on-background': 'var(--color-onBackground)',
        'on-surface': 'var(--color-onSurface)',
        'on-surface-variant': 'var(--color-onSurfaceVariant)',
        
        primary: 'var(--color-primary)',
        'on-primary': 'var(--color-onPrimary)',
        'primary-container': 'var(--color-primaryContainer)',
        'on-primary-container': 'var(--color-onPrimaryContainer)',
        
        secondary: 'var(--color-secondary)',
        'on-secondary': 'var(--color-onSecondary)',
        'secondary-container': 'var(--color-secondaryContainer)',
        'on-secondary-container': 'var(--color-onSecondaryContainer)',
        
        tertiary: 'var(--color-tertiary)',
        'on-tertiary': 'var(--color-onTertiary)',
        'tertiary-container': 'var(--color-tertiaryContainer)',
        'on-tertiary-container': 'var(--color-onTertiaryContainer)',
        
        error: 'var(--color-error)',
        'on-error': 'var(--color-onError)',
        warning: 'var(--color-warning)',
        'on-warning': 'var(--color-onWarning)',
        success: 'var(--color-success)',
        'on-success': 'var(--color-onSuccess)',
        
        border: 'var(--color-border)',
        'border-variant': 'var(--color-borderVariant)',
        divider: 'var(--color-divider)',
        
        // Static colors for backwards compatibility
        focus: {
          50: '#f0f9f4',
          100: '#dcf4e4',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
        },
        energy: {
          50: '#fff7ed',
          100: '#ffedd5',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
        },
        deep: {
          50: '#faf5ff',
          100: '#f3e8ff',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7c3aed',
        },
        calm: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
      },
      
      // Responsive spacing system
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '88': '22rem',
        '100': '25rem',
        '112': '28rem',
        '128': '32rem',
        // Dynamic spacing based on screen size
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
      
      // Container sizes for different breakpoints
      container: {
        center: true,
        padding: {
          DEFAULT: '1rem',
          xs: '1rem',
          sm: '1.5rem',
          md: '2rem',
          lg: '2.5rem',
          xl: '3rem',
          '2xl': '4rem',
        },
        screens: {
          xs: '375px',
          sm: '640px',
          md: '768px',
          lg: '1024px',
          xl: '1280px',
          '2xl': '1400px',
        },
      },
      
      // Typography system with responsive sizing
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
        '7xl': ['4.5rem', { lineHeight: '1' }],
        '8xl': ['6rem', { lineHeight: '1' }],
        '9xl': ['8rem', { lineHeight: '1' }],
        
        // Responsive typography
        'responsive-xs': 'clamp(0.75rem, 2vw, 0.875rem)',
        'responsive-sm': 'clamp(0.875rem, 2.5vw, 1rem)',
        'responsive-base': 'clamp(1rem, 3vw, 1.125rem)',
        'responsive-lg': 'clamp(1.125rem, 3.5vw, 1.25rem)',
        'responsive-xl': 'clamp(1.25rem, 4vw, 1.5rem)',
        'responsive-2xl': 'clamp(1.5rem, 5vw, 2rem)',
        'responsive-3xl': 'clamp(1.875rem, 6vw, 2.5rem)',
        'responsive-4xl': 'clamp(2.25rem, 7vw, 3rem)',
      },
      
      // Animation improvements for reduced motion
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'slide-left': 'slideLeft 0.3s ease-out',
        'slide-right': 'slideRight 0.3s ease-out',
        'pulse-gentle': 'pulseGentle 2s ease-in-out infinite',
        'bounce-gentle': 'bounceGentle 1s ease-in-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'scale-out': 'scaleOut 0.2s ease-in',
      },
      
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideLeft: {
          '0%': { transform: 'translateX(10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideRight: {
          '0%': { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        pulseGentle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        scaleOut: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(0.95)', opacity: '0' },
        },
      },
      
      // Typography improvements
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      },
      
      // Box shadow system
      boxShadow: {
        'soft': '0 2px 8px rgba(0, 0, 0, 0.04)',
        'medium': '0 4px 16px rgba(0, 0, 0, 0.08)',
        'strong': '0 8px 32px rgba(0, 0, 0, 0.12)',
        'interactive': '0 4px 16px rgba(34, 197, 94, 0.16)', // focus color
      },
      
      // Border radius system
      borderRadius: {
        'xs': '0.25rem',
        'sm': '0.375rem',
        'md': '0.5rem',
        'lg': '0.75rem',
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      
      // Z-index system
      zIndex: {
        'modal': '1000',
        'dropdown': '100',
        'sticky': '10',
        'fixed': '20',
        'overlay': '50',
        'toast': '60',
        'tooltip': '70',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    
    // Custom plugin for responsive utilities
    function({ addUtilities, theme }) {
      const newUtilities = {
        // Safe area utilities for mobile devices
        '.safe-top': {
          paddingTop: 'env(safe-area-inset-top)',
        },
        '.safe-bottom': {
          paddingBottom: 'env(safe-area-inset-bottom)',
        },
        '.safe-left': {
          paddingLeft: 'env(safe-area-inset-left)',
        },
        '.safe-right': {
          paddingRight: 'env(safe-area-inset-right)',
        },
        '.safe-x': {
          paddingLeft: 'env(safe-area-inset-left)',
          paddingRight: 'env(safe-area-inset-right)',
        },
        '.safe-y': {
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        },
        '.safe-all': {
          padding: 'env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)',
        },
        
        // Touch-friendly sizing
        '.touch-target': {
          minWidth: '44px',
          minHeight: '44px',
        },
        
        // Fluid typography
        '.text-fluid-sm': {
          fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
        },
        '.text-fluid-base': {
          fontSize: 'clamp(1rem, 3vw, 1.125rem)',
        },
        '.text-fluid-lg': {
          fontSize: 'clamp(1.125rem, 3.5vw, 1.25rem)',
        },
        '.text-fluid-xl': {
          fontSize: 'clamp(1.25rem, 4vw, 1.5rem)',
        },
        '.text-fluid-2xl': {
          fontSize: 'clamp(1.5rem, 5vw, 2rem)',
        },
        '.text-fluid-3xl': {
          fontSize: 'clamp(1.875rem, 6vw, 2.5rem)',
        },
      };
      
      addUtilities(newUtilities, ['responsive']);
    },
  ],
  // Dark mode support
  darkMode: 'class',
};
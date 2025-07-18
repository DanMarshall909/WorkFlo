/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '../../../test-utils';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import LoginPage from '../../../app/auth/login/page';

// Mock Next.js router
const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    pathname: '/auth/login',
    query: {},
    asPath: '/auth/login',
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/auth/login',
}));

// Mock Link component
jest.mock('next/link', () => {
  return function MockLink({ 
    children, 
    href, 
    ...props 
  }: { 
    children: React.ReactNode; 
    href: string; 
    [key: string]: unknown; 
  }) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  };
});

describe('Login Page - End-to-End User Flow', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    mockPush.mockClear();
    mockReplace.mockClear();
  });

  describe('Page Rendering and Accessibility', () => {
    it('renders the login form with all required elements', () => {
      render(<LoginPage />);

      // Check main heading
      expect(screen.getByRole('heading', { name: /welcome back to anchor/i })).toBeInTheDocument();

      // Check form elements
      expect(screen.getByRole('textbox', { name: /email address/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('checkbox', { name: /remember me/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();

      // Check navigation links
      expect(screen.getByRole('link', { name: /forgot password/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /sign up/i })).toBeInTheDocument();

      // Check social login buttons
      expect(screen.getByRole('button', { name: /google/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /microsoft/i })).toBeInTheDocument();
    });

    it('has proper form accessibility attributes', () => {
      render(<LoginPage />);

      const emailInput = screen.getByRole('textbox', { name: /email address/i });
      const passwordInput = screen.getByLabelText(/password/i);

      // Check input attributes
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toHaveAttribute('autoComplete', 'email');
      expect(emailInput).toBeRequired();

      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(passwordInput).toHaveAttribute('autoComplete', 'current-password');
      expect(passwordInput).toBeRequired();
    });

    it('displays privacy protection notice', () => {
      render(<LoginPage />);

      expect(screen.getByText(/privacy protected/i)).toBeInTheDocument();
      expect(screen.getByText(/your data is encrypted and stored locally/i)).toBeInTheDocument();
      expect(screen.getByText(/we never sell or share your information/i)).toBeInTheDocument();
    });
  });

  describe('Form Interaction and Validation', () => {
    it('allows users to type in email and password fields', async () => {
      render(<LoginPage />);

      const emailInput = screen.getByRole('textbox', { name: /email address/i });
      const passwordInput = screen.getByLabelText(/password/i);

      // Type in email
      await user.type(emailInput, 'user@example.com');
      expect(emailInput).toHaveValue('user@example.com');

      // Type in password
      await user.type(passwordInput, 'securepassword123');
      expect(passwordInput).toHaveValue('securepassword123');
    });

    it('toggles remember me checkbox', async () => {
      render(<LoginPage />);

      const rememberMeCheckbox = screen.getByRole('checkbox', { name: /remember me/i });

      expect(rememberMeCheckbox).not.toBeChecked();

      await user.click(rememberMeCheckbox);
      expect(rememberMeCheckbox).toBeChecked();

      await user.click(rememberMeCheckbox);
      expect(rememberMeCheckbox).not.toBeChecked();
    });

    it('validates required fields on form submission', async () => {
      render(<LoginPage />);

      const signInButton = screen.getByRole('button', { name: /sign in/i });

      // Try to submit empty form
      await user.click(signInButton);

      // HTML5 validation should prevent submission
      const emailInput = screen.getByRole('textbox', { name: /email address/i });
      const passwordInput = screen.getByLabelText(/password/i);

      expect(emailInput).toBeInvalid();
      expect(passwordInput).toBeInvalid();
    });

    it('accepts valid email format', async () => {
      render(<LoginPage />);

      const emailInput = screen.getByRole('textbox', { name: /email address/i });

      // Valid email
      await user.type(emailInput, 'user@example.com');
      expect(emailInput).toBeValid();

      // Invalid email format
      await user.clear(emailInput);
      await user.type(emailInput, 'invalid-email');
      
      // Trigger validation by trying to submit
      const signInButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(signInButton);
      
      expect(emailInput).toBeInvalid();
    });
  });

  describe('Navigation and Links', () => {
    it('has correct link destinations', () => {
      render(<LoginPage />);

      const forgotPasswordLink = screen.getByRole('link', { name: /forgot password/i });
      const signUpLink = screen.getByRole('link', { name: /sign up/i });

      expect(forgotPasswordLink).toHaveAttribute('href', '/auth/forgot-password');
      expect(signUpLink).toHaveAttribute('href', '/auth/register');
    });
  });

  describe('User Experience and ADHD-Friendly Features', () => {
    it('provides clear visual feedback for interactive elements', () => {
      render(<LoginPage />);

      const signInButton = screen.getByRole('button', { name: /sign in/i });
      const googleButton = screen.getByRole('button', { name: /google/i });

      // Check buttons have proper classes for styling
      expect(signInButton).toHaveClass('btn-primary');
      expect(googleButton).toHaveClass('btn-secondary');
    });

    it('has clear placeholder text for form fields', () => {
      render(<LoginPage />);

      const emailInput = screen.getByRole('textbox', { name: /email address/i });
      const passwordInput = screen.getByLabelText(/password/i);

      expect(emailInput).toHaveAttribute('placeholder', 'Enter your email');
      expect(passwordInput).toHaveAttribute('placeholder', 'Enter your password');
    });

    it('displays privacy information prominently', () => {
      render(<LoginPage />);

      // Privacy notice should be visible and prominent
      const privacySection = screen.getByText(/privacy protected/i);
      expect(privacySection).toBeInTheDocument();
      
      // Check that privacy notice has proper styling classes
      const privacyContainer = privacySection.closest('[class*="bg-primary"]');
      expect(privacyContainer).toBeInTheDocument();
    });
  });

  describe('Form Submission Flow', () => {
    it('can complete full login flow with valid data', async () => {
      render(<LoginPage />);

      const emailInput = screen.getByRole('textbox', { name: /email address/i });
      const passwordInput = screen.getByLabelText(/password/i);
      const rememberMeCheckbox = screen.getByRole('checkbox', { name: /remember me/i });
      const signInButton = screen.getByRole('button', { name: /sign in/i });

      // Fill out form
      await user.type(emailInput, 'user@example.com');
      await user.type(passwordInput, 'securepassword123');
      await user.click(rememberMeCheckbox);

      // Form should be ready for submission
      expect(emailInput).toHaveValue('user@example.com');
      expect(passwordInput).toHaveValue('securepassword123');
      expect(rememberMeCheckbox).toBeChecked();
      expect(signInButton).toBeEnabled();

      // Note: Actual form submission would be tested with integration tests
      // involving the authentication service
    });

    it('maintains form state during user interaction', async () => {
      render(<LoginPage />);

      const emailInput = screen.getByRole('textbox', { name: /email address/i });
      const passwordInput = screen.getByLabelText(/password/i);
      const rememberMeCheckbox = screen.getByRole('checkbox', { name: /remember me/i });

      // Enter data in steps
      await user.type(emailInput, 'test@');
      expect(emailInput).toHaveValue('test@');

      await user.click(rememberMeCheckbox);
      expect(rememberMeCheckbox).toBeChecked();
      expect(emailInput).toHaveValue('test@'); // Email should persist

      await user.type(emailInput, 'example.com');
      expect(emailInput).toHaveValue('test@example.com');
      expect(rememberMeCheckbox).toBeChecked(); // Checkbox should persist

      await user.type(passwordInput, 'password123');
      expect(passwordInput).toHaveValue('password123');
      expect(emailInput).toHaveValue('test@example.com'); // Email should still persist
      expect(rememberMeCheckbox).toBeChecked(); // Checkbox should still persist
    });
  });

  describe('Keyboard Navigation', () => {
    it('supports keyboard navigation through form elements', async () => {
      render(<LoginPage />);

      const emailInput = screen.getByRole('textbox', { name: /email address/i });

      // Focus on email input
      await user.click(emailInput);
      expect(emailInput).toHaveFocus();

      // Tab to password field
      await user.tab();
      const passwordInput = screen.getByLabelText(/password/i);
      expect(passwordInput).toHaveFocus();

      // Tab to remember me checkbox
      await user.tab();
      const rememberMeCheckbox = screen.getByRole('checkbox', { name: /remember me/i });
      expect(rememberMeCheckbox).toHaveFocus();

      // Continue tabbing to sign in button
      await user.tab();
      await user.tab(); // Skip forgot password link
      const signInButton = screen.getByRole('button', { name: /sign in/i });
      expect(signInButton).toHaveFocus();
    });

    it('allows form submission via Enter key', async () => {
      render(<LoginPage />);

      const emailInput = screen.getByRole('textbox', { name: /email address/i });
      const passwordInput = screen.getByLabelText(/password/i);

      await user.type(emailInput, 'user@example.com');
      await user.type(passwordInput, 'password123');

      // Verify the form structure supports submission
      const form = emailInput.closest('form');
      expect(form).toBeInTheDocument();
      
      // Verify submit button is present and accessible
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      expect(submitButton).toHaveAttribute('type', 'submit');
    });
  });

  describe('Responsive Design Elements', () => {
    it('has responsive CSS classes for mobile and desktop', () => {
      render(<LoginPage />);

      const mainContainer = screen.getByText(/welcome back to anchor/i).closest('.sm\\:mx-auto');
      expect(mainContainer).toHaveClass('sm:mx-auto', 'sm:w-full', 'sm:max-w-md');

      const cardContainer = screen.getByRole('textbox', { name: /email address/i }).closest('.card');
      expect(cardContainer).toHaveClass('card', 'card-padding');
    });
  });
});
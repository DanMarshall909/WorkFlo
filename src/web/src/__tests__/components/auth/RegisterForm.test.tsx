import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../../test-utils';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import RegisterForm from '@/components/auth/RegisterForm';
import { useAuth } from '@/providers/auth-provider';

// Mock the dependencies
jest.mock('next/navigation');

const mockPush = jest.fn();
const mockRegister = jest.fn();

// Mock useRouter
(useRouter as jest.Mock) = jest.fn(() => ({
  push: mockPush,
}));

// Mock useAuth
jest.mock('@/providers/auth-provider', () => ({
  useAuth: () => ({
    register: mockRegister,
  }),
}));

describe('RegisterForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPush.mockClear();
    mockRegister.mockClear();
  });

  it('should render all form fields', () => {
    render(<RegisterForm />);

    expect(screen.getByLabelText('Email address')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('should allow typing in password field', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    const passwordInput = screen.getByLabelText('Password');
    
    // Type a password
    await user.type(passwordInput, 'testpassword');
    expect(passwordInput).toHaveValue('testpassword');
  });

  it('should initially disable submit button', async () => {
    render(<RegisterForm />);

    const submitButton = screen.getByRole('button', { name: /create account/i });

    // Initially disabled (empty form)
    expect(submitButton).toBeDisabled();
  });

  it('should allow typing in form fields', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    const emailInput = screen.getByLabelText('Email address');
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password123');

    expect(emailInput).toHaveValue('test@example.com');
    expect(passwordInput).toHaveValue('password123');
    expect(confirmPasswordInput).toHaveValue('password123');
  });
});
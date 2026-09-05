import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, anonymousAuth } from './helpers.jsx';
import LoginPage from 'src/platform/auth/LoginPage.jsx';

describe('LoginPage', () => {
  it('renders the sign-in form', () => {
    renderWithProviders(<LoginPage />, { auth: anonymousAuth });
    expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/you@company.com/i)).toBeInTheDocument();
  });

  it('keeps submit disabled until both fields are filled', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />, { auth: anonymousAuth });
    const submit = screen.getByRole('button', { name: /^sign in$/i });
    expect(submit).toBeDisabled();

    await user.type(screen.getByPlaceholderText(/you@company.com/i), 't@example.com');
    expect(submit).toBeDisabled();               // email alone is not enough

    const password = document.querySelector('input[type="password"]');
    await user.type(password, 'hunter2');
    expect(submit).toBeEnabled();
  });

  it('submits the typed credentials to the auth context', async () => {
    const user = userEvent.setup();
    const login = vi.fn().mockResolvedValue({ user: { _id: 'u1' } });
    renderWithProviders(<LoginPage />, { auth: { ...anonymousAuth, login } });

    await user.type(screen.getByPlaceholderText(/you@company.com/i), 't@example.com');
    await user.type(document.querySelector('input[type="password"]'), 'hunter2');
    await user.click(screen.getByRole('button', { name: /^sign in$/i }));

    expect(login).toHaveBeenCalledWith('t@example.com', 'hunter2');
  });
});

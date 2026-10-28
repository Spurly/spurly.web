import { describe, it, expect, vi, beforeEach } from 'vitest';
import authController from 'src/core/auth/controller/auth.js';
import authGateway from 'src/core/auth/gateway/auth.js';
import EventEmitter from 'src/shared/utils/EventEmitter.js';
import { AuthResponse } from 'src/core/auth/entities/User.js';
import { AUTH_EVENTS } from 'src/core/auth/constants/constants.js';
import { isManagedSession, markManagedSession } from 'src/shared/utils/managedSession.js';

vi.mock('src/core/auth/gateway/auth.js', () => ({ default: { login: vi.fn(), logout: vi.fn() } }));

beforeEach(() => {
  authGateway.login.mockReset();
  authGateway.logout.mockReset();
});

describe('auth controller and the managed-session marker', () => {
  it('a normal sign-in clears the marker', async () => {
    markManagedSession();
    authGateway.login.mockResolvedValue(
      AuthResponse.fromResponse({ success: true, data: { user: { _id: '1', email: 'a@b.c' }, token: 't' } }),
    );
    await authController.login(new EventEmitter(), 'a@b.c', 'pw');
    expect(isManagedSession()).toBe(false);
  });

  it('logout tells the caller whether the session was managed, and keeps the marker for the ended page', async () => {
    markManagedSession();
    authGateway.logout.mockResolvedValue({});
    const emitter = new EventEmitter();
    const done = vi.fn();
    emitter.on(AUTH_EVENTS.LOGOUT_SUCCESS, done);
    await authController.logout(emitter);
    expect(done).toHaveBeenCalledWith({ managed: true });
    expect(isManagedSession()).toBe(true);
  });

  it('logout of a normal session reports managed: false', async () => {
    authGateway.logout.mockResolvedValue({});
    const emitter = new EventEmitter();
    const done = vi.fn();
    emitter.on(AUTH_EVENTS.LOGOUT_SUCCESS, done);
    await authController.logout(emitter);
    expect(done).toHaveBeenCalledWith({ managed: false });
  });
});

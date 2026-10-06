/**
 * The Sending hours tab: only what went out and when Spurly is quiet. No
 * allowances, no "left today", no account-wide ceiling, no per-action meters.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

const savePreferences = vi.fn();
let snapshot;

vi.mock('src/core/limits/hooks/useLimits.js', () => ({
  useLimits: () => ({ snapshot, loading: false, error: null, saving: false, saveError: null, savePreferences }),
}));

const { SendingLimitsTab } = await import('src/products/pages/accountSettings/components/SendingLimitsTab.jsx');

const win = (used) => ({ used, limit: 80, remaining: 80 - used, nextSlotAt: null });
const action = (key, label, group, day, week, capped) => ({
  action: key, label, group, capped, riskClass: 'W2', hour: win(0), day: win(day), week: win(week),
  status: { ok: true, reason: '', message: '', waitMs: 0 }, binding: null, backoff: null,
});

const baseSnapshot = () => ({
  timezone: 'Asia/Kolkata',
  connected: true,
  enforced: true,
  quiet: { enabled: true, startHour: 23, endHour: 6, activeNow: false },
  actions: [
    action('connect', 'Connection requests', 'outreach', 12, 48, true),
    action('message', 'Messages', 'outreach', 5, 30, true),
    action('follow', 'Follows', 'engagement', 3, 9, false),
  ],
});

describe('Sending hours tab', () => {
  it('shows what went out for connect and message, never what is "left"', () => {
    snapshot = baseSnapshot();
    render(<SendingLimitsTab />);
    expect(screen.getByText('Connection requests')).toBeTruthy();
    expect(screen.getByText('12 today · 48 this week')).toBeTruthy();
    expect(screen.getByText('Messages')).toBeTruthy();
    expect(screen.queryByText(/left today/i)).toBeNull();
    expect(screen.queryByText(/ceiling/i)).toBeNull();
    expect(screen.queryByText('Follows')).toBeNull();
  });

  it('keeps the quiet-hours switch, now described as four times slower', () => {
    snapshot = baseSnapshot();
    render(<SendingLimitsTab />);
    expect(screen.getByText('Slow down overnight')).toBeTruthy();
    expect(screen.getByText(/four times further apart/i)).toBeTruthy();
  });

  it('still warns when LinkedIn is not connected', () => {
    snapshot = { ...baseSnapshot(), connected: false };
    render(<SendingLimitsTab />);
    expect(screen.getByText(/LinkedIn is not connected/i)).toBeTruthy();
  });
});

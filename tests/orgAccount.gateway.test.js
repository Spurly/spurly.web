import { describe, test, expect, beforeEach } from 'vitest';
import { withActiveAccount, setActiveAccountId, getActiveAccountId, rememberAccounts } from 'src/shared/orgAccount/activeAccount.js';

/** The chosen org account rides on account-bound requests only, for that org member only. */
beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('user', JSON.stringify({ _id: 'u1' }));
});

describe('active org account', () => {
  test('nothing chosen: requests are untouched', () => {
    const config = { method: 'get', url: '/hub/profile-viewers' };
    expect(withActiveAccount(config).params).toBeUndefined();
  });

  test('a chosen account is added to account-bound GETs as a query param', () => {
    setActiveAccountId('acc1');
    for (const url of ['/hub/profile-viewers', '/hub/invitations/sent', '/hub/leads/L1/follow', '/hub/posts', '/hub/discover/usage', '/hub/companies/x', '/imported-leads/lookups']) {
      expect(withActiveAccount({ method: 'get', url }).params).toEqual({ accountId: 'acc1' });
    }
  });

  test('campaign and sequence creation carry it in the body', () => {
    setActiveAccountId('acc1');
    expect(withActiveAccount({ method: 'post', url: '/hub/campaigns', data: { name: 'c' } }).data).toEqual({ name: 'c', accountId: 'acc1' });
    expect(withActiveAccount({ method: 'post', url: '/hub/sequences', data: { name: 's' } }).data.accountId).toBe('acc1');
  });

  test('inbox, org settings and other calls are never touched; an explicit account wins', () => {
    setActiveAccountId('acc1');
    expect(withActiveAccount({ method: 'get', url: '/hub/inbox/chats' }).params).toBeUndefined();
    expect(withActiveAccount({ method: 'get', url: '/org/accounts' }).params).toBeUndefined();
    expect(withActiveAccount({ method: 'get', url: '/hub/posts', params: { accountId: 'other' } }).params.accountId).toBe('other');
    expect(withActiveAccount({ method: 'get', url: '/hub/posts?accountId=other' }).params).toBeUndefined();
  });

  test('a choice made for another user, or with nobody signed in, is ignored', () => {
    setActiveAccountId('acc1');
    localStorage.setItem('user', JSON.stringify({ _id: 'someone-else' }));
    expect(getActiveAccountId()).toBe('');
    localStorage.removeItem('user');
    expect(withActiveAccount({ method: 'get', url: '/hub/posts' }).params).toBeUndefined();
  });

  test('network, audience, sourcing and lead profile calls are account-bound too', () => {
    setActiveAccountId('acc1');
    for (const url of ['/hub/network', '/hub/audience/params', '/hub/sourcing/usage', '/hub/leads/L1/profile', '/hub/leads/enrich/queue']) {
      expect(withActiveAccount({ method: 'get', url }).params).toEqual({ accountId: 'acc1' });
    }
    expect(withActiveAccount({ method: 'post', url: '/hub/network/sync', data: {} }).data).toEqual({ accountId: 'acc1' });
  });

  test('the lead, audience, campaign and sequence lists are account-bound (account isolation)', () => {
    setActiveAccountId('acc1');
    for (const url of ['/hub/leads', '/hub/lead-companies', '/hub/searches', '/hub/campaigns', '/hub/sequences']) {
      expect(withActiveAccount({ method: 'get', url }).params).toEqual({ accountId: 'acc1' });
    }
    expect(withActiveAccount({ method: 'post', url: '/hub/lists', data: { name: 'l' } }).params).toEqual({ accountId: 'acc1' });
  });

  test('with several accounts known and none chosen, the first is used before any component mounts', () => {
    rememberAccounts('org1', [{ id: 'a1' }, { id: 'a2' }]);
    expect(getActiveAccountId()).toBe('a1');
    expect(withActiveAccount({ method: 'get', url: '/hub/network' }).params).toEqual({ accountId: 'a1' });
    setActiveAccountId('a2');
    expect(getActiveAccountId()).toBe('a2');
    setActiveAccountId('gone');
    expect(getActiveAccountId()).toBe('a1');
  });

  test('with one account known, no choice is added (the server uses it)', () => {
    rememberAccounts('org1', [{ id: 'a1' }]);
    expect(getActiveAccountId()).toBe('');
  });
});

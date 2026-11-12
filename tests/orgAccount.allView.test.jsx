import { describe, test, expect, beforeEach } from 'vitest';
import { withActiveAccount, setActiveAccountId, setAllAccountsView, isAllAccountsView, rememberAccounts, rememberLeadAccounts, getActiveAccountId } from 'src/shared/orgAccount/activeAccount.js';
import { hubLeadColumns, hubLeadColumnsForAllAccounts } from 'src/products/pages/leads/components/columns.jsx';

const accounts = [{ id: 'a1', name: 'Sarthak' }, { id: 'a2', name: 'Shivanshu' }];
const goto = (path) => window.history.pushState({}, '', path);

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('user', JSON.stringify({ _id: 'u1' }));
  rememberAccounts('org1', accounts);
  setActiveAccountId('a1');
  goto('/hub/leads');
});

describe('all-accounts view', () => {
  test('on the leads page the list reads carry no account, everything else still does', () => {
    setAllAccountsView(true);
    expect(isAllAccountsView()).toBe(true);
    for (const url of ['/hub/leads', '/hub/lead-companies', '/hub/searches', '/hub/searches/S1']) {
      expect(withActiveAccount({ method: 'get', url }).params).toBeUndefined();
    }
    expect(withActiveAccount({ method: 'post', url: '/hub/campaigns', data: {} }).data.accountId).toBe('a1');
    expect(withActiveAccount({ method: 'get', url: '/hub/discover/usage' }).params).toEqual({ accountId: 'a1' });
    expect(getActiveAccountId()).toBe('a1');
  });

  test('one lead acts through an account that holds it', () => {
    setAllAccountsView(true);
    rememberLeadAccounts([{ _id: 'L1', orgAccountIds: ['a2'] }, { _id: 'L2', orgAccountIds: ['a1', 'a2'] }]);
    expect(withActiveAccount({ method: 'post', url: '/hub/leads/L1/profile' }).params).toEqual({ accountId: 'a2' });
    expect(withActiveAccount({ method: 'post', url: '/hub/leads/L2/profile' }).params).toEqual({ accountId: 'a1' });
  });

  test('other pages ignore it, and choosing one account leaves it', () => {
    setAllAccountsView(true);
    goto('/hub/discover');
    expect(isAllAccountsView()).toBe(false);
    goto('/hub/leads');
    setActiveAccountId('a2');
    expect(isAllAccountsView()).toBe(false);
    expect(withActiveAccount({ method: 'get', url: '/hub/leads' }).params).toEqual({ accountId: 'a2' });
  });

  test('the fetch-account picker keeps the all view', () => {
    setAllAccountsView(true);
    setActiveAccountId('a2', { keepAll: true });
    expect(isAllAccountsView()).toBe(true);
    expect(getActiveAccountId()).toBe('a2');
  });

  test('one account only: no all view', () => {
    rememberAccounts('org1', [accounts[0]]);
    setAllAccountsView(true);
    expect(isAllAccountsView()).toBe(false);
  });
});

describe('all accounts is the default', () => {
  beforeEach(() => {
    localStorage.removeItem('orgActiveAccount');
  });

  test('with several accounts and no choice yet, leads and network both show every account', () => {
    for (const page of ['/hub/leads', '/hub/network']) {
      goto(page);
      expect(isAllAccountsView()).toBe(true);
    }
  });

  test('the network status read and "sync all" carry no account in the all view', () => {
    goto('/hub/network');
    expect(withActiveAccount({ method: 'get', url: '/hub/network' }).params).toBeUndefined();
    expect(withActiveAccount({ method: 'post', url: '/hub/network/sync', data: {} }).data.accountId).toBeUndefined();
  });

  test('the switcher filling in a first account by itself keeps the default', () => {
    setActiveAccountId('a1', { auto: true });
    goto('/hub/network');
    expect(isAllAccountsView()).toBe(true);
  });

  test('choosing one account turns it off, and choosing All turns it back on', () => {
    goto('/hub/network');
    setActiveAccountId('a2');
    expect(isAllAccountsView()).toBe(false);
    expect(withActiveAccount({ method: 'post', url: '/hub/network/sync', data: {} }).data.accountId).toBe('a2');
    setAllAccountsView(true);
    expect(isAllAccountsView()).toBe(true);
  });
});

describe('leads table in the all view', () => {
  test('no Degree column, a Found by column naming the accounts', () => {
    expect(hubLeadColumns.some((c) => c.key === 'connectionDegree')).toBe(true);
    const cols = hubLeadColumnsForAllAccounts(accounts);
    expect(cols.some((c) => c.key === 'connectionDegree')).toBe(false);
    const found = cols.find((c) => c.label === 'Found by');
    expect(found.title({ orgAccountIds: ['a1', 'a2'] })).toBe('Sarthak, Shivanshu');
  });
});

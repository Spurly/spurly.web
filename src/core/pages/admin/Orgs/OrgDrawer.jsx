import { useEffect, useMemo, useState, useCallback } from 'react';
import EventEmitter from 'src/shared/utils/EventEmitter.js';
import adminController from 'src/core/admin/controller/admin.js';
import { ADMIN_EVENTS } from 'src/core/admin/constants/constants.js';
import { Badge, Button, Drawer, Input, useConfirm, useToast } from 'src/core/primitives';
import { getToastError, getApiErrorMessage } from 'src/shared/utils/apiError';
import { Dropdown } from 'src/core/primitives/Dropdown';
import { OrgStatusBadge } from './orgColumns.jsx';
import { shortDate } from './format.js';

function Fact({ label, value }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className="text-[length:var(--ui-t-meta)] font-medium uppercase tracking-wider text-[var(--ui-text-secondary)]">{label}</span>
      <span className="truncate text-[length:var(--ui-t-body)] tabular-nums text-[var(--ui-text-primary)]">{value}</span>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-[length:var(--ui-t-label)] font-semibold text-[var(--ui-text-primary)]">{title}</h3>
      {children}
    </section>
  );
}

const INBOX_OPTIONS = [
  ['default', 'Default for this kind'],
  ['on', 'On'],
  ['off', 'Off'],
];

const ACCOUNT_TONE = { OK: 'success', CONNECTING: 'info', CREDENTIALS: 'warning', STOPPED: 'warning', DELETED: 'neutral' };
const ACCOUNT_LABEL = { OK: 'Connected', CONNECTING: 'Connecting', CREDENTIALS: 'Needs reconnect', STOPPED: 'Stopped', DELETED: 'Disconnected' };

/**
 * One org: partner, counts, usage, members, LinkedIn accounts, and suspend or
 * resume. Reports through its own emitter, so no async/await or try/catch here.
 * Suspending ends the members' access and makes the partner API answer 403 for
 * the org; nothing is disconnected, so the counts stay as they are.
 */
export function OrgDrawer({ orgId, onClose, onChanged }) {
  const toast = useToast();
  const confirm = useConfirm();
  const eventEmitter = useMemo(() => new EventEmitter(), []);
  const [org, setOrg] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [workspaceBusy, setWorkspaceBusy] = useState(false);
  const [inboxBusy, setInboxBusy] = useState(false);
  const [creditsBusy, setCreditsBusy] = useState(false);
  const [creditsAmount, setCreditsAmount] = useState('');

  const load = useCallback(() => {
    if (orgId) adminController.getOrg(eventEmitter, orgId);
  }, [eventEmitter, orgId]);

  useEffect(() => {
    function handleLoaded(data) {
      setOrg(data);
      setError('');
    }
    function handleLoadFailed(err) {
      setError(getApiErrorMessage(err, 'Failed to load the organization'));
    }
    function handleStatusSet() {
      setBusy(false);
      toast.success('Organization updated');
      load();
      onChanged?.();
    }
    function handleStatusFailed(err) {
      setBusy(false);
      toast.error(getToastError(err, "Couldn't change the organization's status"));
    }
    function handleInboxSet() {
      setInboxBusy(false);
      toast.success('Inbox setting updated');
      load();
      onChanged?.();
    }
    function handleInboxFailed(err) {
      setInboxBusy(false);
      toast.error(getToastError(err, "Couldn't change the inbox setting"));
    }
    function handleWorkspaceSet() {
      setWorkspaceBusy(false);
      toast.success('Workspace updated');
      load();
      onChanged?.();
    }
    function handleWorkspaceFailed(err) {
      setWorkspaceBusy(false);
      toast.error(getToastError(err, "Couldn't change the workspace"));
    }
    function handleCreditsAdded(data) {
      setCreditsBusy(false);
      setCreditsAmount('');
      toast.success(`Credits added. The pool now has ${data?.creditBalance ?? ''}.`);
      load();
    }
    function handleCreditsFailed(err) {
      setCreditsBusy(false);
      toast.error(getToastError(err, "Couldn't add credits"));
    }
    eventEmitter.on(ADMIN_EVENTS.ADD_ORG_CREDITS_SUCCESS, handleCreditsAdded);
    eventEmitter.on(ADMIN_EVENTS.ADD_ORG_CREDITS_FAILURE, handleCreditsFailed);
    eventEmitter.on(ADMIN_EVENTS.GET_ORG_SUCCESS, handleLoaded);
    eventEmitter.on(ADMIN_EVENTS.GET_ORG_FAILURE, handleLoadFailed);
    eventEmitter.on(ADMIN_EVENTS.SET_ORG_STATUS_SUCCESS, handleStatusSet);
    eventEmitter.on(ADMIN_EVENTS.SET_ORG_STATUS_FAILURE, handleStatusFailed);
    eventEmitter.on(ADMIN_EVENTS.SET_ORG_INBOX_SUCCESS, handleInboxSet);
    eventEmitter.on(ADMIN_EVENTS.SET_ORG_INBOX_FAILURE, handleInboxFailed);
    eventEmitter.on(ADMIN_EVENTS.SET_ORG_WORKSPACE_SUCCESS, handleWorkspaceSet);
    eventEmitter.on(ADMIN_EVENTS.SET_ORG_WORKSPACE_FAILURE, handleWorkspaceFailed);
    return () => {
      eventEmitter.off(ADMIN_EVENTS.GET_ORG_SUCCESS, handleLoaded);
      eventEmitter.off(ADMIN_EVENTS.GET_ORG_FAILURE, handleLoadFailed);
      eventEmitter.off(ADMIN_EVENTS.SET_ORG_STATUS_SUCCESS, handleStatusSet);
      eventEmitter.off(ADMIN_EVENTS.SET_ORG_STATUS_FAILURE, handleStatusFailed);
      eventEmitter.off(ADMIN_EVENTS.SET_ORG_INBOX_SUCCESS, handleInboxSet);
      eventEmitter.off(ADMIN_EVENTS.SET_ORG_INBOX_FAILURE, handleInboxFailed);
      eventEmitter.off(ADMIN_EVENTS.SET_ORG_WORKSPACE_SUCCESS, handleWorkspaceSet);
      eventEmitter.off(ADMIN_EVENTS.SET_ORG_WORKSPACE_FAILURE, handleWorkspaceFailed);
      eventEmitter.off(ADMIN_EVENTS.ADD_ORG_CREDITS_SUCCESS, handleCreditsAdded);
      eventEmitter.off(ADMIN_EVENTS.ADD_ORG_CREDITS_FAILURE, handleCreditsFailed);
    };
  }, [eventEmitter, toast, load, onChanged]);

  useEffect(() => {
    setOrg(null);
    setError('');
    load();
  }, [load]);

  const suspended = org?.status === 'suspended';

  function handleToggle() {
    const next = suspended ? 'active' : 'suspended';
    confirm({
      title: suspended ? 'Resume this organization?' : 'Suspend this organization?',
      description: suspended
        ? 'Its members can sign in again and the partner API accepts its requests.'
        : "Its members lose access and the partner API answers 403 for it. LinkedIn accounts stay connected, so the counts don't change.",
      confirmLabel: suspended ? 'Resume' : 'Suspend',
      tone: suspended ? 'primary' : 'danger',
    }).then((ok) => {
      if (!ok) return;
      setBusy(true);
      adminController.setOrgStatus(eventEmitter, orgId, next);
    });
  }

  const workspaceOn = org?.workspaceEnabled === true;

  const creditsNumber = Number(creditsAmount);
  const creditsValid = Number.isInteger(creditsNumber) && creditsNumber >= 1 && creditsNumber <= 100000;

  function handleAddCredits() {
    if (!creditsValid) return;
    setCreditsBusy(true);
    adminController.addOrgCredits(eventEmitter, orgId, creditsNumber, '');
  }

  const inboxMode = org?.inboxMode ?? 'default';
  const inboxEffective = inboxMode === 'on' || (inboxMode === 'default' && org?.kind === 'direct');
  function handleInboxChange(value) {
    if (value === inboxMode) return;
    setInboxBusy(true);
    adminController.setOrgInbox(eventEmitter, orgId, value);
  }

  function handleWorkspaceToggle() {
    const next = !workspaceOn;
    confirm({
      title: next ? 'Turn the workspace on?' : 'Turn the workspace off?',
      description: next
        ? "Spurly will keep this organization's inbox in the app, shared by its owner. It needs an owner who has signed in. Nothing is sent to LinkedIn."
        : 'Spurly stops syncing this organization right away. Nothing is deleted.',
      confirmLabel: next ? 'Turn on' : 'Turn off',
      tone: next ? 'primary' : 'danger',
    }).then((ok) => {
      if (!ok) return;
      setWorkspaceBusy(true);
      adminController.setOrgWorkspace(eventEmitter, orgId, next);
    });
  }

  return (
    <Drawer
      open={Boolean(orgId)}
      onClose={onClose}
      title={org ? org.name || org.externalId : 'Organization'}
      eyebrow="Organization"
      size="lg"
      footer={
        org && (
          <Button variant={suspended ? 'primary' : 'danger'} loading={busy} onClick={handleToggle}>
            {suspended ? 'Resume organization' : 'Suspend organization'}
          </Button>
        )
      }
    >
      <div className="flex flex-col gap-5 p-[var(--ui-pad-lg)]">
        {error && <p role="alert" className="text-[var(--ui-danger-fg)]">{error}</p>}
        {!org && !error && <p className="text-[var(--ui-text-secondary)]">Loading…</p>}
        {org && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <Fact label="Status" value={<OrgStatusBadge status={org.status} />} />
              <Fact label="Partner" value={org.partner?.name || org.partner?.slug || '—'} />
              <Fact label="Org id" value={org.externalId} />
              <Fact label="Created" value={shortDate(org.createdAt)} />
            </div>

            <Section title="LinkedIn accounts">
              <div className="grid grid-cols-3 gap-4">
                <Fact label="Connected now" value={org.accounts?.connected ?? 0} />
                <Fact label="30-day peak" value={org.usage?.peak?.count ?? 0} />
                <Fact label="Distinct, 30 days" value={org.usage?.distinct ?? 0} />
              </div>
              {org.accountList?.length ? (
                <ul className="flex flex-col divide-y divide-[var(--ui-border-hairline)] rounded-[var(--ui-radius-md)] border border-[var(--ui-border-hairline)]">
                  {org.accountList.map((a) => (
                    <li key={a.id} className="flex items-center justify-between gap-3 px-3 py-2">
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate font-medium text-[var(--ui-text-primary)]">{a.name || a.publicIdentifier || 'LinkedIn member'}</span>
                        <span className="truncate text-[length:var(--ui-t-meta)] text-[var(--ui-text-secondary)]">
                          {a.disconnectedAt ? `Disconnected ${shortDate(a.disconnectedAt)}` : `Connected ${shortDate(a.connectedAt)}`}
                        </span>
                      </span>
                      <Badge size="sm" tone={ACCOUNT_TONE[a.status] || 'neutral'}>{ACCOUNT_LABEL[a.status] || a.status}</Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[var(--ui-text-secondary)]">No LinkedIn accounts yet.</p>
              )}
            </Section>

            <Section title="Workspace">
              <div className="flex items-center justify-between gap-3 rounded-[var(--ui-radius-md)] border border-[var(--ui-border-hairline)] px-3 py-2">
                <span className="flex min-w-0 flex-col">
                  <span className="font-medium text-[var(--ui-text-primary)]">Shared inbox in the app</span>
                  <span className="text-[length:var(--ui-t-meta)] text-[var(--ui-text-secondary)]">
                    {workspaceOn ? 'On. Spurly keeps this organization\'s inbox for its owner.' : 'Off. Nothing of this organization is stored.'}
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  <Badge size="sm" tone={workspaceOn ? 'success' : 'neutral'}>{workspaceOn ? 'On' : 'Off'}</Badge>
                  <Button size="sm" variant={workspaceOn ? 'secondary' : 'primary'} loading={workspaceBusy} onClick={handleWorkspaceToggle}>
                    {workspaceOn ? 'Turn off' : 'Turn on'}
                  </Button>
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-[var(--ui-radius-md)] border border-[var(--ui-border-hairline)] px-3 py-2">
                <span className="flex min-w-0 flex-col">
                  <span className="font-medium text-[var(--ui-text-primary)]">Inbox</span>
                  <span className="text-[length:var(--ui-t-meta)] text-[var(--ui-text-secondary)]">
                    {inboxEffective
                      ? 'Spurly syncs this organization\'s conversations.'
                      : 'Off. Spurly does not sync conversations; the partner\'s app does.'}
                  </span>
                </span>
                <span className="w-44 shrink-0">
                  <Dropdown
                    id="org-inbox-mode"
                    ariaLabel="Inbox"
                    variant="dashboard"
                    value={inboxMode}
                    disabled={inboxBusy}
                    onChange={handleInboxChange}
                    options={INBOX_OPTIONS}
                  />
                </span>
              </div>
              {org.credits != null && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--ui-radius-md)] border border-[var(--ui-border-hairline)] px-3 py-2">
                  <Fact label="Credits in the pool" value={org.credits} />
                  <span className="flex items-end gap-2">
                    <Input
                      type="number"
                      min="1"
                      max="100000"
                      aria-label="Credits to add"
                      placeholder="Credits to add"
                      value={creditsAmount}
                      onChange={(e) => setCreditsAmount(e.target.value)}
                    />
                    <Button size="sm" variant="secondary" loading={creditsBusy} disabled={!creditsValid} onClick={handleAddCredits}>Add credits</Button>
                  </span>
                </div>
              )}
            </Section>

            <Section title="Members">
              {org.members?.length ? (
                <ul className="flex flex-col divide-y divide-[var(--ui-border-hairline)] rounded-[var(--ui-radius-md)] border border-[var(--ui-border-hairline)]">
                  {org.members.map((m) => (
                    <li key={m.email} className="flex items-center justify-between gap-3 px-3 py-2">
                      <span className="truncate text-[var(--ui-text-primary)]">{m.name ? `${m.name} · ${m.email}` : m.email}</span>
                      <Badge size="sm" tone="neutral">{m.role}</Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[var(--ui-text-secondary)]">Nobody has signed in to this organization yet.</p>
              )}
            </Section>
          </>
        )}
      </div>
    </Drawer>
  );
}

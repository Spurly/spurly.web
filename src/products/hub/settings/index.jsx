import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Linkedin, RefreshCw, AlertTriangle, Unlink } from 'lucide-react';
import { DashboardLayout } from 'src/platform/layout/DashboardLayout';
import { SectionCard } from 'src/ui/primitives/SectionCard';
import { Button, useToast, useConfirm, Skeleton } from 'src/ui/primitives';
import { getToastError } from 'src/shared/utils/apiError';
import { hubAccountApi } from './api.js';

/**
 * LinkedIn connection settings.
 *
 * A separate page rather than a tab on Settings, for two reasons: this belongs
 * to hub and the settings page belongs to leadgen (products never import each
 * other), and the server's hosted-auth flow already redirects back here.
 *
 * The state that matters is not "connected / not connected" — it is closer to
 * five, and each one needs different words and a different action. Getting that
 * wrong is how a user ends up staring at "Connected" while nothing sends.
 */

const STATUS_VIEW = {
  OK: {
    label: 'Connected',
    tone: 'var(--green)',
    tint: 'var(--green-tint)',
    detail: 'Spurly can send connection requests and messages as you.',
  },
  CONNECTING: {
    label: 'Setting up',
    tone: 'var(--text-tertiary)',
    tint: 'var(--surface-sunken)',
    detail: 'LinkedIn is syncing. This usually takes under a minute.',
  },
  CREDENTIALS: {
    label: 'Needs reconnecting',
    tone: 'var(--amber)',
    tint: 'var(--amber-tint)',
    detail: 'LinkedIn ended the session. Nothing will send until you reconnect.',
  },
  STOPPED: {
    label: 'Stopped',
    tone: 'var(--red)',
    tint: 'var(--red-tint)',
    detail: 'The connection stopped unexpectedly. Reconnect to resume sending.',
  },
  DELETED: {
    label: 'Disconnected',
    tone: 'var(--text-tertiary)',
    tint: 'var(--surface-sunken)',
    detail: 'This account was removed. Your campaign history is kept.',
  },
};

/** How the session died decides what we tell the user to expect next time. */
const RECONNECT_HINT = {
  cookies: 'This happens when you sign out of the browser you connected from.',
  credentials: 'This happens when the session is revoked in LinkedIn’s settings.',
};

export function LinkedInSettingsPage() {
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const toast = useToast();
  const confirm = useConfirm();
  const pollRef = useRef(null);

  /**
   * Fetch and apply, with every setState confined to a promise callback rather
   * than run straight down the effect body — which is what
   * react-hooks/set-state-in-effect is asking for, and it has a point: the
   * awaited version also had no way to stop, so leaving the page mid-request
   * set state on a component that was already gone.
   *
   * `signal` is optional because the click handlers call this too, and a
   * user-initiated reload has nothing to cancel against.
   */
  const load = useCallback((signal) => {
    const live = () => !signal?.aborted;
    return hubAccountApi.get()
      .then((next) => { if (live()) setAccount(next); })
      .catch((err) => {
        if (live()) toast.error(getToastError(err, 'Could not load your LinkedIn connection'));
      })
      .finally(() => { if (live()) setLoading(false); });
  }, [toast]);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  /**
   * The hosted flow redirects back here with ?linked=1 or ?linked=0. Read it
   * once, then strip it — otherwise a refresh replays the toast, and a shared
   * or bookmarked URL claims a success that never happened.
   */
  useEffect(() => {
    const linked = searchParams.get('linked');
    if (linked === null) return undefined;

    if (linked === '1') toast.success('LinkedIn connected');
    else toast.error('LinkedIn was not connected');

    setSearchParams({}, { replace: true });

    /**
     * Deliberately NOT cancelled on cleanup, unlike the mount load above.
     * Stripping the param changes searchParams, which re-runs this effect —
     * so a cleanup that aborted would kill the very request it just started,
     * and the page would keep showing the pre-connection account after a
     * connection that actually worked.
     */
    load();
    return undefined;
  }, [searchParams, setSearchParams, toast, load]);

  /**
   * While CONNECTING, poll — and every third tick ask the vendor directly
   * rather than reading our own database.
   *
   * Our database only advances when the vendor's webhook arrives. In
   * production that is near-instant; on a developer machine there is usually no
   * webhook reaching localhost at all, so a poll that only re-read our own
   * status would sit on "Setting up" forever and look broken. Asking the vendor
   * every 15s costs one request and makes the page correct in both places — and
   * in production it doubles as a safety net for a webhook that never lands.
   *
   * Capped rather than indefinite: if it has not settled in two minutes,
   * something is actually wrong and quietly retrying forever hides that.
   */
  useEffect(() => {
    clearInterval(pollRef.current);
    if (account?.status !== 'CONNECTING') return undefined;

    let elapsed = 0;
    let ticks = 0;

    pollRef.current = setInterval(() => {
      elapsed += 5000;
      ticks += 1;

      if (elapsed >= 120000) {
        clearInterval(pollRef.current);
        return;
      }
      // Cheap read most ticks; ask the vendor every third one.
      if (ticks % 3 === 0) {
        hubAccountApi.refresh().then(setAccount).catch(() => load());
      } else {
        load();
      }
    }, 5000);

    return () => clearInterval(pollRef.current);
  }, [account?.status, load]);

  const handleConnect = async () => {
    if (busy) return;

    /**
     * The tab is opened NOW, synchronously, and pointed at the URL once it
     * arrives. Opening it after the await would be a popup the browser blocks,
     * because by then the click is no longer what caused it.
     */
    const tab = window.open('', '_blank');
    setBusy(true);

    try {
      const { url } = await hubAccountApi.createLink();
      if (!url) throw new Error('No connection link was returned');

      if (tab) tab.location = url;
      else window.location.assign(url);
    } catch (err) {
      tab?.close();
      toast.error(getToastError(err, 'Could not start the LinkedIn connection'));
    } finally {
      setBusy(false);
    }
  };

  const handleRefresh = async () => {
    if (busy) return;
    setBusy(true);
    try {
      setAccount(await hubAccountApi.refresh());
    } catch (err) {
      toast.error(getToastError(err, 'Could not refresh the connection'));
    } finally {
      setBusy(false);
    }
  };

  const handleDisconnect = async () => {
    const ok = await confirm({
      title: 'Disconnect LinkedIn?',
      // Say what survives, not just what stops. The fear is losing work.
      message:
        'Spurly will stop sending on your behalf and any running campaigns will pause. '
        + 'Your leads, campaigns and history are kept, and you can reconnect at any time.',
      confirmLabel: 'Disconnect',
      destructive: true,
    });
    if (!ok) return;

    setBusy(true);
    try {
      await hubAccountApi.disconnect();
      toast.success('LinkedIn disconnected');
      await load();
    } catch (err) {
      toast.error(getToastError(err, 'Could not disconnect'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <DashboardLayout
      title="LinkedIn"
      subtitle="Let Spurly send from your LinkedIn account, without the extension."
    >
      <div className="p-[var(--ui-pad-lg)] max-w-[720px] flex flex-col gap-4">
        {loading ? (
          <SectionCard title="LinkedIn account">
            <div className="flex flex-col gap-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </SectionCard>
        ) : (
          <>
            <ConnectionCard
              account={account}
              busy={busy}
              onConnect={handleConnect}
              onRefresh={handleRefresh}
              onDisconnect={handleDisconnect}
            />
            {account?.connected && !account?.isPremium && <FreeAccountNotice />}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

/* ------------------------------------------------------------------ */

function ConnectionCard({ account, busy, onConnect, onRefresh, onDisconnect }) {
  const connected = Boolean(account?.status) && account.status !== 'DELETED';
  const view = STATUS_VIEW[account?.status] ?? null;

  if (!connected) {
    return (
      <SectionCard title="LinkedIn account">
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <span
              className="w-10 h-10 rounded-[var(--ui-radius-lg)] grid place-items-center shrink-0"
              style={{ background: 'var(--surface-sunken)', color: 'var(--text-tertiary)' }}
            >
              <Linkedin size={19} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[14px] font-medium text-[var(--text-primary)]">Not connected</div>
              <p className="text-[13px] text-[var(--text-secondary)] mt-0.5">
                Connect once and Spurly can send on a schedule, with your laptop closed.
              </p>
            </div>
          </div>

          <p className="text-[13px] text-[var(--text-secondary)]">
            You sign in on LinkedIn&rsquo;s own page through our provider.{' '}
            <span className="text-[var(--text-primary)] font-medium">
              Spurly never sees or stores your password.
            </span>
          </p>

          <div>
            <Button onClick={onConnect} disabled={busy} leadingIcon={<Linkedin size={15} />}>
              {busy ? 'Opening…' : 'Connect LinkedIn'}
            </Button>
          </div>
        </div>
      </SectionCard>
    );
  }

  const needsAction = account.needsReconnect || ['STOPPED', 'DELETED'].includes(account.status);

  return (
    <SectionCard title="LinkedIn account">
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <span
            className="w-10 h-10 rounded-[var(--ui-radius-lg)] grid place-items-center shrink-0"
            style={{ background: view?.tint, color: view?.tone }}
          >
            <Linkedin size={19} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[14px] font-medium" style={{ color: view?.tone }}>
              {view?.label ?? account.status}
            </div>
            <p className="text-[13px] text-[var(--text-secondary)] mt-0.5 truncate">
              {account.linkedinName || view?.detail}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={busy}
            leadingIcon={<RefreshCw size={15} />}
          >
            Refresh
          </Button>
        </div>

        {needsAction && (
          <div
            className="flex gap-2.5 rounded-[var(--ui-radius-md)] p-3"
            style={{ background: 'var(--amber-tint)' }}
          >
            <AlertTriangle size={16} className="shrink-0 mt-0.5" style={{ color: 'var(--amber)' }} />
            <div className="text-[13px] text-[var(--text-secondary)]">
              <div className="text-[var(--text-primary)] font-medium">{view?.detail}</div>
              {RECONNECT_HINT[account.connectionMethod] && (
                <p className="mt-0.5">{RECONNECT_HINT[account.connectionMethod]}</p>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          {needsAction && (
            <Button onClick={onConnect} disabled={busy} leadingIcon={<Linkedin size={15} />}>
              {busy ? 'Opening…' : 'Reconnect'}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onDisconnect}
            disabled={busy}
            leadingIcon={<Unlink size={15} />}
          >
            Disconnect
          </Button>
        </div>
      </div>
    </SectionCard>
  );
}

/**
 * Free LinkedIn accounts cap connection notes at 200 characters and allow only
 * a handful of personalised invites a month, after which LinkedIn sends the
 * invitation WITHOUT the note and reports nothing. Rather than let campaigns
 * quietly degrade into blank requests, personalised notes are turned off — and
 * the user is told why, before they build a campaign around them.
 */
function FreeAccountNotice() {
  return (
    <SectionCard title="Personalised invites">
      <p className="text-[13px] text-[var(--text-secondary)]">
        Your LinkedIn account is on the free plan, so connection requests will be sent
        without a note. LinkedIn limits free accounts to a few personalised invites each
        month and then silently drops the note — turning it off is the only way to be sure
        what your prospects actually receive.
      </p>
      <p className="text-[13px] text-[var(--text-secondary)] mt-2">
        LinkedIn Premium removes the limit, and Spurly enables notes automatically once it
        sees one.
      </p>
    </SectionCard>
  );
}

export default LinkedInSettingsPage;

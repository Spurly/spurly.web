import { Linkedin, RefreshCw, AlertTriangle, Unlink } from 'lucide-react';
import { SectionCard } from 'src/core/primitives/SectionCard';
import { Button } from 'src/core/primitives';
import { STATUS_VIEW, RECONNECT_HINT } from './statusView.js';
import { linkedInSettingsStrings as t } from '../strings.js';

export function ConnectionCard({ account, busy, onConnect, onRefresh, onDisconnect }) {
  const connected = Boolean(account?.status) && account.status !== 'DELETED';
  const view = STATUS_VIEW[account?.status] ?? null;

  if (!connected) {
    return (
      <SectionCard title={t.sectionTitle}>
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <span
              className="w-10 h-10 rounded-[var(--ui-radius-lg)] grid place-items-center shrink-0"
              style={{ background: 'var(--ui-surface-sunken)', color: 'var(--ui-text-tertiary)' }}
            >
              <Linkedin size={19} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[var(--ui-t-body)] font-medium text-[var(--ui-text-primary)]">{t.notConnected.title}</div>
              <p className="text-[var(--ui-t-body)] text-[var(--ui-text-secondary)] mt-0.5">
                {t.notConnected.body}
              </p>
            </div>
          </div>

          <p className="text-[var(--ui-t-body)] text-[var(--ui-text-secondary)]">
            {t.notConnected.authNoteBefore}
            <span className="text-[var(--ui-text-primary)] font-medium">
              {t.notConnected.authNoteBold}
            </span>
          </p>

          <div className="flex items-center gap-2">
            <Button onClick={onConnect} disabled={busy} leadingIcon={<Linkedin size={15} />}>
              {busy ? t.notConnected.connecting : t.notConnected.connect}
            </Button>
            {/* The way out of "I connected it and this still says no".
                Our row only learns about a connection through a callback the
                vendor sends to BACKEND_PUBLIC_URL — unreachable from a laptop,
                and missable anywhere. This asks the vendor directly, which is
                the same pull the server uses to adopt an account it can prove
                we asked for. Without it the only remedy was running hosted
                auth again, which is how people end up with two billed
                accounts. */}
            <Button variant="ghost" onClick={onRefresh} disabled={busy}>
              {busy ? t.notConnected.checking : t.notConnected.checkAgain}
            </Button>
          </div>
        </div>
      </SectionCard>
    );
  }

  const needsAction = account.needsReconnect || ['STOPPED', 'DELETED'].includes(account.status);

  return (
    <SectionCard title={t.sectionTitle}>
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <span
            className="w-10 h-10 rounded-[var(--ui-radius-lg)] grid place-items-center shrink-0"
            style={{ background: view?.tint, color: view?.tone }}
          >
            <Linkedin size={19} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[var(--ui-t-body)] font-medium" style={{ color: view?.tone }}>
              {view?.label ?? account.status}
            </div>
            <p className="text-[var(--ui-t-body)] text-[var(--ui-text-secondary)] mt-0.5 truncate">
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
            {t.connected.refresh}
          </Button>
        </div>

        {needsAction && (
          <div
            className="flex gap-2.5 rounded-[var(--ui-radius-md)] p-3"
            style={{ background: 'var(--ui-warning-tint)' }}
          >
            <AlertTriangle size={16} className="shrink-0 mt-0.5" style={{ color: 'var(--ui-warning)' }} />
            <div className="text-[var(--ui-t-body)] text-[var(--ui-text-secondary)]">
              <div className="text-[var(--ui-text-primary)] font-medium">{view?.detail}</div>
              {RECONNECT_HINT[account.connectionMethod] && (
                <p className="mt-0.5">{RECONNECT_HINT[account.connectionMethod]}</p>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          {needsAction && (
            <Button onClick={onConnect} disabled={busy} leadingIcon={<Linkedin size={15} />}>
              {busy ? t.connected.reconnecting : t.connected.reconnect}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onDisconnect}
            disabled={busy}
            leadingIcon={<Unlink size={15} />}
          >
            {t.connected.disconnect}
          </Button>
        </div>
      </div>
    </SectionCard>
  );
}

export default ConnectionCard;

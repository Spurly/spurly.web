import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, Pause, Play, Trash2, Radar } from 'lucide-react';
import { DashboardLayout } from 'src/platform/layout/DashboardLayout';
import { SectionCard } from 'src/ui/primitives/SectionCard';
import { Button, Badge, EmptyState, useToast, useConfirm } from 'src/ui/primitives';
import { getToastError } from 'src/shared/utils/apiError';
import { hubCampaignsApi } from './api.js';

export { CampaignDetailPage as HubCampaignDetailPage } from './CampaignDetailPage.jsx';

/**
 * Hub campaigns — the list.
 *
 * Campaigns are made from the leads page, not from here: an outreach campaign
 * with nobody in it is a row that can only disappoint, and the audience is the
 * decision that matters. So this page has no "New campaign" button and says
 * where to start instead.
 *
 * Progress is four counts and never a bar. A campaign's denominator does not
 * move but its numerator advances a handful of times an hour inside working
 * hours, so a bar would sit visibly still for most of a working day and read
 * as stuck.
 */

const POLL_MS = 10000;

const STATUS_VIEW = {
  draft: { label: 'Draft', tone: 'neutral', detail: 'Nothing has been sent. Start it when you are ready.' },
  running: { label: 'Running', tone: 'success', detail: 'Sending, paced through your working hours.' },
  paused: { label: 'Paused', tone: 'warning', detail: 'Stopped. The queue is intact.' },
  done: { label: 'Finished', tone: 'info', detail: 'Everyone in this campaign has been handled.' },
};

/** Only a running campaign has anything new to report. */
const isLive = (c) => c?.status === 'running';

function CountPills({ counts }) {
  const parts = [
    { key: 'invited', label: 'invited', tone: 'text-[var(--text-primary)]' },
    { key: 'pending', label: 'queued', tone: 'text-[var(--text-secondary)]' },
    { key: 'skipped', label: 'skipped', tone: 'text-[var(--text-tertiary)]' },
    { key: 'failed', label: 'failed', tone: 'text-[var(--ui-danger-fg)]' },
  ].filter((p) => (counts?.[p.key] ?? 0) > 0);

  // A brand-new campaign has only queued members; showing three zeroes next to
  // it would be noise dressed as data.
  if (parts.length === 0) return <span className="text-[12px] text-[var(--text-tertiary)]">empty</span>;

  return (
    <span className="flex items-center gap-3 text-[12px] tabular-nums">
      {parts.map((p) => (
        <span key={p.key} className={p.tone}>
          {counts[p.key].toLocaleString()} {p.label}
        </span>
      ))}
    </span>
  );
}

function CampaignRow({ campaign, onStart, onPause, onDelete, busy }) {
  const view = STATUS_VIEW[campaign.status] ?? STATUS_VIEW.draft;
  const running = isLive(campaign);

  return (
    <div className="flex items-center gap-3 px-[var(--ui-pad-lg)] py-3 border-b border-[var(--separator)] last:border-b-0">
      <Link to={`/hub/campaigns/${campaign._id}`} className="flex-1 min-w-0 group">
        <span className="block text-[13px] text-[var(--text-primary)] truncate group-hover:underline">
          {campaign.name}
        </span>
        <span className="block text-[11px] text-[var(--text-tertiary)] truncate">
          {campaign.note ? 'With a note' : 'No note'}
          {campaign.pausedReason === 'account' && ' · LinkedIn needs reconnecting'}
          {campaign.pausedReason === 'breaker' && ' · stopped after repeated failures'}
        </span>
      </Link>

      <CountPills counts={campaign.counts} />

      <Badge tone={view.tone} title={view.detail}>
        <span className="inline-flex items-center gap-1">
          {running && <Loader2 size={11} className="animate-spin" aria-hidden="true" />}
          {view.label}
        </span>
      </Badge>

      <div className="flex items-center gap-1 shrink-0">
        {running ? (
          <Button size="sm" variant="ghost" disabled={busy} onClick={() => onPause(campaign)} title="Stop sending">
            <Pause size={13} />
          </Button>
        ) : (
          <Button
            size="sm"
            variant="ghost"
            disabled={busy || campaign.status === 'done'}
            onClick={() => onStart(campaign)}
            title={campaign.status === 'paused' ? 'Resume sending' : 'Start sending'}
          >
            <Play size={13} />
          </Button>
        )}
        <Button size="sm" variant="ghost" disabled={busy} onClick={() => onDelete(campaign)} title="Remove this campaign">
          <Trash2 size={13} />
        </Button>
      </div>
    </div>
  );
}

export function HubCampaignsPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const toast = useToast();
  const confirm = useConfirm();
  const navigate = useNavigate();

  const mountedRef = useRef(true);
  /**
   * Set on every mount, not only cleared on unmount.
   *
   * StrictMode mounts, unmounts and remounts in development. A cleanup-only
   * version leaves this false for the life of the real mount, so every "am I
   * still on screen?" guard fails, every response is discarded, and the page
   * sits on its loading state over requests that plainly succeeded. It is
   * invisible in production, where the double invoke does not happen — which
   * is exactly what makes it worth a comment.
   */
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const load = useCallback(() => hubCampaignsApi.listCampaigns()
    .then((next) => { if (mountedRef.current) setCampaigns(next); })
    .catch((err) => { if (mountedRef.current) toast.error(getToastError(err, 'Could not load your campaigns')); })
    .finally(() => { if (mountedRef.current) setLoading(false); }), [toast]);

  useEffect(() => { load(); }, [load]);

  /**
   * Poll only while something is running, and slowly.
   *
   * Sending is measured in a handful an hour; a fast timer against a page most
   * users leave open would be a lot of requests to watch a number that changes
   * every few minutes at best. The tick carries no abort signal deliberately —
   * see the same note on the leads page, where an aborted final tick left the
   * table empty over a finished import.
   */
  const anyLive = campaigns.some(isLive);
  useEffect(() => {
    if (!anyLive) return undefined;
    const t = setInterval(load, POLL_MS);
    return () => clearInterval(t);
  }, [anyLive, load]);

  const act = async (fn, campaign, okMessage, failMessage) => {
    setBusy(true);
    try {
      await fn(campaign._id);
      toast.success(okMessage);
      await load();
    } catch (err) {
      toast.error(getToastError(err, failMessage));
    } finally {
      if (mountedRef.current) setBusy(false);
    }
  };

  const start = (campaign) => act(
    (id) => hubCampaignsApi.startCampaign(id),
    campaign,
    'Started. Sending is paced through your working hours.',
    'Could not start that campaign',
  );

  const pause = (campaign) => act(
    (id) => hubCampaignsApi.pauseCampaign(id),
    campaign,
    'Paused. Nobody else will be contacted.',
    'Could not pause that campaign',
  );

  const remove = async (campaign) => {
    const invited = campaign.counts?.invited ?? 0;
    const ok = await confirm({
      title: 'Remove this campaign?',
      // Says exactly what does NOT go away. Invitations already sent cannot be
      // taken back and still count against LinkedIn's weekly allowance, so a
      // vague "are you sure" would leave the user thinking deletion undoes them.
      body: invited
        ? `The ${invited.toLocaleString()} invitation(s) it already sent stay sent, and stay in your activity. Only the campaign and its queue are removed.`
        : 'Nothing has been sent from this campaign, so nothing is undone. The queue is removed.',
      confirmLabel: 'Remove',
    });
    if (!ok) return;
    act((id) => hubCampaignsApi.deleteCampaign(id), campaign, 'Campaign removed', 'Could not remove that campaign');
  };

  return (
    <DashboardLayout
      title="Campaigns"
      subtitle="Connection requests, sent from our servers on a human schedule."
    >
      {!loading && campaigns.length === 0 ? (
        <EmptyState
          icon={<Radar size={20} />}
          title="No campaigns yet"
          hint="Campaigns are built from your leads. Pick the people you want to reach, then create one from the selection."
          action={<Button onClick={() => navigate('/hub/leads')}>Go to leads</Button>}
        />
      ) : (
        <SectionCard title="Campaigns" noPadding>
          {loading ? (
            <p className="px-[var(--ui-pad-lg)] py-6 text-[13px] text-[var(--text-tertiary)]">Loading…</p>
          ) : (
            campaigns.map((campaign) => (
              <CampaignRow
                key={campaign._id}
                campaign={campaign}
                onStart={start}
                onPause={pause}
                onDelete={remove}
                busy={busy}
              />
            ))
          )}
        </SectionCard>
      )}
    </DashboardLayout>
  );
}

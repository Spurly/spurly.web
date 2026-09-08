import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Clock, Loader2, Lock, Pause, Play, RotateCcw } from 'lucide-react';
import { DashboardLayout } from 'src/platform/layout/DashboardLayout';
import { DataTable } from 'src/platform/DataTable';
import { SectionCard } from 'src/ui/primitives/SectionCard';
import { Button, Badge, useToast } from 'src/ui/primitives';
import { getToastError } from 'src/shared/utils/apiError';
import { relativeTime } from 'src/shared/utils/outreach';
import { hubCampaignsApi } from './api.js';
import { hubMemberColumns } from './columns.jsx';

/**
 * One campaign: what it will say, who is in it, and why it is or is not
 * sending right now.
 *
 * That last part is the reason this page is not just a table. A correctly
 * paced campaign sends a handful of invitations an hour, only inside the
 * user's working hours, and only while the shared weekly budget lasts — so for
 * most of the day a healthy campaign looks exactly like a broken one. The
 * server sends its verdict with every read; the banner below is that verdict
 * in words.
 */

const POLL_MS = 10000;

/**
 * `relativeTime` answers "just now" under a minute, which does not take the
 * " ago" every other value wants. Same guard DateCell makes.
 */
const sinceLabel = (value) => {
  const rel = relativeTime(value);
  return rel === 'just now' ? 'just now' : `${rel} ago`;
};

const STATUS_VIEW = {
  draft: { label: 'Draft', tone: 'neutral' },
  running: { label: 'Running', tone: 'success' },
  paused: { label: 'Paused', tone: 'warning' },
  done: { label: 'Finished', tone: 'info' },
};

/**
 * What the campaign is doing between sends.
 *
 * Only shown while running: on a draft it would be answering a question nobody
 * has asked yet, and on a paused campaign the pause is the answer.
 */
/**
 * The sender has stopped checking in.
 *
 * Shown ABOVE the pacing banner and instead of trusting it, because when the
 * worker is dead every word underneath is describing rules that nothing is
 * applying. This is the one state where the page must contradict the campaign's
 * own status.
 */
function SenderDownBanner({ sender }) {
  if (!sender?.expected || !sender.stale) return null;

  return (
    <div
      className="flex items-start gap-2 px-[var(--ui-pad-lg)] py-3 border-b border-[var(--separator)]"
      style={{ background: 'var(--ui-warning-tint)' }}
    >
      <AlertTriangle size={14} className="mt-0.5 shrink-0" style={{ color: 'var(--ui-warning-fg)' }} aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-[12px]" style={{ color: 'var(--ui-warning-fg)' }}>
          This campaign says it is running, but nothing has picked it up
          {sender.lastRunAt ? ` since ${sinceLabel(sender.lastRunAt)}` : ' yet'}.
          No invitations are going out.
        </p>
        <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">
          The scheduled sender checks in every minute. If this persists, it is not running.
        </p>
      </div>
    </div>
  );
}

function PacingBanner({ campaign, pacing, sender }) {
  if (!pacing || campaign.status !== 'running') return null;
  // A dead worker is not a pacing state, and saying "sending now" over one
  // would be the page's most confident lie.
  if (sender?.expected && sender.stale) return null;

  const sending = pacing.ok;
  return (
    <div
      className="flex items-start gap-2 px-[var(--ui-pad-lg)] py-3 border-b border-[var(--separator)]"
      style={{ background: sending ? 'var(--ui-success-tint)' : 'var(--ui-surface-sunken)' }}
    >
      <Clock size={14} className="mt-0.5 shrink-0 text-[var(--text-tertiary)]" aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-[12px] text-[var(--text-primary)]">
          {sending ? 'Sending now, a few at a time.' : pacing.message}
        </p>
        <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">
          {pacing.window.startHour}:00–{pacing.window.endHour}:00 {pacing.timezone.replace('_', ' ')} ·
          {' '}up to {pacing.hourlyCap}/hour ·
          {' '}{pacing.weekUsed} of {pacing.weeklyLimit} invitations used this week
          {/* Said explicitly because the number will not match this campaign's
              own count, and the difference is the whole point: LinkedIn counts
              invitations per person, so anything sent from the extension is
              spending the same allowance. */}
          {' '}across everything you send.
        </p>
        {/* The heartbeat, stated quietly when it is fine. A campaign that is
            deliberately idle and one that nothing is serving look identical
            without it. */}
        {sender?.lastRunAt && (
          <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">
            Sender last checked in {sinceLabel(sender.lastRunAt)}.
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * The note, and the reason it may be locked.
 *
 * On a free LinkedIn account the field is disabled rather than merely
 * ignored: LinkedIn allows about five personalised invitations a month and
 * then silently drops the note, so a campaign that offered the field would
 * quietly start sending blank requests while claiming otherwise.
 */
function NoteEditor({ campaign, account, onSave, saving }) {
  /**
   * Seeded once per saved note, and reset by remounting rather than by an
   * effect — the parent keys this component on the note it was given. The
   * page polls every ten seconds while running, so an effect that pushed the
   * server's value into state would fight anyone typing.
   */
  const [value, setValue] = useState(campaign.note || '');

  const locked = !account?.notesAllowed;
  const running = campaign.status === 'running';
  const cap = account?.noteCap ?? 200;
  const dirty = value !== (campaign.note || '');

  if (locked) {
    return (
      <div className="px-[var(--ui-pad-lg)] py-4 flex items-start gap-3">
        <Lock size={14} className="mt-0.5 shrink-0 text-[var(--text-tertiary)]" aria-hidden="true" />
        <div>
          <p className="text-[13px] text-[var(--text-primary)]">This campaign sends a plain connection request.</p>
          <p className="text-[12px] text-[var(--text-secondary)] mt-0.5">
            Notes need LinkedIn Premium. On a free account LinkedIn drops the note after about five
            invitations a month without saying so, so Spurly does not offer one rather than let a
            campaign quietly stop personalising halfway through.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-[var(--ui-pad-lg)] py-4 flex flex-col gap-2">
      <textarea
        value={value}
        maxLength={cap}
        rows={3}
        disabled={running}
        onChange={(e) => setValue(e.target.value)}
        aria-label="Connection note"
        placeholder="Say why you are reaching out…"
        className="w-full text-[13px] rounded-[var(--ui-radius-md)] border border-[var(--separator)] bg-[var(--ui-surface-card)] px-3 py-2 text-[var(--text-primary)] disabled:opacity-60"
      />
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-[var(--text-tertiary)]">
          {running
            ? 'Pause the campaign to change the note — the people already invited were sent the old one.'
            : `${value.length}/${cap} characters`}
        </span>
        <Button size="sm" disabled={running || !dirty || saving} onClick={() => onSave(value)}>
          {saving ? 'Saving…' : 'Save note'}
        </Button>
      </div>
    </div>
  );
}

export function CampaignDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [members, setMembers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0 });
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);

  const toast = useToast();
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

  const load = useCallback(() => hubCampaignsApi.getCampaign(id)
    .then((next) => { if (mountedRef.current) setData(next); })
    .catch((err) => { if (mountedRef.current) toast.error(getToastError(err, 'Could not load that campaign')); })
    .finally(() => { if (mountedRef.current) setLoading(false); }), [id, toast]);

  const loadMembers = useCallback((page = 1) => hubCampaignsApi
    .listMembers(id, { status: statusFilter || undefined, page })
    .then((res) => {
      if (!mountedRef.current) return;
      setMembers(res.members ?? []);
      setPagination(res.pagination ?? { page, limit: 50, total: 0 });
    })
    .catch((err) => { if (mountedRef.current) toast.error(getToastError(err, 'Could not load members')); }), [id, statusFilter, toast]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadMembers(1); }, [loadMembers]);

  const campaign = data?.campaign ?? null;
  const running = campaign?.status === 'running';

  useEffect(() => {
    if (!running) return undefined;
    const t = setInterval(() => { load().then(() => loadMembers(pagination.page)); }, POLL_MS);
    return () => clearInterval(t);
  }, [running, load, loadMembers, pagination.page]);

  const act = async (fn, okMessage, failMessage) => {
    setBusy(true);
    try {
      const result = await fn();
      toast.success(typeof okMessage === 'function' ? okMessage(result) : okMessage);
      await load();
      await loadMembers(pagination.page);
    } catch (err) {
      toast.error(getToastError(err, failMessage));
    } finally {
      if (mountedRef.current) setBusy(false);
    }
  };

  const saveNote = async (note) => {
    setSaving(true);
    try {
      await hubCampaignsApi.updateCampaign(id, { note });
      toast.success('Note saved');
      await load();
    } catch (err) {
      toast.error(getToastError(err, 'Could not save that note'));
    } finally {
      if (mountedRef.current) setSaving(false);
    }
  };

  if (loading && !campaign) {
    return (
      <DashboardLayout title="Campaign">
        <p className="text-[13px] text-[var(--text-tertiary)]">Loading…</p>
      </DashboardLayout>
    );
  }

  if (!campaign) {
    return (
      <DashboardLayout title="Campaign">
        <p className="text-[13px] text-[var(--text-secondary)]">
          That campaign is not here. <Link to="/hub/campaigns" className="underline">Back to campaigns</Link>
        </p>
      </DashboardLayout>
    );
  }

  const view = STATUS_VIEW[campaign.status] ?? STATUS_VIEW.draft;
  const counts = data.counts ?? {};

  return (
    <DashboardLayout
      title={campaign.name}
      subtitle={`${counts.total ?? 0} people · ${counts.invited ?? 0} invited · ${counts.pending ?? 0} queued`}
      actions={
        <div className="flex items-center gap-2">
          <Badge tone={view.tone}>
            <span className="inline-flex items-center gap-1">
              {running && <Loader2 size={11} className="animate-spin" aria-hidden="true" />}
              {view.label}
            </span>
          </Badge>
          {counts.failed > 0 && (
            <Button
              size="sm"
              variant="ghost"
              leadingIcon={<RotateCcw size={13} />}
              disabled={busy}
              onClick={() => act(
                () => hubCampaignsApi.retryFailed(id),
                (r) => (r.leftAlone
                  ? `${r.requeued} queued again. ${r.leftAlone} left alone — those may already have been sent.`
                  : `${r.requeued} queued again`),
                'Could not queue those again',
              )}
            >
              Retry failed
            </Button>
          )}
          {running ? (
            <Button size="sm" variant="secondary" leadingIcon={<Pause size={13} />} disabled={busy}
              onClick={() => act(() => hubCampaignsApi.pauseCampaign(id), 'Paused. Nobody else will be contacted.', 'Could not pause that campaign')}>
              Pause
            </Button>
          ) : (
            <Button size="sm" leadingIcon={<Play size={13} />} disabled={busy || campaign.status === 'done'}
              onClick={() => act(() => hubCampaignsApi.startCampaign(id), 'Started. Sending is paced through your working hours.', 'Could not start that campaign')}>
              {campaign.status === 'paused' ? 'Resume' : 'Start sending'}
            </Button>
          )}
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <Link to="/hub/campaigns" className="inline-flex items-center gap-1 text-[12px] text-[var(--text-secondary)] hover:underline">
          <ArrowLeft size={13} aria-hidden="true" /> All campaigns
        </Link>

        {campaign.error && (
          <div
            className="flex items-start gap-2 px-[var(--ui-pad-lg)] py-3 rounded-[var(--ui-radius-md)]"
            style={{ background: 'var(--ui-warning-tint)' }}
          >
            <p className="text-[12px]" style={{ color: 'var(--ui-warning-fg)' }}>{campaign.error}</p>
          </div>
        )}

        <SectionCard title="Message" noPadding>
          <SenderDownBanner sender={data.sender} />
          <PacingBanner campaign={campaign} pacing={data.pacing} sender={data.sender} />
          <NoteEditor
            key={campaign.note || 'no-note'}
            campaign={campaign}
            account={data.account}
            onSave={saveNote}
            saving={saving}
          />
        </SectionCard>

        <DataTable
          columns={hubMemberColumns}
          data={members}
          loading={loading}
          emptyMessage={statusFilter ? 'Nobody in this state' : 'Nobody in this campaign'}
          emptyHint={statusFilter ? 'Try another filter.' : 'Add leads from the leads page.'}
          toolbar={{
            filters: (
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter by status"
                className="text-[12px] rounded-[var(--ui-radius-sm)] border border-[var(--separator)] bg-[var(--ui-surface-card)] px-2 py-1 text-[var(--text-secondary)]"
              >
                <option value="">Everyone ({counts.total ?? 0})</option>
                <option value="pending">Queued ({counts.pending ?? 0})</option>
                <option value="invited">Invited ({counts.invited ?? 0})</option>
                <option value="skipped">Skipped ({counts.skipped ?? 0})</option>
                <option value="failed">Failed ({counts.failed ?? 0})</option>
              </select>
            ),
          }}
          pagination={{
            page: pagination.page,
            pageSize: pagination.limit,
            total: pagination.total,
            onPageChange: (page) => loadMembers(page),
          }}
        />
      </div>
    </DashboardLayout>
  );
}

import { Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Pause, Play, RotateCcw } from 'lucide-react';
import { DashboardLayout } from 'src/platform/layout/DashboardLayout';
import { DataTable } from 'src/platform/DataTable';
import { SectionCard } from 'src/ui/primitives/SectionCard';
import { Button, Badge } from 'src/ui/primitives';
import { useCampaignDetail } from 'src/products/hub/campaigns/hooks/useCampaignDetail.js';
import { SenderDownBanner } from './components/SenderDownBanner.jsx';
import { PacingBanner } from './components/PacingBanner.jsx';
import { NoteEditor } from './components/NoteEditor.jsx';
import { hubMemberColumns } from './components/columns.jsx';
import { CAMPAIGN_STATUS_VIEW as STATUS_VIEW } from './components/statusView.js';
import { campaignsStrings } from './strings.js';

/**
 * One campaign: what it will say, who is in it, and why it is or is not
 * sending right now.
 *
 * That last part is the reason this page is not just a table. A correctly
 * paced campaign sends a handful of invitations an hour, only inside the
 * user's working hours, and only while the shared weekly budget lasts — so for
 * most of the day a healthy campaign looks exactly like a broken one. The
 * server sends its verdict with every read; the banners above the table are
 * that verdict in words.
 */
export function CampaignDetailPage() {
  const {
    data,
    campaign,
    members,
    pagination,
    statusFilter,
    setStatusFilter,
    loading,
    busy,
    saving,
    running,
    start,
    pause,
    retryFailed,
    saveNote,
    goToPage,
  } = useCampaignDetail();

  const t = campaignsStrings.detail;

  if (loading && !campaign) {
    return (
      <DashboardLayout title={t.loadingPageTitle}>
        <p className="text-[var(--ui-t-body)] text-[var(--ui-text-tertiary)]">{t.loading}</p>
      </DashboardLayout>
    );
  }

  if (!campaign) {
    return (
      <DashboardLayout title={t.loadingPageTitle}>
        <p className="text-[var(--ui-t-body)] text-[var(--ui-text-secondary)]">
          {t.notFound} <Link to="/hub/campaigns" className="underline">{t.backToCampaigns}</Link>
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
              onClick={retryFailed}
            >
              {t.retryFailed}
            </Button>
          )}
          {running ? (
            <Button size="sm" variant="secondary" leadingIcon={<Pause size={13} />} disabled={busy} onClick={pause}>
              {t.pause}
            </Button>
          ) : (
            <Button size="sm" leadingIcon={<Play size={13} />} disabled={busy || campaign.status === 'done'} onClick={start}>
              {campaign.status === 'paused' ? t.resume : t.startSending}
            </Button>
          )}
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <Link to="/hub/campaigns" className="inline-flex items-center gap-1 text-[var(--ui-t-label)] text-[var(--ui-text-secondary)] hover:underline">
          <ArrowLeft size={13} aria-hidden="true" /> {t.allCampaigns}
        </Link>

        {campaign.error && (
          <div
            className="flex items-start gap-2 px-[var(--ui-pad-lg)] py-3 rounded-[var(--ui-radius-md)]"
            style={{ background: 'var(--ui-warning-tint)' }}
          >
            <p className="text-[var(--ui-t-label)]" style={{ color: 'var(--ui-warning-fg)' }}>{campaign.error}</p>
          </div>
        )}

        <SectionCard title={t.messageSectionTitle} noPadding>
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
                className="text-[var(--ui-t-label)] rounded-[var(--ui-radius-sm)] border border-[var(--ui-border-hairline)] bg-[var(--ui-surface-card)] px-2 py-1 text-[var(--ui-text-secondary)]"
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
            onPageChange: goToPage,
          }}
        />
      </div>
    </DashboardLayout>
  );
}

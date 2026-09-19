import { Link } from 'react-router-dom';
import { Pause, Play, RotateCcw } from 'lucide-react';
import { DashboardLayout } from 'src/core/layout/DashboardLayout';
import { DataTable } from 'src/core/DataTable';
import { DetailConsole, RailCard, ReadingsGrid, FactList, ProgressMeter } from 'src/core/layout';
import { Button, Badge, FilterPills } from 'src/core/primitives';
import { useCampaignDetail } from 'src/products/campaigns/hooks/useCampaignDetail.js';
import {
  DetailPageSkeleton,
  DetailActionsSkeleton,
  DetailSubtitleSkeleton,
} from '../components/DetailPageSkeleton.jsx';
import { SenderDownBanner } from './components/SenderDownBanner.jsx';
import { PacingBanner } from './components/PacingBanner.jsx';
import { NoteEditor } from './components/NoteEditor.jsx';
import { MessageEditor } from './components/MessageEditor.jsx';
import { SendMessagePreviewDialog } from './components/SendMessagePreviewDialog.jsx';
import { sinceLabel } from './components/sinceLabel.js';
import { hubMemberColumns } from './components/columns.jsx';
import { CAMPAIGN_STATUS_VIEW as STATUS_VIEW } from './components/statusView.js';
import { campaignsStrings } from './strings.js';

const TONE_DOT = {
  neutral: 'var(--ui-text-quaternary)',
  success: 'var(--ui-success-dot)',
  warning: 'var(--ui-warning-dot)',
  info: 'var(--ui-info-dot)',
  danger: 'var(--ui-danger-dot)',
};

/**
 * One campaign: what it will say, who is in it, and why it is or is not
 * sending right now.
 *
 * Laid out as a "console" — a table on the left, a fixed status rail on the
 * right (Delivery readings, when this starts, the message/note itself) —
 * rather than the message editor sitting as a full-width card above the
 * table. The rail is the same reason the page is not just a table at all: a
 * correctly paced campaign sends a handful of invitations an hour, only
 * inside the user's working hours, and only while the shared weekly budget
 * lasts, so for most of the day a healthy campaign looks exactly like a
 * broken one. "When this starts" is that verdict in numbers, always visible
 * beside the table rather than buried above it.
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
    previewOpen,
    previewLoading,
    previewMembers,
    openStartPreview,
    closeStartPreview,
    confirmStart,
    senderName,
    pause,
    retryFailed,
    saveNote,
    saveMessageTemplate,
    goToPage,
  } = useCampaignDetail();

  const t = campaignsStrings.detail;

  if (loading && !campaign) {
    return (
      <DashboardLayout
        title={t.loadingPageTitle}
        subtitle={<DetailSubtitleSkeleton />}
        actions={<DetailActionsSkeleton />}
        backTo="/hub/campaigns"
        layout="page"
      >
        <DetailPageSkeleton
          sectionTitle={t.messageSectionTitle}
          columns={hubMemberColumns}
          label={t.loading}
        />
      </DashboardLayout>
    );
  }

  if (!campaign) {
    return (
      <DashboardLayout title={t.loadingPageTitle} backTo="/hub/campaigns" layout="page">
        <p className="text-[length:var(--ui-t-body)] text-[var(--ui-text-secondary)]">
          {t.notFound} <Link to="/hub/campaigns" className="underline">{t.backToCampaigns}</Link>
        </p>
      </DashboardLayout>
    );
  }

  const view = STATUS_VIEW[campaign.status] ?? STATUS_VIEW.draft;
  const counts = data.counts ?? {};
  const isMessage = (campaign.type || 'connect') === 'message';
  const doneCount = isMessage ? (counts.messaged ?? 0) : (counts.invited ?? 0);
  const doneVerb = isMessage ? 'messaged' : 'invited';

  const filterTabs = [
    { id: '', label: 'Everyone', count: counts.total ?? 0 },
    { id: 'pending', label: 'Queued', count: counts.pending ?? 0 },
    isMessage
      ? { id: 'messaged', label: 'Messaged', count: counts.messaged ?? 0 }
      : { id: 'invited', label: 'Invited', count: counts.invited ?? 0 },
    { id: 'skipped', label: 'Skipped', count: counts.skipped ?? 0 },
    { id: 'failed', label: 'Failed', count: counts.failed ?? 0 },
  ];

  const readings = isMessage
    ? [
        { label: 'People', value: counts.total ?? 0 },
        { label: 'Queued', value: counts.pending ?? 0 },
        { label: 'Messaged', value: counts.messaged ?? 0 },
        { label: 'Failed', value: counts.failed ?? 0 },
      ]
    : [
        { label: 'People', value: counts.total ?? 0 },
        { label: 'Queued', value: counts.pending ?? 0 },
        { label: 'Invited', value: counts.invited ?? 0 },
        { label: 'Failed', value: counts.failed ?? 0 },
      ];

  const pacingFacts = data.pacing
    ? [
        { label: 'Sending window', value: `${data.pacing.window.startHour}:00–${data.pacing.window.endHour}:00` },
        { label: 'Timezone', value: data.pacing.timezone.replace('_', ' ') },
        { label: 'Hourly cap', value: `${data.pacing.hourlyCap} / hour` },
        {
          label: 'Sender',
          value: data.sender?.expected && data.sender.stale
            ? 'Not checking in'
            : data.sender?.lastRunAt
              ? `checked in ${sinceLabel(data.sender.lastRunAt)}`
              : '—',
          tone: data.sender?.expected && data.sender.stale ? 'var(--ui-danger-fg)' : 'var(--ui-success-fg)',
        },
      ]
    : null;

  const metaParts = [
    `${(counts.total ?? 0).toLocaleString()} people`,
    `${doneCount.toLocaleString()} ${doneVerb}`,
    isMessage ? null : `${(counts.connected ?? 0).toLocaleString()} accepted`,
    campaign.lastRunAt ? `last send ${sinceLabel(campaign.lastRunAt)}` : null,
  ].filter(Boolean);

  return (
    <DashboardLayout
      title={campaign.name}
      backTo="/hub/campaigns"
      backLabel={t.allCampaigns}
      layout="plain"
      badge={
        <Badge tone={view.tone} dot pulse={running}>
          {view.label}
        </Badge>
      }
      subtitle={
        <span className="font-[family-name:var(--ui-font-mono)] text-[length:var(--ui-t-meta)] text-[var(--ui-text-quaternary)]">
          {metaParts.join(' · ')}
        </span>
      }
      actions={
        <>
          {counts.failed > 0 && (
            <Button leadingIcon={<RotateCcw size={13} />} disabled={busy} onClick={retryFailed}>
              {t.retryFailed}
            </Button>
          )}
          {running ? (
            <Button variant="secondary" leadingIcon={<Pause size={13} />} disabled={busy} onClick={pause}>
              {t.pause}
            </Button>
          ) : (
            <Button
              variant="primary"
              leadingIcon={<Play size={13} />}
              disabled={busy || campaign.status === 'done'}
              onClick={openStartPreview}
            >
              {campaign.status === 'paused' ? t.resume : t.startSending}
            </Button>
          )}
        </>
      }
    >
      <DetailConsole
        main={
          <>
            {campaign.error && (
              <div
                className="flex items-start gap-2 px-[var(--ui-pad-lg)] py-3 rounded-[var(--ui-radius-md)] shrink-0"
                style={{ background: 'var(--ui-warning-tint)' }}
              >
                <p className="text-[length:var(--ui-t-label)]" style={{ color: 'var(--ui-warning-fg)' }}>{campaign.error}</p>
              </div>
            )}

            <div className="flex-1 min-h-0 flex flex-col rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface-card)] shadow-[var(--ui-shadow-sm)] overflow-hidden">
              <SenderDownBanner sender={data.sender} />
              <PacingBanner campaign={campaign} pacing={data.pacing} sender={data.sender} />
              <DataTable
                className="flex-1 min-h-0"
                columns={hubMemberColumns}
                data={members}
                loading={loading}
                emptyMessage={statusFilter ? 'Nobody in this state' : 'Nobody in this campaign'}
                emptyHint={statusFilter ? 'Try another filter.' : 'Add leads from the leads page.'}
                toolbar={{
                  chips: (
                    <FilterPills
                      size="sm"
                      options={filterTabs}
                      value={statusFilter}
                      onChange={setStatusFilter}
                      ariaLabel="Filter by status"
                    />
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
          </>
        }
        rail={
          <>
            <RailCard title="Delivery">
              <div className="p-[var(--ui-pad-lg)] flex flex-col gap-3.5">
                <div className="flex gap-2 items-start">
                  <span
                    className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                    style={{ background: TONE_DOT[view.tone] ?? TONE_DOT.neutral }}
                    aria-hidden="true"
                  />
                  <p className="text-[length:var(--ui-t-body)] text-[var(--ui-text-secondary)]">{view.detail}</p>
                </div>
                <ReadingsGrid items={readings} />
                <ProgressMeter
                  label={`${doneCount} of ${counts.total ?? 0} ${doneVerb}`}
                  valueLabel={`${counts.total ? Math.round((doneCount / counts.total) * 100) : 0}%`}
                  value={doneCount}
                  max={counts.total ?? 0}
                />
              </div>
            </RailCard>

            {pacingFacts && (
              <RailCard title="When this starts">
                <div className="p-[var(--ui-pad-lg)] flex flex-col gap-3.5">
                  <FactList items={pacingFacts} />
                  <ProgressMeter
                    label="This week"
                    valueLabel={`${data.pacing.weekUsed} / ${data.pacing.weeklyLimit}`}
                    value={data.pacing.weekUsed}
                    max={data.pacing.weeklyLimit}
                    caption="LinkedIn counts invitations per person, so anything sent from the extension spends the same allowance."
                  />
                </div>
              </RailCard>
            )}

            <RailCard title={isMessage ? 'Message' : 'Connection note'} grow tone={campaign.status === 'draft' ? 'accent' : 'default'}>
              {isMessage ? (
                <MessageEditor
                  key={campaign.messageTemplate || 'no-message'}
                  campaign={campaign}
                  onSave={saveMessageTemplate}
                  saving={saving}
                />
              ) : (
                <NoteEditor
                  key={campaign.note || 'no-note'}
                  campaign={campaign}
                  account={data.account}
                  onSave={saveNote}
                  saving={saving}
                />
              )}
            </RailCard>
          </>
        }
      />

      {previewOpen && (
        <SendMessagePreviewDialog
          open={previewOpen}
          onClose={closeStartPreview}
          onConfirm={confirmStart}
          confirming={busy}
          mode={isMessage ? 'message' : 'connect'}
          template={isMessage ? (campaign.messageTemplate || '') : (campaign.note || '')}
          members={previewMembers}
          membersLoading={previewLoading}
          pendingCount={counts.pending ?? 0}
          senderName={senderName}
        />
      )}
    </DashboardLayout>
  );
}

import { Link } from 'react-router-dom';
import { Loader2, Pause, Play, Trash2 } from 'lucide-react';
import { DashboardLayout } from 'src/core/layout/DashboardLayout';
import { DataTable } from 'src/core/DataTable';
import { DetailConsole, Breadcrumb, RailCard, ReadingsGrid, FactList, ProgressMeter } from 'src/core/layout';
import { SectionCard } from 'src/core/primitives/SectionCard';
import { Button, Badge, Tabs } from 'src/core/primitives';
import { useSequenceDetail } from 'src/products/sequences/hooks/useSequenceDetail.js';
import {
  DetailPageSkeleton,
  DetailActionsSkeleton,
  DetailSubtitleSkeleton,
} from '../components/DetailPageSkeleton.jsx';
import { SequenceFlowBuilder, SequenceStepsStrip } from './components/SequenceFlowBuilder.jsx';
import { hubEnrollmentColumns } from './components/columns.jsx';
import { SEQUENCE_STATUS_VIEW as STATUS_VIEW } from './components/statusView.js';
import { sequencesStrings } from './strings.js';

const t = sequencesStrings.detail;

const TONE_DOT = {
  neutral: 'var(--ui-text-quaternary)',
  success: 'var(--ui-success-dot)',
  warning: 'var(--ui-warning-dot)',
  info: 'var(--ui-info-dot)',
  danger: 'var(--ui-danger-dot)',
};

/**
 * One sequence: its steps, who is enrolled, and where each of them is.
 *
 * Same "console" shell as CampaignDetailPage — a table beside a fixed rail
 * of read-only status cards — so the two hub detail pages read as one
 * pattern rather than two unrelated layouts. Steps are editable ONLY while
 * the sequence is a draft (the backend 409s otherwise, since an enrolled
 * lead may be mid-flight on a step a rewrite would silently change out from
 * under them): a draft still gets the full node-canvas editor, full width,
 * above the table; once running/paused/done the steps collapse into a
 * horizontal read-only strip so the rail (progress, outcomes) can take over
 * the space the editor used to occupy.
 */
export function SequenceDetailPage() {
  const {
    data,
    sequence,
    draftSteps,
    setDraftSteps,
    enrollments,
    pagination,
    statusFilter,
    setStatusFilter,
    loading,
    busy,
    saving,
    running,
    start,
    pause,
    saveSteps,
    remove,
    stepsDirty,
    stepsValidation,
    loadEnrollments,
  } = useSequenceDetail();

  if (loading && !sequence) {
    return (
      <DashboardLayout
        title={t.loadingPageTitle}
        subtitle={<DetailSubtitleSkeleton />}
        actions={<DetailActionsSkeleton />}
      >
        <DetailPageSkeleton
          backTo="/hub/sequences"
          backLabel={t.allSequences}
          sectionTitle={t.stepsSectionTitle}
          columns={hubEnrollmentColumns()}
          label={t.loading}
        />
      </DashboardLayout>
    );
  }

  if (!sequence) {
    return (
      <DashboardLayout title={t.loadingPageTitle}>
        <p className="text-[var(--ui-t-body)] text-[var(--ui-text-secondary)] p-[var(--ui-pad-lg)]">
          {t.notFound} <Link to="/hub/sequences" className="underline">{t.backToSequences}</Link>
        </p>
      </DashboardLayout>
    );
  }

  const view = STATUS_VIEW[sequence.status] ?? STATUS_VIEW.draft;
  const counts = data.enrollmentCounts ?? {};
  const totalEnrolled = Object.values(counts).reduce((a, b) => a + b, 0);
  const isDraft = sequence.status === 'draft';
  const finishedCount = counts.completed ?? 0;

  const filterTabs = [
    { id: '', label: 'Everyone', count: totalEnrolled },
    { id: 'active', label: 'Active', count: counts.active ?? 0 },
    { id: 'waiting', label: 'Waiting', count: counts.waiting ?? 0 },
    { id: 'completed', label: 'Completed', count: counts.completed ?? 0 },
    { id: 'stopped', label: 'Stopped', count: counts.stopped ?? 0 },
    { id: 'failed', label: 'Failed', count: counts.failed ?? 0 },
  ];

  const readings = [
    { label: 'Enrolled', value: totalEnrolled },
    { label: 'Steps', value: sequence.steps.length },
    { label: 'Active', value: counts.active ?? 0 },
    { label: 'Waiting', value: counts.waiting ?? 0 },
  ];

  const outcomeFacts = [
    { label: 'Completed', value: counts.completed ?? 0, tone: 'var(--ui-success-fg)' },
    { label: 'Stopped', value: counts.stopped ?? 0 },
    { label: 'Failed', value: counts.failed ?? 0, tone: (counts.failed ?? 0) > 0 ? 'var(--ui-danger-fg)' : undefined },
  ];

  return (
    <DashboardLayout
      title={<Breadcrumb parent="Sequences" parentHref="/hub/sequences" title={sequence.name} />}
      actions={
        <div className="flex items-center gap-2">
          <Badge tone={view.tone} title={view.detail}>
            <span className="inline-flex items-center gap-1">
              {running && <Loader2 size={11} className="animate-spin" aria-hidden="true" />}
              {view.label}
            </span>
          </Badge>
          {running ? (
            <Button size="sm" variant="secondary" leadingIcon={<Pause size={13} />} disabled={busy} onClick={pause}>
              {t.pause}
            </Button>
          ) : (
            <Button size="sm" leadingIcon={<Play size={13} />} disabled={busy || sequence.status === 'done'} onClick={start}>
              {sequence.status === 'paused' ? t.resume : t.start}
            </Button>
          )}
        </div>
      }
    >
      <DetailConsole
        main={
          <>
            {sequence.error && (
              <div className="flex items-start gap-2 px-[var(--ui-pad-lg)] py-3 rounded-[var(--ui-radius-md)] shrink-0" style={{ background: 'var(--ui-warning-tint)' }}>
                <p className="text-[var(--ui-t-label)]" style={{ color: 'var(--ui-warning-fg)' }}>{sequence.error}</p>
              </div>
            )}

            {totalEnrolled === 0 && (
              <div className="flex items-start gap-2 px-[var(--ui-pad-lg)] py-3 rounded-[var(--ui-radius-md)] shrink-0" style={{ background: 'var(--ui-surface-sunken)' }}>
                <p className="text-[var(--ui-t-label)] text-[var(--ui-text-secondary)]">
                  {t.noEnrollmentsBefore}<Link to="/hub/leads" className="underline">{t.noEnrollmentsLink}</Link>{t.noEnrollmentsAfter}
                </p>
              </div>
            )}

            {isDraft ? (
              <SectionCard title={t.stepsSectionTitle} noPadding className="shrink-0">
                {stepsDirty && (
                  <div className="flex items-center justify-end px-[var(--ui-pad-lg)] py-2 border-b border-[var(--ui-border-hairline)]" style={{ background: 'var(--ui-surface-sunken)' }}>
                    <Button size="sm" disabled={saving || !!stepsValidation} loading={saving} onClick={saveSteps}>
                      {t.saveSteps}
                    </Button>
                  </div>
                )}
                <SequenceFlowBuilder
                  steps={draftSteps ?? sequence.steps}
                  onChange={setDraftSteps}
                  readOnly={false}
                />
                {stepsValidation && (
                  <p className="px-[var(--ui-pad-lg)] pb-3 text-[var(--ui-t-meta)] text-[var(--ui-danger-fg)]">{stepsValidation}</p>
                )}
              </SectionCard>
            ) : (
              <div className="rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface-card)] shadow-[var(--ui-shadow-sm)] overflow-hidden shrink-0">
                <div className="flex items-center gap-3 h-11 px-[var(--ui-pad-lg)] border-b border-[var(--ui-border-hairline)]">
                  <h2 className="text-[var(--ui-t-section)] font-semibold text-[var(--ui-text-primary)]">{t.stepsSectionTitle}</h2>
                  <span className="ui-num text-[var(--ui-t-meta)] text-[var(--ui-text-tertiary)]">
                    {sequence.steps.length} STEP{sequence.steps.length === 1 ? '' : 'S'}
                  </span>
                  <div className="flex-1" />
                  <span className="text-[var(--ui-t-label)] text-[var(--ui-text-tertiary)]">
                    Locked while running — pause and duplicate to change the plan
                  </span>
                </div>
                <SequenceStepsStrip steps={sequence.steps} />
              </div>
            )}

            <div className="flex-1 min-h-0 flex flex-col rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface-card)] shadow-[var(--ui-shadow-sm)] overflow-hidden">
              <DataTable
                className="flex-1 min-h-0"
                columns={hubEnrollmentColumns(sequence.steps)}
                data={enrollments}
                loading={loading}
                emptyMessage={statusFilter ? t.table.emptyMessageFiltered : t.table.emptyMessageAll}
                emptyHint={statusFilter ? t.table.emptyHintFiltered : t.table.emptyHintAll}
                toolbar={{
                  filters: (
                    <Tabs
                      tabs={filterTabs}
                      activeTab={statusFilter}
                      onTabChange={setStatusFilter}
                      ariaLabel="Filter by status"
                      flush={false}
                    />
                  ),
                }}
                pagination={{
                  page: pagination.page,
                  pageSize: pagination.limit,
                  total: pagination.total,
                  onPageChange: (page) => loadEnrollments(page),
                }}
              />
            </div>
          </>
        }
        rail={
          <>
            <RailCard title="Progress">
              <div className="p-[var(--ui-pad-lg)] flex flex-col gap-3.5">
                <div className="flex gap-2 items-start">
                  <span
                    className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                    style={{ background: TONE_DOT[view.tone] ?? TONE_DOT.neutral }}
                    aria-hidden="true"
                  />
                  <p className="text-[var(--ui-t-body)] text-[var(--ui-text-secondary)]">{view.detail}</p>
                </div>
                <ReadingsGrid items={readings} />
                <ProgressMeter
                  label={`${finishedCount} of ${totalEnrolled} finished`}
                  valueLabel={`${totalEnrolled ? Math.round((finishedCount / totalEnrolled) * 100) : 0}%`}
                  value={finishedCount}
                  max={totalEnrolled}
                />
              </div>
            </RailCard>

            <RailCard title="Outcomes">
              <div className="p-[var(--ui-pad-lg)] flex flex-col gap-3.5">
                <FactList items={outcomeFacts} />
                <ProgressMeter
                  label="Reached the last step"
                  valueLabel={`${finishedCount} / ${totalEnrolled}`}
                  value={finishedCount}
                  max={totalEnrolled}
                  tone="success"
                  caption="Steps are locked while a sequence is running — an enrolled lead may be mid-flight on one."
                />
              </div>
            </RailCard>

            {!isDraft && (
              <RailCard title="Remove this sequence">
                <div className="p-[var(--ui-pad-lg)] flex flex-col gap-2.5">
                  <p className="text-[var(--ui-t-label)] leading-relaxed text-[var(--ui-text-tertiary)]">
                    Removing a sequence stops every lead mid-flight. It cannot be undone.
                  </p>
                  <Button
                    size="sm"
                    variant="dangerSoft"
                    leadingIcon={<Trash2 size={13} />}
                    disabled={busy}
                    onClick={remove}
                    fullWidth
                  >
                    {t.remove}
                  </Button>
                </div>
              </RailCard>
            )}
          </>
        }
      />
    </DashboardLayout>
  );
}

export default SequenceDetailPage;

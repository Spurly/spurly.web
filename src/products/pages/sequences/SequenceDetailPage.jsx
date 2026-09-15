import { Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Pause, Play, Trash2 } from 'lucide-react';
import { DashboardLayout } from 'src/core/layout/DashboardLayout';
import { DataTable } from 'src/core/DataTable';
import { SectionCard } from 'src/core/primitives/SectionCard';
import { Button, Badge } from 'src/core/primitives';
import { useSequenceDetail } from 'src/products/sequences/hooks/useSequenceDetail.js';
import {
  DetailPageSkeleton,
  DetailActionsSkeleton,
  DetailSubtitleSkeleton,
} from '../components/DetailPageSkeleton.jsx';
import { SequenceFlowBuilder, SequenceStepsReadOnly } from './components/SequenceFlowBuilder.jsx';
import { hubEnrollmentColumns } from './components/columns.jsx';
import { SEQUENCE_STATUS_VIEW as STATUS_VIEW } from './components/statusView.js';
import { sequencesStrings } from './strings.js';

const t = sequencesStrings.detail;

/**
 * One sequence: its steps, who is enrolled, and where each of them is.
 *
 * Steps are editable ONLY while the sequence is a draft — the backend 409s
 * (SEQUENCE_NOT_EDITABLE) otherwise, because an enrolled lead may be
 * mid-flight on a step that a rewrite would silently change out from under
 * them. Once running or paused, the step list renders read-only; pause a
 * running sequence and its status is still not 'draft', so the plan's
 * "pause to edit" story does not exist on the backend as built — this page
 * does not imply it does.
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
        <p className="text-[var(--ui-t-body)] text-[var(--ui-text-secondary)]">
          {t.notFound} <Link to="/hub/sequences" className="underline">{t.backToSequences}</Link>
        </p>
      </DashboardLayout>
    );
  }

  const view = STATUS_VIEW[sequence.status] ?? STATUS_VIEW.draft;
  const counts = data.enrollmentCounts ?? {};
  const totalEnrolled = Object.values(counts).reduce((a, b) => a + b, 0);
  const isDraft = sequence.status === 'draft';

  return (
    <DashboardLayout
      title={sequence.name}
      subtitle={`${sequence.steps.length} step(s) · ${totalEnrolled.toLocaleString()} enrolled`}
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
          <Button size="sm" variant="ghost" leadingIcon={<Trash2 size={13} />} disabled={busy} onClick={remove}>
            {t.remove}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <Link to="/hub/sequences" className="inline-flex items-center gap-1 text-[var(--ui-t-label)] text-[var(--ui-text-secondary)] hover:underline">
          <ArrowLeft size={13} aria-hidden="true" /> {t.allSequences}
        </Link>

        {sequence.error && (
          <div className="flex items-start gap-2 px-[var(--ui-pad-lg)] py-3 rounded-[var(--ui-radius-md)]" style={{ background: 'var(--ui-warning-tint)' }}>
            <p className="text-[var(--ui-t-label)]" style={{ color: 'var(--ui-warning-fg)' }}>{sequence.error}</p>
          </div>
        )}

        {totalEnrolled === 0 && (
          <div className="flex items-start gap-2 px-[var(--ui-pad-lg)] py-3 rounded-[var(--ui-radius-md)]" style={{ background: 'var(--ui-surface-sunken)' }}>
            <p className="text-[var(--ui-t-label)] text-[var(--ui-text-secondary)]">
              {t.noEnrollmentsBefore}<Link to="/hub/leads" className="underline">{t.noEnrollmentsLink}</Link>{t.noEnrollmentsAfter}
            </p>
          </div>
        )}

        <SectionCard
          title={t.stepsSectionTitle}
          noPadding
          collapsible={!isDraft}
          defaultCollapsed={!isDraft}
          collapsedSummary={!isDraft ? `${sequence.steps.length} step(s)` : undefined}
        >
          {isDraft ? (
            <>
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
            </>
          ) : (
            <SequenceStepsReadOnly steps={sequence.steps} />
          )}
        </SectionCard>

        <DataTable
          columns={hubEnrollmentColumns(sequence.steps)}
          data={enrollments}
          loading={loading}
          emptyMessage={statusFilter ? t.table.emptyMessageFiltered : t.table.emptyMessageAll}
          emptyHint={statusFilter ? t.table.emptyHintFiltered : t.table.emptyHintAll}
          toolbar={{
            filters: (
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter by status"
                className="text-[var(--ui-t-label)] rounded-[var(--ui-radius-sm)] border border-[var(--ui-border-hairline)] bg-[var(--ui-surface-card)] px-2 py-1 text-[var(--ui-text-secondary)]"
              >
                <option value="">Everyone ({totalEnrolled})</option>
                <option value="active">Active ({counts.active ?? 0})</option>
                <option value="waiting">Waiting ({counts.waiting ?? 0})</option>
                <option value="completed">Completed ({counts.completed ?? 0})</option>
                <option value="stopped">Stopped ({counts.stopped ?? 0})</option>
                <option value="failed">Failed ({counts.failed ?? 0})</option>
              </select>
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
    </DashboardLayout>
  );
}

export default SequenceDetailPage;

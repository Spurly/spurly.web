import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Pause, Play, Trash2 } from 'lucide-react';
import { DashboardLayout } from 'src/core/layout/DashboardLayout';
import { DataTable } from 'src/core/DataTable';
import { FactList, ProgressMeter } from 'src/core/layout';
import { Button, Badge, FilterPills, IconButton, PageTabs, SoonTag, StatTile, WorkingLine } from 'src/core/primitives';
import { CloseIcon, SparkIcon } from 'src/core/icons';
import { relativeTime } from 'src/shared/utils/outreach';
import { STEP_TYPE_MAP } from 'src/products/sequences/stepTypes.js';
import { useSequenceDetail } from 'src/products/sequences/hooks/useSequenceDetail.js';
import {
  DetailPageSkeleton,
  DetailActionsSkeleton,
  DetailSubtitleSkeleton,
} from '../components/DetailPageSkeleton.jsx';
import { SequenceFlowBuilder } from './components/SequenceFlowBuilder.jsx';
import { hubEnrollmentColumns } from './components/columns.jsx';
import { SEQUENCE_STATUS_VIEW as STATUS_VIEW } from './components/statusView.js';
import { sequencesStrings } from './strings.js';

const t = sequencesStrings.detail;


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
  const [pane, setPane] = useState('flow');
  const [selectedStep, setSelectedStep] = useState(null);

  if (loading && !sequence) {
    return (
      <DashboardLayout
        title={t.loadingPageTitle}
        subtitle={<DetailSubtitleSkeleton />}
        actions={<DetailActionsSkeleton />}
        backTo="/hub/sequences"
        layout="page"
      >
        <DetailPageSkeleton
          sectionTitle={t.stepsSectionTitle}
          columns={hubEnrollmentColumns()}
          label={t.loading}
        />
      </DashboardLayout>
    );
  }

  if (!sequence) {
    return (
      <DashboardLayout title={t.loadingPageTitle} backTo="/hub/sequences" layout="page">
        <p className="text-[length:var(--ui-t-body)] text-[var(--ui-text-secondary)]">
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
  const steps = isDraft ? draftSteps ?? sequence.steps : sequence.steps;

  const filterTabs = [
    { id: '', label: 'Everyone', count: totalEnrolled },
    { id: 'active', label: 'Active', count: counts.active ?? 0 },
    { id: 'waiting', label: 'Waiting', count: counts.waiting ?? 0 },
    { id: 'completed', label: 'Completed', count: counts.completed ?? 0 },
    { id: 'stopped', label: 'Stopped', count: counts.stopped ?? 0 },
    { id: 'failed', label: 'Failed', count: counts.failed ?? 0 },
  ];

  const outcomeFacts = [
    { label: 'Completed', value: counts.completed ?? 0, tone: 'var(--ui-success-fg)' },
    { label: 'Stopped', value: counts.stopped ?? 0 },
    { label: 'Failed', value: counts.failed ?? 0, tone: (counts.failed ?? 0) > 0 ? 'var(--ui-danger-fg)' : undefined },
  ];

  const inFlight = (counts.active ?? 0) + (counts.waiting ?? 0);
  const selected = selectedStep != null ? steps[selectedStep] : null;

  return (
    <DashboardLayout
      title={sequence.name}
      backTo="/hub/sequences"
      backLabel={t.allSequences}
      layout="bare"
      badge={
        <Badge tone={view.tone} dot pulse={running} title={view.detail}>
          {view.label}
        </Badge>
      }
      subtitle={
        <span className="font-[family-name:var(--ui-font-mono)] text-[length:var(--ui-t-meta)] text-[var(--ui-text-quaternary)]">
          {sequence.steps.length} {sequence.steps.length === 1 ? 'step' : 'steps'} · {totalEnrolled.toLocaleString()} enrolled
          {sequence.updatedAt ? ` · edited ${relativeTime(sequence.updatedAt)} ago` : ''}
        </span>
      }
      actions={
        <>
          <Button disabled title="Dry-run a sequence against one lead — coming soon">
            Test run <SoonTag className="ml-1" />
          </Button>
          {isDraft && stepsDirty && (
            <Button disabled={saving || !!stepsValidation} loading={saving} onClick={saveSteps}>
              {t.saveSteps}
            </Button>
          )}
          {running ? (
            <Button variant="secondary" leadingIcon={<Pause size={13} />} disabled={busy} onClick={pause}>
              {t.pause}
            </Button>
          ) : (
            <Button variant="primary" leadingIcon={<Play size={13} />} disabled={busy || sequence.status === 'done'} onClick={start}>
              {sequence.status === 'paused' ? t.resume : t.start}
            </Button>
          )}
        </>
      }
    >
      <div className="flex-1 min-h-0 flex overflow-hidden">
        {/* Centre: the flow, or who is in it. */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          <div className="shrink-0 px-[var(--ui-shell-x)] pt-4">
            <PageTabs
              tabs={[
                { id: 'flow', label: 'Flow', count: steps.length },
                { id: 'enrolled', label: 'Enrolled', count: totalEnrolled },
              ]}
              activeTab={pane}
              onTabChange={setPane}
            />
          </div>

          {pane === 'flow' ? (
            <div className="flex-1 min-h-0 overflow-y-auto px-[var(--ui-shell-x)] pt-5 pb-10">
              <div className="max-w-[560px] mx-auto flex flex-col gap-3">
                {running && (
                  <WorkingLine verbs={['Waiting', 'Visiting', 'Sending', 'Watching']} trailing={`${inFlight.toLocaleString()} in flight`}>
                    this sequence is running while you look at it
                  </WorkingLine>
                )}
                {sequence.error && (
                  <p className="px-3.5 py-2.5 rounded-[var(--ui-radius-md)] bg-[var(--ui-warning-tint)] text-[length:var(--ui-t-label)] text-[var(--ui-warning-fg)]">
                    {sequence.error}
                  </p>
                )}
                {totalEnrolled === 0 && (
                  <p className="px-3.5 py-2.5 rounded-[var(--ui-radius-md)] bg-[var(--ui-surface-sunken)] text-[length:var(--ui-t-label)] text-[var(--ui-text-secondary)]">
                    {t.noEnrollmentsBefore}
                    <Link to="/hub/leads" className="underline">{t.noEnrollmentsLink}</Link>
                    {t.noEnrollmentsAfter}
                  </p>
                )}
                {!isDraft && (
                  <p className="font-[family-name:var(--ui-font-mono)] text-[length:var(--ui-t-micro)] text-[var(--ui-text-quaternary)] text-center">
                    Locked while running — pause and duplicate to change the plan
                  </p>
                )}
              </div>
              <div className="mt-3">
                <SequenceFlowBuilder
                  steps={steps}
                  onChange={setDraftSteps}
                  readOnly={!isDraft}
                  selectedIndex={selectedStep}
                  onSelect={(i) => setSelectedStep((cur) => (cur === i && !isDraft ? null : i))}
                />
              </div>
              {isDraft && stepsValidation && (
                <p className="mt-2 text-center text-[length:var(--ui-t-label)] text-[var(--ui-danger-fg)]">{stepsValidation}</p>
              )}
            </div>
          ) : (
            <div className="flex-1 min-h-0 flex flex-col px-[var(--ui-shell-x)] pt-4 pb-5">
              <div className="flex-1 min-h-0 flex flex-col rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface-card)] shadow-[var(--ui-shadow-sm)] overflow-hidden">
                <DataTable
                  className="flex-1 min-h-0"
                  columns={hubEnrollmentColumns(sequence.steps)}
                  data={enrollments}
                  loading={loading}
                  emptyMessage={statusFilter ? t.table.emptyMessageFiltered : t.table.emptyMessageAll}
                  emptyHint={statusFilter ? t.table.emptyHintFiltered : t.table.emptyHintAll}
                  toolbar={{
                    chips: (
                      <FilterPills size="sm" options={filterTabs} value={statusFilter} onChange={setStatusFilter} ariaLabel="Filter by status" />
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
            </div>
          )}
        </div>

        {/* Right: the inspector — a selected step, or the sequence overview. */}
        <aside className="w-[352px] shrink-0 border-l border-[var(--ui-border)] bg-[var(--ui-surface-card)] overflow-y-auto">
          {selected ? (
            <StepInspector
              step={selected}
              index={selectedStep}
              onClose={() => setSelectedStep(null)}
              readOnly={!isDraft}
            />
          ) : (
            <div className="flex flex-col">
              <div className="flex items-center h-12 px-4 border-b border-[var(--ui-neutral-150)]">
                <span className="ui-micro !text-[var(--ui-text-secondary)]">Overview</span>
              </div>
              <div className="p-4 flex flex-col gap-4">
                <p className="text-[length:var(--ui-t-control)] text-[var(--ui-text-secondary)] leading-[1.5]">{view.detail}</p>
                <div className="grid grid-cols-2 gap-2.5">
                  <StatTile size="sm" label="Enrolled" value={totalEnrolled.toLocaleString()} />
                  <StatTile size="sm" label="In flight" value={inFlight.toLocaleString()} fill={totalEnrolled ? (inFlight / totalEnrolled) * 100 : 0} />
                  <StatTile size="sm" label="Finished" value={finishedCount.toLocaleString()} tone="success" fill={totalEnrolled ? (finishedCount / totalEnrolled) * 100 : 0} />
                  <StatTile size="sm" label="Replied" soon />
                </div>
                <div>
                  <p className="ui-micro !text-[var(--ui-text-secondary)] mb-1">Outcomes</p>
                  <FactList items={outcomeFacts} />
                </div>
                <ProgressMeter
                  label="Reached the last step"
                  valueLabel={`${finishedCount} / ${totalEnrolled}`}
                  value={finishedCount}
                  max={totalEnrolled}
                  tone="success"
                  caption="Select a step in the flow to see what it does."
                />
                {!isDraft && (
                  <div className="pt-4 border-t border-[var(--ui-border-hairline)] flex flex-col gap-2.5">
                    <p className="text-[length:var(--ui-t-label)] leading-[1.5] text-[var(--ui-text-quaternary)]">
                      Removing a sequence stops every lead mid-flight. It cannot be undone.
                    </p>
                    <Button size="sm" variant="dangerSoft" leadingIcon={<Trash2 size={13} />} disabled={busy} onClick={remove} fullWidth>
                      {t.remove}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </aside>
      </div>
    </DashboardLayout>
  );
}

/**
 * The inspector for one step (Sequence Builder mockup's right panel):
 * what the step is, what it says, and the rules around it. Editing lives in
 * the step card itself (draft only); the AI panels the mockup draws —
 * drafted/edited counts, "Rewrite" — and the per-step rules are shown in
 * place, marked SOON.
 */
function StepInspector({ step, index, onClose, readOnly }) {
  const def = STEP_TYPE_MAP[step.type];
  const text = step.type === 'connect' ? step.config?.note : step.config?.text;
  const hasText = ['connect', 'message', 'comment_post'].includes(step.type);
  const vars = (text || '').match(/\{\{\s*[a-zA-Z_]+\s*\}\}/g) || [];
  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between h-12 px-4 border-b border-[var(--ui-neutral-150)]">
        <span className="ui-micro !text-[var(--ui-text-secondary)]">Step {index + 1}</span>
        <IconButton size="sm" variant="ghost" label="Close" icon={<CloseIcon size={14} strokeWidth={2.2} />} onClick={onClose} className="!w-7 !h-7" />
      </div>
      <div className="p-4 flex flex-col gap-4">
        <div>
          <h2 className="text-[length:var(--ui-t-section)] font-semibold tracking-[var(--ui-track-tight)] text-[var(--ui-text-primary)]">
            {def?.label ?? step.type}
          </h2>
          <p className="mt-1 text-[length:var(--ui-t-control)] text-[var(--ui-text-secondary)] leading-[1.55]">{def?.description}</p>
        </div>

        {hasText && (
          <>
            <div className="grid grid-cols-2 gap-2.5">
              <StatTile size="sm" label="Drafted" soon />
              <StatTile size="sm" label="Edited by you" soon />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="ui-micro !text-[var(--ui-text-secondary)]">{step.type === 'connect' ? 'Note' : 'Message'}</span>
                <Button size="sm" variant="accentOutline" disabled leadingIcon={<SparkIcon size={12} />} className="!h-[26px] !px-2">
                  Rewrite <SoonTag className="ml-1" />
                </Button>
              </div>
              <div className="rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] overflow-hidden">
                <p className="px-3 py-3 text-[length:var(--ui-t-control)] leading-[1.6] text-[var(--ui-text-primary)] whitespace-pre-wrap min-h-[64px]">
                  {text || <span className="text-[var(--ui-text-quaternary)]">{step.type === 'connect' ? 'No note — a plain connection request.' : 'Not written yet.'}</span>}
                </p>
                {vars.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 px-3 py-2.5 border-t border-[var(--ui-border-hairline)] bg-[var(--ui-surface-header)]">
                    {[...new Set(vars)].map((v) => (
                      <span key={v} className="font-[family-name:var(--ui-font-mono)] text-[length:var(--ui-t-micro)] px-1.5 h-[22px] inline-flex items-center rounded-[var(--ui-radius-xs)] bg-[var(--ui-accent-tint)] text-[var(--ui-accent-fg)]">
                        {v}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              {!readOnly && (
                <p className="mt-2 text-[length:var(--ui-t-label)] text-[var(--ui-text-quaternary)] leading-[1.5]">
                  Edit it on the step card in the flow.
                </p>
              )}
            </div>
          </>
        )}

        <div>
          <p className="ui-micro !text-[var(--ui-text-secondary)] mb-2">Timing</p>
          <FactList
            items={[
              { label: 'Waits before', value: `${step.delayDays ?? 0} day(s)` },
              ...(step.type === 'wait'
                ? [{ label: 'Mode', value: step.config?.mode === 'until-accepted' ? 'Until accepted' : 'Fixed delay' }]
                : []),
            ]}
          />
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="ui-micro !text-[var(--ui-text-secondary)]">Rules</span>
            <SoonTag />
          </div>
          <div className="flex flex-col gap-2 opacity-70">
            {[
              'Stop everything for this person the moment they reply',
              'Only send inside the working-hours window',
              'Skip anyone another campaign contacted in the last 30 days',
            ].map((rule) => (
              <div key={rule} className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-[var(--ui-radius-md)] border border-[var(--ui-border)]">
                <span className="text-[length:var(--ui-t-control)] text-[var(--ui-text-body)] leading-[1.4]">{rule}</span>
                <span className="shrink-0 w-8 h-[18px] rounded-full bg-[var(--ui-border)] relative" aria-hidden="true">
                  <span className="absolute left-0.5 top-0.5 w-[14px] h-[14px] rounded-full bg-[var(--ui-surface-card)] shadow-[var(--ui-shadow-sm)]" />
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SequenceDetailPage;

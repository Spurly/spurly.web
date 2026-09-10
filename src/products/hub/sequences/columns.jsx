import { LinkedInIcon } from 'src/ui/icons';
import { TextCell, PersonCell, LinkCell, DateCell } from 'src/platform/DataTable';
import { Badge } from 'src/ui/primitives';
import { stepTypeLabel } from './stepTypes.js';

/**
 * Columns for one sequence's enrollments table.
 *
 * "Current step" reads `currentStepIndex` + the step's own type, not a bare
 * number — a lead sitting at step 3 means nothing without knowing what step
 * 3 does. `history` carries the full per-step log but only the last entry is
 * shown here, same reasoning as campaigns' single "why" column: the detail
 * that answers "what just happened" is the one worth a column, the rest is a
 * drill-in away (enrollment.history) once a lead-level detail view exists.
 */

const STATUS_VIEW = {
  active: { label: 'Active', tone: 'success' },
  waiting: { label: 'Waiting', tone: 'info' },
  completed: { label: 'Completed', tone: 'success' },
  stopped: { label: 'Stopped', tone: 'neutral' },
  failed: { label: 'Failed', tone: 'danger' },
};

const STOP_REASON = {
  'already-connected': 'Already a connection',
  unresolvable: 'No LinkedIn id to act on',
  self: 'This is you',
  'acceptance-timeout': 'Invite not accepted in time',
  manual: 'Stopped manually',
};

export function hubEnrollmentColumns(steps = []) {
  return [
    {
      key: 'profileUrl',
      label: <LinkedInIcon size={14} aria-label="LinkedIn" />,
      width: 44,
      align: 'center',
      render: (value) => <LinkCell href={value} icon={<LinkedInIcon size={14} />} label="Open LinkedIn profile" />,
    },
    {
      key: 'name',
      label: 'Name',
      width: 200,
      title: (row) => row.name,
      render: (value, row) => <PersonCell name={value} profileUrl={row.profileUrl} />,
    },
    {
      key: 'headline',
      label: 'Headline',
      width: 240,
      title: (row) => row.headline,
      render: (value) => <TextCell value={value} tone="secondary" />,
    },
    {
      key: 'status',
      label: 'Status',
      width: 110,
      render: (value) => {
        const view = STATUS_VIEW[value] ?? STATUS_VIEW.active;
        return <Badge tone={view.tone}>{view.label}</Badge>;
      },
    },
    {
      key: 'currentStepIndex',
      label: 'Step',
      width: 220,
      title: (row) => (steps[row.currentStepIndex] ? stepTypeLabel(steps[row.currentStepIndex].type) : ''),
      render: (value, row) => {
        const total = steps.length;
        const type = steps[value]?.type;
        if (row.status === 'completed') return <TextCell value="Finished" tone="secondary" />;
        return (
          <TextCell
            value={type ? `${value + 1}/${total} — ${stepTypeLabel(type)}` : `${value + 1}/${total}`}
            tone="secondary"
          />
        );
      },
    },
    {
      key: 'lastEvent',
      label: 'Last event',
      width: 260,
      title: (row) => STOP_REASON[row.stopReason] || row.lastError || row.history?.[row.history.length - 1]?.detail || '',
      render: (value, row) => {
        const last = row.history?.[row.history.length - 1];
        const text = STOP_REASON[row.stopReason]
          || row.lastError
          || (last ? `${stepTypeLabel(last.type)} — ${last.outcome}` : '—');
        return <TextCell value={text} tone="secondary" />;
      },
    },
    {
      key: 'startedAt',
      label: 'Enrolled',
      width: 130,
      render: (value) => (value ? <DateCell value={value} /> : <TextCell value="—" tone="tertiary" />),
    },
  ];
}

export default hubEnrollmentColumns;

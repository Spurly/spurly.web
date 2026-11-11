import { LinkedInIcon } from 'src/core/icons';
import { TextCell, PersonCell, LinkCell, DateCell } from 'src/core/DataTable';
import { Badge } from 'src/core/primitives';
import { stepTypeLabel } from 'src/products/sequences/stepTypes.js';

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
  accepted: 'Stopped: the lead accepted',
  'other-account': 'Stopped: another account holds this lead',
  'max-days': 'Stopped: maximum days reached',
  'branch-ended': 'Finished: nothing left on this branch',
  // The backend stops an enrollment the moment the lead replies (Phase 10, sequences/service runOneEnrollment).
  'lead-replied': 'Replied — handed to you',
  'sender-removed': 'Stopped: the account that was sending was removed',
};

/** v2 history reads "Condition → Yes", "Message → done". */
export function historyLabel(entry) {
  const label = stepTypeLabel(entry.type);
  if (entry.branch && (entry.type === 'condition' || entry.type === 'wait_for' || entry.type === 'split')) {
    return `${label} → ${entry.branch === 'yes' ? 'Yes' : 'No'}`;
  }
  return `${label} — ${entry.outcome}${entry.branch ? ` (${entry.branch === 'yes' ? 'Yes' : 'No'} side)` : ''}`;
}

export function hubEnrollmentColumns(steps = [], { tree = false, pool = false } = {}) {
  // v2 enrollments point at a node id; v1 at a list index.
  const nodeIndex = (row) => (tree ? steps.findIndex((n) => n.id === row.currentStepId) : row.currentStepIndex);
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
      render: (value, row) => <PersonCell name={value} avatar={row.profilePictureUrl} profileUrl={row.profileUrl} />,
    },
    ...(pool ? [{
      key: 'senderName',
      label: 'Sent from',
      width: 150,
      render: (value) => <TextCell value={value || null} tone="secondary" />,
    }] : []),
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
      title: (row) => (steps[nodeIndex(row)] ? stepTypeLabel(steps[nodeIndex(row)].type) : ''),
      render: (value, row) => {
        const total = steps.length;
        const at = nodeIndex(row);
        const node = steps[at];
        if (row.status === 'completed') return <TextCell value="Finished" tone="secondary" />;
        if (tree && !node) return <TextCell value="Starting" tone="secondary" />;
        const side = tree && node?.parentId ? ` · ${node.branch === 'yes' ? 'Yes' : 'No'}` : '';
        return (
          <TextCell
            value={node ? `${at + 1}/${total} — ${stepTypeLabel(node.type)}${side}` : `${at + 1}/${total}`}
            tone="secondary"
          />
        );
      },
    },
    {
      key: 'lastEvent',
      label: 'Last event',
      width: 260,
      // The tooltip is the whole path the lead took (branches included), the cell is the last event.
      title: (row) => (tree && row.history?.length
        ? row.history.map(historyLabel).join(' › ')
        : STOP_REASON[row.stopReason] || row.lastError || row.history?.[row.history.length - 1]?.detail || ''),
      render: (value, row) => {
        const last = row.history?.[row.history.length - 1];
        const text = STOP_REASON[row.stopReason]
          || row.lastError
          || (last ? (tree ? historyLabel(last) : `${stepTypeLabel(last.type)} — ${last.outcome}`) : '—');
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

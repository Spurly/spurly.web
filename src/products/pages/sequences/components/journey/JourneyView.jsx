import { useMemo, useState } from 'react';
import { FilterPills } from 'src/core/primitives';
import { SequenceCanvas } from '../SequenceCanvas.jsx';
import { START_NODE, nodeSummary, attentionFor, senderChoices, splitBranches, splitLetter, stepsOnBranch, messageAfterConnectLints } from 'src/products/sequences/journeyModel.js';
import { JourneyNode, JOURNEY_NODE_H } from './JourneyNode.jsx';
import { JourneyStart } from './JourneyStart.jsx';
import { LeadBubble } from './LeadBubble.jsx';
import { AttentionBanner } from './AttentionBanner.jsx';
import { FlowWarnings } from './FlowWarnings.jsx';
import { SenderStrip } from './SenderStrip.jsx';

const STOP_TEXT = {
  replied: 'replied', 'manual-stop': 'stopped by you', 'recent-contact': 'contacted recently', declined: 'declined', other: 'other',
};

/** Where leads ended up, as quiet chips under the tree. */
function Outcomes({ terminal }) {
  const stopped = Object.entries(terminal?.stopped ?? {});
  const failed = Object.values(terminal?.failed ?? {}).reduce((a, b) => a + b, 0);
  const chips = [
    { key: 'done', n: terminal?.completed ?? 0, text: 'completed' },
    ...stopped.map(([k, n]) => ({ key: `s:${k}`, n, text: STOP_TEXT[k] ?? k.replace(/-/g, ' ') })),
    { key: 'failed', n: failed, text: 'failed' },
  ].filter((c) => c.n > 0);
  if (!chips.length) return null;
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Where leads ended up">
      {chips.map((c) => (
        <li key={c.key} className="inline-flex items-center gap-1 h-6 px-2.5 rounded-[var(--ui-radius-pill)] bg-[var(--ui-surface-sunken)] text-[length:var(--ui-t-meta)] text-[var(--ui-text-secondary)]">
          <span className="ui-num font-medium text-[var(--ui-text-primary)]">{c.n}</span> {c.text}
        </li>
      ))}
    </ul>
  );
}

/** Journey tab: the sequence tree with the leads standing on each step. Read-only. */
const LEGEND = [['active', 'moving', 'var(--ui-success-dot)'], ['waiting', 'waiting', 'var(--ui-accent-dot)'], ['failed', 'failed', 'var(--ui-danger-dot)']];

export function JourneyView({ sequence, journey, branchCounts, onOpenEnrolled, onInsertWait, saving = false }) {
  const [status, setStatus] = useState('');
  const [branch, setBranch] = useState('');
  const { flow, loading, senderId, setSenderId, openId, openLead, retrying, retryAll } = journey;
  const choices = useMemo(() => senderChoices(flow), [flow]);
  const counts = useMemo(() => {
    const out = {};
    for (const node of Object.values(flow?.nodes ?? {})) {
      for (const [id, c] of Object.entries(node.bySender ?? {})) out[id] = (out[id] ?? 0) + (c.active ?? 0) + (c.waiting ?? 0) + (c.failed ?? 0);
    }
    return out;
  }, [flow]);
  const attention = attentionFor(flow, senderId);
  const branches = useMemo(() => splitBranches(sequence.steps), [sequence.steps]);
  const onBranch = useMemo(() => (branch ? stepsOnBranch(sequence.steps, branch) : null), [sequence.steps, branch]);
  const startNode = flow?.nodes?.[START_NODE];
  const totals = useMemo(() => {
    const t = { active: 0, waiting: 0, failed: 0 };
    for (const [id, n] of Object.entries(flow?.nodes ?? {})) {
      if (id === START_NODE) continue;
      for (const k of Object.keys(t)) t[k] += n.here?.[k] ?? 0;
    }
    return t;
  }, [flow]);
  const statusOptions = [
    { id: '', label: 'All', count: totals.active + totals.waiting + totals.failed + (startNode ? nodeSummary(startNode).here : 0) },
    { id: 'active', label: 'Moving', count: totals.active },
    { id: 'waiting', label: 'Waiting', count: totals.waiting },
    { id: 'failed', label: 'Failed', count: totals.failed },
    { id: 'notstarted', label: 'Not started', count: nodeSummary(flow?.nodes?.[START_NODE], senderId).here },
    { id: 'replied', label: 'Replied', count: flow?.replied?.count ?? 0 },
  ];
  const enrolled = totals.active + totals.waiting + totals.failed + (startNode ? nodeSummary(startNode).here : 0) + (flow?.terminal?.completed ?? 0)
    + Object.values(flow?.terminal?.stopped ?? {}).reduce((a, b) => a + b, 0);
  const wholeStatus = status === 'notstarted' || status === 'replied';
  const paused = flow?.status === 'paused';
  const lints = useMemo(() => messageAfterConnectLints(sequence.steps), [sequence.steps]);
  const splitIds = useMemo(() => new Set((sequence.steps ?? []).filter((x) => x.type === 'split').map((x) => x.id)), [sequence.steps]);

  if (loading && !flow) {
    return <p className="px-[var(--ui-shell-x)] pt-6 text-[length:var(--ui-t-control)] text-[var(--ui-text-secondary)]">Loading the journey…</p>;
  }
  if (!flow) {
    return <p className="px-[var(--ui-shell-x)] pt-6 text-[length:var(--ui-t-control)] text-[var(--ui-text-secondary)]">The journey is not available right now.</p>;
  }
  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div className="shrink-0 flex flex-col gap-2.5 px-[var(--ui-shell-x)] pt-4 pb-3">
        <div className="flex items-center gap-2.5 flex-wrap">
          <FilterPills size="sm" options={statusOptions} value={status} onChange={setStatus} ariaLabel="Filter by lead status" />
          {branches.length > 0 && (
            <FilterPills
              size="sm"
              options={[{ id: '', label: 'Both branches' }, ...branches.map((b) => ({ id: b, label: `Only ${splitLetter(b)}` }))]}
              value={branch}
              onChange={setBranch}
              ariaLabel="Show one branch"
            />
          )}
          <ul className="ml-auto flex items-center gap-3 text-[length:var(--ui-t-meta)] text-[var(--ui-text-secondary)]" aria-label="Bubble colours">
            {LEGEND.map(([k, text, color]) => (
              <li key={k} className="inline-flex items-center gap-1.5"><i className="block w-2.5 h-2.5 rounded-full border-2" style={{ borderColor: color }} aria-hidden="true" />{text}</li>
            ))}
          </ul>
        </div>
        <SenderStrip choices={choices} counts={counts} value={senderId} onChange={setSenderId} />
        {paused && <p className="font-[family-name:var(--ui-font-mono)] text-[length:var(--ui-t-micro)] text-[var(--ui-text-quaternary)]">Paused: nothing is sent. Positions, waits and counts below are still live.</p>}
        <AttentionBanner items={attention} retrying={retrying} onRetry={retryAll} />
        {onInsertWait && <FlowWarnings lints={lints} steps={sequence.steps} splitIds={splitIds} paused={paused} saving={saving} onInsert={onInsertWait} />}
        {status === 'replied' && (
          <div className="flex items-center gap-1 min-h-8" data-testid="replied-strip">
            {(flow.replied?.leads ?? []).length === 0
              ? <span className="text-[length:var(--ui-t-label)] text-[var(--ui-text-secondary)]">Nobody has replied yet.</span>
              : flow.replied.leads.map((l) => <LeadBubble key={l.id} lead={{ ...l, status: 'replied' }} active={openId === l.id} onOpen={openLead} />)}
            {(flow.replied?.count ?? 0) > (flow.replied?.leads ?? []).length && <span className="ml-2 text-[length:var(--ui-t-meta)] text-[var(--ui-text-secondary)]">+{flow.replied.count - flow.replied.leads.length} more in the inbox</span>}
          </div>
        )}
        <Outcomes terminal={flow.terminal} />
      </div>
      <div className="flex-1 min-h-0 px-[var(--ui-shell-x)] pb-5 flex flex-col">
        <div className="flex-1 min-h-0 flex flex-col rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] overflow-hidden">
          <SequenceCanvas
            steps={sequence.steps}
            readOnly
            nodeH={JOURNEY_NODE_H}
            fitMinZoom={0.8}
            branchCounts={branchCounts}
            selectedId={null}
            onSelect={() => {}}
            renderStart={(node) => (
              <JourneyStart
                key="start"
                node={node}
                flowNode={startNode}
                enrolled={enrolled}
                senderId={senderId}
                status={status}
                dimmed={status === 'replied'}
                openId={openId}
                onOpenLead={openLead}
                onMore={onOpenEnrolled}
              />
            )}
            renderNode={(node) => (
              <JourneyNode
                key={node.key}
                node={node}
                flowNode={flow.nodes?.[node.key]}
                senderId={senderId}
                status={status}
                dimmed={wholeStatus || (!!onBranch && !onBranch.has(node.key))}
                openId={openId}
                selected={false}
                onSelectStep={() => {}}
                onOpenLead={openLead}
                onMore={onOpenEnrolled}
              />
            )}
            className="flex-1 min-h-0"
          />
        </div>
      </div>
    </div>
  );
}

export default JourneyView;

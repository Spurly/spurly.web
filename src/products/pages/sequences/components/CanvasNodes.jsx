import { ArrowRight, Ban, Clock, X } from 'lucide-react';
import { IconButton } from 'src/core/primitives';
import { STEP_TYPE_MAP } from 'src/products/sequences/stepTypes.js';
import { isBranching } from 'src/products/sequences/treeModel.js';
import { tileClass, terminalTile } from './nodeStyle.js';
import { stepSummary } from './SequenceFlowBuilder.jsx';

/** The pieces drawn on the canvas. They only render; every gesture is handled by SequenceCanvas. */

const PILL_TONES = {
  yes: 'border-[var(--ui-success-dot)] text-[var(--ui-success-fg)]',
  no: 'border-[var(--ui-danger-border)] text-[var(--ui-danger-fg)]',
  a: 'border-[var(--ui-accent-border)] text-[var(--ui-accent-fg)]',
  b: 'border-[var(--ui-border-strong)] text-[var(--ui-text-secondary)]',
};

/** The label on a branch ("Yes", "Accepted", "A · 50%"), with how many leads took it once the sequence has run. */
export function BranchPill({ label, count, x, y }) {
  return (
    <div
      className={`absolute pointer-events-none -translate-x-1/2 -translate-y-1/2 inline-flex items-center gap-1 h-[22px] px-2.5 rounded-[var(--ui-radius-pill)] border bg-[var(--ui-surface-card)] shadow-[var(--ui-shadow-sm)] whitespace-nowrap text-[length:var(--ui-t-meta)] font-medium ${PILL_TONES[label.tone] ?? PILL_TONES.b}`}
      style={{ left: x, top: y }}
      data-branch={label.side}
    >
      {label.text}
      {count != null && <span className="ui-num opacity-80">· {count}</span>}
    </div>
  );
}

/** Start and Stop. Not stored: Start is where leads enter and Stop is where a list ends. */
export function TerminalNode({ node }) {
  const stop = node.kind === 'stop';
  const Icon = stop ? Ban : ArrowRight;
  return (
    <div
      className="absolute flex items-center gap-2.5 px-2.5 rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface-card)] shadow-[var(--ui-shadow-sm)]"
      style={{ left: node.x, top: node.y, width: node.w, height: node.h }}
      data-terminal={node.kind}
    >
      <span className={`shrink-0 grid place-items-center w-7 h-7 rounded-[var(--ui-radius-sm)] ${terminalTile(node.kind)}`}>
        <Icon size={14} aria-hidden="true" />
      </span>
      <span className="text-[length:var(--ui-t-body)] font-semibold text-[var(--ui-text-primary)]">{stop ? 'Stop' : 'Start'}</span>
    </div>
  );
}

export function StepNode({ node, error, selected, dimmed, readOnly, onActivate, onRemove }) {
  const { step } = node;
  const def = STEP_TYPE_MAP[step.type];
  const Icon = def?.icon;
  const label = def?.label ?? step.type;
  const summary = stepSummary(step);
  const delay = !isBranching(step) && step.delayDays > 0 ? step.delayDays : 0;
  const ring = error
    ? 'border-[var(--ui-danger)]'
    : selected
      ? 'border-[var(--ui-accent)] shadow-[0_0_0_4px_rgba(59,91,219,0.16),var(--ui-shadow-md)]'
      : 'border-[var(--ui-border)] shadow-[var(--ui-shadow-sm)] hover:border-[var(--ui-accent-border)] hover:shadow-[var(--ui-shadow-md)]';
  return (
    <div
      data-node-id={step.id}
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      aria-label={summary ? `${label}: ${summary}` : label}
      onClick={() => onActivate(step.id)}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) return;
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onActivate(step.id); }
      }}
      className={`group absolute flex items-center gap-3 px-3 rounded-[var(--ui-radius-lg)] border bg-[var(--ui-surface-card)] cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-accent)] transition-[border-color,box-shadow,opacity] duration-[var(--ui-dur-fast)] ${ring} ${dimmed ? 'opacity-40' : ''}`}
      style={{ left: node.x, top: node.y, width: node.w, height: node.h }}
    >
      <span className={`shrink-0 grid place-items-center w-9 h-9 rounded-[var(--ui-radius-btn)] ${tileClass(step.type)}`}>
        {Icon && <Icon size={17} aria-hidden="true" />}
      </span>
      <span className="flex-1 min-w-0 flex flex-col">
        <span className="truncate text-[length:var(--ui-t-body)] font-semibold leading-tight text-[var(--ui-text-primary)]">{label}</span>
        {summary && <span className="truncate mt-0.5 text-[length:var(--ui-t-meta)] leading-tight text-[var(--ui-text-secondary)]">{summary}</span>}
      </span>
      {delay > 0 && (
        <span className="shrink-0 inline-flex items-center gap-1 h-5 px-1.5 rounded-[var(--ui-radius-pill)] bg-[var(--ui-surface-sunken)] text-[var(--ui-text-secondary)] text-[length:var(--ui-t-meta)]" title={`Waits ${delay} day(s) before this step`}>
          <Clock size={10} aria-hidden="true" />
          <span className="ui-num">{delay}d</span>
        </span>
      )}
      {error && <span className="shrink-0 w-2 h-2 rounded-full bg-[var(--ui-danger)]" title={error} role="img" aria-label={`Problem: ${error}`} />}
      {!readOnly && (
        <IconButton
          icon={<X size={11} />}
          label={`Remove ${label}`}
          size="sm"
          variant="secondary"
          onClick={(e) => { e.stopPropagation(); onRemove(step.id); }}
          className={`!absolute -top-2 -right-2 !w-5 !h-5 !rounded-full transition-opacity ${selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100'}`}
        />
      )}
    </div>
  );
}

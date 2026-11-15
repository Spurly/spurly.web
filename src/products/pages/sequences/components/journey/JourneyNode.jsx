import { Clock } from 'lucide-react';
import { STEP_TYPE_MAP } from 'src/products/sequences/stepTypes.js';
import { bubblesFor, hiddenAt, matchesStatus, nodeSummary } from 'src/products/sequences/journeyModel.js';
import { tileClass } from '../nodeStyle.js';
import { stepSummary } from '../SequenceFlowBuilder.jsx';
import { LeadBubble } from './LeadBubble.jsx';

/** Visible bubbles per step; the server sends up to 12 and the rest are counted in "+N". */
export const BUBBLES_SHOWN = 8;
/** Head 62 + bubble strip 36 + footer 28. */
export const JOURNEY_NODE_H = 126;

/** A thin bar of where this step's leads went: passed, skipped, stuck, and still here. */
function Meter({ s }) {
  const total = s.passed.done + s.passed.skipped + s.here;
  if (total === 0) return <span className="flex-1 h-[var(--ui-meter-h)] rounded-full bg-[var(--ui-meter-track)]" />;
  const part = (n) => `${(n / total) * 100}%`;
  return (
    <span className="flex-1 h-[var(--ui-meter-h)] rounded-full bg-[var(--ui-meter-track)] flex overflow-hidden" aria-hidden="true">
      <i className="block h-full bg-[var(--ui-success-dot)]" style={{ width: part(s.passed.done) }} />
      <i className="block h-full bg-[var(--ui-neutral-400)]" style={{ width: part(s.passed.skipped) }} />
      <i className="block h-full bg-[var(--ui-danger-dot)]" style={{ width: part(s.failed) }} />
      <i className="block h-full bg-[var(--ui-accent-dot)]" style={{ width: part(s.active + s.waiting) }} />
    </span>
  );
}

/** A step in the Journey view: the step, the leads standing on it, and how many came through. */
export function JourneyNode({ node, flowNode, senderId, status = '', dimmed = false, openId, selected, onSelectStep, onOpenLead, onMore }) {
  const { step } = node;
  const def = STEP_TYPE_MAP[step.type];
  const Icon = def?.icon;
  const label = def?.label ?? step.type;
  const summary = stepSummary(step);
  const s = nodeSummary(flowNode, senderId);
  const bubbles = bubblesFor(flowNode, senderId);
  const shown = bubbles.slice(0, BUBBLES_SHOWN);
  const more = hiddenAt(flowNode, senderId) + (bubbles.length - shown.length);
  const trouble = s.failed > 0;
  const ring = trouble
    ? 'border-[var(--ui-danger-border)]'
    : selected
      ? 'border-[var(--ui-accent)] shadow-[0_0_0_4px_rgba(59,91,219,0.16),var(--ui-shadow-md)]'
      : 'border-[var(--ui-border)] shadow-[var(--ui-shadow-sm)] hover:border-[var(--ui-accent-border)]';
  return (
    <div
      data-node-id={step.id}
      className={`absolute flex flex-col rounded-[var(--ui-radius-lg)] border bg-[var(--ui-surface-card)] transition-[border-color,box-shadow,opacity] duration-[var(--ui-dur-fast)] ${dimmed ? 'opacity-35' : ''} ${ring}`}
      style={{ left: node.x, top: node.y, width: node.w, height: node.h }}
    >
      <button
        type="button"
        onClick={() => onSelectStep(step.id)}
        aria-pressed={selected}
        aria-label={summary ? `${label}: ${summary}` : label}
        className="flex items-center gap-3 px-3 h-[62px] w-full text-left rounded-t-[var(--ui-radius-lg)] cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--ui-accent)]"
      >
        <span className={`shrink-0 grid place-items-center w-9 h-9 rounded-[var(--ui-radius-btn)] ${tileClass(step.type)}`}>
          {Icon && <Icon size={17} aria-hidden="true" />}
        </span>
        <span className="flex-1 min-w-0 flex flex-col">
          <span className="truncate text-[length:var(--ui-t-body)] font-semibold leading-tight text-[var(--ui-text-primary)]">{label}</span>
          {summary && <span className="truncate mt-0.5 text-[length:var(--ui-t-meta)] leading-tight text-[var(--ui-text-secondary)]">{summary}</span>}
        </span>
        {step.delayDays > 0 && step.type !== 'wait' && (
          <span className="shrink-0 inline-flex items-center gap-1 h-5 px-1.5 rounded-[var(--ui-radius-pill)] bg-[var(--ui-surface-sunken)] text-[var(--ui-text-secondary)] text-[length:var(--ui-t-meta)]" title={`Waits ${step.delayDays} day(s) before this step`}>
            <Clock size={10} aria-hidden="true" />
            <span className="ui-num">{step.delayDays}d</span>
          </span>
        )}
      </button>

      <div className="h-9 flex items-center px-3.5 border-t border-[var(--ui-border-hairline)]" data-testid={`bubbles-${step.id}`}>
        {shown.length === 0 && more === 0 && (
          <span className="font-[family-name:var(--ui-font-mono)] text-[length:var(--ui-t-meta)] text-[var(--ui-text-quaternary)]">nobody here</span>
        )}
        {shown.map((lead) => (
          <LeadBubble key={lead.id} lead={lead} dimmed={!matchesStatus(lead, status)} active={openId === lead.id} onOpen={onOpenLead} />
        ))}
        {more > 0 && (
          <button
            type="button"
            data-canvas-ui
            onClick={(e) => { e.stopPropagation(); onMore(step.id); }}
            title="See everyone in the Enrolled tab"
            className="ml-1.5 h-[22px] px-2 rounded-[var(--ui-radius-pill)] border border-[var(--ui-border)] bg-[var(--ui-surface-card)] font-[family-name:var(--ui-font-mono)] text-[length:var(--ui-t-meta)] text-[var(--ui-text-secondary)] hover:border-[var(--ui-accent-border)] hover:text-[var(--ui-accent-fg)] cursor-pointer"
          >
            +{more}
          </button>
        )}
      </div>

      <div className="h-7 flex items-center gap-2 px-3 border-t border-[var(--ui-border-hairline)] bg-[var(--ui-surface-header)] rounded-b-[var(--ui-radius-lg)] font-[family-name:var(--ui-font-mono)] text-[length:var(--ui-t-meta)] text-[var(--ui-text-quaternary)]">
        <span className="text-[var(--ui-text-primary)] font-medium">{s.here} here</span>
        <Meter s={s} />
        <span title="Passed this step">{s.passed.done + s.passed.skipped} through</span>
      </div>
    </div>
  );
}

export default JourneyNode;

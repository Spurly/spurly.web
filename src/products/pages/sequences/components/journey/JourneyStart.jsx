import { ArrowRight } from 'lucide-react';
import { bubblesFor, hiddenAt, matchesStatus, nodeSummary } from 'src/products/sequences/journeyModel.js';
import { NODE_W } from 'src/products/sequences/treeLayout.js';
import { LeadBubble } from './LeadBubble.jsx';
import { BUBBLES_SHOWN } from './JourneyNode.jsx';

/** Where everyone enrolled waits before their first step. Same bubbles as a step, so "75 not started" is something you can see. */
export function JourneyStart({ node, flowNode, enrolled, senderId, status, dimmed, openId, onOpenLead, onMore }) {
  const s = nodeSummary(flowNode, senderId);
  const bubbles = bubblesFor(flowNode, senderId);
  const shown = bubbles.slice(0, BUBBLES_SHOWN);
  const more = hiddenAt(flowNode, senderId) + (bubbles.length - shown.length);
  const started = Math.max(enrolled - s.here, 0);
  const filter = status === 'notstarted' ? '' : status;
  return (
    <div
      className={`absolute flex flex-col rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface-card)] shadow-[var(--ui-shadow-sm)] transition-opacity duration-[var(--ui-dur-fast)] ${dimmed ? 'opacity-35' : ''}`}
      style={{ left: -NODE_W / 2, top: node.y, width: NODE_W, height: 84 }}
      data-node-id="start"
    >
      <div className="flex items-center gap-3 px-3 h-[46px]">
        <span className="shrink-0 grid place-items-center w-8 h-8 rounded-[var(--ui-radius-btn)] bg-[var(--ui-accent-tint)] text-[var(--ui-accent-fg)]"><ArrowRight size={15} aria-hidden="true" /></span>
        <span className="flex flex-col min-w-0">
          <span className="text-[length:var(--ui-t-body)] font-semibold leading-tight text-[var(--ui-text-primary)]">Start</span>
          <span className="font-[family-name:var(--ui-font-mono)] text-[length:var(--ui-t-meta)] leading-tight text-[var(--ui-text-secondary)]">{enrolled} enrolled · {started} started</span>
        </span>
      </div>
      <div className="h-9 flex items-center px-3.5 border-t border-[var(--ui-border-hairline)]" data-testid="bubbles-start">
        {shown.length === 0 && more === 0 && <span className="font-[family-name:var(--ui-font-mono)] text-[length:var(--ui-t-meta)] text-[var(--ui-text-quaternary)]">everyone has started</span>}
        {shown.map((lead) => <LeadBubble key={lead.id} lead={lead} dimmed={!matchesStatus(lead, filter)} active={openId === lead.id} onOpen={onOpenLead} />)}
        {more > 0 && (
          <button type="button" data-canvas-ui onClick={(e) => { e.stopPropagation(); onMore(); }} title="See everyone in the Enrolled tab" className="ml-1.5 h-[22px] px-2 rounded-[var(--ui-radius-pill)] border border-[var(--ui-border)] bg-[var(--ui-surface-card)] font-[family-name:var(--ui-font-mono)] text-[length:var(--ui-t-meta)] text-[var(--ui-text-secondary)] hover:border-[var(--ui-accent-border)] cursor-pointer">+{more}</button>
        )}
      </div>
    </div>
  );
}

export default JourneyStart;

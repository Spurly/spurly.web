import { Search, UserSearch, Inbox, Send, ChevronRight } from 'lucide-react';
import { Button } from 'src/core/primitives';

/**
 * The Import page's spine: where every imported row is, in the order it
 * moves. Replaces the old tabs — a row's journey is one pipeline, not three
 * unrelated lists:
 *
 *   Finding on LinkedIn → Needs your review → Ready to send → Sending to Hub
 *
 * Each stage is a filter for the table below (click to view it). A stage
 * that is waiting on the USER — review, or rows ready to send — is lit and
 * carries its own action, so the next step is always one obvious click.
 * Zero stages stay visible but quiet: the shape of the flow is the
 * explanation of the feature.
 */

const fmt = (n) => (n || 0).toLocaleString();

function Stage({ id, active, onSelect, icon: Icon, label, count, caption, attention, working, action, sublink }) {
  const empty = !count;
  return (
    <div
      role="tab"
      aria-selected={active}
      tabIndex={0}
      onClick={() => onSelect(id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(id);
        }
      }}
      className={[
        'relative flex-1 min-w-[180px] flex flex-col gap-2 px-4 py-3.5 cursor-pointer select-none',
        'transition-[background-color] duration-[var(--ui-dur-fast)]',
        'focus:outline-none focus-visible:shadow-[var(--ui-focus-ring)]',
        active ? 'bg-[var(--ui-accent-wash)]' : 'hover:bg-[var(--ui-surface-hover)]',
      ].join(' ')}
    >
      {/* the active stage owns the underline, like a tab */}
      <span
        aria-hidden="true"
        className={`absolute left-0 right-0 bottom-0 h-[2px] ${active ? 'bg-[var(--ui-accent)]' : 'bg-transparent'}`}
      />
      <div className="flex items-center gap-2 min-w-0">
        <span
          className={[
            'w-6 h-6 shrink-0 rounded-full grid place-items-center',
            attention && !empty
              ? 'bg-[var(--ui-warning-tint)] text-[var(--ui-warning-fg)]'
              : active
                ? 'bg-[var(--ui-accent-tint)] text-[var(--ui-accent-fg)]'
                : 'bg-[var(--ui-surface-sunken)] text-[var(--ui-text-tertiary)]',
          ].join(' ')}
        >
          <Icon size={13} className={working && !empty ? 'animate-pulse' : ''} />
        </span>
        <span className="ui-micro truncate">{label}</span>
      </div>

      <div className="flex items-end justify-between gap-2 min-h-[30px]">
        <span
          className={`ui-num text-[length:var(--ui-t-section)] leading-none ${
            empty ? 'text-[var(--ui-text-tertiary)]' : 'text-[var(--ui-text-primary)]'
          }`}
        >
          {fmt(count)}
        </span>
        {action && !empty && (
          <span onClick={(e) => e.stopPropagation()} role="presentation">
            {action}
          </span>
        )}
      </div>

      <p className="text-[length:var(--ui-t-meta)] text-[var(--ui-text-tertiary)] leading-snug min-h-[1.2em]">
        {caption}
        {sublink}
      </p>
    </div>
  );
}

function Arrow() {
  return (
    <span aria-hidden="true" className="hidden md:grid place-items-center w-0 relative z-[1]">
      <span className="absolute grid place-items-center w-5 h-5 rounded-full bg-[var(--ui-surface-card)] border border-[var(--ui-border-hairline)] text-[var(--ui-text-quaternary)]">
        <ChevronRight size={12} />
      </span>
    </span>
  );
}

function SubLink({ children, onClick }) {
  return (
    <>
      {' · '}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        className="underline decoration-dotted underline-offset-2 text-[var(--ui-text-secondary)] hover:text-[var(--ui-text-primary)]"
      >
        {children}
      </button>
    </>
  );
}

/**
 * @param {object} counts  { finding, notFound, review, ready, failed, sending }
 * @param {string} view    finding | notfound | review | ready | failed | sending
 */
export function PipelineBar({ counts, view, onSelect, onReview, onSend }) {
  const isActive = (ids) => ids.includes(view);
  return (
    <div
      role="tablist"
      aria-label="Import pipeline"
      className="flex flex-col md:flex-row rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface-card)] shadow-[var(--ui-shadow-card)] overflow-hidden divide-y md:divide-y-0 md:divide-x divide-[var(--ui-border-hairline)]"
    >
      <Stage
        id="finding"
        active={isActive(['finding', 'notfound'])}
        onSelect={onSelect}
        icon={Search}
        label="Finding on LinkedIn"
        count={counts.finding}
        working
        caption={counts.finding ? 'Searching by name + company' : 'Rows without a LinkedIn URL'}
        sublink={counts.notFound ? <SubLink onClick={() => onSelect('notfound')}>{fmt(counts.notFound)} not found</SubLink> : null}
      />
      <Arrow />
      <Stage
        id="review"
        active={isActive(['review'])}
        onSelect={onSelect}
        icon={UserSearch}
        label="Needs your review"
        count={counts.review}
        attention
        caption={counts.review ? 'More than one person fits' : 'Ambiguous matches wait here'}
        action={
          <Button size="sm" variant="primary" onClick={onReview}>
            Review
          </Button>
        }
      />
      <Arrow />
      <Stage
        id="ready"
        active={isActive(['ready', 'failed'])}
        onSelect={onSelect}
        icon={Inbox}
        label="Ready to send"
        count={counts.ready}
        caption={counts.ready ? 'Staged, not in your Hub yet' : 'Nothing waiting to send'}
        sublink={counts.failed ? <SubLink onClick={() => onSelect('failed')}>{fmt(counts.failed)} failed</SubLink> : null}
        action={
          <Button size="sm" variant="primary" leadingIcon={<Send size={12} />} onClick={onSend}>
            Send to Hub
          </Button>
        }
      />
      <Arrow />
      <Stage
        id="sending"
        active={isActive(['sending'])}
        onSelect={onSelect}
        icon={Send}
        label="Sending to Hub"
        count={counts.sending}
        working
        caption={counts.sending ? 'Landing in Hub Leads' : 'Sent rows leave this page'}
      />
    </div>
  );
}

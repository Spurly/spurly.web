import { Search, UserSearch, Inbox, Send, ArrowRight } from 'lucide-react';
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

function Stage({ id, step, active, onSelect, icon: Icon, label, count, caption, attention, working, action, sublink }) {
  const empty = !count;
  const lit = attention && !empty;
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
        'group relative flex-1 min-w-0 flex items-center gap-3 px-4 py-3 cursor-pointer select-none',
        'transition-[background-color] duration-[var(--ui-dur-fast)]',
        'focus:outline-none focus-visible:bg-[var(--ui-surface-hover)]',
        active ? 'bg-[var(--ui-accent-wash)]' : 'hover:bg-[var(--ui-surface-hover)]',
      ].join(' ')}
    >
      <span
        aria-hidden="true"
        className={`absolute left-0 right-0 bottom-0 h-[2px] transition-colors ${active ? 'bg-[var(--ui-accent)]' : 'bg-transparent'}`}
      />
      <span
        className={[
          'relative w-8 h-8 shrink-0 rounded-[var(--ui-radius-md)] grid place-items-center',
          lit
            ? 'bg-[var(--ui-warning-tint)] text-[var(--ui-warning-fg)]'
            : active
              ? 'bg-[var(--ui-accent-tint)] text-[var(--ui-accent-fg)]'
              : 'bg-[var(--ui-surface-sunken)] text-[var(--ui-text-tertiary)]',
        ].join(' ')}
      >
        <Icon size={15} />
        {working && !empty && (
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[var(--ui-accent)] sp-pulse" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 text-[length:var(--ui-t-meta)] text-[var(--ui-text-tertiary)] leading-none">
          <span className="ui-num">{step}</span>
          <span className="truncate">{label}</span>
        </p>
        <p className="flex items-baseline gap-2 mt-1.5 min-w-0">
          <span
            className={`ui-num text-[length:var(--ui-t-section)] leading-none ${
              empty ? 'text-[var(--ui-text-quaternary)]' : lit ? 'text-[var(--ui-warning-fg)]' : 'text-[var(--ui-text-primary)]'
            }`}
          >
            {fmt(count)}
          </span>
          {caption && <span className="truncate text-[length:var(--ui-t-meta)] text-[var(--ui-text-tertiary)]">{caption}</span>}
        </p>
      </div>
      {sublink && <span className="shrink-0 -my-2">{sublink}</span>}
      {action && !empty && (
        <span className="shrink-0" onClick={(e) => e.stopPropagation()} role="presentation">
          {action}
        </span>
      )}
    </div>
  );
}

function SubLink({ children, onClick }) {
  return (
    <Button
      size="sm"
      variant="link"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      {children}
    </Button>
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
        step="1"
        active={isActive(['finding', 'notfound'])}
        onSelect={onSelect}
        icon={Search}
        label="Finding on LinkedIn"
        count={counts.finding}
        working
        caption={counts.finding ? 'searching' : ''}
        sublink={counts.notFound ? <SubLink onClick={() => onSelect('notfound')}>{fmt(counts.notFound)} not found</SubLink> : null}
      />
      <Stage
        id="review"
        step="2"
        active={isActive(['review'])}
        onSelect={onSelect}
        icon={UserSearch}
        label="Needs your review"
        count={counts.review}
        attention
        caption={counts.review ? 'waiting for you' : ''}
        action={
          <Button size="sm" variant="accentSoft" trailingIcon={<ArrowRight size={12} />} onClick={onReview}>
            Review
          </Button>
        }
      />
      <Stage
        id="ready"
        step="3"
        active={isActive(['ready', 'failed'])}
        onSelect={onSelect}
        icon={Inbox}
        label="Ready to send"
        count={counts.ready}
        caption=""
        sublink={counts.failed ? <SubLink onClick={() => onSelect('failed')}>{fmt(counts.failed)} failed</SubLink> : null}
        action={
          <Button size="sm" variant="accentSoft" trailingIcon={<ArrowRight size={12} />} onClick={onSend}>
            Send to Hub
          </Button>
        }
      />
      <Stage
        id="sending"
        step="4"
        active={isActive(['sending'])}
        onSelect={onSelect}
        icon={Send}
        label="Sending to Hub"
        count={counts.sending}
        working
        caption={counts.sending ? 'landing in Hub' : ''}
      />
    </div>
  );
}

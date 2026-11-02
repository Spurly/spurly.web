import { useState } from 'react';
import { ArrowUpRight, Check, UserX } from 'lucide-react';
import { Avatar, Badge, Button, Drawer } from 'src/core/primitives';
import { normalizeDomain } from 'src/shared/utils/companyDomain.js';

/**
 * "Which Rahul Sharma at TCS?" — the one decision the lookup can't make.
 *
 * Opens from a Needs-review row. The user compares the candidates against
 * what their file says, opens a profile on LinkedIn if unsure, selects one
 * and adds it. "None of these" drops the row. After either, the drawer
 * moves straight to the next row needing review, so a batch of them is a
 * quick run of decisions rather than open → decide → close → find the next.
 *
 * Nothing is staged until "Add to staged leads" — ticking a card only
 * selects it. More than one can be ticked: sometimes two of the candidates
 * are both worth reaching (a namesake who also works there), so the user can
 * add several from one row.
 */

const DEGREE = { 1: '1st', 2: '2nd', 3: '3rd+' };
/** Why a candidate looks right, in the words of the user's own file. */
function reasonLabel(reason, input = {}) {
  if (reason === 'company') return input.company ? `Mentions ${input.company}` : 'Company in headline';
  if (reason === 'title') return 'Similar title';
  if (reason === 'location') {
    const city = String(input.location || '').split(',')[0].trim();
    return city ? `In ${city}` : 'Same location';
  }
  return reason;
}

function CandidateOption({ candidate, input, selected, onSelect }) {
  const meta = [candidate.location, DEGREE[candidate.connectionDegree] && `${DEGREE[candidate.connectionDegree]} connection`]
    .filter(Boolean)
    .join(' · ');
  return (
    <div
      role="checkbox"
      aria-checked={selected}
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      className={[
        'group flex items-start gap-3 px-3.5 py-3 rounded-[var(--ui-radius-md)] border cursor-pointer',
        'transition-[background-color,border-color,box-shadow] duration-[var(--ui-dur-fast)]',
        'focus:outline-none focus-visible:shadow-[var(--ui-focus-ring)]',
        selected
          ? 'bg-[var(--ui-accent-wash)] border-[var(--ui-accent)] shadow-[0_0_0_1px_var(--ui-accent)]'
          : 'bg-[var(--ui-surface-card)] border-[var(--ui-border)] hover:border-[var(--ui-accent-border)] hover:bg-[var(--ui-surface-hover)]',
      ].join(' ')}
    >
      <span
        aria-hidden="true"
        className={[
          'mt-2.5 w-4 h-4 shrink-0 rounded-[4px] border-[1.5px] grid place-items-center transition-colors',
          selected ? 'border-[var(--ui-accent)] bg-[var(--ui-accent)] text-[var(--ui-accent-on)]' : 'border-[var(--ui-border)] group-hover:border-[var(--ui-accent-border)]',
        ].join(' ')}
      >
        {selected && <Check size={11} strokeWidth={3} />}
      </span>
      <Avatar src={candidate.profilePictureUrl || null} name={candidate.name} size={36} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="truncate text-[length:var(--ui-t-body)] font-medium text-[var(--ui-text-primary)]">
            {candidate.name}
          </span>
          <a
            href={candidate.profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            title="Open their LinkedIn profile in a new tab"
            aria-label={`Open ${candidate.name} on LinkedIn`}
            className="shrink-0 text-[var(--ui-text-tertiary)] hover:text-[var(--ui-accent-fg)]"
          >
            <ArrowUpRight size={14} />
          </a>
        </div>
        {candidate.headline && (
          <p className="text-[length:var(--ui-t-label)] text-[var(--ui-text-secondary)] mt-0.5 line-clamp-2 leading-snug">
            {candidate.headline}
          </p>
        )}
        {meta && <p className="text-[length:var(--ui-t-meta)] text-[var(--ui-text-tertiary)] mt-1 truncate">{meta}</p>}
        {(candidate.reasons || []).length > 0 && (
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5">
          {(candidate.reasons || []).map((r) => (
            <Badge key={r} size="sm" tone="success" variant="minimal" dot>
              {reasonLabel(r, input)}
            </Badge>
          ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * @param {object|null} row        the lookup row under review (null = closed)
 * @param {number}      position   1-based index among rows needing review
 * @param {number}      total      rows needing review
 */
export function LookupReviewDrawer({ row, position, total, busy, onPick, onNone, onSkip, onClose }) {
  // Keyed on the row id by the caller, so selection resets per row.
  const [selected, setSelected] = useState(() => new Set());
  const toggle = (url) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url);
      else next.add(url);
      return next;
    });
  const input = row?.input || {};
  const candidates = row?.candidates || [];
  const firstName = String(input.firstName || input.name || 'them').trim().split(/\s+/)[0];

  return (
    <Drawer
      open={Boolean(row)}
      onClose={onClose}
      size="lg"
      eyebrow={total > 1 ? `Review ${position} of ${total}` : 'Review'}
      title="Pick the right person"
      footer={
        <div className="flex items-center gap-2 w-full">
          <Button variant="ghost" leadingIcon={<UserX size={14} />} onClick={onNone} disabled={busy}>
            None of these
          </Button>
          <span className="flex-1" />
          {total > 1 && (
            <Button variant="ghost" onClick={onSkip} disabled={busy}>
              Decide later
            </Button>
          )}
          <Button
            variant="primary"
            onClick={() => selected.size > 0 && onPick([...selected])}
            disabled={selected.size === 0 || busy}
          >
            {busy ? 'Adding…' : selected.size > 1 ? `Add ${selected.size} to staged leads` : 'Add to staged leads'}
          </Button>
        </div>
      }
    >
      {row && (
        <div className="flex flex-col px-[var(--ui-pad-x)] py-5">
          {/* Who we are looking for — the subject of the whole panel. */}
          <section>
            <p className="ui-micro">Looking for</p>
            <h3 className="text-[length:var(--ui-t-section)] font-medium tracking-[-0.012em] text-[var(--ui-text-primary)] mt-1.5 leading-tight">
              {input.name}
            </h3>
            <p className="text-[length:var(--ui-t-body)] text-[var(--ui-text-secondary)] mt-1">
              {[input.title, input.company || normalizeDomain(input.website)].filter(Boolean).join(' at ')}
              {input.location ? <span className="text-[var(--ui-text-tertiary)]"> · {input.location}</span> : null}
            </p>
            {input.email && <p className="text-[length:var(--ui-t-label)] text-[var(--ui-text-tertiary)] mt-0.5">{input.email}</p>}
            <p className="text-[length:var(--ui-t-meta)] text-[var(--ui-text-quaternary)] mt-2">From your file{row.sourceFile ? ` ${row.sourceFile}` : ''}</p>
          </section>

          <hr className="my-5 border-0 h-px bg-[var(--ui-border-hairline)]" />

          <section className="flex flex-col gap-3">
            <div>
              <h4 className="text-[length:var(--ui-t-body)] font-medium text-[var(--ui-text-primary)]">Which of these is {firstName}?</h4>
              <p className="text-[length:var(--ui-t-label)] text-[var(--ui-text-tertiary)] mt-0.5">
                {candidates.length} {candidates.length === 1 ? 'person' : 'people'} on LinkedIn could be them. Tick the right one — or several, if
                more than one is worth reaching. Only the people you tick are added.
              </p>
            </div>
            <div role="group" aria-label="Candidates" className="flex flex-col gap-2">
              {candidates.map((c) => (
                <CandidateOption
                  key={c.profileUrl}
                  candidate={c}
                  input={input}
                  selected={selected.has(c.profileUrl)}
                  onSelect={() => toggle(c.profileUrl)}
                />
              ))}
            </div>
          </section>
        </div>
      )}
    </Drawer>
  );
}

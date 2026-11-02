import { useState } from 'react';
import { ArrowUpRight, UserX } from 'lucide-react';
import { Avatar, Badge, Button, Drawer } from 'src/core/primitives';

/**
 * "Which Rahul Sharma at TCS?" — the one decision the lookup can't make.
 *
 * Opens from a Needs-review row. The user compares the candidates against
 * what their file says, opens a profile on LinkedIn if unsure, selects one
 * and adds it. "None of these" drops the row. After either, the drawer
 * moves straight to the next row needing review, so a batch of them is a
 * quick run of decisions rather than open → decide → close → find the next.
 *
 * Nothing is staged until "Add to staged leads" — selecting a card only
 * selects it.
 */

const DEGREE = { 1: '1st', 2: '2nd', 3: '3rd+' };
const REASON_LABEL = { company: 'Company', title: 'Title', location: 'Location' };

function FileFact({ label, value }) {
  if (!value) return null;
  return (
    <span className="inline-flex items-baseline gap-1.5 min-w-0">
      <span className="text-[length:var(--ui-t-meta)] text-[var(--ui-text-tertiary)]">{label}</span>
      <span className="text-[length:var(--ui-t-label)] font-medium text-[var(--ui-text-primary)] truncate" title={value}>
        {value}
      </span>
    </span>
  );
}

function CandidateOption({ candidate, selected, onSelect }) {
  const meta = [candidate.location, DEGREE[candidate.connectionDegree] && `${DEGREE[candidate.connectionDegree]} connection`]
    .filter(Boolean)
    .join(' · ');
  return (
    <div
      role="radio"
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
          'mt-2.5 w-4 h-4 shrink-0 rounded-full border-[1.5px] grid place-items-center transition-colors',
          selected ? 'border-[var(--ui-accent)] bg-[var(--ui-accent)]' : 'border-[var(--ui-border)] group-hover:border-[var(--ui-accent-border)]',
        ].join(' ')}
      >
        {selected && <span className="w-1.5 h-1.5 rounded-full bg-[var(--ui-accent-on)]" />}
      </span>
      <Avatar src={candidate.profilePictureUrl || null} name={candidate.name} size={36} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="truncate text-[length:var(--ui-t-body)] font-medium text-[var(--ui-text-primary)]">
            {candidate.name}
          </span>
          {(candidate.reasons || []).map((r) => (
            <Badge key={r} size="sm" tone="success" variant="minimal" dot>
              {REASON_LABEL[r] || r}
            </Badge>
          ))}
          <a
            href={candidate.profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            title="Open on LinkedIn"
            className="ml-auto shrink-0 inline-flex items-center gap-0.5 text-[length:var(--ui-t-meta)] text-[var(--ui-text-tertiary)] hover:text-[var(--ui-accent-fg)]"
          >
            LinkedIn <ArrowUpRight size={12} />
          </a>
        </div>
        {candidate.headline && (
          <p className="text-[length:var(--ui-t-label)] text-[var(--ui-text-secondary)] mt-0.5 line-clamp-2 leading-snug">
            {candidate.headline}
          </p>
        )}
        {meta && <p className="text-[length:var(--ui-t-meta)] text-[var(--ui-text-tertiary)] mt-1 truncate">{meta}</p>}
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
  const [selectedUrl, setSelectedUrl] = useState(null);
  const input = row?.input || {};
  const candidates = row?.candidates || [];

  return (
    <Drawer
      open={Boolean(row)}
      onClose={onClose}
      size="lg"
      eyebrow={total > 0 ? `Pick the right person · ${position} of ${total}` : 'Pick the right person'}
      title={[input.name, input.company].filter(Boolean).join(' · ') || 'Review'}
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
            onClick={() => selectedUrl && onPick(selectedUrl)}
            disabled={!selectedUrl || busy}
          >
            {busy ? 'Adding…' : 'Add to staged leads'}
          </Button>
        </div>
      }
    >
      {row && (
        <div className="flex flex-col gap-5 px-[var(--ui-pad-x)] py-5">
          <section className="flex flex-col gap-2">
            <p className="ui-micro">Your file says</p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-3.5 py-2.5 rounded-[var(--ui-radius-md)] bg-[var(--ui-surface-sunken)]">
              <FileFact label="Name" value={input.name} />
              <FileFact label="Company" value={input.company} />
              <FileFact label="Title" value={input.title} />
              <FileFact label="Location" value={input.location} />
              <FileFact label="Email" value={input.email} />
            </div>
          </section>

          <section className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between gap-3">
              <p className="ui-micro">{candidates.length} matches on LinkedIn</p>
              <p className="text-[length:var(--ui-t-meta)] text-[var(--ui-text-tertiary)]">Only the one you choose is added</p>
            </div>
            <div role="radiogroup" aria-label="Candidates" className="flex flex-col gap-2">
              {candidates.map((c) => (
                <CandidateOption
                  key={c.profileUrl}
                  candidate={c}
                  selected={selectedUrl === c.profileUrl}
                  onSelect={() => setSelectedUrl(c.profileUrl)}
                />
              ))}
            </div>
          </section>
        </div>
      )}
    </Drawer>
  );
}

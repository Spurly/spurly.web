import { useState } from 'react';
import { ArrowUpRight, Check, UserX } from 'lucide-react';
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
const REASON_LABEL = { company: 'Company matches', title: 'Title matches', location: 'Location matches' };

function FileFact({ label, value }) {
  if (!value) return null;
  return (
    <div className="min-w-0">
      <dt className="text-[length:var(--ui-t-meta)] text-[var(--ui-text-tertiary)]">{label}</dt>
      <dd className="text-[length:var(--ui-t-label)] text-[var(--ui-text-primary)] truncate" title={value}>{value}</dd>
    </div>
  );
}

function CandidateOption({ candidate, selected, onSelect }) {
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
        'relative flex items-start gap-3 p-3 rounded-[var(--ui-radius-md)] border cursor-pointer',
        'transition-[background-color,border-color,box-shadow] duration-[var(--ui-dur-fast)]',
        'focus:outline-none focus-visible:shadow-[var(--ui-focus-ring)]',
        selected
          ? 'bg-[var(--ui-accent-wash)] border-[var(--ui-accent-border)]'
          : 'bg-[var(--ui-surface-card)] border-[var(--ui-border-hairline)] hover:border-[var(--ui-accent-border)]',
      ].join(' ')}
    >
      <Avatar src={candidate.profilePictureUrl || null} name={candidate.name} size={40} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="truncate text-[length:var(--ui-t-body)] font-medium text-[var(--ui-text-primary)]">
            {candidate.name}
          </span>
          {DEGREE[candidate.connectionDegree] && (
            <span className="shrink-0 text-[length:var(--ui-t-meta)] text-[var(--ui-text-tertiary)]">
              · {DEGREE[candidate.connectionDegree]}
            </span>
          )}
        </div>
        {candidate.headline && (
          <p className="text-[length:var(--ui-t-label)] text-[var(--ui-text-secondary)] mt-0.5 line-clamp-2">
            {candidate.headline}
          </p>
        )}
        {candidate.location && (
          <p className="text-[length:var(--ui-t-meta)] text-[var(--ui-text-tertiary)] mt-0.5 truncate">{candidate.location}</p>
        )}
        <div className="flex flex-wrap items-center gap-1.5 mt-2">
          {(candidate.reasons || []).map((r) => (
            <Badge key={r} size="sm" tone="success">
              <Check size={10} className="mr-0.5" />
              {REASON_LABEL[r] || r}
            </Badge>
          ))}
          <a
            href={candidate.profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-0.5 text-[length:var(--ui-t-meta)] text-[var(--ui-accent-fg)] hover:underline"
          >
            View on LinkedIn <ArrowUpRight size={11} />
          </a>
        </div>
      </div>
      <span
        aria-hidden="true"
        className={[
          'mt-1 w-4 h-4 shrink-0 rounded-full border grid place-items-center',
          selected ? 'border-[var(--ui-accent)] bg-[var(--ui-accent)]' : 'border-[var(--ui-border)]',
        ].join(' ')}
      >
        {selected && <span className="w-1.5 h-1.5 rounded-full bg-[var(--ui-accent-on)]" />}
      </span>
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
        <div className="flex flex-col gap-5">
          <section>
            <p className="text-[length:var(--ui-t-label)] font-medium text-[var(--ui-text-secondary)] mb-2">
              Your file says
            </p>
            <dl
              className="grid grid-cols-2 gap-x-4 gap-y-2.5 p-3 rounded-[var(--ui-radius-md)]"
              style={{ background: 'var(--ui-surface-sunken)', border: '1px solid var(--ui-border-hairline)' }}
            >
              <FileFact label="Name" value={input.name} />
              <FileFact label="Company" value={input.company} />
              <FileFact label="Title" value={input.title} />
              <FileFact label="Location" value={input.location} />
              <FileFact label="Email" value={input.email} />
            </dl>
          </section>

          <section>
            <p className="text-[length:var(--ui-t-label)] font-medium text-[var(--ui-text-secondary)]">
              {candidates.length} people on LinkedIn match
            </p>
            <p className="text-[length:var(--ui-t-meta)] text-[var(--ui-text-tertiary)] mt-0.5 mb-2.5">
              Only the person you choose is added. Not sure? Open their profile on LinkedIn first.
            </p>
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

import { Search, UserCheck, UserX, ExternalLink, RotateCcw, X, AlertCircle, ArrowRight } from 'lucide-react';
import { Avatar, Badge, Button, EmptyState, FilterPills, IconButton, WorkingLine } from 'src/core/primitives';
import { LOOKUP_LIMIT } from 'src/products/import/constants/constants.js';

/**
 * "Find profiles" — CSV rows that had a name + company but no LinkedIn URL.
 *
 * Spurly searches each one on LinkedIn through the user's own account in the
 * background — roughly 10-15 a minute (backend importedLeads/lookupJob.js). One clear match is
 * added to Staged leads automatically. When several people fit — five Rahul
 * Sharmas at TCS — NOTHING is added: the row waits here and the user picks
 * the right person, or "None of these". Wrong people never reach Leads.
 */

const VIEWS = [
  { id: 'needs_review', label: 'Needs review', stat: 'needsReview' },
  { id: 'in_progress', label: 'Searching', stat: 'inFlight' },
  { id: 'not_found', label: 'Not found', stat: 'notFound' },
  { id: 'found', label: 'Found', stat: 'found' },
];

const DEGREE = { 1: '1st', 2: '2nd', 3: '3rd+' };
const REASON_LABEL = { company: 'company in headline', title: 'title matches', location: 'location matches' };

function rowLabel(input = {}) {
  return [input.name, input.company].filter(Boolean).join(' · ');
}

function rowExtras(input = {}) {
  return [input.title, input.location].filter(Boolean).join(' · ');
}

function Card({ children }) {
  return (
    <div
      className="rounded-[var(--ui-radius-lg)]"
      style={{ background: 'var(--ui-surface-card)', border: '1px solid var(--ui-border-hairline)' }}
    >
      {children}
    </div>
  );
}

function Candidate({ candidate, onPick, disabled }) {
  return (
    <div
      className="flex items-start gap-3 px-3 py-2.5 rounded-[var(--ui-radius-md)]"
      style={{ border: '1px solid var(--ui-border-hairline)' }}
    >
      <Avatar src={candidate.profilePictureUrl || null} name={candidate.name} size={36} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <a
            href={candidate.profileUrl}
            target="_blank"
            rel="noreferrer"
            className="text-[length:var(--ui-t-body)] font-medium text-[var(--ui-text-primary)] hover:underline truncate"
            title="Open their LinkedIn profile to check"
          >
            {candidate.name}
          </a>
          <ExternalLink size={12} className="shrink-0" style={{ color: 'var(--ui-text-tertiary)' }} />
          {DEGREE[candidate.connectionDegree] && (
            <Badge variant="minimal" tone="neutral">{DEGREE[candidate.connectionDegree]}</Badge>
          )}
        </div>
        {candidate.headline && (
          <p className="text-[length:var(--ui-t-label)] text-[var(--ui-text-secondary)] mt-0.5 line-clamp-2">
            {candidate.headline}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-1.5 mt-1">
          {candidate.location && (
            <span className="text-[length:var(--ui-t-label)] text-[var(--ui-text-tertiary)]">{candidate.location}</span>
          )}
          {(candidate.reasons || []).map((r) => (
            <Badge key={r} size="sm" tone="success" variant="minimal">
              {REASON_LABEL[r] || r}
            </Badge>
          ))}
        </div>
      </div>
      <Button size="sm" variant="secondary" onClick={onPick} disabled={disabled}>
        This one
      </Button>
    </div>
  );
}

function ReviewRow({ row, store }) {
  const disabled = Boolean(store.pendingId);
  const extras = rowExtras(row.input);
  return (
    <Card>
      <div className="flex items-start justify-between gap-3 px-[var(--ui-pad-lg)] py-3" style={{ borderBottom: '1px solid var(--ui-border-hairline)' }}>
        <div className="min-w-0">
          <p className="text-[length:var(--ui-t-body)] font-medium text-[var(--ui-text-primary)] truncate">
            {rowLabel(row.input)}
          </p>
          <p className="text-[length:var(--ui-t-label)] text-[var(--ui-text-tertiary)] mt-0.5">
            {row.candidates.length} possible match{row.candidates.length === 1 ? '' : 'es'}
            {extras ? ` · your file says: ${extras}` : ''}
          </p>
        </div>
        <Button
          size="sm"
          variant="ghost"
          leadingIcon={<UserX size={13} />}
          onClick={() => store.dismiss(row._id)}
          disabled={disabled}
        >
          None of these
        </Button>
      </div>
      <div className="grid gap-2 p-3 md:grid-cols-2">
        {row.candidates.map((c) => (
          <Candidate
            key={c.profileUrl}
            candidate={c}
            disabled={disabled}
            onPick={() => store.pick(row._id, c.profileUrl)}
          />
        ))}
      </div>
    </Card>
  );
}

function SimpleRow({ row, view, store }) {
  const disabled = Boolean(store.pendingId) || store.busy;
  return (
    <div
      className="flex items-center justify-between gap-3 px-[var(--ui-pad-lg)] py-2.5"
      style={{ borderBottom: '1px solid var(--ui-border-hairline)' }}
    >
      <div className="min-w-0">
        <p className="text-[length:var(--ui-t-body)] text-[var(--ui-text-primary)] truncate">{rowLabel(row.input)}</p>
        {view === 'not_found' && (
          <p className="text-[length:var(--ui-t-label)] text-[var(--ui-text-tertiary)] mt-0.5 truncate">
            {row.status === 'failed' ? row.error || 'The search kept failing.' : 'Nobody with this name came up at this company.'}
          </p>
        )}
        {view === 'found' && row.matchedProfileUrl && (
          <a
            href={row.matchedProfileUrl}
            target="_blank"
            rel="noreferrer"
            className="text-[length:var(--ui-t-label)] text-[var(--ui-accent-fg)] hover:underline truncate block"
          >
            {row.matchedProfileUrl.replace('https://www.', '')}
          </a>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {view === 'in_progress' && (
          <Badge variant="minimal" tone="info" dot pulse={row.status === 'searching'}>
            {row.status === 'searching' ? 'Searching…' : 'Waiting'}
          </Badge>
        )}
        {view === 'found' && (
          <Badge variant="minimal" tone="success" dot>
            {row.status === 'picked' ? 'You picked' : 'Matched'}
          </Badge>
        )}
        {view === 'not_found' && (
          <Button size="sm" variant="ghost" leadingIcon={<RotateCcw size={13} />} onClick={() => store.retry([row._id])} disabled={disabled}>
            Search again
          </Button>
        )}
        {(view === 'not_found' || (view === 'in_progress' && row.status === 'queued')) && (
          <Button size="sm" variant="ghost" leadingIcon={<X size={13} />} onClick={() => store.dismiss(row._id)} disabled={disabled}>
            Skip
          </Button>
        )}
      </div>
    </div>
  );
}

const EMPTY = {
  needs_review: { title: 'Nothing to review', hint: 'When several people match a name and company, they wait here for you to pick the right one.' },
  in_progress: { title: 'Nothing being searched', hint: 'Import a CSV with names and companies but no LinkedIn URLs, and Spurly finds the profiles here.' },
  not_found: { title: 'Nobody missing', hint: 'Rows where LinkedIn showed nobody with that name at that company show up here.' },
  found: { title: 'Nothing found yet', hint: 'Profiles Spurly found (or you picked) show here for 30 days. They are already in Staged leads.' },
};

export function LookupPanel({ store, onGoToStaged }) {
  const { view, setView, rows, stats, pagination, page, setPage, loading, error, actionError, clearActionError, busy } = store;

  const pills = VIEWS.map((v) => ({ id: v.id, label: v.label, count: stats?.[v.stat] ?? 0 }));
  const totalPages = Math.max(1, Math.ceil((pagination.total || 0) / LOOKUP_LIMIT));

  return (
    <div className="flex flex-col gap-3">
      {stats.inFlight > 0 && (
        <WorkingLine verbs={['Searching LinkedIn', 'Matching names', 'Checking companies']} variant="strip">
          {stats.inFlight.toLocaleString()} left to search through your LinkedIn account. This page updates by itself —
          you can leave it.
        </WorkingLine>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <FilterPills options={pills} value={view} onChange={setView} ariaLabel="Lookup status" />
        <div className="flex items-center gap-2">
          {view === 'needs_review' && stats.needsReview > 0 && (
            <Button size="sm" variant="ghost" onClick={() => store.dismissAll('needs_review')} disabled={busy}>
              Skip all {stats.needsReview.toLocaleString()}
            </Button>
          )}
          {view === 'not_found' && stats.notFound > 0 && (
            <>
              <Button size="sm" variant="ghost" leadingIcon={<RotateCcw size={13} />} onClick={() => store.retry()} disabled={busy}>
                Search all again
              </Button>
              <Button size="sm" variant="ghost" onClick={() => store.dismissAll('not_found')} disabled={busy}>
                Skip all
              </Button>
            </>
          )}
          {view === 'found' && stats.found > 0 && (
            <Button size="sm" variant="secondary" trailingIcon={<ArrowRight size={13} />} onClick={onGoToStaged}>
              Go to Staged leads
            </Button>
          )}
        </div>
      </div>

      {view === 'needs_review' && stats.needsReview > 0 && (
        <p className="text-[length:var(--ui-t-label)] text-[var(--ui-text-tertiary)] -mt-1">
          More than one person on LinkedIn fits these rows. Open a profile to check, then pick the right one —
          only the person you pick is added to Staged leads.
        </p>
      )}

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-[var(--ui-radius-lg)]" style={{ background: 'var(--ui-danger-tint)' }}>
          <AlertCircle size={16} style={{ color: 'var(--ui-danger)' }} />
          <p className="flex-1 text-[length:var(--ui-t-body)] text-[var(--ui-text-secondary)]">{error}</p>
          <Button size="sm" variant="ghost" onClick={() => store.refresh()}>Retry</Button>
        </div>
      )}

      {actionError && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-[var(--ui-radius-lg)]" style={{ background: 'var(--ui-danger-tint)' }}>
          <AlertCircle size={16} style={{ color: 'var(--ui-danger)' }} />
          <p className="flex-1 text-[length:var(--ui-t-label)] text-[var(--ui-text-secondary)]">{actionError}</p>
          <IconButton size="sm" icon={<X size={14} />} label="Dismiss" onClick={clearActionError} />
        </div>
      )}

      {!loading && !error && rows.length === 0 ? (
        <Card>
          <EmptyState
            compact
            icon={view === 'found' ? <UserCheck size={22} /> : <Search size={22} />}
            title={EMPTY[view].title}
            hint={EMPTY[view].hint}
          />
        </Card>
      ) : view === 'needs_review' ? (
        <div className="flex flex-col gap-3" aria-busy={loading}>
          {rows.map((row) => (
            <ReviewRow key={row._id} row={row} store={store} />
          ))}
        </div>
      ) : (
        <Card>
          <div aria-busy={loading}>
            {rows.map((row) => (
              <SimpleRow key={row._id} row={row} view={view} store={store} />
            ))}
          </div>
        </Card>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2 text-[length:var(--ui-t-label)] text-[var(--ui-text-secondary)]">
          <Button size="sm" variant="ghost" onClick={() => setPage(page - 1)} disabled={page <= 1}>Previous</Button>
          <span>
            Page {page} of {totalPages}
          </span>
          <Button size="sm" variant="ghost" onClick={() => setPage(page + 1)} disabled={page >= totalPages}>Next</Button>
        </div>
      )}
    </div>
  );
}

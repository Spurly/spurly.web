import { useState } from 'react';
import { Button, Dialog, Input } from 'src/core/primitives';
import { DEFAULT_FETCH_COUNT } from 'src/products/leads/constants/constants.js';
import { budgetLine, fetchCountProblem, perFetchMax } from 'src/products/leads/hooks/fetchCount.js';

/**
 * The sourcing dialogs on the leads page: how many profiles to fetch, what to
 * do when a search already has an audience, and naming a new custom list.
 *
 * All three are small forms whose parent remounts them per use (via `key`),
 * so their local state never needs resetting by an effect.
 */

/**
 * The "profiles to fetch" number field, with its limits spelled out.
 * Controlled: `value` is the raw string so a half-typed number is not
 * coerced under the user's cursor.
 */
export function FetchCountField({ id, value, onChange, usage, disabled = false }) {
  const max = perFetchMax(usage);
  const problem = fetchCountProblem(value, max);
  const line = budgetLine(usage);
  const dailyShort = usage && Number(value) > (usage.remainingToday ?? Infinity);
  return (
    <div>
      <label htmlFor={id} className="block ui-micro !text-[var(--ui-text-secondary)] mb-[7px]">
        Profiles to fetch
      </label>
      <Input
        id={id}
        size="sm"
        type="number"
        inputMode="numeric"
        min={1}
        max={max}
        step={1}
        mono
        value={value}
        onChange={(e) => onChange(e.target.value)}
        invalid={Boolean(problem)}
        disabled={disabled}
        className="w-[140px]"
      />
      <p
        className={`mt-2 text-[length:var(--ui-t-label)] leading-[1.5] ${
          problem ? 'text-[var(--ui-danger-fg)]' : 'text-[var(--ui-text-quaternary)]'
        }`}
      >
        {problem || `New people only — anyone already in your leads is skipped. Up to ${max} per fetch.`}
      </p>
      {line && !problem && (
        <p className="mt-1 text-[length:var(--ui-t-label)] leading-[1.5] text-[var(--ui-text-quaternary)]">
          {line}
          {dailyShort ? ' — the rest continues automatically after the daily reset.' : ''}
        </p>
      )}
    </div>
  );
}

/**
 * "You already have an audience for this search." Two ways forward:
 * fetch into that one, or start a new audience that picks up where it left
 * off (so it gets the NEXT people, not the same first page).
 */
export function DuplicateSearchDialog({ duplicate, onChoose, submitting = false }) {
  const existing = duplicate?.audience;
  const name = existing?.name || 'Untitled audience';
  const count = duplicate?.payload?.count;
  const exhausted = Boolean(existing?.exhausted);
  return (
    <Dialog
      open={Boolean(duplicate)}
      onClose={() => !submitting && onChoose(null)}
      title="You already have this search"
      description={`"${name}" was built from the same LinkedIn search.`}
      size="md"
      closeOnBackdrop={!submitting}
      footer={
        <>
          <Button onClick={() => onChoose(null)} disabled={submitting}>Cancel</Button>
          <div className="flex-1" />
          {!exhausted && (
            <Button onClick={() => onChoose('new')} disabled={submitting}>
              Create new audience
            </Button>
          )}
          <Button variant="primary" onClick={() => onChoose('append')} loading={submitting}>
            Add to “{name.length > 24 ? `${name.slice(0, 24)}…` : name}”
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3 text-[length:var(--ui-t-control)] text-[var(--ui-text-body)] leading-[1.55]">
        <p>
          <span className="font-medium text-[var(--ui-text-primary)]">Add to the existing audience</span> — fetch
          {count ? ` ${count}` : ''} more people into it, continuing from where it stopped.
        </p>
        {exhausted ? (
          <p className="text-[var(--ui-text-secondary)]">
            LinkedIn has already returned everything for this search, so a new audience would find nobody new.
            Adding checks the search again from the top for people who have appeared since. To reach more
            people, narrow the search (location, title, company…) instead.
          </p>
        ) : (
          <p>
            <span className="font-medium text-[var(--ui-text-primary)]">Create a new audience</span> — a separate
            audience with the next{count ? ` ${count}` : ''} people from the same search. Nobody already in
            “{name}” is fetched again.
          </p>
        )}
      </div>
    </Dialog>
  );
}

/** "Fetch more" on an existing audience. Remount per audience via `key`. */
export function FetchMoreDialog({ audience, usage, onSubmit, onClose, submitting = false }) {
  const [value, setValue] = useState(String(DEFAULT_FETCH_COUNT));
  const max = perFetchMax(usage);
  const problem = fetchCountProblem(value, max);
  const exhausted = Boolean(audience?.exhausted);
  const submit = () => {
    if (problem || submitting) return;
    onSubmit(audience, Number(value));
  };
  return (
    <Dialog
      open={Boolean(audience)}
      onClose={() => !submitting && onClose()}
      title="Fetch more profiles"
      description={`Into “${audience?.name || 'Untitled audience'}”.`}
      size="sm"
      closeOnBackdrop={!submitting}
      footer={
        <>
          <Button onClick={onClose} disabled={submitting}>Cancel</Button>
          <div className="flex-1" />
          <Button variant="primary" onClick={submit} disabled={Boolean(problem)} loading={submitting}>
            Fetch
          </Button>
        </>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="flex flex-col gap-3"
      >
        <FetchCountField id="fetch-more-count" value={value} onChange={setValue} usage={usage} disabled={submitting} />
        <p className="text-[length:var(--ui-t-label)] text-[var(--ui-text-secondary)] leading-[1.5]">
          {exhausted
            ? 'LinkedIn already returned everything for this search. This checks it again from the top and only adds people who are new.'
            : 'Continues from where this audience stopped, so nobody already fetched is fetched again.'}
        </p>
      </form>
    </Dialog>
  );
}

/** Name a new custom list for the selected leads. Remount per use via `key`. */
export function NewListDialog({ open, count, onSubmit, onClose, submitting = false }) {
  const [name, setName] = useState('');
  const submit = () => {
    if (submitting) return;
    onSubmit(name.trim());
  };
  return (
    <Dialog
      open={open}
      onClose={() => !submitting && onClose()}
      title="New list"
      description={`${count} selected lead${count === 1 ? '' : 's'} will go into it. They stay in All leads too.`}
      size="sm"
      closeOnBackdrop={!submitting}
      footer={
        <>
          <Button onClick={onClose} disabled={submitting}>Cancel</Button>
          <div className="flex-1" />
          <Button variant="primary" onClick={submit} loading={submitting}>Create list</Button>
        </>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <label htmlFor="new-list-name" className="block ui-micro !text-[var(--ui-text-secondary)] mb-[7px]">
          List name
        </label>
        <Input
          id="new-list-name"
          size="sm"
          fullWidth
          autoFocus
          maxLength={200}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Warm founders (optional)"
        />
      </form>
    </Dialog>
  );
}

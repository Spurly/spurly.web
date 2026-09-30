import { useState } from 'react';
import { Button, Dialog, Input, Meter } from 'src/core/primitives';
import { CheckIcon } from 'src/core/icons';
import { DEFAULT_FETCH_COUNT } from 'src/products/leads/constants/constants.js';
import { fetchCountProblem, perFetchMax } from 'src/products/leads/hooks/fetchCount.js';

/**
 * The sourcing dialogs on the leads page: how many profiles to fetch, what to
 * do when a search already has an audience, and naming a new custom list.
 *
 * All three are small forms whose parent remounts them per use (via `key`),
 * so their local state never needs resetting by an effect.
 */

/** Quick picks for "profiles to fetch", trimmed to the plan's per-fetch max. */
const PRESETS = [10, 30, 50, 100];

/**
 * One budget reading — "1,000 left / of 1,000 today" with a meter of what is
 * LEFT, so a full bar means plenty and an empty one means none.
 */
function BudgetCard({ label, left, total, warn = false }) {
  return (
    <div
      className={`flex-1 min-w-0 px-3 py-2.5 rounded-[var(--ui-radius-md)] border ${
        warn ? 'border-[var(--ui-warning-border)] bg-[var(--ui-warning-tint)]' : 'border-[var(--ui-border)] bg-[var(--ui-surface-card)]'
      }`}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="ui-micro !text-[var(--ui-text-secondary)] truncate">{label}</span>
        <span className="font-[family-name:var(--ui-font-mono)] text-[length:var(--ui-t-micro)] text-[var(--ui-text-quaternary)] whitespace-nowrap">
          of {total.toLocaleString()}
        </span>
      </div>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span className="ui-num text-[length:var(--ui-t-section)] text-[var(--ui-text-primary)]">{left.toLocaleString()}</span>
        <span className="text-[length:var(--ui-t-label)] text-[var(--ui-text-secondary)]">left</span>
      </div>
      <Meter value={left} max={total} tone={warn ? 'warning' : 'accent'} label={`${label}: ${left} of ${total} left`} className="mt-2" />
    </div>
  );
}

/**
 * The "profiles to fetch" control: quick-pick pills plus a custom number, a
 * one-line rule, and today's / this month's budget as two small cards.
 * Controlled: `value` is the raw string so a half-typed number is not coerced
 * under the user's cursor.
 */
export function FetchCountField({ id, value, onChange, usage, disabled = false }) {
  const max = perFetchMax(usage);
  const problem = fetchCountProblem(value, max);
  const presets = PRESETS.filter((n) => n <= max);
  const current = Number(value);
  const limits = usage?.limits;
  const leftToday = usage?.remainingToday ?? null;
  const leftMonth = usage?.remainingThisMonth ?? null;
  const overToday = !problem && leftToday !== null && current > leftToday;

  return (
    <div>
      <p className="block ui-micro !text-[var(--ui-text-secondary)] mb-[7px]">Profiles to fetch</p>

      <div className="flex flex-wrap items-center gap-2">
        <div
          className="inline-flex gap-1 p-1 rounded-[var(--ui-radius-sm)] bg-[var(--ui-surface-sunken)]"
          role="group"
          aria-label="Quick picks"
        >
          {presets.map((n) => {
            const active = !problem && current === n;
            return (
              <button
                key={n}
                type="button"
                onClick={() => onChange(String(n))}
                aria-pressed={active}
                disabled={disabled}
                className={`h-[28px] min-w-[44px] px-3 rounded-[var(--ui-radius-xs)] font-[family-name:var(--ui-font-mono)] text-[length:var(--ui-t-label)] font-medium transition-colors focus:outline-none focus-visible:shadow-[var(--ui-focus-ring)] disabled:opacity-50 ${
                  active
                    ? 'bg-[var(--ui-surface-card)] text-[var(--ui-accent-fg)] shadow-[var(--ui-shadow-sm)]'
                    : 'text-[var(--ui-text-secondary)] hover:text-[var(--ui-text-primary)]'
                }`}
              >
                {n}
              </button>
            );
          })}
        </div>

        <label htmlFor={id} className="inline-flex items-center gap-2">
          <span className="text-[length:var(--ui-t-label)] text-[var(--ui-text-tertiary)]">or</span>
          <Input
            id={id}
            aria-label="Profiles to fetch"
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
            className="w-[92px]"
          />
        </label>
      </div>

      {problem ? (
        <p className="mt-2 text-[length:var(--ui-t-label)] leading-[1.5] text-[var(--ui-danger-fg)]">{problem}</p>
      ) : (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          <span
            className="inline-flex items-center gap-1.5 h-[24px] px-2.5 rounded-[var(--ui-radius-pill)] bg-[var(--ui-accent-tint)] text-[length:var(--ui-t-label)] text-[var(--ui-accent-fg)]"
            title="Anyone already in your leads is skipped and does not count toward this number."
          >
            <CheckIcon size={12} strokeWidth={2.4} />
            New people only
          </span>
          <span className="inline-flex items-center h-[24px] px-2.5 rounded-[var(--ui-radius-pill)] bg-[var(--ui-surface-sunken)] text-[length:var(--ui-t-label)] text-[var(--ui-text-secondary)]">
            Max {max} per fetch
          </span>
        </div>
      )}

      {limits && leftToday !== null && leftMonth !== null && (
        <>
          <div className="mt-3 flex gap-2">
            <BudgetCard label="Today" left={leftToday} total={limits.perDay} warn={overToday || leftToday === 0} />
            <BudgetCard label="Month" left={leftMonth} total={limits.perMonth} warn={leftMonth === 0} />
          </div>
          {overToday && (
            <p className="mt-2 text-[length:var(--ui-t-label)] leading-[1.5] text-[var(--ui-warning-fg)]">
              Only {leftToday.toLocaleString()} left today — the rest continues automatically after the daily reset.
            </p>
          )}
        </>
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
  const followers = Boolean(duplicate?.payload?.followers) || existing?.mode === 'followers';
  return (
    <Dialog
      open={Boolean(duplicate)}
      onClose={() => !submitting && onChoose(null)}
      title="You already have this search"
      description={`"${name}" was built from ${followers ? 'the same followers list' : 'the same LinkedIn search'}.`}
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
            {followers
              ? 'LinkedIn has already returned every follower, so a new audience would find nobody new. Adding checks the list again from the top for people who have followed since.'
              : 'LinkedIn has already returned everything for this search, so a new audience would find nobody new. Adding checks the search again from the top for people who have appeared since. To reach more people, narrow the search (location, title, company…) instead.'}
          </p>
        ) : (
          <p>
            <span className="font-medium text-[var(--ui-text-primary)]">Create a new audience</span> — a separate
            audience with the next{count ? ` ${count}` : ''} people from the same {followers ? 'followers list' : 'search'}. Nobody already in
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
            ? `LinkedIn already returned ${audience?.mode === 'followers' ? 'every follower' : 'everything for this search'}. This checks it again from the top and only adds people who are new.`
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

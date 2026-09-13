/**
 * The user's own note on a person, at a glance.
 *
 * Truncation and the full-value `title` are NOT handled here — `DataTable`'s
 * Cell owns both for every column (see components/DataTable/parts/Cell.jsx),
 * and a note is the column most likely to overflow, so it is also the one where
 * a second opinion on clamping would show up fastest.
 *
 * An empty note renders as an invitation rather than the usual em-dash: the
 * row already opens the drawer where the note is written, so "Add note" says
 * what the click will do. It sits at quaternary weight so a column of empty
 * notes stays quiet next to real data.
 */
export function NotesCell({ value }) {
  const text = typeof value === 'string' ? value.trim() : '';

  if (!text) {
    return <span className="text-[var(--ui-text-quaternary)]">Add note</span>;
  }

  return <span className="text-[var(--ui-text-secondary)]">{text}</span>;
}

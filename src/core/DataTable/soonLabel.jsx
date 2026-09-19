import { SoonTag } from 'src/core/primitives';

/** A column header for a column that isn't built yet: its label + SOON. */
export function soonLabel(text) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {text}
      <SoonTag />
    </span>
  );
}

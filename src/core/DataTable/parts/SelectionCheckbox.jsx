import { Checkbox } from 'src/core/primitives';

export function SelectionCheckbox({ checked, indeterminate, onChange, label }) {
  return (
    <Checkbox checked={checked} indeterminate={indeterminate} onChange={onChange} aria-label={label} />
  );
}

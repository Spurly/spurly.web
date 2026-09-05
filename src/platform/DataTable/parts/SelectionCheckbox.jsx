import { Checkbox } from 'src/ui/primitives';

export function SelectionCheckbox({ checked, indeterminate, onChange, label }) {
  return (
    <Checkbox checked={checked} indeterminate={indeterminate} onChange={onChange} aria-label={label} />
  );
}

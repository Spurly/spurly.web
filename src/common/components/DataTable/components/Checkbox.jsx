export function Checkbox({ checked = false, onChange = () => {} }) {
  return (
    <label className="inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="w-4 h-4 rounded-[5px] cursor-pointer"
        style={{ accentColor: 'var(--brand-purple)', borderColor: 'var(--border-default)' }}
      />
    </label>
  );
}

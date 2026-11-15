import { FilterPills } from 'src/core/primitives';

/** "All accounts" plus one chip per sending account, with how many leads each is working. Only shown when there is more than one account. */
export function SenderStrip({ choices, counts, value, onChange }) {
  if (choices.length < 2) return null;
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const options = [
    { id: '', label: 'All accounts', count: total },
    ...choices.map((c) => ({ id: c.id, label: c.name || 'Account', count: counts[c.id] ?? 0 })),
  ];
  return <FilterPills size="sm" options={options} value={value ?? ''} onChange={(id) => onChange(id || null)} ariaLabel="Filter by sending account" />;
}

export default SenderStrip;

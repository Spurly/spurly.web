import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

export function SortIcon({ active, direction }) {
  if (!active) {
    return (
      <ChevronsUpDown
        size={12}
        className="text-[var(--ui-text-tertiary)] opacity-0 group-hover/sort:opacity-100 transition-opacity"
        aria-hidden="true"
      />
    );
  }
  const Icon = direction === 'asc' ? ChevronUp : ChevronDown;
  return <Icon size={12} className="text-[var(--ui-accent-fg)]" aria-hidden="true" />;
}

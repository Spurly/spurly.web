import { Avatar } from 'src/ui/primitives';
import { resolveDensity } from 'src/ui/tokens';

export function CompanyCell({ value, logo = null, density = 'default' }) {
  const d = resolveDensity(density);

  if (!value) return <span className="text-[var(--ui-text-tertiary)]">—</span>;

  return (
    <span className="flex items-center gap-2 min-w-0">
      <Avatar src={logo} name={value} size={d.avatar - 3} shape="square" />
      <span className="truncate text-[var(--ui-text-secondary)]">{value}</span>
    </span>
  );
}

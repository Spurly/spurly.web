import { SectionCard } from 'src/core/primitives/SectionCard';
import { Skeleton } from 'src/core/primitives';
import { useRecentContactDefault } from 'src/products/settings/hooks/useRecentContactDefault.js';
import { RecentContactRule } from './RecentContactRule.jsx';

const title = 'Skip people I’ve messaged recently';
const intro = 'The starting point for every new message campaign and sequence. You can change it on each one; changing it here never touches the ones you already have.';

/** The workspace default for the "skip recently messaged" rule. Saves on every change; the server's answer is what shows. */
export function RecentContactDefaultCard({ org = false }) {
  const { rule, loading, saving, save } = useRecentContactDefault();
  return (
    <SectionCard title={title}>
      {loading ? (
        <div className="flex flex-col gap-3"><Skeleton className="h-12 w-full" /></div>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-[length:var(--ui-t-label)] text-[var(--ui-text-secondary)] leading-[1.5]">{intro}</p>
          <RecentContactRule value={rule} onChange={save} showScope={org} disabled={saving} />
        </div>
      )}
    </SectionCard>
  );
}

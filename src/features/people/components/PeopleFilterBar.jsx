import { AlertTriangle, X } from 'lucide-react';
import { Tabs, Button } from 'src/ui/primitives';
import { Toolbar } from 'src/ui/layout';
import { InviteBudget } from './InviteBudget';

/**
 * Degree tabs on the left, account-level state on the right.
 *
 * Failed sends appear as a conditional alert rather than a permanent chip that
 * reads 0 on a healthy account. Clicking it toggles, so it can't strand you in
 * a filtered view with no way back.
 */
export function PeopleFilterBar({
  tabs,
  activeTab,
  onTabChange,
  summary,
  outreachFilter,
  onOutreachFilterChange,
}) {
  const needsAttention = summary?.needsAttention || 0;

  return (
    <Toolbar
      left={<Tabs tabs={tabs} activeTab={activeTab} onTabChange={onTabChange} ariaLabel="Connection degree" />}
      right={
        <>
          {needsAttention > 0 && (
            <Button
              size="sm"
              variant={outreachFilter === 'failed' ? 'dangerSoft' : 'ghost'}
              leadingIcon={<AlertTriangle size={13} />}
              trailingIcon={outreachFilter === 'failed' ? <X size={12} /> : null}
              onClick={() => onOutreachFilterChange(outreachFilter === 'failed' ? 'all' : 'failed')}
              className={outreachFilter === 'failed' ? '' : 'text-[var(--ui-danger-fg)]'}
            >
              {needsAttention} need{needsAttention === 1 ? 's' : ''} attention
            </Button>
          )}
          <InviteBudget budget={summary?.connectionBudget} />
        </>
      }
    />
  );
}

import { PersonCell, TextCell } from 'src/core/DataTable';
import { degreeLabel } from 'src/shared/utils/connectionDegree.js';
import { formatViewed } from 'src/products/profileViewers/format.js';
import { viewersStrings } from '../strings.js';

/** Viewer (photo, name, headline), Deg, Last viewed (always "about"), Times seen. */
export const viewerColumns = [
  {
    key: 'fullName',
    label: viewersStrings.columns.viewer,
    width: 300,
    title: (row) => [row.fullName, row.headline].filter(Boolean).join(' — '),
    render: (value, row) => (
      <PersonCell name={value || 'LinkedIn member'} avatar={row.photoUrl} profileUrl={row.profileUrl} subtitle={row.headline} />
    ),
  },
  {
    key: 'connectionDegree',
    label: viewersStrings.columns.degree,
    width: 64,
    align: 'center',
    render: (value) => (
      <span className="font-[family-name:var(--ui-font-mono)] text-[length:var(--ui-t-meta)] text-[var(--ui-text-secondary)]">
        {degreeLabel(value) ?? '—'}
      </span>
    ),
  },
  {
    key: 'lastViewedAt',
    label: viewersStrings.columns.lastViewed,
    width: 190,
    render: (value, row) => (
      <span className="text-[var(--ui-text-secondary)]">{formatViewed(value, row.lastViewedPrecision)}</span>
    ),
  },
  {
    key: 'viewsSeen',
    label: viewersStrings.columns.timesSeen,
    width: 110,
    align: 'center',
    render: (value) => (
      <span className="font-[family-name:var(--ui-font-mono)] text-[length:var(--ui-t-meta)] text-[var(--ui-text-secondary)]">{value ?? 1}</span>
    ),
  },
];

/**
 * The All-accounts view: the same table plus "Viewed account", which says whose profile each person looked at. A person
 * who looked at two accounts is two rows, one per account, each with its own last-viewed time and count.
 */
export function viewerColumnsForAllAccounts() {
  const viewedAccount = {
    key: 'accountName',
    label: viewersStrings.columns.viewedAccount,
    width: 190,
    title: (row) => row.accountName,
    render: (value) => <TextCell value={value || null} tone="secondary" />,
  };
  const at = viewerColumns.findIndex((c) => c.key === 'connectionDegree');
  return [...viewerColumns.slice(0, at), viewedAccount, ...viewerColumns.slice(at)];
}

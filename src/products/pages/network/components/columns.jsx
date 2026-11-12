import { PersonCell, ActivityCell, TextCell } from 'src/core/DataTable';
import { hubLeadColumns } from 'src/products/pages/leads/components/columns.jsx';

const byKey = (key) => hubLeadColumns.find((c) => c.key === key);

/** Name, Title, Company, Connected, Enrichment — the leads columns that mean something for a 1st-degree list. */
export const networkColumns = [
  {
    key: 'name',
    label: 'Name',
    width: 260,
    title: (row) => [row.name, row.headline].filter(Boolean).join(' — '),
    render: (value, row) => (
      <PersonCell name={value} avatar={row.profilePictureUrl} profileUrl={row.profileUrl} subtitle={row.headline} />
    ),
  },
  { ...byKey('currentTitle'), sortable: false },
  { ...byKey('companyName'), sortable: false },
  {
    key: 'connectedAt',
    label: 'Connected',
    width: 140,
    render: (value) => <ActivityCell label={value ? 'Connected' : null} at={value || null} />,
  },
  byKey('enrichmentStatus'),
].filter(Boolean);


/**
 * The All-accounts view: the same table plus "Connected to", which says which of the organization's accounts each
 * person is a connection of (one row per person, even when two accounts know them).
 */
export function networkColumnsForAllAccounts(accounts = []) {
  const names = new Map(accounts.map((a) => [String(a.accountKey), a.name || a.publicIdentifier || 'LinkedIn account']));
  const text = (row) => (row.orgAccountIds || []).map((id) => names.get(String(id))).filter(Boolean).join(', ');
  const connectedTo = {
    key: 'orgAccountIds',
    label: 'Connected to',
    width: 200,
    title: text,
    render: (value, row) => <TextCell value={text(row) || null} tone="secondary" />,
  };
  const at = networkColumns.findIndex((c) => c.key === 'connectedAt');
  return [...networkColumns.slice(0, at), connectedTo, ...networkColumns.slice(at)];
}

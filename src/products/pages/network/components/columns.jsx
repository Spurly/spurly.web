import { PersonCell, ActivityCell } from 'src/core/DataTable';
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


import { LinkedInIcon } from 'src/ui/icons';
import { TextCell, PersonCell, CompanyCell, LocationCell, LinkCell } from 'src/components/DataTable';

/**
 * Columns for the CSV import preview.
 *
 * Keys map onto the enrich-mode profile objects from `extractProfiles`.
 *
 * The preview is the user's proof that the mapping they just confirmed is
 * right, so the columns follow the mapping: a field they didn't map would
 * render as an empty column and read as "the import lost my data".
 *
 * Email and phone use a plain text cell rather than EmailCell/PhoneCell on
 * purpose: those render a paid-plan "Locked" state when empty, which would be
 * badly misleading for a row nobody has enriched yet.
 */

/** Always shown — profileUrl and name are required by the mapping step. */
const BASE_COLUMNS = [
  {
    key: 'profileUrl',
    label: <LinkedInIcon size={14} aria-label="LinkedIn" />,
    width: 44,
    align: 'center',
    render: (value) => <LinkCell href={value} icon={<LinkedInIcon size={14} />} label="Open LinkedIn profile" />,
  },
  {
    key: 'name',
    label: 'Name',
    width: 200,
    title: (row) => row.name,
    render: (value, row) => <PersonCell name={value} avatar={row.avatar} profileUrl={row.profileUrl} />,
  },
];

/** Shown only when the user mapped a column onto them, in this order. */
const OPTIONAL_COLUMNS = [
  { key: 'title', label: 'Title', width: 200, render: (value) => <TextCell value={value} tone="secondary" /> },
  { key: 'company', label: 'Company', width: 170, render: (value) => <CompanyCell value={value} /> },
  { key: 'location', label: 'Location', width: 170, render: (value) => <LocationCell value={value} /> },
  { key: 'headline', label: 'Headline', width: 260, render: (value) => <TextCell value={value} tone="secondary" /> },
  { key: 'email', label: 'Email', width: 200, render: (value) => <TextCell value={value} tone="secondary" /> },
  { key: 'phone', label: 'Phone', width: 150, render: (value) => <TextCell value={value} tone="secondary" /> },
  { key: 'website', label: 'Website', width: 200, render: (value) => <TextCell value={value} tone="secondary" /> },
];

/**
 * Build the preview columns for a confirmed mapping.
 *
 * @param {string[]} mappedKeys  Field keys the user mapped to a column.
 */
export function buildPreviewColumns(mappedKeys = []) {
  const mapped = new Set(mappedKeys);
  return [...BASE_COLUMNS, ...OPTIONAL_COLUMNS.filter((col) => mapped.has(col.key))];
}

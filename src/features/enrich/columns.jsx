import { LinkedInIcon } from 'src/ui/icons';
import { TextCell, PersonCell, CompanyCell, LocationCell, LinkCell } from 'src/components/DataTable';

/**
 * Columns for the CSV import preview.
 *
 * Keys map onto the enrich-mode profile objects from validateAndExtractProfiles.
 * Email and phone are deliberately absent: those cells render a paid-plan
 * "Locked" state when empty, which would be misleading for rows the user has
 * only just uploaded and nobody has enriched yet.
 */
export const previewColumns = [
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
  { key: 'title', label: 'Title', width: 200, render: (value) => <TextCell value={value} tone="secondary" /> },
  { key: 'company', label: 'Company', width: 170, render: (value) => <CompanyCell value={value} /> },
  { key: 'location', label: 'Location', width: 170, render: (value) => <LocationCell value={value} /> },
  { key: 'headline', label: 'Headline', width: 260, render: (value) => <TextCell value={value} tone="secondary" /> },
];

import { Linkedin } from 'lucide-react';
import {
  AvatarNameCell,
  CompanyCell,
  LinkedInCell,
} from 'src/common/components/DataTable/components';

/** Muted em-dash for empty preview cells (CSV imports often only carry name + URL). */
function PreviewText({ value }) {
  if (!value) return <span style={{ color: 'var(--text-tertiary)' }}>—</span>;
  return <span className="text-[13px] text-[var(--text-primary)]">{value}</span>;
}

/**
 * Column set for the Import preview table.
 *
 * Keys map directly onto the enrich-mode profile objects produced by
 * validateAndExtractProfiles (profileUrl, name, title, company, ...). Reuses the
 * same cell components as the Captured People table so the preview looks
 * identical, but omits the Email/Phone columns (those render a paid-plan "Locked"
 * state when empty, which would be misleading for rows the user just uploaded).
 */
export const previewColumns = [
  {
    key: 'profileUrl',
    label: <Linkedin size={18} className="text-spurly-purple" />,
    width: '44px',
    minWidth: '44px',
    align: 'center',
    headerClassName: 'text-center',
    cellClassName: 'text-center',
    render: (value) => <LinkedInCell value={value} />,
  },
  {
    key: 'name',
    label: 'Name',
    width: '200px',
    minWidth: '160px',
    render: (value, row) => <AvatarNameCell value={value} row={row} />,
  },
  {
    key: 'title',
    label: 'Title',
    width: '180px',
    minWidth: '150px',
    render: (value) => <PreviewText value={value} />,
  },
  {
    key: 'company',
    label: 'Company',
    width: '160px',
    minWidth: '130px',
    render: (value) => <CompanyCell value={value} />,
  },
  {
    key: 'location',
    label: 'Location',
    width: '170px',
    minWidth: '140px',
    render: (value) => <PreviewText value={value} />,
  },
  {
    key: 'headline',
    label: 'Headline',
    width: '240px',
    minWidth: '180px',
    render: (value) => <PreviewText value={value} />,
  },
];

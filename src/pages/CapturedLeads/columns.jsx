import { Linkedin } from 'lucide-react';
import {
  AvatarNameCell,
  TextCell,
  CompanyCell,
  EmailCell,
  PhoneCell,
  SkillsCell,
  LinkedInCell,
  OutreachStatusCell,
} from 'src/common/components/DataTable/components';
import { absoluteTime, relativeTime } from 'src/common/utils/outreach';


/**
 * Column definitions for the Captured People DataTable.
 * People is a full clone of the old Profile model (minus sessions), so the
 * enrichment columns (email, phone, headline, skills) are back.
 *
 * Outreach state is rendered as ONE status pill rather than separate
 * "connection sent" / "message sent" date columns — see
 * common/utils/outreach.js for why (repeat outreach, scannability).
 */
export const columns = [
  {
    key: 'linkedInUrl',
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
    width: '180px',
    minWidth: '160px',
    sortable: true,
    render: (value, row) => <AvatarNameCell value={value} row={row} />,
  },
  {
    key: 'outreach',
    label: 'Status',
    width: '150px',
    minWidth: '140px',
    render: (value) => <OutreachStatusCell outreach={value} />,
  },
  {
    key: 'title',
    label: 'Title',
    width: '180px',
    minWidth: '160px',
    sortable: true,
    render: (value) => <TextCell value={value} />,
  },
  {
    key: 'company',
    label: 'Company',
    width: '140px',
    minWidth: '120px',
    sortable: true,
    render: (value) => <CompanyCell value={value} />,
  },
  {
    key: 'location',
    label: 'Location',
    width: '160px',
    minWidth: '140px',
    sortable: true,
    render: (value) => <TextCell value={value} />,
  },
  {
    key: 'headline',
    label: 'Headline',
    width: '220px',
    minWidth: '180px',
    sortable: true,
    render: (value) => <TextCell value={value} />,
  },
  {
    key: 'email',
    label: 'Email',
    width: '200px',
    minWidth: '160px',
    render: (value) => <EmailCell value={value} />,
  },
  {
    key: 'phone',
    label: 'Phone',
    width: '140px',
    minWidth: '120px',
    sortable: true,
    render: (value) => <PhoneCell value={value} />,
  },
  {
    key: 'currentCompany',
    label: 'Current Company',
    width: '180px',
    minWidth: '160px',
    sortable: true,
    render: (value) => <TextCell value={value} />,
  },
  {
    key: 'skills',
    label: 'Skills',
    width: '220px',
    minWidth: '180px',
    render: (value) => <SkillsCell value={value} />,
  },
  {
    // The raw date, for when "3d" isn't precise enough. Reads off the same
    // rollup as the status pill so the two can never disagree.
    key: 'lastTouched',
    label: 'Last touched',
    width: '130px',
    minWidth: '120px',
    render: (_value, row) => {
      const at = row?.outreach?.lastTouchedAt;
      if (!at) return <span className="text-[13px] text-[var(--text-tertiary)]">—</span>;
      const rel = relativeTime(at);
      return (
        <span className="text-[13px] text-[var(--text-secondary)] tabular-nums" title={absoluteTime(at)}>
          {rel === 'just now' ? 'Just now' : `${rel} ago`}
        </span>
      );
    },
  },
];

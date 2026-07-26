import { Linkedin } from 'lucide-react';
import {
  AvatarNameCell,
  TextCell,
  CompanyCell,
  LinkedInCell,
} from 'src/common/components/DataTable/components';
import { relativeTime, absoluteTime } from 'src/common/utils/outreach';

const MEMBER_STATUS = {
  pending: { label: 'Pending', bg: 'var(--surface-sunken)', color: 'var(--text-tertiary)' },
  sent: { label: 'Sent', bg: 'var(--accent-tint)', color: 'var(--brand-purple)' },
  accepted: { label: 'Accepted', bg: 'var(--green-tint)', color: 'var(--green)' },
  replied: { label: 'Replied', bg: 'var(--green-tint)', color: 'var(--green)' },
  failed: { label: 'Failed', bg: 'var(--red-tint)', color: 'var(--red)' },
  skipped: { label: 'Skipped', bg: 'var(--surface-sunken)', color: 'var(--text-tertiary)' },
};

const DEGREE_LABEL = { 1: '1st', 2: '2nd', 3: '3rd' };

function StatusBadge({ value, row }) {
  const s = MEMBER_STATUS[value] || MEMBER_STATUS.pending;
  // A failed row is useless without the reason — surface it on hover.
  const title = value === 'failed' && row?.error ? row.error : undefined;
  return (
    <span
      title={title}
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap"
      style={{ background: s.bg, color: s.color }}
    >
      {s.label}
    </span>
  );
}

// Members store profileUrl directly (not linkedInUrl), so map it for the cell.
export const memberColumns = [
  {
    key: 'profileUrl',
    label: <Linkedin size={18} className="text-spurly-purple" />,
    width: '44px',
    minWidth: '44px',
    align: 'center',
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
    width: '200px',
    minWidth: '160px',
    render: (value) => <TextCell value={value} />,
  },
  {
    key: 'company',
    label: 'Company',
    width: '160px',
    minWidth: '130px',
    render: (value) => <CompanyCell value={value} />,
  },
  {
    key: 'connectionDegree',
    label: 'Degree',
    width: '80px',
    minWidth: '70px',
    align: 'center',
    render: (value) => <TextCell value={DEGREE_LABEL[value] || ''} />,
  },
  {
    key: 'status',
    label: 'Status',
    width: '110px',
    minWidth: '96px',
    render: (value, row) => <StatusBadge value={value} row={row} />,
  },
  {
    key: 'sentAt',
    label: 'Sent',
    width: '120px',
    minWidth: '110px',
    render: (value, row) => {
      const at = row?.repliedAt || row?.acceptedAt || value;
      if (!at) return <span className="text-[13px] text-[var(--text-tertiary)]">—</span>;
      const rel = relativeTime(at);
      return (
        <span
          className="text-[13px] text-[var(--text-secondary)] tabular-nums"
          title={absoluteTime(at)}
        >
          {rel === 'just now' ? 'Just now' : `${rel} ago`}
        </span>
      );
    },
  },
];

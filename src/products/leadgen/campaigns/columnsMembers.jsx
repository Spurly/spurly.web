import { LinkedInIcon } from 'src/ui/icons';
import { Badge } from 'src/ui/primitives';
import {
  TextCell,
  PersonCell,
  CompanyCell,
  LinkCell,
  DateCell,
} from 'src/ui/DataTable';
import { degreeLabel, degreeTitle } from 'src/shared/utils/connectionDegree';

const MEMBER_STATUS = {
  pending: { label: 'Pending', tone: 'neutral', dot: false },
  sent:    { label: 'Sent',    tone: 'accent',  dot: true },
  failed:  { label: 'Failed',  tone: 'danger',  dot: true },
  skipped: { label: 'Skipped', tone: 'neutral', dot: true },
};

// Members store profileUrl directly rather than linkedInUrl.
export const memberColumns = [
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
    width: 210,
    title: (row) => row.name,
    render: (value, row) => (
      <PersonCell
        name={value}
        avatar={row.avatar}
        profileUrl={row.profileUrl}
        meta={degreeLabel(row.connectionDegree)}
        metaTitle={degreeTitle(row.connectionDegree)}
      />
    ),
  },
  {
    key: 'status',
    label: 'Status',
    width: 130,
    // A failed row is useless without the reason — surface it on hover.
    title: (row) => (row.status === 'failed' && row.error ? row.error : undefined),
    render: (value, row) => {
      const s = MEMBER_STATUS[value] || MEMBER_STATUS.pending;
      return (
        <Badge
          variant="minimal"
          tone={s.tone}
          dot={s.dot}
          title={value === 'failed' && row?.error ? row.error : undefined}
        >
          {s.label}
        </Badge>
      );
    },
  },
  {
    key: 'title',
    label: 'Title',
    width: 210,
    render: (value) => <TextCell value={value} tone="secondary" />,
  },
  {
    key: 'company',
    label: 'Company',
    width: 170,
    render: (value) => <CompanyCell value={value} />,
  },
  {
    key: 'sentAt',
    label: 'Sent',
    width: 130,
    render: (value) => <DateCell value={value} />,
  },
];

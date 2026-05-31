import { Linkedin } from 'lucide-react';
import {
  AvatarNameCell,
  TextCell,
  CompanyCell,
  EmailCell,
  PhoneCell,
  SkillsCell,
  LinkedInCell,
} from 'src/common/components/DataTable/components';

/**
 * Column definitions for the Captured Leads DataTable.
 * Defines the structure, rendering, and behavior of each column.
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
];

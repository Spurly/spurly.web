import { Linkedin } from 'lucide-react';
import {
  TextCell,
  PersonCell,
  CompanyCell,
  EmailCell,
  PhoneCell,
  TagsCell,
  LinkCell,
  CalendarCell,
} from 'src/components/DataTable';

/**
 * Columns for the Connections table.
 *
 * Deliberately the People columns MINUS the outreach status and last-touched
 * date. A connection is someone you already know, not a lead in a pipeline —
 * an empty status column would imply there could be one.
 *
 * Connection degree is absent for the same reason: every row here is 1st degree
 * by definition, so the column would read "1st" forever.
 */
export const connectionColumns = [
  {
    key: 'linkedInUrl',
    label: <Linkedin size={14} aria-label="LinkedIn" />,
    width: 44,
    align: 'center',
    render: (value) => <LinkCell href={value} icon={<Linkedin size={14} />} label="Open LinkedIn profile" />,
  },
  {
    key: 'name',
    label: 'Name',
    width: 200,
    sortable: true,
    title: (row) => row.name,
    render: (value, row) => <PersonCell name={value} avatar={row.avatar} />,
  },
  {
    key: 'connectedAt',
    label: 'Connected',
    width: 170,
    sortable: true,
    render: (value) => <CalendarCell value={value} />,
  },
  {
    key: 'title',
    label: 'Title',
    width: 210,
    sortable: true,
    render: (value) => <TextCell value={value} tone="secondary" />,
  },
  {
    key: 'company',
    label: 'Company',
    width: 170,
    sortable: true,
    render: (value) => <CompanyCell value={value} />,
  },
  {
    key: 'location',
    label: 'Location',
    width: 170,
    sortable: true,
    render: (value) => <TextCell value={value} tone="secondary" />,
  },
  {
    key: 'headline',
    label: 'Headline',
    width: 260,
    sortable: true,
    render: (value) => <TextCell value={value} tone="secondary" />,
  },
  { key: 'email', label: 'Email', width: 200, render: (value) => <EmailCell value={value} /> },
  { key: 'phone', label: 'Phone', width: 150, sortable: true, render: (value) => <PhoneCell value={value} /> },
  { key: 'skills', label: 'Skills', width: 190, render: (value) => <TagsCell value={value} max={2} /> },
];

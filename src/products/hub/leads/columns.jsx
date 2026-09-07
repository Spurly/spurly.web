import { LinkedInIcon } from 'src/ui/icons';
import {
  TextCell,
  PersonCell,
  CompanyCell,
  LocationCell,
  LinkCell,
} from 'src/platform/DataTable';

/** 1st / 2nd / 3rd, from the normalised degree the backend stores. */
const DEGREE_LABEL = { 1: '1st', 2: '2nd', 3: '3rd' };

/**
 * Columns for hub leads.
 *
 * Close to the Contacts columns but not the same table and not the same data:
 * these people came from a search the user ran, not from a profile they chose
 * to capture, so there is no outreach status yet and no notes. Both arrive with
 * the sending engine; columns for them now would be empty forever.
 *
 * Degree is present here and absent on Connections for the opposite reason —
 * there every row is 1st by definition, here it is the single most useful
 * filter, because a 1st-degree lead cannot be invited and a 3rd may not be
 * reachable at all.
 */
export const hubLeadColumns = [
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
    sortable: true,
    title: (row) => row.name,
    render: (value, row) => <PersonCell name={value} avatar={row.profilePictureUrl} profileUrl={row.profileUrl} />,
  },
  {
    key: 'headline',
    label: 'Headline',
    width: 280,
    title: (row) => row.headline,
    render: (value) => <TextCell value={value} tone="secondary" />,
  },
  {
    key: 'companyName',
    label: 'Company',
    width: 180,
    sortable: true,
    render: (value) => <CompanyCell value={value} />,
  },
  {
    key: 'location',
    label: 'Location',
    width: 180,
    sortable: true,
    render: (value) => <LocationCell value={value} />,
  },
  {
    key: 'connectionDegree',
    label: 'Degree',
    width: 80,
    align: 'center',
    render: (value) => <TextCell value={DEGREE_LABEL[value] ?? '—'} tone="secondary" />,
  },
  {
    key: 'industry',
    label: 'Industry',
    width: 170,
    render: (value) => <TextCell value={value} tone="secondary" />,
  },
];

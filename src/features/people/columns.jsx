import { LinkedInIcon } from 'src/ui/icons';
import {
  TextCell,
  PersonCell,
  CompanyCell,
  LocationCell,
  EmailCell,
  PhoneCell,
  TagsCell,
  LinkCell,
} from "src/components/DataTable";
import { degreeLabel, degreeTitle } from "src/common/utils/connectionDegree";
import { OutreachStatusCell } from "./cells/OutreachStatusCell";
import { NotesCell } from "./cells/NotesCell";

/**
 * Column definitions for the People table.
 *
 * Every column carries an explicit width. Under `table-layout: fixed` these are
 * binding, so a long headline can no longer widen its column or grow its row —
 * it truncates with the full value on hover. When the total exceeds the
 * viewport the table scrolls horizontally rather than squashing.
 */
export const peopleColumns = [
  {
    key: "linkedInUrl",
    label: <LinkedInIcon size={14} aria-label="LinkedIn" />,
    width: 44,
    align: "center",
    render: (value) => (
      <LinkCell
        href={value}
        icon={<LinkedInIcon size={14} />}
        label="Open LinkedIn profile"
      />
    ),
  },
  {
    key: "name",
    label: "Name",
    width: 200,
    sortable: true,
    title: (row) => row.name,
    render: (value, row) => (
      <PersonCell
        name={value}
        avatar={row.avatar}
        /* The Profile entity renames the API's `profileUrl` to `linkedInUrl`
           (see core/entities/Profile.js). Campaign members and Enrich rows are
           NOT mapped through it and keep the original name, so both are read
           here rather than assuming one shape across tables. */
        profileUrl={row.linkedInUrl || row.profileUrl}
        meta={degreeLabel(row.connectionDegree)}
        metaTitle={degreeTitle(row.connectionDegree)}
      />
    ),
  },
  // There is no separate "Last touched" date column. It was redundant: for an
  // invited or messaged row the pill already shows that same timestamp, and for
  // a connected row the pill's date is the more useful one (the acceptance, not
  // the invite). Exact times are still one hover away — the pill's title
  // carries the absolute date of every send.
  {
    key: "outreach",
    label: "Status",
    width: 168,
    render: (value, row) => <OutreachStatusCell outreach={value} connectedAt={row?.connectedAt} />,
  },
  // Notes sit right after Status, not at the far right with the enrichment
  // columns. Everything to the right of this is scraped from LinkedIn; a note
  // is the one thing on the row the USER wrote, so it is worth a column you can
  // see without scrolling. Narrow on purpose — the full note is one hover away
  // (Cell puts it on `title`) and one click away in the drawer.
  {
    key: "notes",
    label: "Notes",
    width: 200,
    title: (row) => row.notes || undefined,
    render: (value) => <NotesCell value={value} />,
  },
  {
    key: "title",
    label: "Title",
    width: 210,
    sortable: true,
    render: (value) => <TextCell value={value} tone="secondary" />,
  },
  {
    key: "company",
    label: "Company",
    width: 170,
    sortable: true,
    render: (value) => <CompanyCell value={value} />,
  },
  {
    key: "location",
    label: "Location",
    width: 170,
    sortable: true,
    render: (value) => <LocationCell value={value} />,
  },
  {
    key: "email",
    label: "Email",
    width: 200,
    render: (value) => <EmailCell value={value} />,
  },
  {
    key: "phone",
    label: "Phone",
    width: 150,
    sortable: true,
    render: (value) => <PhoneCell value={value} />,
  },
  {
    key: "headline",
    label: "Headline",
    width: 260,
    sortable: true,
    render: (value) => <TextCell value={value} tone="secondary" />,
  },

  {
    key: "currentCompany",
    label: "Current company",
    width: 180,
    sortable: true,
    render: (value) => <TextCell value={value} tone="secondary" />,
  },
  {
    key: "skills",
    label: "Skills",
    width: 190,
    render: (value) => <TagsCell value={value} max={2} />,
  },
];

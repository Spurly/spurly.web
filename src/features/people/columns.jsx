import { Linkedin } from "lucide-react";
import {
  TextCell,
  PersonCell,
  CompanyCell,
  EmailCell,
  PhoneCell,
  TagsCell,
  LinkCell,
  DateCell,
} from "src/components/DataTable";
import { degreeLabel, degreeTitle } from "src/common/utils/connectionDegree";
import { OutreachStatusCell } from "./cells/OutreachStatusCell";

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
    label: <Linkedin size={14} aria-label="LinkedIn" />,
    width: 44,
    align: "center",
    render: (value) => (
      <LinkCell
        href={value}
        icon={<Linkedin size={14} />}
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
        meta={degreeLabel(row.connectionDegree)}
        metaTitle={degreeTitle(row.connectionDegree)}
      />
    ),
  },
  {
    key: "outreach",
    label: "Status",
    width: 168,
    render: (value, row) => <OutreachStatusCell outreach={value} connectedAt={row?.connectedAt} />,
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
    render: (value) => <TextCell value={value} tone="secondary" />,
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
    key: "lastTouched",
    label: "Last touched",
    width: 130,
    title: () => undefined,
    render: (_value, row) => <DateCell value={row?.outreach?.lastTouchedAt} />,
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

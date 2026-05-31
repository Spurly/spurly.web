import { Linkedin } from "lucide-react";
import {
  AvatarNameCell,
  TextCell,
  CompanyCell,
  LinkedInCell,
} from "src/common/components/DataTable/components";

export const columns = [
  {
    key: "linkedInUrl",
    label: <Linkedin size={18} className="text-spurly-purple" />,
    width: "44px",
    minWidth: "44px",
    align: "center",
    headerClassName: "text-center",
    cellClassName: "text-center",
    render: (value) => <LinkedInCell value={value} />,
  },
  {
    key: "name",
    label: "Name",
    width: "180px",
    minWidth: "160px",
    render: (value, row) => <AvatarNameCell value={value} row={row} />,
  },
  {
    key: "title",
    label: "Role",
    width: "160px",
    minWidth: "140px",
    render: (value) => <TextCell value={value} />,
  },
  {
    key: "headline",
    label: "Title",
    width: "200px",
    minWidth: "180px",
    render: (value) => <TextCell value={value} />,
  },
  {
    key: "company",
    label: "Company",
    width: "140px",
    minWidth: "120px",
    render: (value) => <CompanyCell value={value} />,
  },
];

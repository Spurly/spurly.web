import { LinkedInIcon } from 'src/ui/icons';
import {
  TextCell,
  PersonCell,
  LocationCell,
  LinkCell,
} from 'src/platform/DataTable';

/** 1st / 2nd / 3rd, from the normalised degree the backend stores. */
const DEGREE_LABEL = { 1: '1st', 2: '2nd', 3: '3rd' };

/**
 * Follower counts are BUCKETS, not counts.
 *
 * LinkedIn returned 3000, 21000, 2000 — round numbers because that is what it
 * publishes, the same way a profile reads "3K followers". Rendering "21,000"
 * claims a precision nobody has, and a comma-formatted figure is exactly the
 * kind of number someone quotes in a pitch. "21K" says what we actually know.
 */
function formatFollowers(n) {
  if (n == null) return '—';
  if (n >= 1_000_000) return `${Math.round(n / 100_000) / 10}M`;
  if (n >= 1_000) {
    const k = n / 1000;
    // 1.5K reads as measured; 21.0K reads as false precision.
    return `${k < 10 ? Math.round(k * 10) / 10 : Math.round(k)}K`;
  }
  return String(n);
}

/**
 * Columns for hub leads.
 *
 * NO COMPANY AND NO INDUSTRY COLUMN, deliberately. A live search response
 * (2026-09-07) carries neither: there is no `current_positions` on a search
 * result, and `industry` arrives as an explicit null. Company only exists via
 * GET /users/{id} — the per-lead resolve pass this whole module is built to
 * avoid, capped around 100 a day. A column that is empty on every row is worse
 * than no column: it reads as a bug in the import.
 *
 * The company is legible in the headline ("Head of Sales at Energy One Ltd"),
 * which is where it stays until there is an enrichment step that fetches it
 * honestly.
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
    key: 'followersCount',
    label: 'Followers',
    width: 110,
    align: 'right',
    sortable: true,
    // null means the vendor did not tell us; 0 would be a claim about their
    // audience, and someone would act on it.
    render: (value) => <TextCell value={formatFollowers(value)} tone="secondary" />,
  },
];

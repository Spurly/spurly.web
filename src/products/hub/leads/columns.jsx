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
 * COMPANY AND TITLE, PHASE 6 (1b) — these are populated by the LAZY resolve
 * pass (opening the lead drawer fires `GET /hub/leads/:id/profile`, see
 * LeadDrawer.jsx), not by the search import. A search-only row has neither:
 * there is no `current_positions`/`work_experience` on a search result (only
 * on the full-profile endpoint), which is exactly why this column used to not
 * exist at all — "empty on every row is worse than no column." That reasoning
 * no longer holds now that the fields fill in for real once a row is opened,
 * but it means these two columns are correctly blank for a lead nobody has
 * looked at yet, not broken. There is still deliberately no `industry`
 * column: verified live 2026-09-10 (see [[hub_phase6_kickoff]]) that neither
 * endpoint returns one.
 *
 * The company/title are still legible in the headline
 * ("Head of Sales at Energy One Ltd") for a row that hasn't been resolved —
 * this column is a faster scan once it has been, not a replacement.
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
    width: 160,
    sortable: true,
    title: (row) => row.companyName,
    // Blank means "not resolved yet or genuinely has none" — both read the
    // same as an empty cell, which is correct: there is nothing false to
    // assert either way. See the module comment above.
    render: (value) => <TextCell value={value || '—'} tone="secondary" />,
  },
  {
    key: 'currentTitle',
    label: 'Title',
    width: 180,
    title: (row) => row.currentTitle,
    render: (value) => <TextCell value={value || '—'} tone="secondary" />,
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

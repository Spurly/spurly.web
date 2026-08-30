/**
 * Tab manifest for the person drawer.
 *
 * Deliberately client-side DATA, not an API concern. Every field the first
 * three tabs render already arrives in the `GET /people` row, so grouping them
 * is a pure view decision: a `?view=contact` param would buy nothing and cost a
 * round-trip per tab, a backend deploy to rename a tab, and the instant-open
 * behaviour the drawer has today. If the extension ever needs the same
 * grouping, promote this file to a shared module — it is static config, not
 * data. Backend-driven grouping only earns its keep if these sections become
 * user-configurable, at which point it is a settings resource, still not a
 * parameter on the people list.
 *
 * The two remote tabs (Research, Activity) each own their own endpoint and now
 * fetch only when opened. Before tabs, opening ANY row fired both requests
 * immediately, even when the user just wanted the email.
 *
 * `hasContent` drives a muted label, not a hidden tab: most rows are
 * un-enriched, and a tab strip whose items move around between rows is harder
 * to use than one with a few dim entries.
 */
export const PERSON_DETAIL_TABS = [
  {
    id: 'overview',
    label: 'Overview',
    // Always the landing tab, so never muted — the identity block above the
    // strip means it is never truly empty anyway.
    hasContent: () => true,
  },
  {
    id: 'contact',
    label: 'Contact',
    hasContent: (lead) => Boolean(lead?.email || lead?.phone || lead?.website),
  },
  {
    id: 'research',
    label: 'Research',
    // Person-only: the Connections drawer passes a Connection, whose _id is not
    // a Person id — the research and timeline endpoints would 404 on it.
    personOnly: true,
    hasContent: () => true,
  },
  {
    id: 'activity',
    label: 'Activity',
    personOnly: true,
    hasContent: (lead) => Boolean(lead?.outreach?.lastTouchedAt),
  },
];

/** The tabs to render for this row, in order, with their muted state resolved. */
export function resolveTabs(lead, { showOutreach = true } = {}) {
  return PERSON_DETAIL_TABS.filter((tab) => showOutreach || !tab.personOnly).map((tab) => ({
    id: tab.id,
    label: tab.label,
    muted: !tab.hasContent(lead),
  }));
}

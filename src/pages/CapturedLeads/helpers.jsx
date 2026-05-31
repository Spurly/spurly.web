/**
 * Tab definitions for the Captured Leads page.
 */
export const buildCapturedLeadsTabs = (total) => [
  { id: 'all', label: 'All Leads', count: total || '0' },
  { id: 'new', label: 'New', count: '248' },
  { id: 'enriching', label: 'Enriching', count: '156' },
  { id: 'enriched', label: 'Enriched', count: '892' },
  { id: 'failed', label: 'Failed', count: '12' },
];

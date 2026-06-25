export const buildCapturedLeadsTabs = (total, degrees = {}) => [
  { id: 'all', label: 'All Leads', count: total || 0 },
  { id: '1',   label: '1st Degree', count: degrees.first  ?? 0 },
  { id: '2',   label: '2nd Degree', count: degrees.second ?? 0 },
  { id: '3',   label: '3rd Degree', count: degrees.third  ?? 0 },
];

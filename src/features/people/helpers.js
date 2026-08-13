export const buildDegreeTabs = (total, degrees = {}) => [
  { id: 'all', label: 'All', count: total || 0 },
  { id: '1', label: '1st', count: degrees.first ?? 0 },
  { id: '2', label: '2nd', count: degrees.second ?? 0 },
  { id: '3', label: '3rd', count: degrees.third ?? 0 },
];

/**
 * CSV generation and export utilities.
 *
 * Ported 1:1 from spurly.extension's `src/explore/utils/csvExport.js` so the
 * dashboard's "Export" action produces byte-for-byte the same column set,
 * ordering, and escaping as the extension's "Download CSV" button. If you
 * change the columns here, mirror the change in the extension (and vice
 * versa) so the two stay identical.
 */

function escapeCSV(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str === '') return '';
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function currentCompanyFromExperiences(experiences) {
  if (!Array.isArray(experiences) || experiences.length === 0) return '';
  const current = experiences.find((e) => e && !e.endDate) || experiences[0];
  return current?.company || '';
}

function captureStatusLabel(p) {
  const s = p?._captureStatus;
  if (s === 'captured') return 'Captured';
  if (s === 'capturing') return 'Capturing';
  return '';
}

const COLUMNS = [
  ['Name',            (p) => p.name],
  ['Title',           (p) => p.title],
  ['Company',         (p) => p.company],
  ['Location',        (p) => p.location],
  ['Headline',        (p) => p.headline],
  ['Email',           (p) => p.email],
  ['Phone',           (p) => p.phone],
  ['Current Company', (p) => currentCompanyFromExperiences(p.experiences)],
  ['Skills',          (p) => (Array.isArray(p.skills) ? p.skills.length : 0)],
  ['Status',          (p) => captureStatusLabel(p)],
  ['profileurl',      (p) => p.profileUrl],
];

export function generateCSV(profiles) {
  if (!Array.isArray(profiles) || profiles.length === 0) return '';
  const headers = COLUMNS.map(([h]) => h);
  const rows = profiles.map((p) =>
    COLUMNS.map(([, get]) => escapeCSV(get(p ?? {})))
  );
  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

export function downloadFile(csv, filename = null) {
  if (!csv) return;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  const finalFilename = filename || `linkedin-search-${new Date().toISOString().split('T')[0]}.csv`;
  link.setAttribute('href', url);
  link.setAttribute('download', finalFilename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportProfilesAsCSV(profiles, filename) {
  const csv = generateCSV(profiles);
  downloadFile(csv, filename);
}

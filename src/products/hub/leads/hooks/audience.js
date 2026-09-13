/**
 * Audience helpers, deliberately in their own file.
 *
 * They lived beside the components that use them and tripped
 * react-refresh/only-export-components: a module that exports both a component
 * and a plain function loses fast refresh for the component. Two lines of
 * warning for two helpers is a bad trade, and they are genuinely shared —
 * the leads hook and AudienceList.jsx both ask "is this one still working?".
 */

/** Queued and running are both "the worker has not finished with this". */
export const isBusy = (s) => s?.status === 'queued' || s?.status === 'running';

/**
 * A one-line summary of what an audience actually searched for.
 *
 * A pasted search has a URL to show. A structured one has no single string, so
 * this builds the equivalent out of whichever filters were set. Deliberately
 * terse — titles and counts only: the row is a list item, not the place to
 * re-render the whole filter form.
 */
export function describeSearch(search) {
  if (search.mode === 'manual') {
    const n = search.manualQueue?.length ?? 0;
    return `${n} imported profile${n === 1 ? '' : 's'}`;
  }
  if (search.mode !== 'structured') return search.searchUrl;
  const f = search.filters || {};
  const parts = [];
  if (f.keywords) parts.push(`"${f.keywords}"`);
  if (f.location?.length) parts.push(`${f.location.length} location${f.location.length > 1 ? 's' : ''}`);
  if (f.industry?.length) parts.push(`${f.industry.length} industr${f.industry.length > 1 ? 'ies' : 'y'}`);
  if (f.company?.length) parts.push(`${f.company.length} compan${f.company.length > 1 ? 'ies' : 'y'}`);
  if (f.past_company?.length) parts.push('past company');
  if (f.school?.length) parts.push('school');
  if (f.network_distance?.length) parts.push(`${f.network_distance.length}° connection${f.network_distance.length > 1 ? 's' : ''}`);
  if (f.advanced_keywords?.title) parts.push(`title: ${f.advanced_keywords.title}`);
  return parts.length > 0 ? parts.join(' · ') : 'Structured search';
}

import { useState } from 'react';
import { Button, Input } from 'src/ui/primitives';
import { FilterTagPicker } from './FilterTagPicker.jsx';

/**
 * PHASE 8 — the structured alternative to pasting a LinkedIn search URL.
 *
 * Every field here maps 1:1 to a Classic-tier search filter CONFIRMED LIVE
 * against Unipile on 2026-09-10 (see hub_phase8_kickoff.md) — this is
 * deliberately not the full field list the vendor's own docs describe:
 * skills, seniority and tenure do not exist on Classic tier at all (they are
 * Sales-Navigator-only, which needs a paid seat Hub does not support yet), so
 * they are not offered here rather than being shown and then rejected by the
 * backend's allow-list.
 *
 * "Search a company" is not a separate flow — it is this same form with one
 * chip already in "Current company" (see index.jsx's onSearchCompany).
 */
const NETWORK_DISTANCE_OPTIONS = [
  { value: 1, label: '1st' },
  { value: 2, label: '2nd' },
  { value: 3, label: '3rd+' },
];

export function AudienceFilterForm({ initialCompany = null, onSubmit, submitting }) {
  const [location, setLocation] = useState([]);
  const [industry, setIndustry] = useState([]);
  const [company, setCompany] = useState(initialCompany ? [initialCompany] : []);
  const [pastCompany, setPastCompany] = useState([]);
  const [school, setSchool] = useState([]);
  const [keywords, setKeywords] = useState('');
  const [title, setTitle] = useState('');
  const [networkDistance, setNetworkDistance] = useState([]);
  const [name, setName] = useState('');

  const hasAnyFilter =
    location.length > 0 ||
    industry.length > 0 ||
    company.length > 0 ||
    pastCompany.length > 0 ||
    school.length > 0 ||
    Boolean(keywords.trim()) ||
    Boolean(title.trim()) ||
    networkDistance.length > 0;

  const toggleDistance = (d) =>
    setNetworkDistance((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));

  const buildFilters = () => {
    const filters = {};
    if (keywords.trim()) filters.keywords = keywords.trim();
    if (location.length) filters.location = location.map((v) => v.id);
    if (industry.length) filters.industry = industry.map((v) => v.id);
    if (company.length) filters.company = company.map((v) => v.id);
    if (pastCompany.length) filters.past_company = pastCompany.map((v) => v.id);
    if (school.length) filters.school = school.map((v) => v.id);
    if (networkDistance.length) filters.network_distance = networkDistance;
    if (title.trim()) filters.advanced_keywords = { title: title.trim() };
    return filters;
  };

  const submit = (e) => {
    e.preventDefault();
    if (!hasAnyFilter || submitting) return;
    onSubmit({ filters: buildFilters(), name: name.trim() });
  };

  return (
    <form onSubmit={submit} className="px-[var(--ui-pad-lg)] py-4 flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FilterTagPicker
          type="LOCATION"
          label="Location"
          placeholder="Search a city or region…"
          value={location}
          onChange={setLocation}
          disabled={submitting}
        />
        <FilterTagPicker
          type="INDUSTRY"
          label="Industry"
          placeholder="Search an industry…"
          value={industry}
          onChange={setIndustry}
          disabled={submitting}
        />
        <FilterTagPicker
          type="COMPANY"
          label="Current company"
          placeholder="Search a company…"
          value={company}
          onChange={setCompany}
          disabled={submitting}
        />
        <FilterTagPicker
          type="COMPANY"
          label="Past company"
          placeholder="Search a company…"
          value={pastCompany}
          onChange={setPastCompany}
          disabled={submitting}
        />
        <FilterTagPicker
          type="SCHOOL"
          label="School"
          placeholder="Search a school…"
          value={school}
          onChange={setSchool}
          disabled={submitting}
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-medium text-[var(--text-primary)] tracking-[-0.006em]">
            Connection degree
          </label>
          <div className="flex gap-1.5">
            {NETWORK_DISTANCE_OPTIONS.map((opt) => {
              const active = networkDistance.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  disabled={submitting}
                  onClick={() => toggleDistance(opt.value)}
                  aria-pressed={active}
                  className={[
                    'h-8 px-3 rounded-[var(--ui-radius-sm)] text-[13px] border transition-colors disabled:opacity-45 disabled:cursor-not-allowed',
                    active
                      ? 'bg-[var(--ui-accent-tint)] border-[var(--ui-accent)] text-[var(--ui-accent-fg)]'
                      : 'border-[var(--border-default)] text-[var(--text-secondary)]',
                  ].join(' ')}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          className="flex-1"
          fullWidth
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          placeholder="Keywords (e.g. co-founder)"
          aria-label="Keywords"
          disabled={submitting}
        />
        <Input
          className="flex-1"
          fullWidth
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title contains (e.g. VP Sales)"
          aria-label="Title keyword"
          disabled={submitting}
        />
      </div>

      <div className="flex items-center gap-2">
        <Input
          className="flex-1"
          fullWidth
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name this audience (optional)"
          aria-label="Audience name"
          disabled={submitting}
        />
        <Button type="submit" disabled={!hasAnyFilter || submitting}>
          {submitting ? 'Queueing…' : 'Import'}
        </Button>
      </div>

      <p className="text-[11px] text-[var(--text-tertiary)]">
        Pick from the suggestions as you type — LinkedIn matches its own internal ids, not plain
        text, so a filter only takes effect once you have selected a chip. Importing happens in the
        background — you can leave this page.
      </p>
    </form>
  );
}

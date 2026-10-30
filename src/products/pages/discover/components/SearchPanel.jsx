import { useEffect, useRef, useState } from 'react';
import { Button, FilterPills, Input, SwitchRow, Tooltip } from 'src/core/primitives';
import { SearchIcon, SlidersIcon, ChevronDownIcon } from 'src/core/icons';
import {
  DATE_POSTED_OPTIONS,
  SORT_OPTIONS,
  CONTENT_TYPE_OPTIONS,
  POSTED_BY_OPTIONS,
  HEADCOUNT_OPTIONS,
  PRESENCE_OPTIONS,
  JOB_TYPE_OPTIONS,
  RESULT_COUNT_OPTIONS,
  DEFAULT_RESULT_COUNT,
} from 'src/products/discover/constants/constants.js';
import { searchPagesFor, compactFilters } from 'src/products/discover/format.js';
import { ROWS_PER_PAGE } from 'src/products/discover/constants/constants.js';
import { FilterTagPicker } from 'src/products/pages/leads/components/FilterTagPicker.jsx';
import { ChoiceChips } from './ChoiceChips.jsx';
import { discoverStrings } from '../strings.js';

const t = discoverStrings;

const optionValues = (options) => options.map(({ id, label }) => ({ id, label }));

/**
 * Keyword box (or a pasted LinkedIn search URL) plus the filters for the tab.
 * Remounted per tab (`key`), so each tab keeps its own text and filters.
 * Nothing runs until Search is pressed: a search spends vendor quota. A pasted
 * URL already carries its own filters, so the filter row hides in URL mode.
 *
 * `filters` holds what the controls show (picker objects, option ids, 'any'
 * for "not set"); format.js#compactFilters turns it into what the API takes.
 */
export function SearchPanel({ category, loading, disabled, onSearch }) {
  const copy = t.tabs[category];
  const [useUrl, setUseUrl] = useState(false);
  const [keywords, setKeywords] = useState('');
  const [url, setUrl] = useState('');
  const [filters, setFilters] = useState({});
  const [count, setCount] = useState(DEFAULT_RESULT_COUNT);
  const [showFilters, setShowFilters] = useState(false);
  const filtersRef = useRef(null);
  useEffect(() => {
    if (!showFilters) return undefined;
    const onDown = (e) => { if (!filtersRef.current?.contains(e.target)) setShowFilters(false); };
    const onKey = (e) => { if (e.key === 'Escape') setShowFilters(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [showFilters]);
  const activeFilters = Object.keys(compactFilters(filters) ?? {}).length;
  const set = (key) => (value) => setFilters((f) => ({ ...f, [key]: value }));
  const value = useUrl ? url : keywords;

  // Part 1 (discover_posts_relevance_plan.md): a plain keyword matches loosely on
  // LinkedIn's post search; a #hashtag matches the exact topic (verified live). We
  // never rewrite the user's query ourselves — only suggest, for posts, not URL mode.
  const trimmedKeywords = keywords.trim();
  const showHashtagHint = category === 'posts' && !useUrl && !!trimmedKeywords && !trimmedKeywords.includes('#');
  const hashtagCandidate = showHashtagHint && !/\s/.test(trimmedKeywords) ? trimmedKeywords : null;
  const submit = (event) => {
    event.preventDefault();
    if (!value.trim() || loading || disabled) return;
    onSearch(category, useUrl ? { url, count } : { keywords, filters, count });
  };

  const sortPills = (
    <FilterPills ariaLabel="Sort" size="sm" value={filters.sortBy ?? 'any'} onChange={set('sortBy')}
      options={optionValues(SORT_OPTIONS)} />
  );

  return (
    <form onSubmit={submit} className="flex flex-col gap-3" aria-label={`${category} search`}>
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <Input
            fullWidth
            leadingIcon={<SearchIcon size={15} />}
            aria-label={useUrl ? t.urlLabel : copy.keywordsLabel}
            placeholder={useUrl ? copy.urlPlaceholder : copy.keywordsPlaceholder}
            value={value}
            onChange={(e) => (useUrl ? setUrl(e.target.value) : setKeywords(e.target.value))}
            maxLength={useUrl ? 2000 : 200}
          />
        </div>
        <Button type="submit" variant="primary" loading={loading} disabled={!value.trim() || disabled}>
          {t.search}
        </Button>
      </div>

      {showHashtagHint && (
        <div className="flex items-center gap-2 -mt-1">
          <span className="ui-micro !text-[var(--ui-text-secondary)]">
            {hashtagCandidate ? t.tabs.posts.hashtagHintSingle : t.tabs.posts.hashtagHintMulti}
          </span>
          {hashtagCandidate && (
            <Button
              type="button"
              variant="link"
              size="sm"
              className="h-auto !px-0 ui-micro"
              onClick={() => setKeywords(`#${hashtagCandidate}`)}
            >
              {t.tabs.posts.hashtagSuggestion(hashtagCandidate)}
            </Button>
          )}
        </div>
      )}

      <div className="flex items-center justify-between gap-x-4 gap-y-2 flex-wrap">
        <div className="flex items-center gap-x-4 gap-y-2 flex-wrap">
          {!useUrl && (
          <div ref={filtersRef} className="relative">
            <Button type="button" variant="ghost" size="sm" aria-expanded={showFilters} onClick={() => setShowFilters((v) => !v)}>
              <SlidersIcon size={14} />
              {t.filtersButton}
              {activeFilters > 0 && (
                <span className="font-[family-name:var(--ui-font-mono)] text-[length:var(--ui-t-micro)] text-[var(--ui-accent-fg)]">{activeFilters}</span>
              )}
              <ChevronDownIcon size={14} className={showFilters ? 'rotate-180' : ''} />
            </Button>
            {showFilters && (
              <div
                role="dialog"
                aria-label={t.filtersButton}
                className="absolute left-0 top-full z-30 mt-2 flex w-[min(760px,calc(100vw-3rem))] flex-col gap-4 rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface-card)] p-4 shadow-[var(--ui-shadow-md)]"
              >
              {category === 'companies' && (
                <div className="flex flex-col gap-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <FilterTagPicker type="LOCATION" label="Location" placeholder="Search a city or region…" value={filters.location ?? []} onChange={set('location')} disabled={loading} />
                    <FilterTagPicker type="INDUSTRY" label="Industry" placeholder="Search an industry…" value={filters.industry ?? []} onChange={set('industry')} disabled={loading} />
                  </div>
                  <ChoiceChips label="Company size" options={HEADCOUNT_OPTIONS} value={filters.headcount ?? []} onChange={set('headcount')} disabled={loading} />
                  <SwitchRow title={t.filters.hiringOnly} checked={!!filters.hasJobOffers} onChange={set('hasJobOffers')} disabled={loading} />
                </div>
              )}

              {category === 'jobs' && (
                <div className="flex flex-col gap-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <FilterTagPicker type="LOCATION" label="Location" placeholder="Search a city or region…" value={filters.region ? [filters.region] : []}
                      onChange={(next) => set('region')(next[next.length - 1])} disabled={loading} />
                    <div className="flex flex-col gap-1.5">
                      <span className="ui-micro !text-[var(--ui-text-secondary)]">{t.filters.sort}</span>
                      {sortPills}
                    </div>
                  </div>
                  <ChoiceChips label="Work type" options={PRESENCE_OPTIONS} value={filters.presence ?? []} onChange={set('presence')} disabled={loading} />
                  <ChoiceChips label="Job type" options={JOB_TYPE_OPTIONS} value={filters.jobType ?? []} onChange={set('jobType')} disabled={loading} />
                  <SwitchRow title={t.filters.easyApply} checked={!!filters.easyApply} onChange={set('easyApply')} disabled={loading} />
                </div>
              )}

              {category === 'posts' && (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5">
                    <span className="ui-micro !text-[var(--ui-text-secondary)]">{t.filters.posted}</span>
                    <FilterPills ariaLabel="Posted" size="sm" value={filters.datePosted ?? 'any'} onChange={set('datePosted')}
                      options={optionValues(DATE_POSTED_OPTIONS)} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="ui-micro !text-[var(--ui-text-secondary)]">{t.filters.sort}</span>
                    {sortPills}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="ui-micro !text-[var(--ui-text-secondary)]">{t.filters.format}</span>
                    <FilterPills ariaLabel="Format" size="sm" value={filters.contentType ?? 'any'} onChange={set('contentType')}
                      options={optionValues(CONTENT_TYPE_OPTIONS)} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="ui-micro !text-[var(--ui-text-secondary)]">{t.filters.postedBy}</span>
                    <FilterPills ariaLabel="Posted by" size="sm" value={filters.postedBy ?? 'any'} onChange={set('postedBy')}
                      options={optionValues(POSTED_BY_OPTIONS)} />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <FilterTagPicker type="INDUSTRY" label={t.filters.authorIndustry} placeholder="Search an industry…" value={filters.authorIndustry ?? []} onChange={set('authorIndustry')} disabled={loading} />
                    <FilterTagPicker type="COMPANY" label={t.filters.authorCompany} placeholder="Search a company…" value={filters.authorCompany ?? []} onChange={set('authorCompany')} disabled={loading} />
                  </div>
                </div>
              )}
                <div className="flex items-center justify-between border-t border-[var(--ui-border)] pt-3">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setFilters({})} disabled={activeFilters === 0}>{t.clearFilters}</Button>
                  <Button type="button" variant="primary" size="sm" onClick={() => setShowFilters(false)}>{t.done}</Button>
                </div>
              </div>
            )}
          </div>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="ui-micro !text-[var(--ui-text-secondary)]">{t.resultCount}</span>
            <FilterPills ariaLabel={t.resultCount} size="sm" value={count} onChange={setCount}
              options={RESULT_COUNT_OPTIONS.map((n) => ({ id: n, label: String(n) }))} />
            <Tooltip content={t.resultCountExplain(ROWS_PER_PAGE[category], searchPagesFor(category, count))} placement="bottom">
              <span tabIndex={0} className="ui-micro !text-[var(--ui-text-tertiary)] underline decoration-dotted underline-offset-2 cursor-help">
                {t.resultCountCost(searchPagesFor(category, count))}
              </span>
            </Tooltip>
          </div>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={() => setUseUrl((v) => !v)}>
          {useUrl ? t.useKeywords : t.pasteUrl}
        </Button>
      </div>
    </form>
  );
}

import { useState } from 'react';
import { Button, FilterPills, Input } from 'src/core/primitives';
import { SearchIcon } from 'src/core/icons';
import { DATE_POSTED_OPTIONS } from 'src/products/discover/constants/constants.js';
import { discoverStrings } from '../strings.js';

const t = discoverStrings;

/**
 * Keyword box (or a pasted LinkedIn search URL) plus the posted-date filter on
 * the Posts tab. Remounted per tab (`key`), so each tab keeps its own text.
 * Nothing runs until Search is pressed: a search spends vendor quota.
 */
export function SearchPanel({ category, loading, disabled, onSearch }) {
  const copy = t.tabs[category];
  const [useUrl, setUseUrl] = useState(false);
  const [keywords, setKeywords] = useState('');
  const [url, setUrl] = useState('');
  const [datePostedId, setDatePostedId] = useState('any');

  const value = useUrl ? url : keywords;
  const submit = (event) => {
    event.preventDefault();
    if (!value.trim() || loading || disabled) return;
    onSearch(category, useUrl ? { url, datePostedId } : { keywords, datePostedId });
  };

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
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {category === 'posts' && !useUrl ? (
          <FilterPills
            ariaLabel="Posted"
            size="sm"
            value={datePostedId}
            onChange={setDatePostedId}
            options={DATE_POSTED_OPTIONS.map(({ id, label }) => ({ id, label }))}
          />
        ) : <span />}
        <Button type="button" variant="ghost" size="sm" onClick={() => setUseUrl((v) => !v)}>
          {useUrl ? t.useKeywords : t.pasteUrl}
        </Button>
      </div>
    </form>
  );
}

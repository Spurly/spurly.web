import { useCallback, useEffect, useRef, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { IconButton } from 'src/ui/primitives';
import { hubSourcingApi } from './api.js';

/**
 * PHASE 8 — one multi-select id-lookup filter (location, industry, current
 * company, past company, or school).
 *
 * LinkedIn's structured search does not take free text for these fields, only
 * its own internal ids (confirmed live against Unipile — see
 * hub_phase8_kickoff.md). So this is never a plain text input: typing calls
 * GET /hub/audience/params, and only an actual suggestion from that list can
 * become a selected chip. Matching on the vendor's side is fuzzy/substring,
 * not exact ("React" also surfaces "Reaction Engineering"), which is exactly
 * why a chip always shows the full `title` string rather than trusting the
 * user's own typed text to mean what they think it means.
 */
export function FilterTagPicker({ type, label, placeholder, value, onChange, disabled = false }) {
  const [text, setText] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef(null);
  const debounceRef = useRef(null);
  const requestSeq = useRef(0);

  useEffect(() => {
    if (!open) return undefined;
    function handleClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const runSearch = useCallback((keywords) => {
    const seq = ++requestSeq.current;
    setLoading(true);
    hubSourcingApi
      .searchAudienceParams({ type, keywords, limit: 8 })
      .then((params) => {
        // A slower earlier request landing after a faster later one would
        // otherwise flash stale results under fresh keystrokes.
        if (seq !== requestSeq.current) return;
        setResults(params.filter((p) => p.id && !value.some((v) => v.id === p.id)));
        setOpen(true);
      })
      .catch(() => {
        if (seq !== requestSeq.current) return;
        setResults([]);
      })
      .finally(() => {
        if (seq === requestSeq.current) setLoading(false);
      });
  }, [type, value]);

  const handleTextChange = (e) => {
    const next = e.target.value;
    setText(next);
    clearTimeout(debounceRef.current);
    if (!next.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }
    // Same 300ms debounce the leads-table search box already uses — this is
    // a real vendor call, not a local filter, so every keystroke would be a
    // wasted round trip against LinkedIn's own rate limits.
    debounceRef.current = setTimeout(() => runSearch(next.trim()), 300);
  };

  const pick = (param) => {
    onChange([...value, param]);
    setText('');
    setResults([]);
    setOpen(false);
  };

  const remove = (id) => onChange(value.filter((v) => v.id !== id));

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-[13px] font-medium text-[var(--text-primary)] tracking-[-0.006em]">
          {label}
        </label>
      )}

      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((v) => (
            <span
              key={v.id}
              className="inline-flex items-center gap-1 h-6 pl-2 pr-1 rounded-[var(--ui-radius-sm)] bg-[var(--ui-accent-tint)] text-[var(--ui-accent-fg)] text-[12px]"
            >
              {v.title}
              {!disabled && (
                <IconButton
                  icon={<X size={11} />}
                  label={`Remove ${v.title}`}
                  size="sm"
                  variant="ghost"
                  onClick={() => remove(v.id)}
                  className="!w-4 !h-4 !rounded-full"
                />
              )}
            </span>
          ))}
        </div>
      )}

      <div className="relative" ref={wrapRef}>
        <input
          type="text"
          value={text}
          disabled={disabled}
          onChange={handleTextChange}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={placeholder}
          className="w-full h-8 pl-3 pr-8 bg-[var(--ui-surface-card)] border border-[var(--border-default)] rounded-[var(--ui-radius-sm)] text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] tracking-[-0.006em] focus:outline-none focus:border-[var(--ui-accent)] focus:shadow-[var(--ui-focus-ring)] transition-colors disabled:opacity-45 disabled:cursor-not-allowed"
        />
        {loading && (
          <Loader2
            size={13}
            className="animate-spin absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]"
            aria-hidden="true"
          />
        )}

        {open && (
          <ul
            role="listbox"
            className="absolute z-10 mt-1 w-full max-h-56 overflow-auto rounded-[var(--ui-radius-sm)] border border-[var(--border-default)] bg-[var(--ui-surface-card)] shadow-[var(--ui-shadow-md)] py-1"
          >
            {results.length === 0 && !loading && (
              <li className="px-3 py-2 text-[12px] text-[var(--text-tertiary)]">No matches</li>
            )}
            {results.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => pick(r)}
                  className="w-full text-left px-3 py-1.5 text-[13px] text-[var(--text-primary)] hover:bg-[var(--ui-surface-sunken)]"
                >
                  {r.title}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

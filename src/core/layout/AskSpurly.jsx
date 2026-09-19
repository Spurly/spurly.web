import { useEffect, useMemo, useRef, useState } from 'react';
import { Sparkles, CornerDownLeft } from 'lucide-react';
import { Overlay } from '../primitives/Overlay';

/**
 * Ask Spurly — the command palette.
 *
 * This is the shell only: it opens on Cmd/Ctrl+K or a click, fuzzy-filters
 * and jumps to any page already in the sidebar, and its empty/no-match state
 * frames what it will eventually do (answer things like "Find VPs of Sales
 * in Germany with a 2nd-degree path" in natural language). Wiring that
 * natural-language layer to the leads/campaigns backends is a separate,
 * much bigger piece of work — see docs/UI_REDESIGN_PLAN.md, open question 4.
 *
 * It deliberately replaces nothing else in the sidebar: there was no search
 * box here before, so this is additive, and it is the single clearest
 * "this product is AI-native" signal the design calls for.
 */
function fuzzyScore(query, label) {
  const q = query.trim().toLowerCase();
  if (!q) return 0;
  const l = label.toLowerCase();
  if (l === q) return 100;
  if (l.startsWith(q)) return 80;
  if (l.includes(q)) return 60;
  // Loose subsequence match, so "sqb" still finds "Sequence Builder".
  let qi = 0;
  for (let li = 0; li < l.length && qi < q.length; li += 1) {
    if (l[li] === q[qi]) qi += 1;
  }
  return qi === q.length ? 20 : -1;
}

export function AskSpurly({ open, onClose, items, onNavigate }) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
      // Let the panel mount before focusing, or the focus trap steals it.
      const id = window.requestAnimationFrame(() => inputRef.current?.focus());
      return () => window.cancelAnimationFrame(id);
    }
    return undefined;
  }, [open]);

  const results = useMemo(() => {
    if (!query.trim()) return items;
    return items
      .map((item) => ({ item, score: fuzzyScore(query, `${item.section} ${item.label}`) }))
      .filter((r) => r.score >= 0)
      .sort((a, b) => b.score - a.score)
      .map((r) => r.item);
  }, [items, query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [results.length, query]);

  const go = (item) => {
    if (!item) return;
    onNavigate(item.href);
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      go(results[activeIndex]);
    }
  };

  return (
    <Overlay
      open={open}
      onClose={onClose}
      label="Ask Spurly"
      align="center"
      className="items-start pt-[14vh]"
      panelClassName="w-full max-w-[560px] rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] shadow-[var(--ui-shadow-lg)] overflow-hidden"
    >
      <div className="flex items-center gap-2.5 h-12 px-4 border-b border-[var(--ui-border-hairline)] shrink-0">
        <Sparkles size={15} className="text-[var(--ui-accent)] shrink-0" aria-hidden="true" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Find VPs of Sales in Germany, or jump to a page…"
          className="flex-1 min-w-0 bg-transparent outline-none text-[length:var(--ui-t-body)] text-[var(--ui-text-primary)] placeholder:text-[var(--ui-text-quaternary)]"
        />
        <kbd className="ui-meta shrink-0 border border-[var(--ui-border)] rounded-[var(--ui-radius-xs)] px-1.5 py-0.5 text-[var(--ui-text-tertiary)]">
          esc
        </kbd>
      </div>

      <div className="max-h-[320px] overflow-y-auto py-1.5">
        {results.length === 0 ? (
          <div className="px-4 py-6 text-center">
            <p className="text-[length:var(--ui-t-body)] text-[var(--ui-text-secondary)]">
              Nothing matches “{query}” yet.
            </p>
            <p className="mt-1 text-[length:var(--ui-t-label)] text-[var(--ui-text-tertiary)]">
              Natural-language search is coming — for now, Ask Spurly jumps you
              to a page.
            </p>
          </div>
        ) : (
          results.map((item, i) => {
            const Icon = item.icon;
            const active = i === activeIndex;
            return (
              <button
                key={item.href}
                type="button"
                onMouseEnter={() => setActiveIndex(i)}
                onClick={() => go(item)}
                className={[
                  'w-full flex items-center gap-3 h-10 px-4 text-left transition-colors duration-[var(--ui-dur-fast)]',
                  active
                    ? 'bg-[var(--ui-accent-tint)] text-[var(--ui-accent-fg)]'
                    : 'text-[var(--ui-text-primary)]',
                ].join(' ')}
              >
                {Icon && <Icon size={15} className="shrink-0 opacity-80" aria-hidden="true" />}
                <span className="flex-1 min-w-0 truncate text-[length:var(--ui-t-body)]">{item.label}</span>
                <span className="ui-micro shrink-0 opacity-70">{item.section}</span>
                {active && <CornerDownLeft size={13} className="shrink-0 opacity-60" aria-hidden="true" />}
              </button>
            );
          })
        )}
      </div>
    </Overlay>
  );
}

import { useLayoutEffect, useRef, useState } from 'react';

/**
 * Page-level tab strip — sits between the page header and the page's card,
 * on the canvas, with its own hairline underneath (spurlyDESIGN.md, Leads v2).
 *
 * The underline SLIDES between tabs rather than cutting. It is one element
 * positioned from the active button's measured box, so it can travel on
 * `transform` + `width` with the handoff's travel curve. Measured rather than
 * computed from fixed widths so a tab whose count changes (14 → 140) never
 * leaves the indicator short.
 */
export function PageTabs({ tabs, activeTab, onTabChange, className = '' }) {
  const stripRef = useRef(null);
  const [bar, setBar] = useState({ x: 0, w: 0, ready: false });

  useLayoutEffect(() => {
    const strip = stripRef.current;
    if (!strip) return undefined;
    const measure = () => {
      const el = strip.querySelector('[data-active="true"]');
      if (!el) return;
      setBar({ x: el.offsetLeft, w: el.offsetWidth, ready: true });
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(measure);
    ro.observe(strip);
    return () => ro.disconnect();
  }, [activeTab, tabs]);

  return (
    <div
      ref={stripRef}
      role="tablist"
      className={`relative flex items-center gap-1 border-b border-[var(--ui-border)] ${className}`}
    >
      {tabs.map((tab) => {
        const active = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            data-active={active ? 'true' : undefined}
            onClick={() => onTabChange(tab.id)}
            className={[
              'inline-flex items-center justify-center gap-[7px] h-9 px-[18px] text-[length:var(--ui-t-nav)] font-medium whitespace-nowrap',
              'transition-colors duration-[var(--ui-dur-fast)] focus:outline-none focus-visible:shadow-[var(--ui-focus-ring)] rounded-[var(--ui-radius-xs)]',
              active
                ? 'text-[var(--ui-text-primary)]'
                : 'text-[var(--ui-text-secondary)] hover:text-[var(--ui-text-primary)]',
            ].join(' ')}
          >
            {tab.label}
            {tab.count !== undefined && tab.count !== null && (
              <span className="ui-num text-[length:var(--ui-t-micro)] px-[5px] py-px rounded-[var(--ui-radius-xs)] bg-[var(--ui-neutral-150)] text-[var(--ui-text-secondary)]">
                {tab.count?.toLocaleString?.() ?? tab.count}
              </span>
            )}
          </button>
        );
      })}
      <span
        aria-hidden="true"
        className="absolute -bottom-px left-0 h-[2px] rounded-full bg-[var(--ui-accent)] pointer-events-none"
        style={{
          width: bar.w,
          transform: `translateX(${bar.x}px)`,
          opacity: bar.ready ? 1 : 0,
          transition:
            'transform var(--ui-dur-slow) var(--ui-spring), width var(--ui-dur-slow) var(--ui-spring)',
        }}
      />
    </div>
  );
}

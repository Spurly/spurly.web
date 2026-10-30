import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '../Button';
import { ChevronDownIcon, DownloadIcon } from 'src/core/icons';

const CLOSE_DELAY_MS = 150;

/**
 * "Export" button with a small menu of export choices (for example "This page"
 * and "All matching"). Opens on hover, and also on click / Enter so touch and
 * keyboard work; closes when the pointer leaves, on Escape, a click outside, or a pick.
 *
 * items: [{ key, label, hint?, onSelect, disabled? }]
 * `loading` shows the button busy while an export is being prepared.
 */
export function ExportMenu({ label = 'Export', items = [], disabled = false, loading = false, title }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const timerRef = useRef(null);

  const cancelClose = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);
  const show = useCallback(() => { cancelClose(); setOpen(true); }, [cancelClose]);
  const hideSoon = useCallback(() => {
    cancelClose();
    timerRef.current = setTimeout(() => setOpen(false), CLOSE_DELAY_MS);
  }, [cancelClose]);

  useEffect(() => cancelClose, [cancelClose]);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (!wrapRef.current?.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const blocked = disabled || loading;

  return (
    <div
      ref={wrapRef}
      className="relative"
      onMouseEnter={blocked ? undefined : show}
      onMouseLeave={hideSoon}
    >
      <Button
        leadingIcon={<DownloadIcon size={14} />}
        trailingIcon={<ChevronDownIcon size={14} />}
        aria-haspopup="menu"
        aria-expanded={open}
        loading={loading}
        disabled={disabled}
        title={title}
        onClick={show} // opens, never toggles: on a mouse the hover has already opened it, and a click must not close it again
      >
        {label}
      </Button>
      {open && !blocked && (
        <div className="absolute right-0 top-full z-30 pt-1.5">
          <div
            role="menu"
            aria-label={label}
            className="min-w-[260px] rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-surface-card)] py-1 shadow-[var(--ui-shadow-md)]"
          >
            {items.map((item) => (
              <button
                key={item.key}
                type="button"
                role="menuitem"
                disabled={item.disabled}
                onClick={() => { setOpen(false); item.onSelect(); }}
                className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left hover:bg-[var(--ui-surface-rail-hover)] focus:outline-none focus-visible:bg-[var(--ui-surface-rail-hover)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
              >
                <span className="text-[length:var(--ui-t-control)] text-[var(--ui-text-primary)]">{item.label}</span>
                {item.hint && <span className="text-[length:var(--ui-t-meta)] text-[var(--ui-text-tertiary)]">{item.hint}</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

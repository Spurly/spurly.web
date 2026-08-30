import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, useToast } from 'src/ui/primitives';
import { getToastError } from 'src/common/utils/apiError';
import capturedLeadsController from 'src/core/controllers/capturedLeadsController';

/** Mirrors the `maxlength` on the Person schema. */
export const NOTES_MAX_LENGTH = 5000;

/** Long enough that a pause reads as "done typing", short enough to feel live. */
const AUTOSAVE_DELAY_MS = 700;

/** Only start nagging about the ceiling when it is actually in reach. */
const COUNTER_VISIBLE_BELOW = 500;

/**
 * The user's own note about a person, edited in place in the drawer.
 *
 * AUTOSAVES. There is no Save button, and that is the whole design: the drawer
 * closes on a backdrop click, on Escape, and on picking another row, so a note
 * behind an explicit Save would be one stray click away from being lost — the
 * exact failure a notes field must never have. Instead the note is written 700ms
 * after the last keystroke, on blur, on Cmd/Ctrl+Enter, and once more from the
 * unmount cleanup if the drawer closes with an edit still pending.
 *
 * Four things this has to get right:
 *
 * 1. NEVER TWO WRITES AT ONCE. A slow request must not be overtaken by a fast
 *    one and leave the older text on the row. At most one PATCH is in flight;
 *    anything typed while it runs is queued and sent after it lands.
 *
 * 2. COMPARE TRIMMED. The server trims what it stores, so the "is this saved?"
 *    check has to trim too — otherwise a trailing space is permanently dirty
 *    and the editor re-sends the same note forever.
 *
 * 3. NO CLOBBERING WHAT'S BEING TYPED. The initial value is read once, in the
 *    useState initialiser. The parent patches the row on every successful save,
 *    which sends a NEW `notes` prop back down; re-syncing from it would reset
 *    the caret mid-sentence. Switching to a different person is handled by the
 *    caller keying this component on the person id, which remounts it cleanly.
 *
 * 4. A FAILED SAVE IS VISIBLE AND RECOVERABLE. A toast fires, the status line
 *    says "Not saved", and Retry re-sends. A failure never auto-retries on a
 *    loop; typing again schedules the next attempt.
 *
 * @param {Object} props
 * @param {string} props.personId
 * @param {string} [props.notes] - Note as last loaded from the server.
 * @param {(personId: string, notes: string) => void} [props.onSaved]
 */
export function NotesEditor({ personId, notes = '', onSaved }) {
  const toast = useToast();

  const [value, setValue] = useState(() => notes ?? '');
  const [status, setStatus] = useState('idle'); // idle | saving | saved | error
  /* The last value known to be on the server, mirrored into state purely so
     the "Unsaved" hint can be derived during render — a ref read at render time
     wouldn't re-render when it changed. `savedRef` below stays the authority
     for the save path itself, which runs outside render. */
  const [savedValue, setSavedValue] = useState(() => (notes ?? '').trim());

  /* Refs, not state, for everything the save path reads: it runs from timers
     and from the unmount cleanup, where a captured state value would be stale
     or the component already gone. */
  const valueRef = useRef(value);
  const savedRef = useRef((notes ?? '').trim());
  const inFlightRef = useRef(false);
  const queuedRef = useRef(false);
  const timerRef = useRef(null);
  const mountedRef = useRef(true);
  const flushRef = useRef(null);

  /* Read through refs so `flush` doesn't need them as dependencies — it is
     stored in a ref and called from cleanup, where a stale closure would send
     the wrong text or call a handler that no longer exists. */
  const toastRef = useRef(toast);
  const onSavedRef = useRef(onSaved);
  useEffect(() => { toastRef.current = toast; }, [toast]);
  useEffect(() => { onSavedRef.current = onSaved; }, [onSaved]);

  const setStatusIfMounted = useCallback((next) => {
    if (mountedRef.current) setStatus(next);
  }, []);

  const flush = useCallback(async () => {
    clearTimeout(timerRef.current);

    const target = valueRef.current.trim();
    if (target === savedRef.current) return;

    if (inFlightRef.current) {
      queuedRef.current = true;
      return;
    }

    inFlightRef.current = true;
    setStatusIfMounted('saving');

    try {
      const stored = await capturedLeadsController.updateNotes(personId, target);
      savedRef.current = typeof stored === 'string' ? stored : target;
      if (mountedRef.current) setSavedValue(savedRef.current);
      /* Tell the table, so the row's Notes column matches the drawer without a
         refetch that would re-page the list under the user. */
      onSavedRef.current?.(personId, savedRef.current);
      /* "Saved" only if nothing has been typed since this request went out —
         otherwise the editor would claim to be current while holding an
         unsaved edit that the queued run below is about to send. */
      setStatusIfMounted(valueRef.current.trim() === savedRef.current ? 'saved' : 'idle');
    } catch (error) {
      console.error('[Notes] Save error:', error);
      setStatusIfMounted('error');
      // The provider lives above the drawer, so this still lands if the panel
      // was closed while the request was in flight — which is exactly when the
      // user most needs to hear that their note didn't make it.
      toastRef.current?.error(getToastError(error, "Couldn't save your note"));
      // A failure retries on Retry or on the next keystroke, never on a loop.
      queuedRef.current = false;
      return;
    } finally {
      inFlightRef.current = false;
    }

    if (queuedRef.current) {
      queuedRef.current = false;
      flushRef.current?.();
    }
  }, [personId, setStatusIfMounted]);

  useEffect(() => { flushRef.current = flush; }, [flush]);

  useEffect(
    () => () => {
      clearTimeout(timerRef.current);
      // Set BEFORE the final flush so its status updates no-op instead of
      // warning about setting state on an unmounted component.
      mountedRef.current = false;
      if (valueRef.current.trim() !== savedRef.current) flushRef.current?.();
    },
    [],
  );

  const handleChange = (event) => {
    // Belt and braces with the `maxLength` attribute below: a paste in some
    // browsers can exceed it, and an over-long note is a 400 from the server.
    const next = event.target.value.slice(0, NOTES_MAX_LENGTH);
    valueRef.current = next;
    setValue(next);
    setStatus('idle');

    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => flushRef.current?.(), AUTOSAVE_DELAY_MS);
  };

  const handleKeyDown = (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault();
      flushRef.current?.();
    }
  };

  const dirty = value.trim() !== savedValue;
  const remaining = NOTES_MAX_LENGTH - value.length;

  return (
    <div className="flex flex-col gap-1.5">
      <textarea
        value={value}
        onChange={handleChange}
        onBlur={() => flushRef.current?.()}
        onKeyDown={handleKeyDown}
        maxLength={NOTES_MAX_LENGTH}
        rows={3}
        spellCheck
        placeholder="Where you met, what to follow up on, anything worth remembering…"
        aria-label="Notes about this person"
        className={[
          'w-full px-2.5 py-2 resize-y min-h-[72px]',
          'bg-[var(--ui-surface-card)] text-[13px] leading-relaxed text-[var(--ui-text-primary)]',
          'placeholder:text-[var(--ui-text-tertiary)]',
          'border rounded-[var(--ui-radius-sm)]',
          status === 'error' ? 'border-[var(--ui-danger)]' : 'border-[var(--ui-border)]',
          'transition-[border-color,box-shadow] duration-[var(--ui-dur-fast)] ease-[cubic-bezier(0.2,0,0.1,1)]',
          'hover:border-[var(--ui-border-strong)]',
          'focus:outline-none focus:border-[var(--ui-accent)] focus:shadow-[0_0_0_3px_var(--ui-accent-tint)]',
        ].join(' ')}
      />

      <div className="flex items-center gap-2 min-h-[20px]">
        {/* aria-live so a screen reader hears the save land — with no Save
            button to press, the status line is the only confirmation there is. */}
        <span className="text-[11px] text-[var(--ui-text-tertiary)]" role="status" aria-live="polite">
          {status === 'saving' && 'Saving…'}
          {status === 'saved' && 'Saved'}
          {status === 'error' && <span className="text-[var(--ui-danger)]">Not saved</span>}
          {status === 'idle' && dirty && 'Unsaved'}
        </span>

        {status === 'error' && (
          <Button size="sm" variant="ghost" onClick={() => flushRef.current?.()}>
            Retry
          </Button>
        )}

        {remaining <= COUNTER_VISIBLE_BELOW && (
          <span className="ml-auto text-[11px] tabular-nums text-[var(--ui-text-tertiary)]">
            {remaining.toLocaleString()} left
          </span>
        )}
      </div>
    </div>
  );
}

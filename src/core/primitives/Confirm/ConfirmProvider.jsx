import { useCallback, useMemo, useRef, useState } from 'react';
import { ConfirmContext } from './ConfirmContext';
import { Dialog } from '../Dialog';
import { Button } from '../Button';

const DEFAULTS = {
  title: 'Are you sure?',
  description: null,
  confirmLabel: 'Confirm',
  cancelLabel: 'Cancel',
  tone: 'danger', // 'danger' | 'primary'
};

/**
 * App-owned replacement for `window.confirm`.
 *
 * The native dialog can't be styled, is pinned to the top of the browser
 * chrome rather than the app, says "localhost:3001 says", and blocks the main
 * thread — so an app that has its own toasts and modals still drops to a
 * system alert at exactly the moment the user is deciding whether to destroy
 * something. That's the least reassuring moment to look like a browser error.
 *
 * The API is deliberately promise-based so it's a drop-in at the call site:
 *
 *   if (!(await confirm({ title: 'Delete "X"?' }))) return;
 *
 * — the same `if (!confirmed) return` shape `window.confirm` had, so migrating
 * doesn't require restructuring the handler into callbacks.
 *
 * Only one confirmation can be open at a time. A second call while one is open
 * resolves the first as cancelled rather than stacking dialogs, because two
 * overlapping destructive prompts is a state no user can reason about.
 */
export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null);
  const resolveRef = useRef(null);

  const settle = useCallback((value) => {
    resolveRef.current?.(value);
    resolveRef.current = null;
    setState(null);
  }, []);

  const confirm = useCallback(
    (options = {}) =>
      new Promise((resolve) => {
        /* Anything already waiting is answered "no" — never left dangling, or
           its caller would hang forever on an unresolved promise. */
        resolveRef.current?.(false);
        resolveRef.current = resolve;
        setState({ ...DEFAULTS, ...options });
      }),
    [],
  );

  const api = useMemo(() => ({ confirm }), [confirm]);
  const open = state !== null;

  return (
    <ConfirmContext.Provider value={api}>
      {children}
      <Dialog
        open={open}
        onClose={() => settle(false)}
        size="sm"
        title={state?.title}
        description={state?.description}
        /* No close X. Two buttons, both labelled, is the whole dialog — a third
           dismissal affordance just adds a control the user has to interpret.
           It also means the focus trap's "focus the first focusable" lands on
           Cancel rather than the destructive button, so a stray Enter on an
           unexpected dialog backs out instead of deleting something. */
        hideClose
        footer={
          <>
            <Button variant="secondary" onClick={() => settle(false)}>
              {state?.cancelLabel ?? DEFAULTS.cancelLabel}
            </Button>
            <Button
              variant={state?.tone === 'primary' ? 'primary' : 'danger'}
              onClick={() => settle(true)}
            >
              {state?.confirmLabel ?? DEFAULTS.confirmLabel}
            </Button>
          </>
        }
      >
        {state?.body ?? null}
      </Dialog>
    </ConfirmContext.Provider>
  );
}

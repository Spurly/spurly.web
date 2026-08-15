import { useContext } from 'react';
import { ConfirmContext } from './ConfirmContext';

/**
 * Ask the user to confirm a destructive action.
 *
 *   const confirm = useConfirm();
 *   const ok = await confirm({
 *     title: `Delete "${template.name}"?`,
 *     description: "This can't be undone.",
 *     confirmLabel: 'Delete',
 *   });
 *   if (!ok) return;
 *
 * Outside a provider this falls back to `window.confirm` rather than a no-op.
 * A missing toast is a small failure; a confirmation that silently returns
 * false would make delete buttons look broken, and one that silently returns
 * true would delete without asking. The native dialog is ugly but correct.
 */
export function useConfirm() {
  const ctx = useContext(ConfirmContext);

  if (!ctx) {
    return ({ title = 'Are you sure?', description } = {}) =>
      Promise.resolve(window.confirm(description ? `${title}\n\n${description}` : title));
  }
  return ctx.confirm;
}

import { useEffect, useRef } from 'react';

/**
 * Tracks which overlay is on top.
 *
 * Escape must close only the topmost overlay. Without a stack, pressing Escape
 * over a confirm dialog that sits above a drawer closes both at once, because
 * each one has its own listener on the document.
 */
const stack = [];

export function useOverlayStack(active, onEscape, closeOnEscape = true) {
  const idRef = useRef({});
  const onEscapeRef = useRef(onEscape);

  useEffect(() => {
    onEscapeRef.current = onEscape;
  }, [onEscape]);

  useEffect(() => {
    if (!active) return undefined;

    const id = idRef.current;
    stack.push(id);

    const onKeyDown = (e) => {
      if (e.key !== 'Escape') return;
      if (!closeOnEscape) return;
      if (stack[stack.length - 1] !== id) return;
      e.stopPropagation();
      onEscapeRef.current?.();
    };

    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      const i = stack.indexOf(id);
      if (i !== -1) stack.splice(i, 1);
    };
  }, [active, closeOnEscape]);
}

import { useEffect } from 'react';

const LOADER_SRC = 'https://cdn.pulse.is/livechat/loader.js';
const CHAT_ID = '6abaa0a27215f190f0041f47';

/**
 * Mounts the Pulse live-chat bubble for as long as the caller is mounted.
 * Used by the public marketing layout only, so the bubble never covers the
 * signed-in app (it sat over table pagination and page footers). On unmount
 * the loader script and any nodes it added to <body> are removed.
 */
export function useLiveChat() {
  useEffect(() => {
    const body = document.body;
    const before = new Set(Array.from(body.children));

    const script = document.createElement('script');
    script.src = LOADER_SRC;
    script.async = true;
    script.dataset.liveChatId = CHAT_ID;
    body.appendChild(script);

    return () => {
      script.remove();
      Array.from(body.children).forEach((el) => {
        if (!before.has(el) && el.id !== 'root') el.remove();
      });
    };
  }, []);
}

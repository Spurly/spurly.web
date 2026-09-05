const SDK_URL = 'https://sdk.cashfree.com/js/v3/cashfree.js';
let sdkPromise = null;

/**
 * Lazily loads Cashfree's JS SDK and returns an initialized instance.
 * Subscriptions authorization has no plain-URL redirect — Cashfree requires
 * going through `cashfree.subscriptionsCheckout()` from this SDK — so this
 * is the one place in the web app that injects a third-party script.
 *
 * Cached across calls so a retry after a failed load reuses the same tag
 * instead of stacking up duplicate <script> elements.
 *
 * Mode mirrors the backend's CASHFREE_ENV: defaults to sandbox so a missing
 * env var can never accidentally point checkout at production.
 */
export function loadCashfreeSdk() {
  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise((resolve, reject) => {
    if (window.Cashfree) {
      resolve(window.Cashfree({ mode: cashfreeMode() }));
      return;
    }

    const script = document.createElement('script');
    script.src = SDK_URL;
    script.async = true;
    script.onload = () => {
      if (!window.Cashfree) {
        sdkPromise = null;
        reject(new Error('Cashfree SDK loaded but window.Cashfree is missing'));
        return;
      }
      resolve(window.Cashfree({ mode: cashfreeMode() }));
    };
    script.onerror = () => {
      sdkPromise = null;
      reject(new Error('Could not load the Cashfree payment SDK'));
    };
    document.head.appendChild(script);
  });

  return sdkPromise;
}

function cashfreeMode() {
  return import.meta.env.VITE_CASHFREE_ENV === 'production' ? 'production' : 'sandbox';
}

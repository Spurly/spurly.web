const SDK_URL = 'https://checkout.razorpay.com/v1/checkout.js';
let sdkPromise = null;

/**
 * Lazily loads Razorpay Standard Checkout and resolves to the `Razorpay`
 * constructor. The one third-party script the web app injects.
 *
 * Cached across calls so a retry after a failed load reuses one tag instead
 * of stacking duplicate <script> elements; a failed load clears the cache so
 * the next attempt actually retries.
 *
 * No key or mode config here: the key id comes back from POST /subscriptions,
 * so the backend alone decides test vs live.
 */
export function loadRazorpaySdk() {
  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve(window.Razorpay);
      return;
    }
    const script = document.createElement('script');
    script.src = SDK_URL;
    script.async = true;
    script.onload = () => {
      if (!window.Razorpay) {
        sdkPromise = null;
        reject(new Error('Razorpay checkout loaded but window.Razorpay is missing'));
        return;
      }
      resolve(window.Razorpay);
    };
    script.onerror = () => {
      sdkPromise = null;
      reject(new Error('Could not load the Razorpay payment window. Check your connection and try again.'));
    };
    document.head.appendChild(script);
  });

  return sdkPromise;
}

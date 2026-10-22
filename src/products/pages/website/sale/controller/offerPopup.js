import { OFFER_POPUP_DISMISSED_KEY } from "../constants/constants.js";

/** True when the visitor already closed the launch-offer popup in this browser session. */
export function wasOfferPopupDismissed() {
  try {
    return window.sessionStorage.getItem(OFFER_POPUP_DISMISSED_KEY) === "1";
  } catch {
    return false; // storage blocked: show it (it still closes for this page view)
  }
}

export function rememberOfferPopupDismissed() {
  try {
    window.sessionStorage.setItem(OFFER_POPUP_DISMISSED_KEY, "1");
  } catch {
    // storage blocked: nothing to remember
  }
}

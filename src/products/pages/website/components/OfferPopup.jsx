import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { usePrice } from "../hooks/usePrice.js";
import { OFFER_POPUP_DELAY_MS } from "../sale/constants/constants.js";
import { wasOfferPopupDismissed, rememberOfferPopupDismissed } from "../sale/controller/offerPopup.js";

/* The launch offer as a floating card, bottom-left (the chat bubble owns bottom-right).
   Slides in a few seconds after the page opens, never during prerender, and stays
   closed for the rest of the visit once dismissed. Renders nothing when the offer is off. */
export default function OfferPopup() {
  const price = usePrice();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (wasOfferPopupDismissed()) return undefined;
    const timer = setTimeout(() => setOpen(true), OFFER_POPUP_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function close() {
    rememberOfferPopupDismissed();
    setOpen(false);
  }

  if (!price.sale || !open) return null;
  const s = price.sale;

  return (
    <aside className="offer-pop" aria-label={s.label}>
      <button type="button" className="offer-pop-x" onClick={close} aria-label="Dismiss offer">×</button>
      <div className="offer-pop-top">
        <span className="offer-pop-live"><i aria-hidden="true" />{s.label}</span>
        <span className="offer-pop-off">{s.percentOff}% off</span>
      </div>
      <p className="offer-pop-who">Only for the <b>first {s.seats} members</b></p>
      <div className="offer-pop-price">
        <s aria-label={"Was " + s.listLabel}>{s.listLabel}</s>
        <b className="tnum">{s.saleLabel}</b>
        <span>/ month</span>
      </div>
      <p className="offer-pop-lock">Price locked for life, even when it goes back up.</p>
      <Link to="/signup" className="offer-pop-cta" onClick={close}>Claim my spot <span aria-hidden="true">→</span></Link>
      <p className="offer-pop-note">7-day free trial · no card needed</p>
    </aside>
  );
}

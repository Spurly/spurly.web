import { Link } from "react-router-dom";
import { usePrice } from "../hooks/usePrice.js";
import SaleCountdown from "./SaleCountdown.jsx";

/* Slim bar above the nav while the launch sale is live. The countdown shows
   only when pricing.js has a real `endsAt`; with none it says "live" and never
   fakes a timer. Renders nothing when the sale is off or over. */
export default function UrgencyBar() {
  const price = usePrice();
  if (!price.sale) return null;
  const s = price.sale;

  return (
    <div className="urgency-bar" role="region" aria-label={s.label}>
      <p>
        <b>{s.label} live</b>
        <span>{s.saleLabel}/month<span className="ub-long"> instead of <s>{s.listLabel}</s></span> · {s.percentOff}% off</span>
        <SaleCountdown endsAt={s.endsAt} className="ub-count" />
      </p>
      <Link to="/signup">Claim it →</Link>
    </div>
  );
}

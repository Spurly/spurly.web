import { Link } from "react-router-dom";
import { usePrice } from "../hooks/usePrice.js";

/* Slim bar above the nav while the launch offer is on. The offer is limited by seats,
   not by time, so there is no timer: it names the seats and the lock-in instead.
   Renders nothing when the offer is off. */
export default function UrgencyBar() {
  const price = usePrice();
  if (!price.sale) return null;
  const s = price.sale;

  return (
    <div className="urgency-bar" role="region" aria-label={s.label}>
      <p>
        <b>{s.label}</b>
        <span>
          {s.saleLabel}/month, {s.lock}, for the {s.audience}
          <span className="ub-long"> · <s>{s.listLabel}</s> after that · {s.percentOff}% off</span>
        </span>
      </p>
      <Link to="/signup">Claim your spot →</Link>
    </div>
  );
}

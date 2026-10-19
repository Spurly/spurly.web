import { useCountdown } from "../hooks/useCountdown.js";
import { DEMO_ROLLING_SALE, SALE, currentSaleEnd } from "../pricing.js";

const pad = (n) => String(n).padStart(2, "0");

/* "Ends in 1d 23h 59m 12s" for the launch sale. Renders nothing without a real
   end date, on the server, and once the sale is over. In demo mode (local dev)
   it counts down a rolling 2 days per browser instead. */
export default function SaleCountdown({ endsAt, className = "sale-count" }) {
  const left = useCountdown(endsAt, { demo: DEMO_ROLLING_SALE && !SALE.cycle, nextEnd: SALE.cycle ? currentSaleEnd : null });
  if (!left) return null;
  return (
    <span className={className}>
      Ends in {left.days}d {pad(left.hours)}h {pad(left.minutes)}m {pad(left.seconds)}s
    </span>
  );
}

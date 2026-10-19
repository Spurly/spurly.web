import { useState } from "react";

/* One flip-clock digit. The top half shows the new digit and the bottom half the
   old one; two flaps swing down to swap them. Only digits that changed flip.
   Pure CSS (website.css, .fl-*), so there is nothing to run on the server. */
function Digit({ value, prev }) {
  const changed = value !== prev;
  return (
    <span className="fl-d">
      <span className="fl-up"><b>{value}</b></span>
      <span className="fl-low"><b>{prev}</b></span>
      {changed && (
        <>
          <span key={"t" + prev + value} className="fl-flap fl-flap-top"><b>{prev}</b></span>
          <span key={"b" + prev + value} className="fl-flap fl-flap-bot"><b>{value}</b></span>
        </>
      )}
    </span>
  );
}

export default function FlipNumber({ value, digits }) {
  const text = String(value).padStart(digits, "0");
  const [seen, setSeen] = useState({ cur: text, prev: text });
  if (seen.cur !== text) setSeen({ cur: text, prev: seen.cur });
  const prev = seen.prev;

  return (
    <span className="fl-num" role="img" aria-label={String(value)}>
      {[...text].map((ch, i) => <Digit key={i} value={ch} prev={prev[i] ?? ch} />)}
    </span>
  );
}

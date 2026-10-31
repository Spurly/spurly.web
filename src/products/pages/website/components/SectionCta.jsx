import { Link } from "react-router-dom";

/* The repeated primary call to action between home sections. One button,
   always the same wording, so a visitor never has to look for it. `more` is an
   optional text link to a deeper page. */

export default function SectionCta({ more }) {
  return (
    <div className="section-cta reveal">
      <Link to="/signup" className="btn btn-primary btn-lg" data-magnetic>Start 7-day free trial</Link>
      {more && <Link className="more-link" to={more.to}>{more.label} →</Link>}
    </div>
  );
}

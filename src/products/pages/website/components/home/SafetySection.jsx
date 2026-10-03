import { Link } from "react-router-dom";
import { CheckItem } from "../../icons.jsx";

const POINTS = [
  "Hourly and daily limits for every type of action",
  "Random gaps between actions, never a fixed timer",
  "Actions are spread out, never sent in bursts",
  "Sequences stop the moment someone replies",
  "Anyone you already invited is skipped, never invited twice",
  "Campaigns pause if LinkedIn disconnects your account",
];

export default function SafetySection() {
  return (
    <section id="safety" className="section-pad">
      <div className="wrap">
        <div className="safety-panel glass reveal">
          <div>
            <span className="eyebrow">Safety</span>
            <h2 className="h2" style={{ marginTop: 14 }}>Designed to stay <em>within LinkedIn's limits.</em></h2>
            <p className="lead">No tool can guarantee LinkedIn won't restrict an account, and LinkedIn's User Agreement restricts automation. Spurly paces everything like a person would and tells you plainly what it cannot promise.</p>
            <Link className="more-link" to="/product/safety">How Spurly keeps your account safe →</Link>
          </div>
          <ul>{POINTS.map((p) => <CheckItem key={p}>{p}</CheckItem>)}</ul>
        </div>
      </div>
    </section>
  );
}

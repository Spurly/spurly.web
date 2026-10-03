import { CheckItem } from "../../icons.jsx";

const POINTS = [
  "AI writes your connection note and follow-ups from a short brief",
  "Personal details such as name and company fill in for each lead at send time",
  "You read and edit the draft before the campaign launches",
  "AI drafts comments on your leads' posts, and you approve every one",
  "Nothing is sent or posted by AI without your say-so",
];

export default function AiSection() {
  return (
    <section id="ai" className="section-pad">
      <div className="wrap">
        <div className="safety-panel glass reveal">
          <div>
            <span className="eyebrow">AI in Spurly</span>
            <h2 className="h2" style={{ marginTop: 14 }}>AI that writes the outreach, <em>you stay in charge.</em></h2>
            <p className="lead">Spurly drafts the messages and comments, then runs the campaign for you in the cloud. Generic copy-paste notes get ignored, so every message is built around who you are and who you are writing to.</p>
          </div>
          <ul>{POINTS.map((p) => <CheckItem key={p}>{p}</CheckItem>)}</ul>
        </div>
      </div>
    </section>
  );
}

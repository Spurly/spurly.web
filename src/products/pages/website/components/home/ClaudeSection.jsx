import { Link } from "react-router-dom";
import { CheckItem } from "../../icons.jsx";

const POINTS = [
  "Ask about your outreach in plain language and get answers from your real numbers",
  "Claude drafts campaigns, sequences and templates, and you review them before anything starts",
  "Sending is off by default, and your daily and weekly limits still apply",
  "Disconnect any time from Settings, and see what Claude did in the activity log",
];

/* An example exchange. The replies are illustrative, not live data. */
const CHAT = [
  ["you", "How did my outreach do this week?"],
  ["bot", "Your acceptance rate is up on last week, and 3 replies are waiting on you. Want me to draft answers?"],
  ["you", "Yes, and which need an answer today?"],
  ["bot", "Two are asking about pricing. I can draft replies for you to approve. Nothing is sent without your say-so."],
  ["you", "Draft a campaign for heads of growth at fintechs in London."],
];

function Burst({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
      <path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6L5.6 18.4" />
    </svg>
  );
}

export default function ClaudeSection() {
  return (
    <section id="claude" className="section-pad">
      <div className="wrap">
        <div className="safety-panel claude-panel reveal">
          <div>
            <span className="claude-eyebrow"><span className="claude-logo"><Burst /></span>Works with Claude</span>
            <h2 className="h2" style={{ marginTop: 16 }}>Talk to your AI SDR <em>in Claude.</em></h2>
            <p className="lead">Connect Spurly to Claude through MCP and manage outreach in plain language: check results, sort replies, draft answers and plan the next campaign, without opening a dashboard.</p>
            <ul className="claude-points">{POINTS.map((p) => <CheckItem key={p}>{p}</CheckItem>)}</ul>
            <p className="claude-actions">
              <Link className="btn btn-claude btn-lg" to="/product/ai-assistants-setup">Connect Spurly to Claude</Link>
              <Link className="more-link" to="/product/ai-assistants">How it works →</Link>
            </p>
          </div>
          <div className="claude-window" role="img" aria-label="Example conversation with Claude using Spurly">
            <div className="claude-bar">
              <span className="claude-logo sm"><Burst size={12} /></span>
              <b>Claude</b>
              <span className="claude-status"><i />Spurly connected</span>
            </div>
            <div className="claude-thread" aria-hidden="true">
              {CHAT.map(([who, text], i) =>
                who === "you" ? (
                  <p key={i} className="claude-msg you">{text}</p>
                ) : (
                  <div key={i} className="claude-row">
                    <span className="claude-logo xs"><Burst size={13} /></span>
                    <p className="claude-msg bot">{text}</p>
                  </div>
                ),
              )}
              <div className="claude-row">
                <span className="claude-logo xs"><Burst size={13} /></span>
                <span className="claude-typing"><i /><i /><i /></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

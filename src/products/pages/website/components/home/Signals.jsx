import { Link } from "react-router-dom";

/* Intent signals as a Beeze-style grid: short labelled chips, no sentences.
   Only signals that ship are listed (profile viewers, followers, post search,
   hiring companies, network and invitations). The profile fields and actions
   come from the enrichment and sequence code. The sample lead is made up and
   labelled "Example". */

const SIGNAL_CARDS = [
  { title: "Interested in you", sub: "They already know who you are.", items: ["Viewed your profile", "Follows you", "Follows your company page"] },
  { title: "Showing a need", sub: "Talking about it or paying for it.", items: ["Posted about your topic", "Company is hiring"] },
  { title: "Your network", sub: "People already close to you.", items: ["Accepted your invitation", "Sent you an invitation", "In your network"] },
];

const READS = ["Headline", "Title and company", "About", "Work history", "Education", "Skills", "Location", "Followers", "Email and phone"];
const ACTS = ["Visit profile", "Connect", "Message", "Follow", "Like a post", "Comment", "Endorse a skill"];
const COUNT = SIGNAL_CARDS.reduce((n, c) => n + c.items.length, 0);

function Card({ c, i }) {
  return (
    <article className={"sig-card reveal d" + (i + 1)}>
      <span className="sig-n" aria-hidden="true">{c.items.length}</span>
      <h3>{c.title}</h3>
      <p>{c.sub}</p>
      <ul>{c.items.map((it) => <li key={it}>{it}</li>)}</ul>
    </article>
  );
}

function Chips({ title, sub, items, cls }) {
  return (
    <article className={"sig-card reveal " + (cls || "")}>
      <span className="sig-n" aria-hidden="true">{items.length}</span>
      <h3>{title}</h3>
      <p>{sub}</p>
      <ul>{items.map((it) => <li key={it}>{it}</li>)}</ul>
    </article>
  );
}

export default function Signals() {
  return (
    <section id="signals" className="sig section-pad">
      <div className="wrap">
        <div className="sec-head center reveal">
          <span className="eyebrow">Intent signals</span>
          <h2 className="h2" style={{ marginTop: 14 }}>Start with warm leads, <em>not cold lists.</em></h2>
          <p className="sig-count"><b>{COUNT}</b> intent signals tracked</p>
        </div>
        <div className="sig-grid">
          <div className="sig-col">
            <Card c={SIGNAL_CARDS[0]} i={0} />
            <Card c={SIGNAL_CARDS[1]} i={1} />
          </div>
          <div className="sig-lead reveal d2" role="img" aria-label="Example lead: a profile with the fields Spurly reads highlighted">
            <span className="sig-ex">Example</span>
            <div className="sig-av">AR</div>
            <strong>Alex Rivera</strong>
            <small>VP of Sales · Northwind</small>
            <span className="sig-tag">Viewed your profile · 2 days ago</span>
            <dl>
              <div><dt>Experience</dt><dd>Northwind, 2024 to now</dd></div>
              <div><dt>Before</dt><dd>Contoso, 4 years</dd></div>
              <div><dt>Education</dt><dd>State University</dd></div>
              <div><dt>Skills</dt><dd>Outbound · Sales ops</dd></div>
              <div><dt>Followers</dt><dd>2,140</dd></div>
            </dl>
          </div>
          <div className="sig-col">
            <Card c={SIGNAL_CARDS[2]} i={2} />
            <Chips title="Then Spurly acts" sub="Every step runs at a safe pace." items={ACTS} cls="d3" />
          </div>
        </div>
        <Chips title="Read from every profile" sub="Pulled in when a lead is enriched, so messages can be personal." items={READS} cls="sig-wide d2" />
        <p className="center" style={{ marginTop: 26 }}><Link className="more-link" to="/product/lead-finder">See every intent signal →</Link></p>
      </div>
    </section>
  );
}

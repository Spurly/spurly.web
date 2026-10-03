const ROWS = [
  ["Needs your laptop and a LinkedIn tab open", "Runs from the cloud, even with your laptop closed"],
  ["Names copied into a spreadsheet", "Audiences built from searches, companies, posts, URLs or CSV"],
  ["Follow-ups when you remember", "Each step sent on schedule, stopped when someone replies"],
  ["Replies scattered across tabs", "One inbox for every conversation"],
  ["Pace decided by guesswork", "Limits per action and your own working hours"],
];

export default function ByHand() {
  return (
    <section id="compare" className="section-pad">
      <div className="wrap">
        <div className="sec-head center reveal">
          <span className="eyebrow">By hand or with Spurly</span>
          <h2 className="h2" style={{ marginTop: 14 }}>The same outreach, <em>without the busywork.</em></h2>
        </div>
        <div className="content-table reveal d1">
          <table>
            <thead>
              <tr><th scope="col">Doing it by hand</th><th scope="col">With Spurly</th></tr>
            </thead>
            <tbody>
              {ROWS.map(([a, b]) => <tr key={a}><td>{a}</td><td>{b}</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

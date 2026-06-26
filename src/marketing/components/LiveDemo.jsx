import { useEffect, useRef } from "react";
import { SendIcon } from "../icons.jsx";

/* LIVE DEMO — type a template once, then cycle recipients into preview.
   Ported verbatim from app.js initDemo(), scoped to the section ref. */
export default function LiveDemo() {
  const rootRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var composeEl = root.querySelector("[data-compose]");
    var pv = {
      av: root.querySelector("[data-pv-av]"),
      nm: root.querySelector("[data-pv-nm]"),
      ro: root.querySelector("[data-pv-ro]"),
      sub: root.querySelector("[data-pv-sub]"),
      body: root.querySelector("[data-pv-body]")
    };
    var recipsWrap = root.querySelector("[data-recips]");

    var tmplSub = "Quick thought on {{company}}'s growth";
    var tmplBody = "Hi {{name}},\n\nNoticed your work as {{title}} at {{company}}. We've been helping similar teams cut their pipeline-to-meeting time roughly in half.\n\nWorth a 15-min look next week?\n\n— Sarthak";

    var people = [
      { name: "Vasant", full: "Vasant Pardhi", title: "Founder", company: "Nexux Inc.", role: "Founder · Nexux Inc.", c: "linear-gradient(135deg,#a3a625,#6b7a1a)", in: "VP" },
      { name: "Krishna", full: "Krishna Chaturvedi", title: "Founder", company: "RECRIVIO", role: "Founder · RECRIVIO", c: "linear-gradient(135deg,#3b82f6,#1e5fd1)", in: "KC" },
      { name: "Kapil", full: "Kapil K. K.", title: "Co-Founder & CTO", company: "60db.ai", role: "Co-Founder · 60db.ai", c: "linear-gradient(135deg,#10b981,#0c8f66)", in: "KK" },
      { name: "Surya", full: "Surya Chandra", title: "BD Executive", company: "MetaLogic", role: "BD Executive · MetaLogic", c: "linear-gradient(135deg,#8b5cf6,#6d28d9)", in: "SC" }
    ];

    people.forEach(function (p, i) {
      var el = document.createElement("div");
      el.className = "recip" + (i === 0 ? " active" : "");
      el.innerHTML = '<span class="mini" style="background:' + p.c + '">' + p.in + "</span>" + p.full;
      recipsWrap.appendChild(el);
      p._chip = el;
    });

    function highlight(text) {
      return text
        .replace(/\{\{name\}\}/g, '<span class="v">{{name}}</span>')
        .replace(/\{\{company\}\}/g, '<span class="v">{{company}}</span>')
        .replace(/\{\{title\}\}/g, '<span class="v">{{title}}</span>')
        .replace(/\{\{sender\}\}/g, '<span class="v">{{sender}}</span>');
    }
    function fill(tmpl, p) {
      return tmpl.replace(/\{\{name\}\}/g, p.name).replace(/\{\{company\}\}/g, p.company).replace(/\{\{title\}\}/g, p.title);
    }
    function setPreview(p) {
      pv.av.style.background = p.c; pv.av.textContent = p.in;
      pv.nm.textContent = p.full; pv.ro.textContent = p.role;
      pv.sub.textContent = fill(tmplSub, p);
      pv.body.textContent = fill(tmplBody, p);
      people.forEach(function (x) { x._chip.classList.toggle("active", x === p); });
    }

    var full = "Subject:  " + tmplSub + "\n\n" + tmplBody;
    var idx = 0, pi = 0, started = false, typing = true, holdTimer = null;
    var typeTimer = null;
    var stepIO = null;

    function renderCompose(n) {
      var slice = full.slice(0, n);
      composeEl.innerHTML = highlight(escapeHtml(slice)) + '<span class="caret"></span>';
    }
    function escapeHtml(s) { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

    function tick() {
      if (!started) return;
      if (typing) {
        idx += 1;
        renderCompose(idx);
        if (idx >= full.length) {
          typing = false;
          setPreview(people[0]);
          holdTimer = setTimeout(function () { cyclePeople(); }, 1400);
          return;
        }
        var ch = full.charAt(idx - 1);
        var d = ch === "\n" ? 90 : (Math.random() < 0.12 ? 130 : 26 + Math.random() * 34);
        typeTimer = setTimeout(tick, reduce ? 0 : d);
      }
    }

    function cyclePeople() {
      pi = (pi + 1) % people.length;
      setPreview(people[pi]);
      holdTimer = setTimeout(cyclePeople, 2600);
    }

    function begin() {
      if (started) return; started = true;
      if (reduce) {
        renderCompose(full.length);
        composeEl.innerHTML = highlight(escapeHtml(full));
        setPreview(people[0]);
        pi = 0; cyclePeople();
      } else {
        tick();
      }
    }

    composeEl.innerHTML = highlight(escapeHtml(full.slice(0, 0))) + '<span class="caret"></span>';
    setPreview(people[0]);
    people.forEach(function (x) { x._chip.classList.remove("active"); });
    people[0]._chip.classList.add("active");

    if ("IntersectionObserver" in window) {
      stepIO = new IntersectionObserver(function (e, obs) {
        if (e[0].isIntersecting) { begin(); obs.disconnect(); }
      }, { threshold: 0.4 });
      stepIO.observe(root);
    } else { begin(); }

    return () => {
      started = false;
      if (holdTimer) clearTimeout(holdTimer);
      if (typeTimer) clearTimeout(typeTimer);
      if (stepIO) stepIO.disconnect();
      if (recipsWrap) recipsWrap.innerHTML = "";
    };
  }, []);

  return (
    <section className="section-pad">
      <div className="wrap">
        <div className="sec-head center reveal">
          <span className="eyebrow">Personalization, on autopilot</span>
          <h2 className="h2" style={{ marginTop: 14 }}>Write it once. Spurly makes it personal for everyone.</h2>
          <p className="lead">Use variables for the parts that change. Spurly fills in every recipient's real name, title and company — and shows you a live preview before a single message sends.</p>
        </div>

        <div id="demo" className="demo-grid" ref={rootRef}>
          <div className="demo-pane glass reveal d1">
            <div className="ph">
              <span className="ttl">Compose message</span>
              <span className="chip" style={{ padding: "5px 12px" }}><span className="dot" style={{ background: "var(--purple)" }} />Template</span>
            </div>
            <div className="demo-body">
              <div className="insert-row">
                <span className="lbl">Insert</span>
                <span className="var-chip">{"{{name}}"}</span>
                <span className="var-chip">{"{{company}}"}</span>
                <span className="var-chip">{"{{title}}"}</span>
              </div>
              <div className="compose" data-compose />
            </div>
            <div className="demo-foot">
              <span className="tnum">190 chars · ~1 min read</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 7, color: "var(--accent)", fontWeight: 600 }}>
                <SendIcon width="16" height="16" />
                Sending to 9
              </span>
            </div>
          </div>

          <div className="demo-pane glass reveal d2">
            <div className="ph">
              <span className="ttl">Live preview</span>
              <span className="ttl" style={{ textTransform: "none", letterSpacing: 0, color: "var(--text-3)" }}>updates per recipient</span>
            </div>
            <div className="preview-card">
              <div className="pv-head">
                <div className="pv-av" data-pv-av />
                <div>
                  <div className="nm" data-pv-nm />
                  <div className="ro" data-pv-ro />
                </div>
              </div>
              <div className="pv-sub" data-pv-sub />
              <div className="pv-body" data-pv-body />
            </div>
            <div style={{ padding: "0 22px 22px" }}>
              <div className="recip-row" data-recips />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

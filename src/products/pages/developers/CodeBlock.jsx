import { useState } from "react";

/* A code block with a copy button. The clipboard is only touched inside the
   click handler, so this renders on the server (prerender) unchanged. */
export function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    const done = () => { setCopied(true); setTimeout(() => setCopied(false), 1600); };
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).then(done, () => {});
  }
  return (
    <button type="button" className="docs-copy" onClick={copy} aria-label="Copy code">
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export default function CodeBlock({ code, lang, title }) {
  return (
    <div className="docs-code">
      {(title || lang) && (
        <div className="docs-code-bar">
          <span>{title || lang}</span>
          <CopyButton text={code} />
        </div>
      )}
      <pre className="content-code"><code>{code}</code></pre>
    </div>
  );
}

/** Tabs of code (curl / Node.js / Python). All panes render; only one shows. */
export function CodeTabs({ samples, label = "Request" }) {
  const [active, setActive] = useState(samples[0]?.id);
  const current = samples.find((s) => s.id === active) || samples[0];
  return (
    <div className="docs-code docs-tabs">
      <div className="docs-code-bar">
        <div className="docs-tablist" role="tablist" aria-label={label}>
          {samples.map((s) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={s.id === current.id}
              className={s.id === current.id ? "is-active" : ""}
              onClick={() => setActive(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>
        <CopyButton text={current.code} />
      </div>
      <pre className="content-code" role="tabpanel"><code>{current.code}</code></pre>
    </div>
  );
}

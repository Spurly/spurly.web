import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { EventEmitter } from "src/shared/utils/EventEmitter.js";
import { track } from "src/shared/analytics/analytics.js";
import connectionRequestController from "../controller/connectionRequest.js";
import { TOOL_EVENTS, NOTE_REASONS, NOTE_TONES } from "../constants/constants.js";

const EMPTY = { recipient: "", about: "", detail: "", reason: "network", tone: "professional", website: "" };

/* Free connection-request generator. Nothing here reads window/document during
   render, so the form prerenders; the call happens only on submit. */
export default function ConnectionRequestTool() {
  const emitter = useMemo(() => new EventEmitter(), []);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setCopied(false);
    emitter.once(TOOL_EVENTS.CONNECTION_NOTE_SUCCESS, (data) => {
      setNote(data);
      setBusy(false);
      track("tool_generate", { tool: "connection_request" });
    });
    emitter.once(TOOL_EVENTS.CONNECTION_NOTE_FAILURE, (err) => {
      setError(err);
      setBusy(false);
    });
    connectionRequestController.createNote(emitter, form);
  };

  const copy = () => {
    if (!note) return;
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(note.note).then(() => {
      setCopied(true);
      track("tool_copy", { tool: "connection_request" });
    });
  };

  const fieldError = (name) => error?.errors?.[name];

  return (
    <section className="tool-box" aria-labelledby="tool-title">
      <h2 id="tool-title" className="tool-title">Write your connection note</h2>
      <form onSubmit={submit} className="tool-form" noValidate>
        <label>
          Who are you writing to?
          <input value={form.recipient} onChange={set("recipient")} maxLength={120} placeholder="e.g. Head of Talent at a fintech startup" required />
          {fieldError("recipient") && <span className="tool-err">{fieldError("recipient")}</span>}
        </label>
        <label>
          Who are you?
          <input value={form.about} onChange={set("about")} maxLength={160} placeholder="e.g. I run a small recruiting agency for fintech" required />
          {fieldError("about") && <span className="tool-err">{fieldError("about")}</span>}
        </label>
        <label>
          Anything specific to mention? (optional)
          <input value={form.detail} onChange={set("detail")} maxLength={160} placeholder="e.g. their post about hiring in 2026" />
        </label>
        <div className="tool-row">
          <label>
            Why connect?
            <select value={form.reason} onChange={set("reason")}>
              {NOTE_REASONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </label>
          <label>
            Tone
            <select value={form.tone} onChange={set("tone")}>
              {NOTE_TONES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </label>
        </div>
        {/* Honeypot: hidden from people, filled in by simple bots. */}
        <input className="tool-hp" tabIndex={-1} autoComplete="off" aria-hidden="true" value={form.website} onChange={set("website")} name="website" />
        <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? "Writing…" : note ? "Write another" : "Write my note"}</button>
      </form>

      {error && !error.errors && <p className="tool-err" role="alert">{error.message}</p>}

      {note && (
        <div className="tool-result" aria-live="polite">
          <p className="tool-note">{note.note}</p>
          <p className="tool-meta">{note.length} of {note.limit} characters. Replace [First name] with their name before sending.</p>
          <button type="button" className="btn btn-ghost btn-sm" onClick={copy}>{copied ? "Copied" : "Copy note"}</button>
        </div>
      )}

      <p className="tool-foot">
        Free, no sign-up. Your answers are used to write the note and are not stored.
        Want this to run for hundreds of people with the right name filled in each time?{" "}
        <Link to="/product/campaigns">See how Spurly campaigns work</Link>.
      </p>
    </section>
  );
}

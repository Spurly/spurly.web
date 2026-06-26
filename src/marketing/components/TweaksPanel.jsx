import { useEffect, useState } from "react";

/* TWEAKS PANEL — Palette · Frost (glass material) · Energy (motion).
   Ported from tweaks.js to a state-driven component. Persists to
   localStorage, applies body[data-*] attributes, dispatches
   "spurly:repaint", and speaks the editor host postMessage protocol. */

const KEY = "spurly_tweaks_v1";
const DEFAULTS = { palette: "violet", frost: "frosted", energy: "balanced" };

const SWATCHES = {
  azure: "linear-gradient(135deg,#2d6ae0,#38bdf8)",
  sand: "linear-gradient(135deg,#a9762f,#d9a441)",
  green: "linear-gradient(135deg,#1f8a5b,#34d399)",
  violet: "linear-gradient(135deg,#7c3aed,#38bdf8)",
};

const LABELS = { azure: "Azure", sand: "Sand", green: "Evergreen", violet: "Violet", clear: "Clear", frosted: "Frosted", solid: "Solid", calm: "Calm", balanced: "Balanced", hyped: "Hyped" };

const PALETTE_OPTS = [["azure", "Azure"], ["sand", "Sand"], ["green", "Evergreen"], ["violet", "Violet"]];
const FROST_OPTS = [["clear", "Clear"], ["frosted", "Frosted"], ["solid", "Solid"]];
const ENERGY_OPTS = [["calm", "Calm"], ["balanced", "Balanced"], ["hyped", "Hyped"]];

function loadState() {
  try { return Object.assign({}, DEFAULTS, JSON.parse(localStorage.getItem(KEY) || "{}")); }
  catch (e) { return Object.assign({}, DEFAULTS); }
}

function post(type) {
  try { window.parent && window.parent.postMessage({ type: type }, "*"); } catch (e) {}
}

export default function TweaksPanel() {
  const [state, setState] = useState(loadState);
  const [open, setOpen] = useState(false);

  // apply + persist whenever state changes
  useEffect(() => {
    const b = document.body;
    if (state.palette && state.palette !== "azure") b.setAttribute("data-palette", state.palette);
    else b.removeAttribute("data-palette");
    if (state.frost && state.frost !== "frosted") b.setAttribute("data-frost", state.frost);
    else b.removeAttribute("data-frost");
    b.setAttribute("data-energy", state.energy || "balanced");
    window.dispatchEvent(new CustomEvent("spurly:repaint"));
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  }, [state]);

  // host protocol (editor toolbar toggle)
  useEffect(() => {
    function onMessage(e) {
      const d = e.data;
      if (!d || typeof d !== "object") return;
      if (d.type === "__activate_edit_mode") setOpen(true);
      else if (d.type === "__deactivate_edit_mode") setOpen(false);
    }
    window.addEventListener("message", onMessage);
    post("__edit_mode_available");
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const set = (key, val) => setState((s) => ({ ...s, [key]: val }));

  const closePanel = () => { setOpen(false); post("__edit_mode_dismissed"); };

  return (
    <>
      <div className={"twk" + (open ? " show" : "")} role="dialog" aria-label="Tweaks">
        <div className="twk-hd">
          <b>Tweaks</b>
          <span className="tag">reshape the feel</span>
          <button className="twk-x" aria-label="Close" onClick={closePanel}>
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="twk-bd">
          <div className="twk-grp">
            <div className="twk-lbl"><span>Palette</span><span>{LABELS[state.palette] || ""}</span></div>
            <div className="twk-sw">
              {PALETTE_OPTS.map(([id, label]) => (
                <button key={id} className={state.palette === id ? "on" : undefined} title={label} aria-label={label} style={{ background: SWATCHES[id] }} onClick={() => set("palette", id)} />
              ))}
            </div>
          </div>
          <div className="twk-grp">
            <div className="twk-lbl"><span>Frost</span><span>{LABELS[state.frost] || ""}</span></div>
            <div className="twk-seg">
              {FROST_OPTS.map(([id, label]) => (
                <button key={id} className={state.frost === id ? "on" : undefined} onClick={() => set("frost", id)}>{label}</button>
              ))}
            </div>
          </div>
          <div className="twk-grp">
            <div className="twk-lbl"><span>Energy</span><span>{LABELS[state.energy] || ""}</span></div>
            <div className="twk-seg">
              {ENERGY_OPTS.map(([id, label]) => (
                <button key={id} className={state.energy === id ? "on" : undefined} onClick={() => set("energy", id)}>{label}</button>
              ))}
            </div>
          </div>
        </div>
        <div className="twk-foot">
          <button className="twk-reset" onClick={() => setState(Object.assign({}, DEFAULTS))}>Reset to default</button>
        </div>
      </div>

      <button className={"twk-fab" + (open ? " hidden" : "")} aria-label="Open Tweaks — reshape the feel" onClick={() => setOpen((o) => !o)}>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" /><line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" /><line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" /><line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" /></svg>
        <span className="twk-fab-tx">Tweaks</span>
        <span className="twk-fab-pulse" />
      </button>
    </>
  );
}

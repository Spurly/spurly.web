import { useId, useState } from "react";
import { Tag } from "src/core/primitives";
import {
  ICP_COMPANY_SIZES,
  ICP_ITEM_MAX_LENGTH,
  ICP_MAX_ITEMS,
  ICP_NOTES_MAX_LENGTH,
} from "../../constants/constants.js";

/**
 * "Who do you want to reach?" -- the user's ideal customer profile, as short
 * chips. Nothing is pre-selected: a profile says who someone IS, not who they
 * sell to, so the suggestions below each field are offered, never applied.
 *
 * Controlled: `icp` is the draft, `onChange(field, value)` edits one field.
 */

const sameText = (a, b) => a.toLowerCase() === b.toLowerCase();

function ChipInput({ label, hint, placeholder, values, suggestions = [], onChange }) {
  const id = useId();
  const [text, setText] = useState("");
  const full = values.length >= ICP_MAX_ITEMS;

  function add(raw) {
    const item = raw.trim().replace(/\s+/g, " ").slice(0, ICP_ITEM_MAX_LENGTH);
    if (!item || full || values.some((v) => sameText(v, item))) return;
    onChange([...values, item]);
  }

  function commit() {
    add(text);
    setText("");
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commit();
    } else if (e.key === "Backspace" && !text && values.length) {
      onChange(values.slice(0, -1));
    }
  }

  const open = suggestions.filter((s) => !values.some((v) => sameText(v, s)));

  return (
    <div className="sp-icp__f">
      <label className="sp-icp__l" htmlFor={id}>{label}</label>
      {values.length > 0 && (
        <div className="sp-chips">
          {values.map((v) => (
            <Tag key={v} tone="accent" removable onRemove={() => onChange(values.filter((x) => x !== v))}>
              {v}
            </Tag>
          ))}
        </div>
      )}
      <input
        id={id}
        className="sp-icp__input"
        value={text}
        placeholder={full ? `Up to ${ICP_MAX_ITEMS}` : placeholder}
        disabled={full}
        maxLength={ICP_ITEM_MAX_LENGTH}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={commit}
      />
      {hint && <div className="sp-prof__note">{hint}</div>}
      {open.length > 0 && !full && (
        <div className="sp-chips" aria-label={`Suggested ${label.toLowerCase()}`}>
          {open.map((s) => (
            <Tag key={s} onClick={() => add(s)} title={`Add ${s}`}>
              + {s}
            </Tag>
          ))}
        </div>
      )}
    </div>
  );
}

export function IcpEditor({ icp, suggestions, onChange }) {
  const notesId = useId();

  function toggleSize(size) {
    const has = icp.companySizes.includes(size);
    onChange("companySizes", has ? icp.companySizes.filter((s) => s !== size) : [...icp.companySizes, size]);
  }

  return (
    <section className="sp-icp" aria-label="Who you want to reach">
      <div>
        <div className="sp-icp__title">Who do you want to reach?</div>
        <div className="sp-icp__sub">
          Your profile tells us who you are, not who you sell to. Add a few
          details and we&rsquo;ll start your first audience from them. All
          optional, and you can change them any time.
        </div>
      </div>

      <ChipInput
        label="Job titles"
        placeholder="e.g. Head of Growth, VP Sales"
        values={icp.roles}
        suggestions={suggestions.roles}
        hint={suggestions.roles.length ? "Suggestions are your own current titles: tap one if you want to reach people like you." : undefined}
        onChange={(v) => onChange("roles", v)}
      />
      <ChipInput
        label="Industries"
        placeholder="e.g. SaaS, Fintech, Healthcare"
        values={icp.industries}
        onChange={(v) => onChange("industries", v)}
      />
      <ChipInput
        label="Locations"
        placeholder="e.g. India, London"
        values={icp.locations}
        suggestions={suggestions.locations}
        onChange={(v) => onChange("locations", v)}
      />

      <div className="sp-icp__f">
        <span className="sp-icp__l" id="icp-size-label">Company size</span>
        <div className="sp-chips" role="group" aria-labelledby="icp-size-label">
          {ICP_COMPANY_SIZES.map((size) => {
            const on = icp.companySizes.includes(size);
            return (
              <Tag key={size} tone={on ? "accent" : "neutral"} onClick={() => toggleSize(size)}>
                {size} employees
                {on && <span className="sr-only"> (selected)</span>}
              </Tag>
            );
          })}
        </div>
      </div>

      <div className="sp-icp__f">
        <label className="sp-icp__l" htmlFor={notesId}>Anything else?</label>
        <textarea
          id={notesId}
          className="sp-icp__input"
          rows={3}
          maxLength={ICP_NOTES_MAX_LENGTH}
          placeholder="e.g. Founders who recently raised, teams hiring SDRs"
          value={icp.notes}
          onChange={(e) => onChange("notes", e.target.value)}
        />
        <div className="sp-icp__count">{icp.notes.length}/{ICP_NOTES_MAX_LENGTH}</div>
      </div>
    </section>
  );
}

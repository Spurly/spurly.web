import { Clock } from 'lucide-react';
import { Avatar } from 'src/core/primitives';
import { statusWord } from 'src/products/sequences/journeyModel.js';
import './journey.css';

/**
 * One lead on a step: their photo (initials when there is none), a ring for how they are doing, and a slow drift.
 * The ring and the small badge carry the meaning, not the colour alone: a clock for waiting, "!" for failed.
 */

const RING = {
  active: 'var(--ui-success-dot)',
  waiting: 'var(--ui-accent-dot)',
  failed: 'var(--ui-danger-dot)',
};

/** Deterministic 0..1 from a string, so a bubble drifts the same way on every render and poll. */
function unit(seed, salt) {
  let h = salt;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return (h % 1000) / 1000;
}

function driftStyle(lead) {
  const r = (salt) => unit(lead.id, salt);
  const failed = lead.status === 'failed';
  const waiting = lead.status === 'waiting';
  const amp = failed ? 3.2 + r(1) * 0.8 : waiting ? 2 + r(1) * 0.6 : 2.4 + r(1) * 1.2;
  const dur = failed ? 4 + r(2) * 1.2 : waiting ? 6 + r(2) : 4.5 + r(2) * 1.8;
  const sign = r(3) > 0.5 ? 1 : -1;
  return {
    '--jd': `${dur.toFixed(2)}s`,
    '--jdelay': `-${(r(4) * dur).toFixed(2)}s`,
    '--jy': `-${amp.toFixed(2)}px`,
    '--jx': `${((waiting ? 0.8 : 1) * (0.5 + r(5)) * sign).toFixed(2)}px`,
    '--jr': waiting ? '0deg' : `${((0.8 + r(6)) * sign).toFixed(2)}deg`,
  };
}

export function LeadBubble({ lead, dimmed = false, active = false, onOpen }) {
  const ring = RING[lead.status] ?? 'var(--ui-neutral-400)';
  const label = `${lead.name}, ${statusWord(lead)}`;
  return (
    <button
      type="button"
      data-canvas-ui
      onClick={(e) => { e.stopPropagation(); onOpen(lead.id); }}
      aria-label={label}
      aria-pressed={active}
      title={lead.waitText ? `${lead.name}: ${lead.waitText}` : label}
      className={`journey-bubble relative shrink-0 w-6 h-6 -ml-[3px] first:ml-0 rounded-full p-0 cursor-pointer outline-none transition-[opacity,scale] duration-[var(--ui-dur-fast)] hover:scale-110 focus-visible:scale-110 focus-visible:ring-2 focus-visible:ring-[var(--ui-accent)] ${dimmed ? 'opacity-20' : ''}`}
      style={{ ...driftStyle(lead), border: `2px solid ${ring}`, boxShadow: `0 0 0 1.5px var(--ui-surface-card)${active ? `, 0 0 0 3.5px ${ring}` : ''}` }}
    >
      <Avatar src={lead.photo || null} name={lead.name} size={20} />
      {lead.status === 'waiting' && (
        <span className="absolute -right-[5px] -bottom-[4px] w-3 h-3 rounded-full grid place-items-center bg-[var(--ui-accent)] text-white shadow-[0_0_0_1.5px_var(--ui-surface-card)]" aria-hidden="true">
          <Clock size={8} strokeWidth={3} />
        </span>
      )}
      {lead.status === 'failed' && (
        <span className="absolute -right-[5px] -bottom-[4px] w-3 h-3 rounded-full bg-[var(--ui-danger)] text-white text-[8px] leading-3 text-center shadow-[0_0_0_1.5px_var(--ui-surface-card)]" aria-hidden="true">!</span>
      )}
    </button>
  );
}

export default LeadBubble;

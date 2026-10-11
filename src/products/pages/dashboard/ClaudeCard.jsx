import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'src/core/primitives';
import { ArrowRightIcon, ExternalIcon } from 'src/core/icons';
import { CLAUDE_CONNECTORS_URL, CLAUDE_PROMPTS, MCP_URL } from 'src/products/aiAssistants/constants/constants.js';
import { dashboardStrings as t } from './strings.js';

/* Claude's brand orange. The card is warm on purpose so it reads as "Claude", not as a Spurly action. */
const SHINY =
  '!relative !overflow-hidden group !border-[#C75F3C] !text-white !bg-[linear-gradient(180deg,#EC9573_0%,#D96F4A_55%,#CC5F3B_100%)] ' +
  '!shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_8px_22px_-4px_rgba(217,111,74,0.55)] ' +
  'hover:!brightness-105 hover:!shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_12px_28px_-4px_rgba(217,111,74,0.65)]';
const OUTLINE = '!bg-white/80 !border-[#EBCDBF] hover:!border-[#D96F4A] hover:!bg-white';

/* An example exchange: your prompts are the real suggestions, Claude's replies are illustrative. */
const CHAT = [
  { from: 'you', text: CLAUDE_PROMPTS[0] },
  { from: 'claude', text: t.claude.replies[0] },
  { from: 'you', text: CLAUDE_PROMPTS[1] },
  { from: 'claude', text: t.claude.replies[1] },
  { from: 'you', text: CLAUDE_PROMPTS[2] },
];

function Burst({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
      <path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6L5.6 18.4" />
    </svg>
  );
}

/**
 * "Run Spurly from Claude" — the Home entry point to the MCP connection. Claude cannot be
 * prefilled from a link, so Connect copies the server address and opens Claude's connector page.
 */
export function ClaudeCard() {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const copy = () => navigator.clipboard?.writeText(MCP_URL).then(() => setCopied(true));
  const connect = () => {
    copy();
    window.open(CLAUDE_CONNECTORS_URL, '_blank', 'noopener,noreferrer');
  };

  return (
    <section
      aria-label={t.claude.title}
      className="relative overflow-hidden rounded-[var(--ui-radius-lg)] border border-[#F2D9CC] bg-[linear-gradient(135deg,#FFF4ED_0%,#FFFFFF_48%,#FFEFE4_100%)] shadow-[0_1px_0_rgba(255,255,255,0.9)_inset,0_18px_40px_-24px_rgba(217,111,74,0.45)]"
    >
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(236,149,115,0.35),transparent_68%)]" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-28 right-10 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(236,149,115,0.22),transparent_70%)]" aria-hidden="true" />

      <div className="relative grid gap-6 p-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-center lg:p-7">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-[12px] bg-[linear-gradient(160deg,#EE9A78,#CF6540)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_8px_18px_-6px_rgba(217,111,74,0.7)]">
              <Burst />
            </span>
            <span className="font-[family-name:var(--ui-font-mono)] text-[length:var(--ui-t-micro)] tracking-[var(--ui-track-meta)] text-[#C2593A]">
              {t.claude.eyebrow}
            </span>
          </div>
          <div>
            <h2 className="text-[length:var(--ui-t-title)] font-semibold leading-[1.2] tracking-[-0.01em] text-[var(--ui-text-primary)]">{t.claude.title}</h2>
            <p className="mt-2 max-w-[56ch] text-[length:var(--ui-t-control)] leading-[1.55] text-[var(--ui-text-secondary)]">{t.claude.body}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <Button variant="primary" size="lg" className={SHINY} trailingIcon={<ExternalIcon size={13} strokeWidth={2} />} onClick={connect} data-testid="claude-connect">
              <span
                className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 -skew-x-12 bg-white/35 opacity-0 blur-[2px] transition-all duration-700 group-hover:left-[130%] group-hover:opacity-100"
                aria-hidden="true"
              />
              {t.claude.connect}
            </Button>
            <Button variant="secondary" size="lg" className={OUTLINE} onClick={copy} data-testid="claude-copy">
              {copied ? t.claude.copied : t.claude.copy}
            </Button>
            <Button variant="ghost" size="lg" trailingIcon={<ArrowRightIcon size={13} strokeWidth={2} />} onClick={() => navigate('/dashboard/settings/ai-assistants')}>
              {t.claude.guide}
            </Button>
          </div>
        </div>

        <div
          className="flex flex-col overflow-hidden rounded-[var(--ui-radius-lg)] border border-[#F2D9CC] bg-white shadow-[0_18px_36px_-22px_rgba(217,111,74,0.5)]"
          role="img"
          aria-label={t.claude.chatLabel}
        >
          <div className="flex items-center gap-2 border-b border-[#F6E4DA] bg-[#FFFAF7] px-4 py-2.5">
            <span className="grid h-5 w-5 place-items-center rounded-[6px] bg-[linear-gradient(160deg,#EE9A78,#CF6540)] text-white"><Burst size={12} /></span>
            <span className="text-[length:var(--ui-t-label)] font-medium text-[var(--ui-text-primary)]">Claude</span>
            <span className="ml-auto flex items-center gap-1.5 font-[family-name:var(--ui-font-mono)] text-[length:var(--ui-t-micro)] tracking-[var(--ui-track-meta)] text-[var(--ui-text-secondary)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--ui-success-dot)]" aria-hidden="true" />
              {t.claude.connected}
            </span>
          </div>
          <div className="flex flex-col gap-3 p-4" aria-hidden="true">
            {CHAT.map(({ from, text }, i) =>
              from === 'you' ? (
                <p key={i} className="max-w-[85%] self-end rounded-[var(--ui-radius-md)] rounded-br-[4px] bg-[linear-gradient(180deg,#E98A66,#D2653F)] px-3.5 py-2 text-[length:var(--ui-t-label)] leading-[1.45] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]">
                  {text}
                </p>
              ) : (
                <div key={i} className="flex max-w-[92%] items-start gap-2 self-start">
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[linear-gradient(160deg,#EE9A78,#CF6540)] text-white"><Burst size={13} /></span>
                  <p className="rounded-[var(--ui-radius-md)] rounded-tl-[4px] border border-[#F2E4DC] bg-[#FFFAF7] px-3.5 py-2 text-[length:var(--ui-t-label)] leading-[1.5] text-[var(--ui-text-primary)]">{text}</p>
                </div>
              ),
            )}
            <div className="flex items-center gap-2 self-start">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[linear-gradient(160deg,#EE9A78,#CF6540)] text-white"><Burst size={13} /></span>
              <span className="flex gap-1 rounded-[var(--ui-radius-md)] border border-[#F2E4DC] bg-[#FFFAF7] px-3 py-2.5">
                {[0, 150, 300].map((d) => (
                  <span key={d} className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#D96F4A]" style={{ animationDelay: `${d}ms` }} />
                ))}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

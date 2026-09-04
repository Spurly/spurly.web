import { X, Puzzle, RefreshCw, ExternalLink } from 'lucide-react';

/**
 * Shown when the user tries to send a campaign but the Spurly extension isn't
 * detected (not installed, disabled, or pinned off). Offers a recheck + install.
 */
export function EnableExtensionModal({ installed, loggedIn, loginKnown, checking, onRecheck, onClose }) {
  return (
    <div
      className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-full max-w-md rounded-[var(--ui-radius-lg)] shadow-[var(--shadow-lg)] overflow-hidden"
        style={{ background: 'var(--surface-card)', border: '1px solid var(--border-hairline)' }}
      >
        <div className="flex items-center justify-between px-[var(--ui-pad-lg)] pt-[var(--ui-pad-lg)] pb-[var(--ui-pad-lg)] border-b border-[var(--separator)]">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-[var(--ui-radius-lg)] grid place-items-center shrink-0"
              style={{ background: 'var(--accent-tint)' }}
            >
              <Puzzle size={17} style={{ color: 'var(--brand-purple)' }} />
            </div>
            <h2 className="text-[14px] font-medium text-[var(--text-primary)] tracking-[-0.012em]">
              Enable the Spurly extension
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 grid place-items-center rounded-[var(--ui-radius-md)] text-[var(--text-tertiary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-[var(--ui-pad-lg)] py-5">
          <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
            Connection requests are sent by the Spurly Chrome extension running on LinkedIn — so the
            extension needs to be installed and turned on in this browser.
          </p>

          <ol className="mt-4 flex flex-col gap-2.5 text-[13px] text-[var(--text-secondary)]">
            <Step n={1}>Install the Spurly extension (or enable it in <code className="font-mono text-[12px]">chrome://extensions</code>).</Step>
            <Step n={2}>Pin it — it signs in from this browser session, so there’s no second login.</Step>
            <Step n={3}>Come back here and hit “Recheck”.</Step>
          </ol>

          {/* Only when the worker actually answered. An unanswered ping means
              "unknown", and telling someone to go fix a sign-in that isn't
              broken is worse than saying nothing. */}
          {!checking && installed && loginKnown && !loggedIn && (
            <p
              className="mt-4 text-[12px] px-3 py-2.5 rounded-[var(--ui-radius-lg)]"
              style={{ background: 'var(--accent-tint)', color: 'var(--brand-purple)' }}
            >
              Detected the extension, but it couldn’t pick up this browser’s session. Reload this
              page and recheck — if it stays signed out, open it on LinkedIn and log in.
            </p>
          )}

          <div className="mt-5 flex items-center justify-end gap-2">
            <a
              href="https://chrome.google.com/webstore/detail/dcohpfeaohfiiinjjiinojlbnnfmihoh"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[var(--ui-radius-sm)] text-[13px] font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] transition-colors"
            >
              <ExternalLink size={15} /> Install
            </a>
            <button
              onClick={onRecheck}
              disabled={checking}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[var(--ui-radius-sm)] text-[13px] font-medium text-white transition-opacity disabled:opacity-60"
              style={{ background: 'var(--brand-purple)' }}
            >
              <RefreshCw size={15} className={checking ? 'animate-spin' : ''} />
              {checking ? 'Checking…' : 'Recheck'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Step({ n, children }) {
  return (
    <li className="flex gap-2.5">
      <span
        className="w-5 h-5 rounded-full grid place-items-center text-[11px] font-medium shrink-0 mt-0.5"
        style={{ background: 'var(--accent-tint)', color: 'var(--brand-purple)' }}
      >
        {n}
      </span>
      <span>{children}</span>
    </li>
  );
}

import { X, Puzzle, RefreshCw, ExternalLink } from 'lucide-react';

/**
 * Shown when the user tries to send a campaign but the Spurly extension isn't
 * detected (not installed, disabled, or pinned off). Offers a recheck + install.
 */
export function EnableExtensionModal({ installed, loggedIn, checking, onRecheck, onClose }) {
  return (
    <div
      className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-full max-w-md rounded-[20px] shadow-[var(--shadow-lg)] overflow-hidden"
        style={{ background: 'var(--surface-card)', border: '1px solid var(--border-hairline)' }}
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-5 border-b border-[var(--separator)]">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-[11px] grid place-items-center shrink-0"
              style={{ background: 'var(--accent-tint)' }}
            >
              <Puzzle size={17} style={{ color: 'var(--brand-purple)' }} />
            </div>
            <h2 className="text-[16px] font-bold text-[var(--text-primary)] tracking-[-0.014em]">
              Enable the Spurly extension
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 grid place-items-center rounded-[9px] text-[var(--text-tertiary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-5">
          <p className="text-[13.5px] text-[var(--text-secondary)] leading-relaxed">
            Connection requests are sent by the Spurly Chrome extension running on LinkedIn — so the
            extension needs to be installed and turned on in this browser.
          </p>

          <ol className="mt-4 flex flex-col gap-2.5 text-[13px] text-[var(--text-secondary)]">
            <Step n={1}>Install the Spurly extension (or enable it in <code className="font-mono text-[12px]">chrome://extensions</code>).</Step>
            <Step n={2}>Pin it and make sure you’re signed in to Spurly.</Step>
            <Step n={3}>Come back here and hit “Recheck”.</Step>
          </ol>

          {!checking && installed && !loggedIn && (
            <p
              className="mt-4 text-[12.5px] px-3 py-2.5 rounded-[10px]"
              style={{ background: 'var(--accent-tint)', color: 'var(--brand-purple)' }}
            >
              Detected the extension but you’re not signed in there — open it and log in, then recheck.
            </p>
          )}

          <div className="mt-5 flex items-center justify-end gap-2">
            <a
              href="https://chrome.google.com/webstore/detail/dcohpfeaohfiiinjjiinojlbnnfmihoh"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 h-10 px-4 rounded-[12px] text-[14px] font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] transition-colors"
            >
              <ExternalLink size={15} /> Install
            </a>
            <button
              onClick={onRecheck}
              disabled={checking}
              className="inline-flex items-center gap-1.5 h-10 px-5 rounded-[12px] text-[14px] font-semibold text-white transition-opacity disabled:opacity-60"
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
        className="w-5 h-5 rounded-full grid place-items-center text-[11px] font-bold shrink-0 mt-0.5"
        style={{ background: 'var(--accent-tint)', color: 'var(--brand-purple)' }}
      >
        {n}
      </span>
      <span>{children}</span>
    </li>
  );
}

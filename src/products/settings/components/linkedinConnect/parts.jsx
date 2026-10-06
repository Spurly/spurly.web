import { useEffect, useState } from 'react';
import { AlertCircle, Lock, ShieldCheck, Unlink, Check, Info } from 'lucide-react';
import { LinkedInIcon } from 'src/core/icons';
import { Button } from 'src/core/primitives';

/**
 * Small building blocks shared by the LinkedIn connect dialog's steps.
 * Presentational only — all state lives in useLinkedInConnect.
 */

const STEPS = ['Sign in', 'Verify', 'Connected'];

/** Spurly ↔ LinkedIn, joined by a secured link — what is being connected to what. */
export function BrandBridge({ done = false }) {
  return (
    <div className="flex items-center justify-center gap-2.5" aria-hidden="true">
      <span className="grid place-items-center w-12 h-12 rounded-[var(--ui-radius-lg)] bg-[var(--ui-surface-card)] border border-[var(--ui-border)] shadow-[var(--ui-shadow-sm)]">
        <img src="/spurly-icon-128.png" alt="" width="28" height="28" className="rounded-[var(--ui-radius-sm)]" />
      </span>
      <span className="relative flex items-center w-16">
        <span
          className="w-full border-t-2 border-dashed"
          style={{ borderColor: done ? 'var(--ui-success)' : 'var(--ui-border-strong)' }}
        />
        <span
          className="absolute left-1/2 -translate-x-1/2 grid place-items-center w-6 h-6 rounded-full border"
          style={{
            background: done ? 'var(--ui-success)' : 'var(--ui-surface-card)',
            borderColor: done ? 'var(--ui-success)' : 'var(--ui-border)',
            color: done ? 'var(--ui-text-inverse)' : 'var(--ui-success)',
          }}
        >
          {done ? <Check size={13} strokeWidth={3} /> : <Lock size={12} strokeWidth={2.4} />}
        </span>
      </span>
      <span className="grid place-items-center w-12 h-12 rounded-[var(--ui-radius-lg)] bg-[var(--ui-surface-card)] border border-[var(--ui-border)] shadow-[var(--ui-shadow-sm)]">
        <LinkedInIcon size={28} />
      </span>
    </div>
  );
}

/** Sign in → Verify → Connected. `current` is 0, 1 or 2. */
export function Stepper({ current }) {
  return (
    <ol className="flex items-center justify-center gap-2" aria-label="Progress">
      {STEPS.map((label, i) => {
        const state = i < current ? 'done' : i === current ? 'current' : 'todo';
        return (
          <li key={label} className="flex items-center gap-2" aria-current={state === 'current' ? 'step' : undefined}>
            <span className="flex items-center gap-1.5">
              <span
                className="grid place-items-center w-[18px] h-[18px] rounded-full text-[length:var(--ui-t-micro)] font-semibold"
                style={{
                  background: state === 'todo' ? 'var(--ui-surface-sunken)' : state === 'done' ? 'var(--ui-success)' : 'var(--ui-accent)',
                  color: state === 'todo' ? 'var(--ui-text-tertiary)' : 'var(--ui-text-inverse)',
                }}
              >
                {state === 'done' ? <Check size={11} strokeWidth={3} /> : i + 1}
              </span>
              <span
                className="text-[length:var(--ui-t-label)]"
                style={{
                  color: state === 'todo' ? 'var(--ui-text-tertiary)' : 'var(--ui-text-primary)',
                  fontWeight: state === 'current' ? 'var(--ui-w-medium)' : undefined,
                }}
              >
                {label}
              </span>
            </span>
            {i < STEPS.length - 1 && <span className="w-6 h-px bg-[var(--ui-border-strong)]" aria-hidden="true" />}
          </li>
        );
      })}
    </ol>
  );
}

/** Error or info banner. An error's title says what kind of problem; the message says what to do. */
export function ConnectAlert({ error, offerHosted, onUseHosted, hostedBusy }) {
  if (!error && !offerHosted) return null;
  const tone = error ? 'danger' : 'info';
  return (
    <div
      role={error ? 'alert' : 'status'}
      className="flex gap-2.5 rounded-[var(--ui-radius-md)] border p-3"
      style={{
        background: `var(--ui-${tone}-tint)`,
        borderColor: tone === 'danger' ? 'var(--ui-danger)' : 'var(--ui-border)',
      }}
    >
      {error ? (
        <AlertCircle size={17} className="shrink-0 mt-px" style={{ color: 'var(--ui-danger)' }} />
      ) : (
        <Info size={17} className="shrink-0 mt-px" style={{ color: 'var(--ui-info)' }} />
      )}
      <div className="min-w-0 flex-1 flex flex-col gap-1">
        {error?.title && (
          <p className="text-[length:var(--ui-t-body)] font-medium text-[var(--ui-text-primary)]">{error.title}</p>
        )}
        {error?.message && (
          <p className="text-[length:var(--ui-t-body)] text-[var(--ui-text-secondary)] leading-[1.45]">{error.message}</p>
        )}
        {offerHosted && onUseHosted && (
          <div className="flex flex-wrap items-center gap-2 mt-1">
            {!error && (
              <span className="text-[length:var(--ui-t-body)] text-[var(--ui-text-secondary)]">
                Still having trouble?
              </span>
            )}
            <Button variant="secondary" size="sm" onClick={onUseHosted} disabled={hostedBusy}>
              {hostedBusy ? 'Opening…' : 'Use LinkedIn’s secure sign-in page'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

/** A quiet progress line under the step while a request is in flight. */
export function Working({ title, detail }) {
  return (
    <div role="status" className="flex flex-col gap-2 rounded-[var(--ui-radius-md)] p-3 bg-[var(--ui-accent-tint)]">
      <div className="flex items-center gap-2.5">
        <span
          className="shrink-0 rounded-full border-2 border-[var(--ui-accent)] border-r-transparent animate-spin"
          style={{ width: 16, height: 16 }}
          aria-hidden="true"
        />
        <span className="text-[length:var(--ui-t-body)] font-medium text-[var(--ui-text-primary)]">{title}</span>
      </div>
      {detail && <p className="text-[length:var(--ui-t-label)] text-[var(--ui-text-secondary)] pl-[26px]">{detail}</p>}
    </div>
  );
}

/** The three promises, in one quiet row under the sign-in form. */
export function TrustRow({ secret = 'password' }) {
  const items = [
    { Icon: Lock, text: 'Encrypted' },
    { Icon: ShieldCheck, text: `${secret === 'cookie' ? 'Cookie' : 'Password'} never stored` },
    { Icon: Unlink, text: 'Disconnect any time' },
  ];
  return (
    <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5">
      {items.map(({ Icon, text }) => (
        <li key={text} className="flex items-center gap-1.5 text-[length:var(--ui-t-label)] text-[var(--ui-text-tertiary)]">
          <Icon size={13} style={{ color: 'var(--ui-success)' }} />
          {text}
        </li>
      ))}
    </ul>
  );
}

/** "Expires in 4:12" for an open checkpoint; ticks once a second. */
export function Countdown({ expiresAt }) {
  const target = expiresAt ? new Date(expiresAt).getTime() : null;
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!target) return undefined;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [target]);
  if (!target || Number.isNaN(target)) return null;
  const left = Math.max(0, Math.round((target - now) / 1000));
  const expired = left === 0;
  const text = expired
    ? 'Expired — use a different account to start again'
    : `Expires in ${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-[var(--ui-radius-pill)] px-2.5 py-0.5 text-[length:var(--ui-t-label)]"
      style={{
        background: expired || left < 60 ? 'var(--ui-warning-tint)' : 'var(--ui-surface-sunken)',
        color: expired || left < 60 ? 'var(--ui-warning-fg)' : 'var(--ui-text-secondary)',
      }}
    >
      {text}
    </span>
  );
}

/** Label + control + the field's own error. */
export function FieldShell({ id, label, hint, error, optional = false, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="flex items-center gap-1.5 text-[length:var(--ui-t-body)] font-medium text-[var(--ui-text-primary)]">
          {label}
          {optional && <span className="font-normal text-[var(--ui-text-tertiary)]">Optional</span>}
        </label>
      )}
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-[length:var(--ui-t-label)] text-[var(--ui-danger-fg)]">{error}</p>
      ) : hint ? (
        <p className="text-[length:var(--ui-t-label)] text-[var(--ui-text-tertiary)] leading-[1.45]">{hint}</p>
      ) : null}
    </div>
  );
}

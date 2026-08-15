import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { IconButton } from '../IconButton';

/**
 * Tone → visual treatment.
 *
 * `success` deliberately uses the brand accent rather than green: a success
 * toast is the most-seen toast in the app, so it is the one that should carry
 * the brand. Green is left to `warning`-adjacent semantics where "go / stop"
 * meaning actually matters.
 *
 * `edge` paints a 3px rail down the leading side. It does the tone-signalling
 * at a glance, which means the card itself can stay neutral white and keep the
 * message legible — a fully tinted toast fights its own text.
 */
const TONES = {
  success: {
    Icon: CheckCircle2,
    edge: 'var(--ui-accent)',
    icon: 'var(--ui-accent-dot)',
    tint: 'var(--ui-accent-tint)',
  },
  error: {
    Icon: AlertCircle,
    edge: 'var(--ui-danger)',
    icon: 'var(--ui-danger-dot)',
    tint: 'var(--ui-danger-tint)',
  },
  warning: {
    Icon: AlertTriangle,
    edge: 'var(--ui-warning)',
    icon: 'var(--ui-warning-dot)',
    tint: 'var(--ui-warning-tint)',
  },
  info: {
    Icon: Info,
    edge: 'var(--ui-info-dot)',
    icon: 'var(--ui-info-dot)',
    tint: 'var(--ui-info-tint)',
  },
};

export function Toast({ toast, onDismiss, onPause, onResume }) {
  const { Icon, edge, icon, tint } = TONES[toast.tone] ?? TONES.info;

  return (
    <div
      /* `alert` is assertive and interrupts a screen reader mid-sentence. That
         is right for a failure and wrong for "Saved", so only errors get it. */
      role={toast.tone === 'error' ? 'alert' : 'status'}
      onMouseEnter={onPause}
      onMouseLeave={onResume}
      onFocus={onPause}
      onBlur={onResume}
      className={[
        toast.exiting ? 'sp-toast-exit' : 'sp-toast-enter',
        'pointer-events-auto relative flex items-start gap-2.5',
        'w-max min-w-[280px] max-w-[440px] overflow-hidden',
        'pl-4 pr-2 py-3 rounded-[var(--ui-radius-lg)]',
        'border border-[var(--ui-border)] bg-[var(--ui-surface-card)]',
        'shadow-[var(--ui-shadow-lg)]',
      ].join(' ')}
    >
      {/* Tone rail */}
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-[3px]"
        style={{ backgroundColor: edge }}
      />

      <span
        aria-hidden="true"
        className="shrink-0 grid place-items-center w-5 h-5 rounded-full mt-px"
        style={{ backgroundColor: tint }}
      >
        <Icon size={13} style={{ color: icon }} />
      </span>

      <div className="min-w-0 flex-1 pt-px">
        <p className="text-[13px] font-medium text-[var(--ui-text-primary)] leading-snug">
          {toast.message}
        </p>
        {toast.description && (
          <p className="mt-1 text-[12px] text-[var(--ui-text-secondary)] leading-snug break-words">
            {toast.description}
          </p>
        )}
        {toast.action && (
          <button
            type="button"
            onClick={() => {
              toast.action.onClick?.();
              onDismiss();
            }}
            className="mt-1.5 text-[12px] font-medium text-[var(--ui-accent-fg)] hover:underline focus:outline-none focus-visible:underline"
          >
            {toast.action.label}
          </button>
        )}
      </div>

      <IconButton
        size="sm"
        variant="ghost"
        label="Dismiss"
        icon={<X size={13} />}
        onClick={onDismiss}
        className="shrink-0 -mt-0.5"
      />
    </div>
  );
}

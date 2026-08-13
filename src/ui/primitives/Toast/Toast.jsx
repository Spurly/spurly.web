import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { IconButton } from '../IconButton';

const TONES = {
  success: { Icon: CheckCircle2, color: 'var(--ui-success-dot)' },
  error: { Icon: AlertCircle, color: 'var(--ui-danger-dot)' },
  info: { Icon: Info, color: 'var(--ui-accent-dot)' },
};

export function Toast({ toast, onDismiss, onPause, onResume }) {
  const { Icon, color } = TONES[toast.tone] ?? TONES.info;

  return (
    <div
      role={toast.tone === 'error' ? 'alert' : 'status'}
      onMouseEnter={onPause}
      onMouseLeave={onResume}
      onFocus={onPause}
      onBlur={onResume}
      className="pointer-events-auto flex items-start gap-2.5 w-[320px] px-3 py-2.5 rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-surface-card)] shadow-[var(--ui-shadow-lg)]"
    >
      <Icon size={15} style={{ color }} className="shrink-0 mt-px" aria-hidden="true" />

      <div className="min-w-0 flex-1">
        <p className="text-[13px] text-[var(--ui-text-primary)] leading-snug">{toast.message}</p>
        {toast.description && (
          <p className="mt-0.5 text-[12px] text-[var(--ui-text-secondary)] leading-snug">
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
            className="mt-1.5 text-[12.5px] font-medium text-[var(--ui-accent-fg)] hover:underline focus:outline-none focus-visible:underline"
          >
            {toast.action.label}
          </button>
        )}
      </div>

      <IconButton size="sm" variant="ghost" label="Dismiss" icon={<X size={13} />} onClick={onDismiss} />
    </div>
  );
}

import { AlertTriangle } from 'lucide-react';
import { Button } from 'src/core/primitives';

/**
 * What needs a person, in order of how stuck it is. Each line says what happened and the fix; a failure that can be
 * retried gets a button. Per-account lines name the account, so one capped account never reads as the whole sequence.
 */
export function AttentionBanner({ items, retrying, onRetry }) {
  if (!items.length) return null;
  return (
    <ul className="flex flex-col gap-1.5" aria-label="Needs attention">
      {items.map((item, i) => {
        const key = `${item.kind}:${item.code || item.reason || ''}:${item.sender?.orgAccountId || ''}:${i}`;
        const who = item.sender?.name ? `${item.sender.name}: ` : '';
        let text;
        if (item.kind === 'failed') text = `${item.count} ${item.count === 1 ? 'lead' : 'leads'} failed. ${item.friendly} ${item.action}`;
        else if (item.kind === 'paced') text = `${who}${item.count} ${item.count === 1 ? 'lead is' : 'leads are'} waiting. ${item.text}.`;
        else text = item.text || 'The sequence paused itself.';
        const danger = item.kind === 'failed' || item.kind === 'paused';
        return (
          <li
            key={key}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-[var(--ui-radius-md)] text-[length:var(--ui-t-label)] ${danger ? 'bg-[var(--ui-danger-tint)] text-[var(--ui-danger-fg)]' : 'bg-[var(--ui-warning-tint)] text-[var(--ui-warning-fg)]'}`}
          >
            <AlertTriangle size={14} aria-hidden="true" className="shrink-0" />
            <span className="flex-1 min-w-0">{text}</span>
            {item.kind === 'failed' && item.retryable && (
              <Button size="sm" variant="secondary" disabled={retrying} onClick={() => onRetry({ errorCode: item.code })}>
                Retry {item.count}
              </Button>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export default AttentionBanner;

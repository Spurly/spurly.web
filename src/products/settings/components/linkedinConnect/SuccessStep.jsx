import { CheckCircle2, Inbox, Send, RefreshCw } from 'lucide-react';
import { LinkedInIcon } from 'src/core/icons';

/** Step 3 — connected. Says who, and what happens now. */
export function SuccessStep({ account }) {
  const name = account?.linkedinName;
  const settling = account?.status && account.status !== 'OK';
  const next = [
    { Icon: RefreshCw, text: settling ? 'LinkedIn is finishing setup — this usually takes under a minute.' : 'Your network and inbox are syncing in the background.' },
    { Icon: Send, text: 'Campaigns and sequences can now send from this account.' },
    { Icon: Inbox, text: 'Replies show up in Spurly’s Inbox.' },
  ];
  return (
    <div role="status" className="flex flex-col items-center text-center gap-4 py-2">
      <span className="relative grid place-items-center w-16 h-16 rounded-full bg-[var(--ui-success-tint)]">
        <CheckCircle2 size={34} style={{ color: 'var(--ui-success)' }} />
        <span className="absolute -bottom-1 -right-1 grid place-items-center w-7 h-7 rounded-full bg-[var(--ui-surface-card)] shadow-[var(--ui-shadow-sm)]">
          <LinkedInIcon size={18} />
        </span>
      </span>
      <div className="flex flex-col gap-1">
        <p className="text-[length:var(--ui-t-title)] font-semibold text-[var(--ui-text-primary)]">LinkedIn connected</p>
        <p className="text-[length:var(--ui-t-body)] text-[var(--ui-text-secondary)]">
          {name ? <>Signed in as <span className="font-medium text-[var(--ui-text-primary)]">{name}</span></> : 'Your account is linked to Spurly.'}
        </p>
      </div>
      <ul className="w-full flex flex-col gap-2 text-left rounded-[var(--ui-radius-md)] bg-[var(--ui-surface-sunken)] p-3.5">
        {next.map(({ Icon, text }) => (
          <li key={text} className="flex items-start gap-2.5 text-[length:var(--ui-t-body)] text-[var(--ui-text-secondary)]">
            <Icon size={15} className="shrink-0 mt-0.5" style={{ color: 'var(--ui-text-tertiary)' }} />
            {text}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default SuccessStep;

import { Mail, Lock } from 'lucide-react';
import { Tooltip } from 'src/common/components/Tooltip';

export function EmailCell({ value }) {
  if (!value) {
    return (
      <Tooltip text="Upgrade to our paid plan to unlock email addresses for your leads.">
        <span className="inline-flex items-center gap-1.5 cursor-default">
          <span className="text-[13px]" style={{ color: 'var(--text-tertiary)' }}>Locked</span>
          <Lock size={13} style={{ color: 'var(--text-tertiary)' }} />
        </span>
      </Tooltip>
    );
  }

  return (
    <a
      href={`mailto:${value}`}
      onClick={(e) => e.stopPropagation()}
      className="text-[13px] hover:underline transition inline-flex items-center gap-1"
      style={{ color: 'var(--brand-purple)' }}
    >
      {value}
      <Mail size={13} className="flex-shrink-0" />
    </a>
  );
}

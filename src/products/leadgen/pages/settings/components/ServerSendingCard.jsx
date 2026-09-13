import { Link } from 'react-router-dom';
import { Linkedin } from 'lucide-react';
import { SectionCard } from 'src/ui/primitives/SectionCard';
import { Button } from 'src/ui/primitives';
import { settingsStrings as t } from '../strings.js';

/**
 * The extension is one way Spurly reaches LinkedIn; sending from our servers is
 * the other. This belongs on the Extension tab because that is where a user
 * goes when asking "how does Spurly actually send things".
 *
 * A link rather than an import: the page lives in products/hub, and products
 * never import each other. A route string crosses no module boundary.
 */
export function ServerSendingCard() {
  return (
    <SectionCard title={t.serverSending.sectionTitle}>
      <div className="flex items-center gap-3">
        <span
          className="w-10 h-10 rounded-[var(--ui-radius-lg)] grid place-items-center shrink-0"
          style={{ background: 'var(--ui-surface-sunken)', color: 'var(--ui-text-tertiary)' }}
        >
          <Linkedin size={19} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[var(--ui-t-body)] font-medium text-[var(--ui-text-primary)]">
            {t.serverSending.title}
          </div>
          <p className="text-[var(--ui-t-body)] text-[var(--ui-text-secondary)] mt-0.5">
            {t.serverSending.body}
          </p>
        </div>
        {/* Deliberately status-blind: this card belongs to leadgen and the
            account state belongs to hub, which leadgen may not import. The
            wording reads correctly either way, and the page it links to is
            the one place that knows the truth. */}
        <Link to="/dashboard/settings/linkedin">
          <Button variant="ghost" size="sm">{t.serverSending.manage}</Button>
        </Link>
      </div>
    </SectionCard>
  );
}

export default ServerSendingCard;

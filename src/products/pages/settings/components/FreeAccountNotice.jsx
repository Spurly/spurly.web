import { SectionCard } from 'src/core/primitives/SectionCard';
import { linkedInSettingsStrings as t } from '../strings.js';

/**
 * Free LinkedIn accounts cap connection notes at 200 characters and allow only
 * a handful of personalised invites a month, after which LinkedIn sends the
 * invitation WITHOUT the note and reports nothing. Rather than let campaigns
 * quietly degrade into blank requests, personalised notes are turned off — and
 * the user is told why, before they build a campaign around them.
 */
export function FreeAccountNotice() {
  return (
    <SectionCard title={t.freeAccountNotice.title}>
      <p className="text-[length:var(--ui-t-body)] text-[var(--ui-text-secondary)]">
        {t.freeAccountNotice.paragraph1}
      </p>
      <p className="text-[length:var(--ui-t-body)] text-[var(--ui-text-secondary)] mt-2">
        {t.freeAccountNotice.paragraph2}
      </p>
    </SectionCard>
  );
}

export default FreeAccountNotice;

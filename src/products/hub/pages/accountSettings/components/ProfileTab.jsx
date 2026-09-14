import { User as UserIcon } from 'lucide-react';
import { SectionCard } from 'src/ui/primitives/SectionCard';
import { Field } from 'src/ui/primitives/Field';
import { Button } from 'src/ui/primitives';
import { useProfileTab } from 'src/products/hub/accountSettings/hooks/useProfileTab.js';
import { settingsStrings as t } from '../strings.js';

export function ProfileTab() {
  const { user, name, setName, companyName, setCompanyName, saving, dirty, handleSave } = useProfileTab();

  return (
    <SectionCard title={t.profile.sectionTitle}>
      <form onSubmit={handleSave} className="flex flex-col gap-4 max-w-[420px]">
        <Field
          label={t.profile.nameLabel}
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={saving}
          maxLength={120}
          leadingIcon={<UserIcon size={16} />}
        />

        <Field
          label={t.profile.companyLabel}
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          disabled={saving}
          placeholder={t.profile.companyPlaceholder}
          maxLength={120}
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-[var(--ui-t-body)] font-medium text-[var(--ui-text-primary)] tracking-[-0.006em]">
            {t.profile.emailLabel}
          </label>
          <div
            className="h-8 px-3 flex items-center rounded-[var(--ui-radius-sm)] text-[var(--ui-t-body)] text-[var(--ui-text-secondary)]"
            style={{ background: 'var(--ui-surface-sunken)', border: '1px solid var(--ui-border-hairline)' }}
          >
            {user?.email || '—'}
          </div>
          <p className="text-[var(--ui-t-label)] text-[var(--ui-text-tertiary)]">
            {t.profile.emailHint}
          </p>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <Button type="submit" disabled={!dirty || saving}>
            {saving ? t.profile.saving : t.profile.save}
          </Button>
        </div>
      </form>
    </SectionCard>
  );
}

export default ProfileTab;

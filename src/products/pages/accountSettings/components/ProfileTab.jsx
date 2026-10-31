import { Avatar, Button, Input, SoonTag, SwitchRow } from 'src/core/primitives';
import { SectionCard } from 'src/core/primitives/SectionCard';
import { useProfileTab } from 'src/products/accountSettings/hooks/useProfileTab.js';
import { settingsStrings as t } from '../strings.js';

function FieldLabel({ htmlFor, children }) {
  return (
    <label htmlFor={htmlFor} className="block ui-micro !text-[var(--ui-text-secondary)] mb-[7px]">
      {children}
    </label>
  );
}

/**
 * Account (the handoff's Settings → Account): the profile card — who you
 * are, the fields you can change — and notification preferences, which are
 * drawn but not yet wired (SOON).
 */
export function ProfileTab() {
  const { user, name, setName, companyName, setCompanyName, saving, dirty, handleSave } = useProfileTab();

  return (
    <>
      <SectionCard title={t.profile.sectionTitle}>
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div className="flex items-center gap-3.5">
            <Avatar src={user?.profilePicture || null} name={user?.name || user?.email} size={52} tone="accent" />
            <div className="min-w-0 flex-1">
              <p className="text-[length:var(--ui-t-title)] font-semibold text-[var(--ui-text-primary)] truncate">{user?.name || '—'}</p>
              <p className="font-[family-name:var(--ui-font-mono)] text-[length:var(--ui-t-meta)] text-[var(--ui-text-quaternary)] truncate">
                {user?.email}
                {user?.isAdmin ? ' · admin' : ' · owner'}
              </p>
            </div>
            <Button disabled title="Your photo comes from your sign-in provider for now">
              Change photo <SoonTag className="ml-1" />
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <FieldLabel htmlFor="settings-name">{t.profile.nameLabel}</FieldLabel>
              <Input id="settings-name" fullWidth value={name} onChange={(e) => setName(e.target.value)} disabled={saving} maxLength={120} className="[&>input]:w-full" />
            </div>
            <div>
              <FieldLabel htmlFor="settings-email">{t.profile.emailLabel}</FieldLabel>
              <Input id="settings-email" fullWidth value={user?.email || ''} disabled readOnly className="[&>input]:w-full" />
            </div>
            <div>
              <FieldLabel htmlFor="settings-company">{t.profile.companyLabel}</FieldLabel>
              <Input
                id="settings-company"
                fullWidth
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                disabled={saving}
                placeholder={t.profile.companyPlaceholder}
                maxLength={120}
                className="[&>input]:w-full"
              />
            </div>
          </div>
          <p className="text-[length:var(--ui-t-label)] text-[var(--ui-text-quaternary)]">{t.profile.emailHint}</p>

          <div className="flex items-center gap-3">
            <Button type="submit" variant="primary" disabled={!dirty || saving}>
              {saving ? t.profile.saving : t.profile.save}
            </Button>
          </div>
        </form>
      </SectionCard>

      <SectionCard title={t.notifications.sectionTitle} action={<SoonTag />}>
        <div className="flex flex-col gap-2">
          {t.notifications.items.map((n) => (
            <SwitchRow key={n.title} title={n.title} hint={n.hint} checked={n.on} disabled />
          ))}
        </div>
      </SectionCard>
    </>
  );
}

export default ProfileTab;

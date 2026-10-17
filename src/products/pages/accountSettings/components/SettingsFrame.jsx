import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from 'src/core/layout/DashboardLayout';
import { PageTabs } from 'src/core/primitives';
import { settingsStrings as t } from '../strings.js';

/**
 * Settings — one page, one tab strip (the handoff's Settings screen:
 * Account · LinkedIn · Sending limits · Team · Billing, plus the two tabs
 * Spurly already had: AI context and Extension).
 *
 * LinkedIn keeps its own route (/dashboard/settings/linkedin — the sidebar's
 * LinkedIn row and the OAuth callback both land there), so choosing that
 * tab navigates; every other tab is `?tab=` on /dashboard/settings.
 */
export const SETTINGS_TABS = [
  { id: 'account', label: t.tabs.account },
  { id: 'linkedin', label: t.tabs.linkedin },
  { id: 'limits', label: t.tabs.limits },
  { id: 'ai', label: t.tabs.ai },
  { id: 'assistants', label: t.tabs.assistants },
  { id: 'extension', label: t.tabs.extension },
  { id: 'team', label: t.tabs.team },
  { id: 'billing', label: t.tabs.billing },
];

export function SettingsFrame({ activeTab, children }) {
  const navigate = useNavigate();
  const go = (id) =>
    navigate(id === 'linkedin' ? '/dashboard/settings/linkedin' : id === 'assistants' ? '/dashboard/settings/ai-assistants' : id === 'account' ? '/dashboard/settings' : `/dashboard/settings?tab=${id}`);

  return (
    <DashboardLayout
      title={t.pageTitle}
      subtitle={t.pageSubtitle}
      layout="page"
      tabs={<PageTabs tabs={SETTINGS_TABS} activeTab={activeTab} onTabChange={go} />}
    >
      {/* Two columns once there is room, so the page isn't a narrow strip beside an empty field. */}
      <div className="max-w-[1240px] grid grid-cols-1 min-[1180px]:grid-cols-2 gap-4 items-start pt-1 [&>*:only-child]:min-[1180px]:col-span-2 [&>*:only-child]:max-w-[820px]">
        {children}
      </div>
    </DashboardLayout>
  );
}

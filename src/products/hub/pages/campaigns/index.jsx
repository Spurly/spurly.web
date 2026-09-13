import { useNavigate } from 'react-router-dom';
import { Radar } from 'lucide-react';
import { DashboardLayout } from 'src/platform/layout/DashboardLayout';
import { SectionCard } from 'src/ui/primitives/SectionCard';
import { Button, EmptyState } from 'src/ui/primitives';
import { useCampaigns } from 'src/products/hub/campaigns/hooks/useCampaigns.js';
import { CampaignRow } from './components/CampaignRow.jsx';
import { campaignsStrings } from './strings.js';

export { CampaignDetailPage as HubCampaignDetailPage } from './CampaignDetailPage.jsx';

const t = campaignsStrings.list;

/**
 * Hub campaigns — the list.
 *
 * Campaigns are made from the leads page, not from here: an outreach campaign
 * with nobody in it is a row that can only disappoint, and the audience is the
 * decision that matters. So this page has no "New campaign" button and says
 * where to start instead.
 */
export function HubCampaignsPage() {
  const { campaigns, loading, busy, start, pause, remove } = useCampaigns();
  const navigate = useNavigate();

  return (
    <DashboardLayout title={t.pageTitle} subtitle={t.pageSubtitle}>
      {!loading && campaigns.length === 0 ? (
        <EmptyState
          icon={<Radar size={20} />}
          title={t.emptyTitle}
          hint={t.emptyHint}
          action={<Button onClick={() => navigate('/hub/leads')}>{t.goToLeads}</Button>}
        />
      ) : (
        <SectionCard title={t.sectionTitle} noPadding>
          {loading ? (
            <p className="px-[var(--ui-pad-lg)] py-6 text-[var(--ui-t-body)] text-[var(--ui-text-tertiary)]">{t.loading}</p>
          ) : (
            campaigns.map((campaign) => (
              <CampaignRow
                key={campaign._id}
                campaign={campaign}
                onStart={start}
                onPause={pause}
                onDelete={remove}
                busy={busy}
              />
            ))
          )}
        </SectionCard>
      )}
    </DashboardLayout>
  );
}

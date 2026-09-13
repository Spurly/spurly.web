import { useNavigate } from 'react-router-dom';
import { Radar } from 'lucide-react';
import { DashboardLayout } from 'src/platform/layout/DashboardLayout';
import { SectionCard } from 'src/ui/primitives/SectionCard';
import { Button, EmptyState } from 'src/ui/primitives';
import { useCampaigns } from 'src/products/hub/campaigns/hooks/useCampaigns.js';
import { CampaignRow } from './components/CampaignRow.jsx';

export { CampaignDetailPage as HubCampaignDetailPage } from './CampaignDetailPage.jsx';

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
    <DashboardLayout
      title="Campaigns"
      subtitle="Connection requests, sent from our servers on a human schedule."
    >
      {!loading && campaigns.length === 0 ? (
        <EmptyState
          icon={<Radar size={20} />}
          title="No campaigns yet"
          hint="Campaigns are built from your leads. Pick the people you want to reach, then create one from the selection."
          action={<Button onClick={() => navigate('/hub/leads')}>Go to leads</Button>}
        />
      ) : (
        <SectionCard title="Campaigns" noPadding>
          {loading ? (
            <p className="px-[var(--ui-pad-lg)] py-6 text-[var(--ui-t-body)] text-[var(--ui-text-tertiary)]">Loading…</p>
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

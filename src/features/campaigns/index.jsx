import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from 'src/components/DashboardLayout';
import { DataTable } from 'src/components/DataTable';
import campaignsController from 'src/core/controllers/campaignsController.js';
import { useCampaigns } from 'src/hooks/useCampaigns';
import { buildCampaignColumns } from './columns.jsx';

export function CampaignsPage() {
  const navigate = useNavigate();
  const { campaigns, loading, error, refresh } = useCampaigns();
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState(null); // campaign pending delete confirm

  const handleDelete = async (campaign) => {
    // Simple confirm — campaigns are cheap to recreate from People.
    if (!window.confirm(`Delete campaign "${campaign.name}"? This removes the campaign and its enrolled leads.`)) {
      return;
    }
    setDeleting(campaign._id);
    try {
      await campaignsController.deleteCampaign(campaign._id);
      await refresh();
    } catch (e) {
      console.error('[Campaigns] Delete error:', e);
    } finally {
      setDeleting(null);
    }
  };

  const columns = useMemo(() => buildCampaignColumns(handleDelete), []); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return campaigns;
    return campaigns.filter((c) => (c.name || '').toLowerCase().includes(q));
  }, [campaigns, search]);

  return (
    <DashboardLayout
      title="Campaigns"
      subtitle="Outreach campaigns built from your captured People."
    >
      <div className="relative flex flex-col h-full overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <DataTable
            columns={columns}
            data={filtered}
            rowKey={(row) => row._id}
            loading={loading}
            error={error}
            onRowClick={(row) => navigate(`/dashboard/campaigns/${row._id}`)}
            emptyMessage={search ? 'No campaigns match your search' : 'No campaigns yet'}
            emptyHint={
              search
                ? 'Try a different search term'
                : 'Select people on the People tab and click “Create campaign” to get started.'
            }
            toolbar={{
              searchValue: search,
              onSearch: setSearch,
              searchPlaceholder: 'Search a campaign...',
            }}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}

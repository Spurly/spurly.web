import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from 'src/platform/layout/DashboardLayout';
import { DataTable } from 'src/ui/DataTable';
import campaignsController from 'src/products/leadgen/campaigns/controller.js';
import { useCampaigns } from 'src/products/leadgen/campaigns/useCampaigns';
import { useToast, useConfirm } from 'src/ui/primitives';
import { getToastError } from 'src/shared/utils/apiError';
import { buildCampaignColumns } from './columns.jsx';

export function CampaignsPage() {
  const navigate = useNavigate();
  const { campaigns, loading, error, refresh } = useCampaigns();
  const toast = useToast();
  const confirm = useConfirm();
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState(null); // campaign pending delete confirm

  const handleDelete = async (campaign) => {
    // Confirmed rather than undoable — campaigns are cheap to recreate from
    // People, so a prompt costs less than building an undo path.
    const ok = await confirm({
      title: `Delete campaign "${campaign.name}"?`,
      description: 'This removes the campaign and its enrolled leads.',
      confirmLabel: 'Delete campaign',
    });
    if (!ok) return;
    setDeleting(campaign._id);
    try {
      await campaignsController.deleteCampaign(campaign._id);
      await refresh();
      toast.success(`Deleted "${campaign.name}"`);
    } catch (e) {
      console.error('[Campaigns] Delete error:', e);
      toast.error(getToastError(e, "Couldn't delete the campaign"));
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
      subtitle="Outreach campaigns built from your captured Contacts."
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
                : 'Select people on the Contacts tab and click “Create campaign” to get started.'
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

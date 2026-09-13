import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from 'src/platform/layout/DashboardLayout';
import { DataTable } from 'src/platform/DataTable';
import campaignsController from 'src/products/leadgen/campaigns/controller/campaigns.js';
import { useCampaigns } from 'src/products/leadgen/campaigns/hooks/useCampaigns.js';
import { useToast, useConfirm } from 'src/ui/primitives';
import { getToastError } from 'src/shared/utils/apiError';
import { buildCampaignColumns } from './components/columns.jsx';
import { campaignsStrings as t } from './strings.js';

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
      description: t.confirmDelete.description,
      confirmLabel: t.confirmDelete.confirmLabel,
    });
    if (!ok) return;
    setDeleting(campaign._id);
    try {
      await campaignsController.deleteCampaign(campaign._id);
      await refresh();
      toast.success(`Deleted "${campaign.name}"`);
    } catch (e) {
      console.error('[Campaigns] Delete error:', e);
      toast.error(getToastError(e, t.deleteErrorFallback));
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
    <DashboardLayout title={t.pageTitle} subtitle={t.pageSubtitle}>
      <div className="relative flex flex-col h-full overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <DataTable
            columns={columns}
            data={filtered}
            rowKey={(row) => row._id}
            loading={loading}
            error={error}
            onRowClick={(row) => navigate(`/dashboard/campaigns/${row._id}`)}
            emptyMessage={search ? t.emptySearch : t.emptyAll}
            emptyHint={search ? t.emptySearchHint : t.emptyAllHint}
            toolbar={{
              searchValue: search,
              onSearch: setSearch,
              searchPlaceholder: t.searchPlaceholder,
            }}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}

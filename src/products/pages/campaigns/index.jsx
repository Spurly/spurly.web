import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Radar } from 'lucide-react';
import { DashboardLayout } from 'src/core/layout/DashboardLayout';
import { DataTable, sortRows, filterRows } from 'src/core/DataTable';
import { Button, EmptyState } from 'src/core/primitives';
import { useCampaigns } from 'src/products/campaigns/hooks/useCampaigns.js';
import { hubCampaignListColumns } from './components/listColumns.jsx';
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
 *
 * A DataTable rather than a card of hand-rolled rows. The rows carried name,
 * counts and status in the same three places a table puts them, and the table
 * brings the loading skeleton, the fixed column widths and the row-click
 * target with it — all three of which the card was doing by hand or not at
 * all. The page title already says "Campaigns"; the card's own header said it
 * a second time, and has gone with the card.
 */
export function HubCampaignsPage() {
  const { campaigns, loading, busy, start, pause, remove } = useCampaigns();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState({ key: null, direction: null });

  const columns = useMemo(
    () => hubCampaignListColumns({ onStart: start, onPause: pause, onDelete: remove, busy }),
    // `start`/`pause`/`remove` are rebuilt every render by the hook; depending
    // on them would rebuild the columns every render too, and the table would
    // lose its column-order state on each one. `busy` is the only value in
    // here a column actually reads.
    [busy], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const visibleCampaigns = useMemo(() => {
    const filtered = filterRows(campaigns, search, ['name']);
    return sortRows(filtered, sort, { counts: (row) => row.counts?.total ?? 0 });
  }, [campaigns, search, sort]);

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
        <DataTable
          columns={columns}
          data={visibleCampaigns}
          rowKey={(row) => row._id}
          loading={loading}
          onRowClick={(row) => navigate(`/hub/campaigns/${row._id}`)}
          emptyMessage={search ? 'No campaigns match your search' : t.emptyTitle}
          emptyHint={search ? 'Try a different search term' : t.emptyHint}
          reorderable
          sort={sort}
          onSortChange={setSort}
          toolbar={{
            searchValue: search,
            onSearch: setSearch,
            searchPlaceholder: 'Search campaigns by name...',
          }}
        />
      )}
    </DashboardLayout>
  );
}

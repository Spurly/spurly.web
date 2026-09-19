import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusIcon, SequenceIcon } from 'src/core/icons';
import { DashboardLayout } from 'src/core/layout/DashboardLayout';
import { DataTable, sortRows, filterRows } from 'src/core/DataTable';
import { Button, FilterPills } from 'src/core/primitives';
import { useSequencesPage } from 'src/products/sequences/hooks/useSequencesPage.js';
import { hubSequenceListColumns } from './components/listColumns.jsx';
import { sequencesStrings } from './strings.js';

export { NewSequencePage as HubNewSequencePage } from './NewSequencePage.jsx';
export { SequenceDetailPage as HubSequenceDetailPage } from './SequenceDetailPage.jsx';

const t = sequencesStrings.list;

/**
 * Hub sequences — the list.
 *
 * Unlike campaigns (built from a lead selection, so the list page has no
 * "New" button), a sequence needs at least one configured step before the
 * backend will save it at all — there is nothing to select first, so this
 * page does carry a "New sequence" button, straight into the step builder.
 *
 * A DataTable, for the reasons written on the campaigns list — these two pages
 * are the same page with different nouns and they should not drift again.
 */
export function HubSequencesPage() {
  const { sequences, loading, busy, start, pause, remove } = useSequencesPage();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState({ key: null, direction: null });

  const columns = useMemo(
    () => hubSequenceListColumns({ onStart: start, onPause: pause, onDelete: remove, busy }),
    [busy], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const visibleSequences = useMemo(() => {
    const filtered = filterRows(sequences, search, ['name']);
    return sortRows(filtered, sort, { steps: (row) => row.steps?.length ?? 0 });
  }, [sequences, search, sort]);

  const [status, setStatus] = useState('all');
  const byStatus = status === 'all' ? visibleSequences : visibleSequences.filter((q) => q.status === status);
  const countOf = (id) => sequences.filter((q) => q.status === id).length;

  return (
    <DashboardLayout
      title={t.pageTitle}
      subtitle={t.pageSubtitle}
      actions={
        <Button variant="primary" leadingIcon={<PlusIcon size={14} strokeWidth={2} />} onClick={() => navigate('/hub/sequences/new')}>
          {t.newSequence}
        </Button>
      }
    >
      <DataTable
        columns={columns}
        data={byStatus}
        rowKey={(row) => row._id}
        loading={loading}
        onRowClick={(row) => navigate(`/hub/sequences/${row._id}`)}
        emptyIcon={<SequenceIcon size={22} strokeWidth={1.6} />}
        emptyMessage={search || status !== 'all' ? 'No sequences match' : t.emptyTitle}
        emptyHint={search || status !== 'all' ? 'Try a different search or filter.' : t.emptyHint}
        emptyAction={
          !search && status === 'all' ? (
            <Button variant="primary" onClick={() => navigate('/hub/sequences/new')}>
              {t.newSequence}
            </Button>
          ) : null
        }
        reorderable
        sort={sort}
        onSortChange={setSort}
        toolbar={{
          searchValue: search,
          onSearch: setSearch,
          searchPlaceholder: 'Search sequences by name',
          chips: (
            <FilterPills
              size="sm"
              ariaLabel="Filter sequences by status"
              value={status}
              onChange={setStatus}
              options={[
                { id: 'all', label: 'All', count: sequences.length },
                { id: 'running', label: 'Live', count: countOf('running') },
                { id: 'paused', label: 'Paused', count: countOf('paused') },
                { id: 'draft', label: 'Draft', count: countOf('draft') },
                { id: 'done', label: 'Finished', count: countOf('done') },
              ].filter((o) => o.id === 'all' || o.count > 0)}
            />
          ),
        }}
      />
    </DashboardLayout>
  );
}

export default HubSequencesPage;

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Workflow } from 'lucide-react';
import { DashboardLayout } from 'src/core/layout/DashboardLayout';
import { DataTable, sortRows, filterRows } from 'src/core/DataTable';
import { Button, EmptyState } from 'src/core/primitives';
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

  return (
    <DashboardLayout
      title={t.pageTitle}
      subtitle={t.pageSubtitle}
      actions={<Button leadingIcon={<Plus size={13} />} onClick={() => navigate('/hub/sequences/new')}>{t.newSequence}</Button>}
    >
      {!loading && sequences.length === 0 ? (
        <EmptyState
          icon={<Workflow size={20} />}
          title={t.emptyTitle}
          hint={t.emptyHint}
          action={<Button onClick={() => navigate('/hub/sequences/new')}>{t.newSequence}</Button>}
        />
      ) : (
        <DataTable
          columns={columns}
          data={visibleSequences}
          rowKey={(row) => row._id}
          loading={loading}
          onRowClick={(row) => navigate(`/hub/sequences/${row._id}`)}
          emptyMessage={search ? 'No sequences match your search' : t.emptyTitle}
          emptyHint={search ? 'Try a different search term' : t.emptyHint}
          reorderable
          sort={sort}
          onSortChange={setSort}
          toolbar={{
            searchValue: search,
            onSearch: setSearch,
            searchPlaceholder: 'Search sequences by name...',
          }}
        />
      )}
    </DashboardLayout>
  );
}

export default HubSequencesPage;

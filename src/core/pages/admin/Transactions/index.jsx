import { useState, useEffect, useCallback, useMemo } from 'react';
import EventEmitter from 'src/shared/utils/EventEmitter.js';
import adminController from 'src/core/admin/controller/admin.js';
import { ADMIN_EVENTS } from 'src/core/admin/constants/constants.js';
import { AdminLayout } from 'src/core/pages/admin/components/AdminLayout';
import { DataTable } from 'src/core/DataTable';
import { Dropdown } from 'src/core/primitives/Dropdown';
import { useToast } from 'src/core/primitives';
import { getToastError, getApiErrorMessage } from 'src/shared/utils/apiError';
import { transactionColumns } from './transactionColumns.jsx';

const TYPE_OPTIONS = [
  ['', 'All types'],
  ['DEDUCTION', 'Deduction'],
  ['CREDIT', 'Credit'],
  ['ADMIN_ADJUSTMENT', 'Admin Adjustment'],
];

/**
 * `adminController` reports back over `eventEmitter` instead of
 * returning/throwing, so this page has no async/await or try/catch of its
 * own.
 */
export function AdminTransactionsPage() {
  const toast = useToast();
  const eventEmitter = useMemo(() => new EventEmitter(), []);

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({ total: 0, limit: 50, skip: 0, pages: 0 });
  const [filterType, setFilterType] = useState('');

  // Declared above the effect that calls it, same reasoning as before: a
  // `const` referenced before its declaration is a temporal-dead-zone
  // hazard the moment anything calls it earlier, and it blocks the React
  // Compiler from optimising the component.
  const fetchTransactions = useCallback(() => {
    setLoading(true);
    setError('');
    adminController.getTransactions(eventEmitter, pagination.limit, pagination.skip, filterType || null);
  }, [eventEmitter, pagination.limit, pagination.skip, filterType]);

  useEffect(() => {
    function handleSuccess(data) {
      setTransactions(data.transactions);
      setPagination(data.pagination);
      setLoading(false);
    }
    function handleFailure(err) {
      setError(getApiErrorMessage(err, 'Failed to load transactions'));
      toast.error(getToastError(err, "Couldn't load transactions"));
      setLoading(false);
    }

    eventEmitter.on(ADMIN_EVENTS.GET_TRANSACTIONS_SUCCESS, handleSuccess);
    eventEmitter.on(ADMIN_EVENTS.GET_TRANSACTIONS_FAILURE, handleFailure);
    return () => {
      eventEmitter.off(ADMIN_EVENTS.GET_TRANSACTIONS_SUCCESS, handleSuccess);
      eventEmitter.off(ADMIN_EVENTS.GET_TRANSACTIONS_FAILURE, handleFailure);
    };
  }, [eventEmitter, toast]);

  useEffect(() => {
    fetchTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.skip, filterType]);

  const currentPage = Math.floor(pagination.skip / pagination.limit) + 1;

  return (
    <AdminLayout title="Transactions" subtitle="All credit movements across accounts">
      <div className="space-y-6">
        {error && (
          <div
            className="p-3 rounded-[var(--ui-radius-lg)] text-[var(--ui-t-body)] font-medium"
            style={{
              background: 'var(--ui-danger-tint)',
              color: 'var(--ui-danger)',
              border: '1px solid rgba(255,69,58,0.2)',
            }}
          >
            {error}
          </div>
        )}

        <div className="rounded-[var(--ui-radius-lg)] border border-[var(--ui-border-hairline)] overflow-hidden shadow-sm">
          <DataTable
            columns={transactionColumns}
            data={transactions}
            rowKey={(row) => row._id}
            loading={loading}
            emptyMessage="No transactions found"
            toolbar={{
              filters: (
                <div className="w-56">
                  <Dropdown
                    id="tx-type-filter"
                    variant="dashboard"
                    value={filterType}
                    onChange={(val) => {
                      setFilterType(val);
                      setPagination((prev) => ({ ...prev, skip: 0 }));
                    }}
                    placeholder="Filter by type"
                    options={TYPE_OPTIONS}
                  />
                </div>
              ),
            }}
            pagination={{
              page: currentPage,
              pageSize: pagination.limit,
              total: pagination.total,
              onPageChange: (p) =>
                setPagination((prev) => ({ ...prev, skip: Math.max(0, (p - 1) * prev.limit) })),
            }}
          />
        </div>
      </div>
    </AdminLayout>
  );
}

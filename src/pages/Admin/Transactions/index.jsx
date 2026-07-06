import { useState, useEffect } from 'react';
import { getTransactions } from 'src/core/gateway/adminApi';
import { AdminLayout } from 'src/admin/AdminLayout';
import { DataTable } from 'src/common/components/DataTable';
import { Dropdown } from 'src/common/components/Dropdown';
import { transactionColumns } from './transactionColumns.jsx';

const TYPE_OPTIONS = [
  ['', 'All types'],
  ['DEDUCTION', 'Deduction'],
  ['CREDIT', 'Credit'],
  ['ADMIN_ADJUSTMENT', 'Admin Adjustment'],
];

export function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({ total: 0, limit: 50, skip: 0, pages: 0 });
  const [filterType, setFilterType] = useState('');

  useEffect(() => {
    fetchTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.skip, filterType]);

  const fetchTransactions = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await getTransactions(pagination.limit, pagination.skip, filterType || null);
      if (result.success) {
        setTransactions(result.data.transactions);
        setPagination(result.data.pagination);
      } else {
        setError(result.message || 'Failed to load transactions');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const currentPage = Math.floor(pagination.skip / pagination.limit) + 1;

  return (
    <AdminLayout title="Transactions" subtitle="All credit movements across accounts">
      <div className="space-y-6">
        {error && (
          <div
            className="p-3 rounded-[12px] text-[13px] font-medium"
            style={{
              background: 'var(--red-tint)',
              color: 'var(--red)',
              border: '1px solid rgba(255,69,58,0.2)',
            }}
          >
            {error}
          </div>
        )}

        <div className="rounded-[16px] border border-[var(--border-hairline)] overflow-hidden shadow-sm">
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

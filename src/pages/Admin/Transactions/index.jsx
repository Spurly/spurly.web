import { useState, useEffect } from 'react';
import { getTransactions } from 'src/core/gateway/adminApi';
import { ChevronLeft, ChevronRight, Loader, Filter } from 'lucide-react';
import { AdminLayout } from 'src/admin/AdminLayout';

export function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({ total: 0, limit: 50, skip: 0, pages: 0 });
  const [filterType, setFilterType] = useState(null);
  const [refreshTrigger] = useState(0);

  useEffect(() => {
    fetchTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.skip, filterType, refreshTrigger]);

  const fetchTransactions = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await getTransactions(pagination.limit, pagination.skip, filterType);
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

  const handlePreviousPage = () => {
    if (pagination.skip > 0) {
      setPagination((prev) => ({ ...prev, skip: Math.max(0, prev.skip - prev.limit) }));
    }
  };

  const handleNextPage = () => {
    if (pagination.skip + pagination.limit < pagination.total) {
      setPagination((prev) => ({ ...prev, skip: prev.skip + prev.limit }));
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'DEDUCTION':
        return 'bg-red-100 text-red-800';
      case 'CREDIT':
        return 'bg-green-100 text-green-800';
      case 'ADMIN_ADJUSTMENT':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getFeatureColor = (feature) => {
    switch (feature) {
      case 'PROFILE_CARD':
        return 'bg-purple-100 text-purple-800';
      case 'PROFILE_DETAILS':
        return 'bg-indigo-100 text-indigo-800';
      case 'ADMIN_CREDIT':
        return 'bg-teal-100 text-teal-800';
      case 'MANUAL_ADJUSTMENT':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <AdminLayout title="Transactions" subtitle="All credit movements across accounts">
      <div className="space-y-6">
        {/* Filter Bar */}
        <div className="card">
          <div className="flex items-center gap-4">
            <Filter size={20} className="text-gray-600" />
            <label className="text-sm font-medium text-gray-700">Filter by Type:</label>
            <select
              value={filterType || ''}
              onChange={(e) => {
                setFilterType(e.target.value || null);
                setPagination((prev) => ({ ...prev, skip: 0 }));
              }}
              className="input py-2"
              style={{ width: 'auto' }}
            >
              <option value="">All Types</option>
              <option value="DEDUCTION">Deduction</option>
              <option value="CREDIT">Credit</option>
              <option value="ADMIN_ADJUSTMENT">Admin Adjustment</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <div className="card overflow-hidden" style={{ padding: 0 }}>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="animate-spin text-primary" size={32} />
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No transactions found</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>User</th>
                      <th>Type</th>
                      <th>Feature</th>
                      <th>Amount</th>
                      <th>Balance Before</th>
                      <th>Balance After</th>
                      <th>Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => (
                      <tr key={tx._id}>
                        <td className="text-sm text-gray-600">
                          {new Date(tx.createdAt).toLocaleDateString()}{' '}
                          {new Date(tx.createdAt).toLocaleTimeString()}
                        </td>
                        <td>
                          <div className="text-sm">
                            <p className="font-medium text-gray-900">
                              {tx.userId?.name || 'Unknown'}
                            </p>
                            <p className="text-gray-600">{tx.userId?.email}</p>
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${getTypeColor(tx.type)} text-xs`}>
                            {tx.type}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${getFeatureColor(tx.feature)} text-xs`}>
                            {tx.feature}
                          </span>
                        </td>
                        <td className="font-semibold">
                          <span
                            className={tx.type === 'DEDUCTION' ? 'text-red-600' : 'text-green-600'}
                          >
                            {tx.type === 'DEDUCTION' ? '-' : '+'}
                            {tx.amount.toFixed(1)}
                          </span>
                        </td>
                        <td className="text-gray-600">{tx.balanceBefore.toFixed(1)}</td>
                        <td className="text-gray-600">{tx.balanceAfter.toFixed(1)}</td>
                        <td className="text-sm text-gray-600">{tx.reason || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {pagination.skip + 1} to{' '}
                  {Math.min(pagination.skip + pagination.limit, pagination.total)} of{' '}
                  {pagination.total} transactions
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handlePreviousPage}
                    disabled={pagination.skip === 0}
                    className="btn btn-secondary py-2 px-4 flex items-center gap-2"
                  >
                    <ChevronLeft size={18} />
                    Previous
                  </button>
                  <button
                    onClick={handleNextPage}
                    disabled={pagination.skip + pagination.limit >= pagination.total}
                    className="btn btn-secondary py-2 px-4 flex items-center gap-2"
                  >
                    Next
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

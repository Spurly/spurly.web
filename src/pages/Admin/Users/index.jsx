import { useState, useEffect } from 'react';
import { getAllUsers } from 'src/core/gateway/adminApi';
import { Search, ChevronLeft, ChevronRight, Loader, RefreshCw } from 'lucide-react';
import { AdminLayout } from 'src/admin/AdminLayout';
import CreditsModal from 'src/pages/Admin/components/CreditsModal';

export function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({ total: 0, limit: 20, skip: 0, pages: 0 });
  const [selectedUser, setSelectedUser] = useState(null);
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.skip, refreshTrigger]);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await getAllUsers(pagination.limit, pagination.skip);
      if (result.success) {
        setUsers(result.data.users);
        setPagination(result.data.pagination);
      } else {
        setError(result.message || 'Failed to load users');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCreditsClick = (user) => {
    setSelectedUser(user);
    setShowCreditsModal(true);
  };

  const handleCreditsSuccess = () => {
    setShowCreditsModal(false);
    setSelectedUser(null);
    setRefreshTrigger((prev) => prev + 1);
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

  const filteredUsers = searchTerm
    ? users.filter((u) => {
        const q = searchTerm.toLowerCase();
        return (
          u.email?.toLowerCase().includes(q) || u.name?.toLowerCase().includes(q)
        );
      })
    : users;

  return (
    <AdminLayout title="Users" subtitle="Manage user credit balances">
      <div className="space-y-6">
        {/* Search Bar and Refresh Button */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by email or name (current page)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10 py-3 w-full"
            />
          </div>
          <button
            onClick={() => setRefreshTrigger((prev) => prev + 1)}
            disabled={loading}
            className="btn btn-secondary py-3 px-4 flex items-center gap-2"
            title="Refresh user list"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
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
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No users found</div>
          ) : (
            <>
              <table className="table w-full">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Name</th>
                    <th>Credit Balance</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user._id}>
                      <td className="font-medium text-gray-900">{user.email}</td>
                      <td className="text-gray-700">{user.name}</td>
                      <td>
                        <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                          {user.creditBalance?.toFixed(1) || 0}
                        </span>
                      </td>
                      <td className="text-gray-600 text-sm">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td>
                        <button
                          onClick={() => handleCreditsClick(user)}
                          className="btn btn-primary py-1 px-3 text-sm"
                        >
                          Manage Credits
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {pagination.skip + 1} to{' '}
                  {Math.min(pagination.skip + pagination.limit, pagination.total)} of{' '}
                  {pagination.total} users
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

        {showCreditsModal && selectedUser && (
          <CreditsModal
            user={selectedUser}
            onClose={() => setShowCreditsModal(false)}
            onSuccess={handleCreditsSuccess}
          />
        )}
      </div>
    </AdminLayout>
  );
}

import { useState, useEffect } from 'react';
import { getAllUsers } from 'src/core/gateway/adminApi';
import { RefreshCw } from 'lucide-react';
import { AdminLayout } from 'src/admin/AdminLayout';
import { DataTable } from 'src/common/components/DataTable';
import { Button } from 'src/common/components/Button';
import CreditsModal from 'src/pages/Admin/components/CreditsModal';
import PlanAssignModal from 'src/pages/Admin/components/PlanAssignModal';
import { buildUserColumns } from './userColumns.jsx';

export function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({ total: 0, limit: 20, skip: 0, pages: 0 });
  const [selectedUser, setSelectedUser] = useState(null);
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
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

  const handlePlanClick = (user) => {
    setSelectedUser(user);
    setShowPlanModal(true);
  };

  const handlePlanSuccess = () => {
    setShowPlanModal(false);
    setSelectedUser(null);
    setRefreshTrigger((prev) => prev + 1);
  };

  const filteredUsers = searchTerm
    ? users.filter((u) => {
        const q = searchTerm.toLowerCase();
        return u.email?.toLowerCase().includes(q) || u.name?.toLowerCase().includes(q);
      })
    : users;

  const columns = buildUserColumns({
    onManageCredits: handleCreditsClick,
    onManagePlan: handlePlanClick,
  });

  const currentPage = Math.floor(pagination.skip / pagination.limit) + 1;

  return (
    <AdminLayout title="Users" subtitle="Manage user plans & credit balances">
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
            columns={columns}
            data={filteredUsers}
            rowKey={(row) => row._id}
            loading={loading}
            emptyMessage={searchTerm ? 'No users match your search' : 'No users found'}
            emptyHint={searchTerm ? 'Try a different search term' : undefined}
            toolbar={{
              searchValue: searchTerm,
              onSearch: setSearchTerm,
              searchPlaceholder: 'Search by email or name (current page)...',
              actions: (
                <Button
                  variant="secondary"
                  size="sm"
                  leadingIcon={<RefreshCw size={15} className={loading ? 'animate-spin' : ''} />}
                  onClick={() => setRefreshTrigger((prev) => prev + 1)}
                  disabled={loading}
                >
                  Refresh
                </Button>
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

        {showCreditsModal && selectedUser && (
          <CreditsModal
            user={selectedUser}
            onClose={() => setShowCreditsModal(false)}
            onSuccess={handleCreditsSuccess}
          />
        )}

        {showPlanModal && selectedUser && (
          <PlanAssignModal
            user={selectedUser}
            onClose={() => setShowPlanModal(false)}
            onSuccess={handlePlanSuccess}
          />
        )}
      </div>
    </AdminLayout>
  );
}

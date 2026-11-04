import { useState, useEffect, useCallback, useMemo } from 'react';
import EventEmitter from 'src/shared/utils/EventEmitter.js';
import adminController from 'src/core/admin/controller/admin.js';
import { ADMIN_EVENTS } from 'src/core/admin/constants/constants.js';
import { AdminLayout } from 'src/core/pages/admin/components/AdminLayout';
import { DataTable } from 'src/core/DataTable';
import { Dropdown } from 'src/core/primitives/Dropdown';
import { useToast } from 'src/core/primitives';
import { getToastError, getApiErrorMessage } from 'src/shared/utils/apiError';
import { orgColumns } from './orgColumns.jsx';
import { OrgDrawer } from './OrgDrawer.jsx';

const STATUS_OPTIONS = [
  ['', 'All organizations'],
  ['active', 'Active'],
  ['suspended', 'Suspended'],
];

const PAGE_SIZE = 20;

/**
 * Admin -> Orgs: every organization with its partner, how many LinkedIn
 * accounts are connected now and the 30-day peak. Click a row for members,
 * accounts and suspend / resume. No async/await or try/catch here; the
 * controller reports over `eventEmitter`.
 */
export function AdminOrgsPage() {
  const toast = useToast();
  const eventEmitter = useMemo(() => new EventEmitter(), []);
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [openId, setOpenId] = useState(null);

  const fetchOrgs = useCallback(() => {
    setLoading(true);
    setError('');
    adminController.getOrgs(eventEmitter, { page, limit: PAGE_SIZE, status, q: search });
  }, [eventEmitter, page, status, search]);

  useEffect(() => {
    function handleSuccess(data) {
      setOrgs(data.items || []);
      setTotal(data.total || 0);
      setLoading(false);
    }
    function handleFailure(err) {
      setError(getApiErrorMessage(err, 'Failed to load organizations'));
      toast.error(getToastError(err, "Couldn't load organizations"));
      setLoading(false);
    }
    eventEmitter.on(ADMIN_EVENTS.GET_ORGS_SUCCESS, handleSuccess);
    eventEmitter.on(ADMIN_EVENTS.GET_ORGS_FAILURE, handleFailure);
    return () => {
      eventEmitter.off(ADMIN_EVENTS.GET_ORGS_SUCCESS, handleSuccess);
      eventEmitter.off(ADMIN_EVENTS.GET_ORGS_FAILURE, handleFailure);
    };
  }, [eventEmitter, toast]);

  useEffect(() => {
    fetchOrgs();
  }, [fetchOrgs]);

  const handleSearch = useCallback((value) => {
    setPage(1);
    setSearch(value);
  }, []);

  return (
    <AdminLayout title="Organizations" subtitle="LinkedIn accounts connected per organization" layout="card">
      <DataTable
        columns={orgColumns}
        data={orgs}
        loading={loading}
        error={error}
        onRowClick={(row) => setOpenId(row.id)}
        emptyMessage={search || status ? 'No organizations match your filters' : 'No organizations yet'}
        emptyHint="Organizations appear here when a partner creates one."
        toolbar={{
          searchValue: search,
          onSearch: handleSearch,
          searchPlaceholder: 'Search org id or name',
          filters: (
            <div className="w-48">
              <Dropdown
                id="org-status-filter"
                variant="dashboard"
                value={status}
                onChange={(value) => {
                  setPage(1);
                  setStatus(value);
                }}
                options={STATUS_OPTIONS}
              />
            </div>
          ),
        }}
        pagination={{ page, pageSize: PAGE_SIZE, total, onPageChange: setPage }}
      />
      <OrgDrawer orgId={openId} onClose={() => setOpenId(null)} onChanged={fetchOrgs} />
    </AdminLayout>
  );
}

export default AdminOrgsPage;

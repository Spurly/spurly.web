import { useState, useEffect } from 'react';
import { Search, AlertTriangle } from 'lucide-react';
import { getPayments } from 'src/platform/admin/api';
import { AdminLayout } from 'src/platform/admin/AdminLayout';
import { DataTable } from 'src/platform/DataTable';
import { Dropdown } from 'src/ui/primitives/Dropdown';
import { useToast } from 'src/ui/primitives';
import { getToastError, getApiErrorMessage } from 'src/shared/utils/apiError';
import { paymentColumns } from './paymentColumns.jsx';

const STATUS_OPTIONS = [
  ['', 'All statuses'],
  ['paid', 'Paid'],
  ['created', 'Pending'],
  ['failed', 'Failed'],
];

const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

/**
 * A summary number. Deliberately not a chart: these are five unrelated
 * scalars, and the question each answers ("how much have we taken?", "how
 * many people can use the product?") is read directly off the figure.
 * Plotting them against each other would invent a relationship that isn't
 * there.
 */
function Stat({ label, value, hint, warn = false }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-[var(--ui-radius-md)] border border-[var(--ui-border-hairline)] bg-white px-4 py-3">
      <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--ui-text-secondary)]">
        {label}
      </span>
      <span className="flex items-center gap-1.5 text-[22px] font-semibold tabular-nums leading-none text-[var(--ui-text-primary)]">
        {/* The icon carries the warning as much as the colour does, so the
            state survives a colourblind reader and a greyscale print. */}
        {warn && <AlertTriangle size={16} className="text-[var(--ui-warning-fg,#9a5b08)]" />}
        {value}
      </span>
      {hint && <span className="text-[11px] text-[var(--ui-text-secondary)]">{hint}</span>}
    </div>
  );
}

export function AdminPaymentsPage() {
  const toast = useToast();
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({ total: 0, limit: 50, skip: 0, pages: 0 });
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // Declared above the effect that calls it. A hoisted `function` is safe here,
  // but keeping definition before use is what lets the React Compiler reason
  // about the component, and it removes the question entirely.
  async function fetchPayments() {
    setLoading(true);
    setError('');
    try {
      const result = await getPayments({
        limit: pagination.limit,
        skip: pagination.skip,
        status: status || null,
        search: search || null,
      });
      if (result.success) {
        setPayments(result.data.payments || []);
        setPagination((prev) => ({ ...prev, ...result.data.pagination }));
        setSummary(result.data.summary || null);
      } else {
        setError(result.message || 'Failed to load payments');
        toast.error(getToastError(result, "Couldn't load payments"));
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load payments'));
      toast.error(getToastError(err, "Couldn't load payments"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.skip, status, search]);

  function submitSearch(e) {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, skip: 0 }));
    setSearch(searchInput.trim());
  }

  const currentPage = Math.floor(pagination.skip / pagination.limit) + 1;

  return (
    <AdminLayout title="Payments" subtitle="Every payment attempt, and who can use the product">
      <div className="flex flex-col gap-4 p-[var(--ui-pad-lg)]">

        {summary && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <Stat
              label="Revenue"
              value={money(summary.revenue)}
              hint={`${money(summary.discountGiven)} given as discount`}
            />
            <Stat
              label="Can use Spurly"
              value={summary.activePaying + summary.compedActive}
              hint={`${summary.activePaying} paying · ${summary.compedActive} comped`}
            />
            <Stat label="Paid" value={summary.paidCount} hint="successful payments" />
            <Stat label="Failed" value={summary.failedCount} hint="declined or dropped" />
            <Stat
              label="Pending"
              value={summary.pendingCount}
              hint={summary.stuck ? `${summary.stuck} over an hour old` : 'awaiting confirmation'}
              warn={summary.stuck > 0}
            />
          </div>
        )}

        {/* A rising stuck count is the earliest signal that webhooks aren't
            arriving — worth saying out loud rather than leaving as a number to
            interpret. */}
        {summary?.stuck > 0 && (
          <div className="flex items-start gap-2.5 rounded-[var(--ui-radius-md)] border border-[var(--ui-warning-border,#e8d5b0)] bg-[var(--ui-warning-tint,#fbeedc)] px-4 py-3">
            <AlertTriangle size={16} className="mt-0.5 shrink-0 text-[var(--ui-warning-fg,#9a5b08)]" />
            <p className="text-[13px] leading-relaxed text-[var(--ui-text-primary)]">
              {summary.stuck} payment{summary.stuck === 1 ? '' : 's'} created over an hour ago and
              still unconfirmed. Usually this means Cashfree webhooks aren't reaching the server —
              check the webhook endpoint is publicly reachable. Reconciliation will still settle
              these on the customer's next page load, so access isn't blocked.
            </p>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Dropdown
            id="pay-status-filter"
            variant="dashboard"
            value={status}
            onChange={(value) => {
              setPagination((prev) => ({ ...prev, skip: 0 }));
              setStatus(value);
            }}
            options={STATUS_OPTIONS}
          />
          <form onSubmit={submitSearch} className="flex items-center gap-2">
            <div className="relative">
              <Search
                size={14}
                className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--ui-text-tertiary)]"
              />
              <input
                className="h-8 w-[260px] rounded-[var(--ui-radius-sm)] border border-[var(--ui-border-hairline)] pl-8 pr-3 text-[13px]"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search email or order id"
                aria-label="Search payments"
              />
            </div>
          </form>
          {search && (
            <button
              type="button"
              className="text-[12px] text-[var(--ui-text-secondary)] underline underline-offset-2"
              onClick={() => {
                setSearchInput('');
                setSearch('');
                setPagination((prev) => ({ ...prev, skip: 0 }));
              }}
            >
              Clear
            </button>
          )}
        </div>

        <DataTable
          columns={paymentColumns}
          data={payments}
          loading={loading}
          error={error}
          emptyMessage="No payments yet"
          emptyHint="Payments appear here as soon as someone subscribes."
          pagination={{
            page: currentPage,
            pageSize: pagination.limit,
            total: pagination.total,
            onPageChange: (p) =>
              setPagination((prev) => ({ ...prev, skip: Math.max(0, (p - 1) * prev.limit) })),
          }}
        />
      </div>
    </AdminLayout>
  );
}

export default AdminPaymentsPage;

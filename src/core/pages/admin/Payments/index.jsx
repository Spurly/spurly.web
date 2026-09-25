import { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, AlertTriangle } from 'lucide-react';
import EventEmitter from 'src/shared/utils/EventEmitter.js';
import adminController from 'src/core/admin/controller/admin.js';
import { ADMIN_EVENTS } from 'src/core/admin/constants/constants.js';
import { AdminLayout } from 'src/core/pages/admin/components/AdminLayout';
import { DataTable } from 'src/core/DataTable';
import { Dropdown } from 'src/core/primitives/Dropdown';
import { useToast } from 'src/core/primitives';
import { getToastError, getApiErrorMessage } from 'src/shared/utils/apiError';
import { paymentColumns } from './paymentColumns.jsx';
import { formatMoney } from 'src/shared/utils/money.js';

const STATUS_OPTIONS = [
  ['', 'All charges'],
  ['captured', 'Paid'],
  ['failed', 'Failed'],
];

/** { INR: 4998, USD: 24.99 } → "₹4,998 · $24.99" (never summed across currencies). */
function revenueText(revenue) {
  const parts = Object.entries(revenue || {}).map(([cur, amt]) => formatMoney(amt, cur));
  return parts.length ? parts.join(' · ') : formatMoney(0, 'INR');
}

/**
 * A summary number. Deliberately not a chart: these are five unrelated
 * scalars, and the question each answers ("how much have we taken?", "how
 * many people can use the product?") is read directly off the figure.
 * Plotting them against each other would invent a relationship that isn't
 * there.
 */
function Stat({ label, value, hint, warn = false }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-[var(--ui-radius-md)] border border-[var(--ui-border-hairline)] bg-[var(--ui-surface-card)] px-4 py-3">
      <span className="text-[length:var(--ui-t-meta)] font-medium uppercase tracking-wider text-[var(--ui-text-secondary)]">
        {label}
      </span>
      <span className="flex items-center gap-1.5 text-[length:var(--ui-t-metric)] font-semibold tabular-nums leading-none text-[var(--ui-text-primary)]">
        {/* The icon carries the warning as much as the colour does, so the
            state survives a colourblind reader and a greyscale print. */}
        {warn && <AlertTriangle size={16} className="text-[var(--ui-warning-fg)]" />}
        {value}
      </span>
      {hint && <span className="text-[length:var(--ui-t-meta)] text-[var(--ui-text-secondary)]">{hint}</span>}
    </div>
  );
}

export function AdminPaymentsPage() {
  const toast = useToast();
  const eventEmitter = useMemo(() => new EventEmitter(), []);
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({ total: 0, limit: 50, skip: 0, pages: 0 });
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // Declared above the effect that calls it, same reasoning as before: a
  // `const` referenced before its declaration is a temporal-dead-zone
  // hazard the moment anything calls it earlier, and it blocks the React
  // Compiler from optimising the component.
  const fetchPayments = useCallback(() => {
    setLoading(true);
    setError('');
    adminController.getPayments(eventEmitter, {
      limit: pagination.limit,
      skip: pagination.skip,
      status: status || null,
      search: search || null,
    });
  }, [eventEmitter, pagination.limit, pagination.skip, status, search]);

  useEffect(() => {
    function handleSuccess(data) {
      setPayments(data.payments || []);
      setPagination((prev) => ({ ...prev, ...data.pagination }));
      setSummary(data.summary || null);
      setLoading(false);
    }
    function handleFailure(err) {
      setError(getApiErrorMessage(err, 'Failed to load payments'));
      toast.error(getToastError(err, "Couldn't load payments"));
      setLoading(false);
    }

    eventEmitter.on(ADMIN_EVENTS.GET_PAYMENTS_SUCCESS, handleSuccess);
    eventEmitter.on(ADMIN_EVENTS.GET_PAYMENTS_FAILURE, handleFailure);
    return () => {
      eventEmitter.off(ADMIN_EVENTS.GET_PAYMENTS_SUCCESS, handleSuccess);
      eventEmitter.off(ADMIN_EVENTS.GET_PAYMENTS_FAILURE, handleFailure);
    };
  }, [eventEmitter, toast]);

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
    <AdminLayout title="Payments" subtitle="Every Razorpay charge, and who can use the product">
      <div className="flex flex-col gap-4 p-[var(--ui-pad-lg)]">

        {summary && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <Stat label="Revenue" value={revenueText(summary.revenue)} hint={`${summary.paidCount} successful charges`} />
            <Stat
              label="Can use Spurly"
              value={summary.active + summary.trialing + summary.paymentIssue + summary.cancelledWithAccess + summary.compedActive}
              hint={`${summary.active} paying · ${summary.trialing} trial · ${summary.compedActive} comped`}
            />
            <Stat
              label="Payment issues"
              value={summary.paymentIssue}
              hint={`${summary.halted} halted (locked)`}
              warn={summary.paymentIssue > 0}
            />
            <Stat label="Failed charges" value={summary.failedCount} hint="declined renewals" />
            <Stat
              label="Cancelled, still on"
              value={summary.cancelledWithAccess}
              hint={summary.stuck ? `${summary.stuck} abandoned checkouts` : 'access until period end'}
            />
          </div>
        )}

        {/* Customers inside Razorpay's retry window — their card/UPI mandate
            failed; they keep access until Razorpay halts the subscription. */}
        {summary?.paymentIssue > 0 && (
          <div className="flex items-start gap-2.5 rounded-[var(--ui-radius-md)] border border-[var(--ui-warning-border)] bg-[var(--ui-warning-tint)] px-4 py-3">
            <AlertTriangle size={16} className="mt-0.5 shrink-0 text-[var(--ui-warning-fg)]" />
            <p className="text-[length:var(--ui-t-body)] leading-relaxed text-[var(--ui-text-primary)]">
              {summary.paymentIssue} subscription{summary.paymentIssue === 1 ? ' has' : 's have'} a failing
              renewal. Razorpay is retrying; access continues until it halts them. If this number keeps
              rising, check the Razorpay dashboard and that webhooks reach /api/subscriptions/webhook.
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
                className="h-8 w-[260px] rounded-[var(--ui-radius-sm)] border border-[var(--ui-border-hairline)] pl-8 pr-3 text-[length:var(--ui-t-body)]"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search email, pay_… or sub_… id"
                aria-label="Search payments"
              />
            </div>
          </form>
          {search && (
            <button
              type="button"
              className="text-[length:var(--ui-t-label)] text-[var(--ui-text-secondary)] underline underline-offset-2"
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
          emptyHint="Charges appear here when Razorpay bills a subscription (after the free trial)."
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

import { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from 'recharts';
import {
  Activity,
  Users as UsersIcon,
  UserPlus,
  UserX,
  MousePointerClick,
  Send,
  MessageSquare,
  RefreshCw,
  Flame,
  CalendarDays,
  X,
  Loader,
  TrendingUp,
  TrendingDown,
  Minus,
  Layers,
  FolderKanban,
  Sparkles,
  Search,
} from 'lucide-react';
import { AdminLayout } from 'src/admin/AdminLayout';
import { MetricCard } from 'src/common/components/MetricCard';
import { Card, CardHeader } from 'src/common/components/Card/Card';
import { DataTable } from 'src/common/components/DataTable';
import { Badge } from 'src/common/components/Badge';
import { Button } from 'src/common/components/Button';
import { Dropdown } from 'src/common/components/Dropdown';
import { Input } from 'src/common/components/Input';
import {
  getAnalyticsOverview,
  getUserUsageAnalytics,
  getUserDailyActivity,
} from 'src/core/gateway/adminApi';

const CHART = {
  captures: '#7c3aed', // brand purple
  connections: '#0a84ff', // sky
  messages: '#f59e0b', // amber
  active: '#2fb457', // green
};

const FEATURES = [
  { key: 'captureCards', label: 'Captures', color: CHART.captures, icon: MousePointerClick },
  { key: 'sendConnections', label: 'Connections', color: CHART.connections, icon: Send },
  { key: 'sendMessages', label: 'Messages', color: CHART.messages, icon: MessageSquare },
];

// Engagement segments (matches backend classifySegment).
const SEGMENTS = [
  { key: 'power', label: 'Power', tone: 'success', color: '#2fb457', hint: '12+ active days / 30d' },
  { key: 'regular', label: 'Regular', tone: 'info', color: '#0a84ff', hint: '4–11 active days' },
  { key: 'casual', label: 'Casual', tone: 'warning', color: '#f59e0b', hint: '1–3 active days' },
  { key: 'dormant', label: 'Dormant', tone: 'danger', color: '#ff453a', hint: 'No recent activity' },
  { key: 'never', label: 'Never activated', tone: 'neutral', color: '#8e8e93', hint: 'Signed up, never used' },
];
const SEGMENT_BY_KEY = Object.fromEntries(SEGMENTS.map((s) => [s.key, s]));

function shortDate(d) {
  if (!d) return '';
  return new Date(d + 'T00:00:00Z').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}
function fullDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

/** Shared recharts tooltip styling. */
const tooltipStyle = {
  background: 'var(--surface-card)',
  border: '1px solid var(--border-hairline)',
  borderRadius: 12,
  fontSize: 12,
};

function ChartPanel({ title, subtitle, height = 260, children }) {
  return (
    <Card padding="md">
      <CardHeader title={title} subtitle={subtitle} />
      <ResponsiveContainer width="100%" height={height}>
        {children}
      </ResponsiveContainer>
    </Card>
  );
}

/** Small week-over-week trend pill. */
function TrendPill({ pct }) {
  if (pct === undefined || pct === null) return <span className="text-[var(--text-tertiary)]">—</span>;
  const up = pct > 0;
  const flat = pct === 0;
  const color = flat ? 'var(--text-tertiary)' : up ? 'var(--green)' : 'var(--red)';
  const Icon = flat ? Minus : up ? TrendingUp : TrendingDown;
  return (
    <span className="inline-flex items-center gap-1 text-[12px] font-semibold tabular-nums" style={{ color }}>
      <Icon size={13} />
      {up ? '+' : ''}{pct}%
    </span>
  );
}

/** Compact labelled stat tile used in the drill-down modal. */
function StatTile({ label, value, sub, color, icon: Icon }) {
  return (
    <div className="rounded-[12px] p-3" style={{ background: 'var(--surface-sunken)' }}>
      <p className="text-[11px] text-[var(--text-tertiary)] flex items-center gap-1">
        {Icon && <Icon size={12} />} {label}
      </p>
      <p className="text-[20px] font-bold leading-tight" style={{ color: color || 'var(--text-primary)' }}>{value}</p>
      {sub && <p className="text-[10.5px] text-[var(--text-tertiary)] mt-0.5">{sub}</p>}
    </div>
  );
}

/** Captures → Connections → Messages funnel with conversion rates. */
function Funnel({ funnel }) {
  const steps = [
    { label: 'Captures', value: funnel.captures, color: CHART.captures, rate: null },
    { label: 'Connections', value: funnel.connections, color: CHART.connections, rate: funnel.connectRate },
    { label: 'Messages', value: funnel.messages, color: CHART.messages, rate: funnel.messageRate },
  ];
  const max = Math.max(1, funnel.captures, funnel.connections, funnel.messages);
  return (
    <div className="space-y-2.5">
      {steps.map((s) => (
        <div key={s.label} className="flex items-center gap-3">
          <span className="text-[12px] text-[var(--text-secondary)] w-24 shrink-0">{s.label}</span>
          <div className="flex-1 h-6 rounded-[8px] overflow-hidden" style={{ background: 'var(--surface-sunken)' }}>
            <div
              className="h-full rounded-[8px] transition-all"
              style={{
                width: `${(s.value / max) * 100}%`,
                minWidth: s.value > 0 ? 4 : 0,
                background: s.color,
              }}
            />
          </div>
          <span className="text-[13px] font-semibold text-[var(--text-primary)] tabular-nums w-12 shrink-0 text-right">
            {s.value.toLocaleString()}
          </span>
          <span className="text-[11px] text-[var(--text-tertiary)] w-24 shrink-0 text-right">
            {s.rate !== null ? `${s.rate}% of captures` : 'baseline'}
          </span>
        </div>
      ))}
    </div>
  );
}

function SegmentBadge({ seg }) {
  const meta = SEGMENT_BY_KEY[seg] || SEGMENT_BY_KEY.never;
  return <Badge tone={meta.tone} dot>{meta.label}</Badge>;
}

/** Horizontal proportion bar for the segment mix. */
function SegmentBar({ segments }) {
  const total = SEGMENTS.reduce((a, s) => a + (segments?.[s.key] || 0), 0) || 1;
  return (
    <div>
      <div className="flex h-3 w-full rounded-full overflow-hidden" style={{ background: 'var(--surface-sunken)' }}>
        {SEGMENTS.map((s) => {
          const v = segments?.[s.key] || 0;
          if (!v) return null;
          return <div key={s.key} style={{ width: `${(v / total) * 100}%`, background: s.color }} title={`${s.label}: ${v}`} />;
        })}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4">
        {SEGMENTS.map((s) => (
          <div key={s.key} className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
              <span className="text-[13px] font-semibold text-[var(--text-primary)] tabular-nums">{segments?.[s.key] ?? 0}</span>
            </div>
            <span className="text-[11.5px] text-[var(--text-secondary)] mt-0.5">{s.label}</span>
            <span className="text-[10.5px] text-[var(--text-tertiary)]">{s.hint}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminInsightsPage() {
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, limit: 25, skip: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('lastActive');
  const [refreshKey, setRefreshKey] = useState(0);

  const [drillUser, setDrillUser] = useState(null);
  const [drillData, setDrillData] = useState(null);
  const [drillLoading, setDrillLoading] = useState(false);

  // Load overview once (and on manual refresh).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const ov = await getAnalyticsOverview();
        if (!cancelled && ov.success) setOverview(ov.data);
      } catch {
        /* handled by table error surface */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  // Load per-user table on paging / sort / search / refresh.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    const t = setTimeout(async () => {
      try {
        const res = await getUserUsageAnalytics(pagination.limit, pagination.skip, search, sort);
        if (cancelled) return;
        if (res.success) {
          setUsers(res.data.users);
          setPagination((p) => ({ ...p, ...res.data.pagination }));
        } else {
          setError(res.message || 'Failed to load usage');
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load usage');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, search ? 300 : 0); // small debounce while typing search
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.skip, sort, search, refreshKey]);

  const openDrill = async (user) => {
    setDrillUser(user);
    setDrillData(null);
    setDrillLoading(true);
    try {
      const res = await getUserDailyActivity(user.userId, 30);
      if (res.success) setDrillData(res.data);
    } catch {
      /* modal shows empty state */
    } finally {
      setDrillLoading(false);
    }
  };

  // Derived chart series
  const trend = overview?.trend || [];
  const dauSeries = trend.map((t) => ({ date: shortDate(t.date), activeUsers: t.activeUsers }));
  const actionSeries = trend.map((t) => ({
    date: shortDate(t.date),
    Captures: t.captureCards,
    Connections: t.sendConnections,
    Messages: t.sendMessages,
  }));
  const featureSplit = FEATURES.map((f) => ({
    label: f.label,
    value: overview?.actions?.last30Days?.[f.key] ?? 0,
    color: f.color,
  }));

  const columns = [
    {
      key: 'name',
      label: 'User',
      minWidth: '210px',
      render: (_v, row) => (
        <div>
          <div className="font-medium text-[var(--text-primary)] flex items-center gap-1.5">
            {row.name || '—'}
            {row.activeToday && <Flame size={13} style={{ color: 'var(--green)' }} title="Active today" />}
          </div>
          <div className="text-[12px] text-[var(--text-tertiary)]">{row.email}</div>
        </div>
      ),
    },
    {
      key: 'segment',
      label: 'Segment',
      minWidth: '130px',
      render: (value) => <SegmentBadge seg={value} />,
    },
    {
      key: 'activeDays30',
      label: 'Active days (30d)',
      align: 'center',
      minWidth: '150px',
      render: (value) => (
        <div className="flex items-center gap-2 justify-center">
          <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-sunken)' }}>
            <div
              className="h-full"
              style={{ width: `${Math.min(100, (value / 30) * 100)}%`, background: 'var(--brand-gradient-vivid, var(--brand-purple))' }}
            />
          </div>
          <span className="tabular-nums text-[13px] text-[var(--text-secondary)] w-5 text-left">{value}</span>
        </div>
      ),
    },
    {
      key: 'cap',
      label: 'Captures',
      align: 'right',
      minWidth: '90px',
      render: (_v, row) => <span className="tabular-nums text-[var(--text-primary)]">{row.last30.captureCards}</span>,
    },
    {
      key: 'con',
      label: 'Connections',
      align: 'right',
      minWidth: '100px',
      render: (_v, row) => <span className="tabular-nums text-[var(--text-primary)]">{row.last30.sendConnections}</span>,
    },
    {
      key: 'msg',
      label: 'Messages',
      align: 'right',
      minWidth: '90px',
      render: (_v, row) => <span className="tabular-nums text-[var(--text-primary)]">{row.last30.sendMessages}</span>,
    },
    {
      key: 'wowTrendPct',
      label: 'Trend (WoW)',
      align: 'right',
      minWidth: '100px',
      render: (value) => <TrendPill pct={value} />,
    },
    {
      key: 'lastActive',
      label: 'Last active',
      minWidth: '120px',
      render: (value, row) => (
        <div className="text-[12px] tabular-nums">
          <span className="text-[var(--text-secondary)]">{value ? shortDate(value) : '—'}</span>
          {row.daysSinceActive !== null && row.daysSinceActive !== undefined && (
            <span className="text-[var(--text-tertiary)] block">
              {row.daysSinceActive === 0 ? 'today' : `${row.daysSinceActive}d ago`}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'plan',
      label: 'Plan',
      minWidth: '100px',
      render: (value) => <Badge tone="primary">{value || 'Free'}</Badge>,
    },
  ];

  const currentPage = Math.floor(pagination.skip / pagination.limit) + 1;

  return (
    <AdminLayout title="Insights" subtitle="How users are using the extension">
      <div className="space-y-6">
        {/* KPI cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            icon={<Activity size={18} />}
            label="Active today"
            value={overview?.activeUsers?.dau ?? '—'}
            hint={`${overview?.activeUsers?.wau ?? 0} this week · ${overview?.activeUsers?.mau ?? 0} this month`}
          />
          <MetricCard
            icon={<UsersIcon size={18} />}
            label="Total users"
            value={overview?.totals?.totalUsers ?? '—'}
            hint={`${overview?.signups?.last7Days ?? 0} new in last 7 days`}
          />
          <MetricCard
            icon={<UserX size={18} />}
            label="Dormant users"
            value={overview?.totals?.dormantUsers ?? '—'}
            hint="No activity in the last 14 days"
          />
          <MetricCard
            icon={<UserPlus size={18} />}
            label="New signups (30d)"
            value={overview?.signups?.last30Days ?? '—'}
            hint={`${(overview?.totals?.lifetimeCaptures ?? 0).toLocaleString()} lifetime captures`}
          />
        </div>

        {/* Action totals */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {FEATURES.map((f) => (
            <Card key={f.key} padding="md">
              <div className="flex items-center gap-4">
                <div className="grid place-items-center w-11 h-11 rounded-[12px] text-white shrink-0" style={{ background: f.color }}>
                  <f.icon size={20} />
                </div>
                <div>
                  <p className="text-[26px] font-bold tabular-nums text-[var(--text-primary)] leading-none">
                    {(overview?.actions?.last30Days?.[f.key] ?? 0).toLocaleString()}
                  </p>
                  <p className="text-[13px] text-[var(--text-secondary)] mt-1">{f.label} · last 30 days</p>
                  <p className="text-[11.5px] text-[var(--text-tertiary)]">
                    {(overview?.actions?.last7Days?.[f.key] ?? 0).toLocaleString()} in 7d · {(overview?.actions?.today?.[f.key] ?? 0).toLocaleString()} today
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* User segments */}
        <Card padding="md">
          <CardHeader
            title="User segments"
            subtitle="Engagement mix across all users, based on active days in the last 30 days"
          />
          <SegmentBar segments={overview?.segments} />
        </Card>

        {/* Charts row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <ChartPanel title="Daily active users" subtitle="Distinct users who took any action · last 30 days">
              <BarChart data={dauSeries} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--separator)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} interval={4} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: 'var(--surface-hover)' }} contentStyle={tooltipStyle} />
                <Bar dataKey="activeUsers" name="Active users" fill={CHART.active} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartPanel>
          </div>
          <ChartPanel title="Feature usage split" subtitle="Total actions · last 30 days">
            <BarChart data={featureSplit} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--separator)" />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="label" tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} tickLine={false} axisLine={false} width={78} />
              <Tooltip cursor={{ fill: 'var(--surface-hover)' }} contentStyle={tooltipStyle} />
              <Bar dataKey="value" name="Actions" radius={[0, 4, 4, 0]}>
                {featureSplit.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ChartPanel>
        </div>

        {/* Charts row 2: stacked daily actions */}
        <ChartPanel title="Daily actions by feature" subtitle="Captures, connections & messages per day · last 30 days" height={280}>
          <BarChart data={actionSeries} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--separator)" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} interval={4} tickLine={false} axisLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} tickLine={false} axisLine={false} />
            <Tooltip cursor={{ fill: 'var(--surface-hover)' }} contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="Captures" stackId="a" fill={CHART.captures} />
            <Bar dataKey="Connections" stackId="a" fill={CHART.connections} />
            <Bar dataKey="Messages" stackId="a" fill={CHART.messages} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartPanel>

        {/* Per-user table */}
        {error && (
          <div
            className="p-3 rounded-[12px] text-[13px] font-medium"
            style={{ background: 'var(--red-tint)', color: 'var(--red)', border: '1px solid rgba(255,69,58,0.2)' }}
          >
            {error}
          </div>
        )}

        {/* Per-user toolbar — kept above the table (elevated) so the sort
            dropdown menu overlays the table instead of being clipped by the
            table's sticky header. */}
        <div className="relative z-30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="w-full sm:w-72">
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPagination((p) => ({ ...p, skip: 0 }));
              }}
              placeholder="Search by email or name..."
              leadingIcon={<Search size={16} />}
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-52">
              <Dropdown
                variant="dashboard"
                value={sort}
                onChange={(val) => {
                  setSort(val);
                  setPagination((p) => ({ ...p, skip: 0 }));
                }}
                options={[
                  ['lastActive', 'Sort: Last active'],
                  ['last30Captures', 'Sort: Captures (30d)'],
                  ['last30Connections', 'Sort: Connections (30d)'],
                  ['last30Messages', 'Sort: Messages (30d)'],
                  ['activeDays', 'Sort: Active days'],
                  ['signup', 'Sort: Signup date'],
                ]}
              />
            </div>
            <Button
              variant="secondary"
              leadingIcon={<RefreshCw size={16} className={loading ? 'animate-spin' : ''} />}
              onClick={() => setRefreshKey((k) => k + 1)}
              disabled={loading}
            >
              Refresh
            </Button>
          </div>
        </div>

        <div className="rounded-[16px] border border-[var(--border-hairline)] overflow-hidden shadow-sm">
          <DataTable
            columns={columns}
            data={users}
            rowKey={(row) => row.userId}
            onRowClick={openDrill}
            loading={loading}
            emptyMessage="No users found"
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

      {/* Drill-down modal */}
      {drillUser && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4"
          style={{ zIndex: 'var(--z-modal, 1100)', background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setDrillUser(null)}
        >
          <div
            className="bg-[var(--surface-card)] rounded-[18px] shadow-[0_24px_60px_rgba(0,0,0,0.25)] w-full max-w-[820px] max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 bg-[var(--surface-card)] rounded-t-[18px] flex items-start justify-between p-6 border-b border-[var(--separator)]">
              <div className="flex items-center gap-3 min-w-0">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-[17px] font-semibold text-[var(--text-primary)] truncate">{drillUser.name || drillUser.email}</h3>
                    <SegmentBadge seg={drillUser.segment} />
                    {drillData && <TrendPill pct={drillData.summary.wowTrendPct} />}
                  </div>
                  <p className="text-[12px] text-[var(--text-tertiary)]">{drillUser.email} · {drillUser.plan}</p>
                </div>
              </div>
              <button onClick={() => setDrillUser(null)} className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] shrink-0">
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              {drillLoading && (
                <div className="flex items-center justify-center py-16 text-[var(--text-tertiary)]">
                  <Loader className="animate-spin mr-2" /> Loading activity…
                </div>
              )}
              {!drillLoading && drillData && (
                <>
                  {/* Engagement stat grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
                    <StatTile icon={CalendarDays} label="Active days" value={`${drillData.summary.activeDays}`} sub={`of last ${drillData.windowDays}`} />
                    <StatTile icon={Flame} label="Current streak" value={`${drillData.summary.currentStreak}d`} color={drillData.summary.currentStreak > 0 ? 'var(--green)' : undefined} sub={`best ${drillData.summary.longestStreak}d`} />
                    <StatTile icon={Activity} label="Avg / active day" value={drillData.summary.avgPerActiveDay} sub="actions" />
                    <StatTile icon={TrendingUp} label="Total actions" value={drillData.summary.totalActions.toLocaleString()} sub={`last ${drillData.windowDays}d`} />
                    <StatTile icon={UserPlus} label="Days since signup" value={drillData.user.daysSinceSignup ?? '—'} sub={fullDate(drillData.user.signupDate)} />
                    <StatTile icon={FolderKanban} label="Sessions" value={drillData.activity.sessions} sub="lists created" />
                  </div>

                  {/* Funnel + Sources/Enrichment side by side */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
                    <div>
                      <p className="text-[13px] font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-1.5">
                        <Layers size={14} /> Outreach funnel · last {drillData.windowDays} days
                      </p>
                      <Funnel funnel={drillData.funnel} />
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-1.5">
                        <Sparkles size={14} /> Capture sources & enrichment
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <StatTile label="LinkedIn" value={drillData.profiles.bySource.linkedin.toLocaleString()} sub="profiles" color={CHART.captures} />
                        <StatTile label="Sales Navigator" value={drillData.profiles.bySource.salesNavigator.toLocaleString()} sub="profiles" color={CHART.connections} />
                        <StatTile label="Enriched" value={`${drillData.profiles.enriched}`} sub={`${drillData.profiles.enrichRate}% of ${drillData.profiles.total}`} />
                        <StatTile label="Lifetime captures" value={drillData.profiles.lifetimeCaptures.toLocaleString()} sub="all-time" />
                      </div>
                    </div>
                  </div>

                  {/* Weekly activity */}
                  <p className="text-[13px] font-semibold text-[var(--text-primary)] mb-2">Weekly activity</p>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart
                      data={drillData.weekly.map((w) => ({
                        week: shortDate(w.weekStart),
                        Captures: w.captureCards,
                        Connections: w.sendConnections,
                        Messages: w.sendMessages,
                      }))}
                      margin={{ top: 4, right: 8, left: -18, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--separator)" />
                      <XAxis dataKey="week" tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} tickLine={false} axisLine={false} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} tickLine={false} axisLine={false} />
                      <Tooltip cursor={{ fill: 'var(--surface-hover)' }} contentStyle={tooltipStyle} />
                      <Bar dataKey="Captures" stackId="a" fill={CHART.captures} />
                      <Bar dataKey="Connections" stackId="a" fill={CHART.connections} />
                      <Bar dataKey="Messages" stackId="a" fill={CHART.messages} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>

                  {/* Daily activity */}
                  <p className="text-[13px] font-semibold text-[var(--text-primary)] mb-2 mt-5">
                    Daily activity · last {drillData.windowDays} days
                  </p>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart
                      data={drillData.series.map((s) => ({
                        date: shortDate(s.date),
                        Captures: s.captureCards,
                        Connections: s.sendConnections,
                        Messages: s.sendMessages,
                      }))}
                      margin={{ top: 4, right: 8, left: -18, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--separator)" />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} interval={4} tickLine={false} axisLine={false} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} tickLine={false} axisLine={false} />
                      <Tooltip cursor={{ fill: 'var(--surface-hover)' }} contentStyle={tooltipStyle} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="Captures" stackId="a" fill={CHART.captures} />
                      <Bar dataKey="Connections" stackId="a" fill={CHART.connections} />
                      <Bar dataKey="Messages" stackId="a" fill={CHART.messages} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>

                  <p className="text-[11.5px] text-[var(--text-tertiary)] mt-4">
                    Recorded outreach (lifetime, from credit ledger): {drillData.activity.lifetimeConnections.toLocaleString()} connections · {drillData.activity.lifetimeMessages.toLocaleString()} messages · Credit balance {drillData.user.creditBalance}
                  </p>
                </>
              )}
              {!drillLoading && !drillData && (
                <div className="py-16 text-center text-[var(--text-tertiary)]">Couldn't load this user's activity.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

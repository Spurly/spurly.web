import { useState } from "react";
import { DashboardLayout } from "src/components/DashboardLayout";
import { MetricCard } from "src/common/components/MetricCard";
import { DataTable } from "src/common/components/DataTable";
import { LeadDetailSidebar } from "src/components/LeadDetailSidebar";
import { useAllProfiles } from "src/hooks/useAllProfiles";
import { useMetrics } from "src/hooks/useMetrics";
import { useAuth } from "src/hooks/useAuth";
import {
  Target,
  Users,
  Zap,
  Layers,
  Download,
  Bell,
  Share2,
} from "lucide-react";
import { signalsColumns } from "./columns";

// Augment profiles with their real connectionDegree field (already on the profile
// from the API). whyNow is intentionally omitted here — it will come from the
// signals API and show as locked until that is wired up.
function augmentWithSignalData(profiles) {
  return profiles.map((p) => ({
    ...p,
    connectionDegree: p.connectionDegree ?? null,
    whyNow: p.whyNow ?? null,
  }));
}

// --- SVG Donut Chart ---
function DonutChart({ segments, total, size = 144, strokeWidth = 22 }) {
  const r = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  let cumulative = 0;

  return (
    <svg
      width={size}
      height={size}
      style={{ transform: "rotate(-90deg)", display: "block" }}
    >
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="var(--surface-sunken)"
        strokeWidth={strokeWidth}
      />
      {segments.map((seg, i) => {
        const length = (seg.value / total) * circumference;
        const dashoffset = circumference - cumulative;
        cumulative += length;
        return (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${length} ${circumference - length}`}
            strokeDashoffset={dashoffset}
          />
        );
      })}
    </svg>
  );
}

// --- Network Reach Card ---
function NetworkReachCard({ connectionDegrees, donutSize = 140 }) {
  const { first = 0, second = 0, third = 0, unknown = 0 } = connectionDegrees;
  const total = first + second + third + unknown;
  const strokeWidth = donutSize <= 120 ? 18 : 22;

  const segments = [
    { value: first, color: "#7c3aed", label: "1st degree", count: first },
    { value: second, color: "#4f46e5", label: "2nd degree", count: second },
    { value: third, color: "#06b6d4", label: "3rd degree", count: third },
    ...(unknown > 0
      ? [{ value: unknown, color: "#d1d5db", label: "Unknown", count: unknown }]
      : []),
  ];

  return (
    <div className="bg-[var(--surface-card)] border border-[var(--border-hairline)] shadow-[var(--shadow-sm)] rounded-[18px] p-5">
      <div className="flex items-center gap-2.5 mb-4">
        <div
          className="w-8 h-8 rounded-[10px] grid place-items-center shrink-0"
          style={{ background: "var(--accent-tint)" }}
        >
          <Share2 size={16} style={{ color: "var(--brand-purple)" }} />
        </div>
        <div>
          <p className="text-[14px] font-semibold" style={{ color: "#06b6d4" }}>
            Network reach
          </p>
          <p className="text-[12px] text-[var(--text-tertiary)]">
            Connection degree mix
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          <DonutChart
            segments={
              total > 0
                ? segments
                : [{ value: 1, color: "var(--surface-sunken)" }]
            }
            total={total || 1}
            size={donutSize}
            strokeWidth={strokeWidth}
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className="font-bold text-[var(--text-primary)] leading-none"
              style={{ fontSize: donutSize <= 120 ? 20 : 26 }}
            >
              {second}
            </span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[12px] text-[var(--text-secondary)] mb-2.5">
            2nd° — warmest path
          </p>
          {segments.map((seg) => (
            <div
              key={seg.label}
              className="flex items-center justify-between mb-1.5 last:mb-0"
            >
              <div className="flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: seg.color }}
                />
                <span className="text-[11.5px] text-[var(--text-secondary)]">
                  {seg.label}
                </span>
              </div>
              <span className="text-[12px] font-semibold text-[var(--text-primary)]">
                {seg.count}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- Engage-Ready Card (bar chart) ---
function EngageReadyCard({ connectionDegrees, total }) {
  const reachOut = connectionDegrees.first;
  const connect =
    connectionDegrees.second +
    connectionDegrees.third +
    connectionDegrees.unknown;
  const max = Math.max(total || 0, reachOut + connect, 1);

  const bars = [
    { label: "Total leads", value: total, pct: 100, color: "#06b6d4" },
    {
      label: "Reach out ready",
      value: reachOut,
      pct: (reachOut / max) * 100,
      color: "#7c3aed",
    },
    {
      label: "Connect ready",
      value: connect,
      pct: (connect / max) * 100,
      color: "#f97316",
    },
  ];

  return (
    <div className="relative rounded-[18px] p-6 overflow-hidden bg-[var(--surface-card)] border border-[var(--border-hairline)] shadow-[var(--shadow-sm)]">
      <div
        className="absolute top-4 right-4 grid place-items-center w-10 h-10 rounded-[12px]"
        style={{ background: "var(--accent-tint)" }}
      >
        <Zap size={18} style={{ color: "var(--brand-purple)" }} />
      </div>

      <p
        className="text-[12px] font-semibold uppercase tracking-[0.04em] mb-4"
        style={{ color: "#7c3aed" }}
      >
        Engage-Ready
      </p>

      <div className="flex flex-col gap-3">
        {bars.map((bar) => (
          <div key={bar.label}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11.5px] text-[var(--text-secondary)]">
                {bar.label}
              </span>
              <span
                className="text-[12px] font-bold leading-none"
                style={{ color: bar.color }}
              >
                {bar.value?.toLocaleString() ?? "—"}
              </span>
            </div>
            <div
              className="h-[6px] rounded-full overflow-hidden"
              style={{ background: "var(--surface-sunken)" }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.min(bar.pct, 100)}%`,
                  background: bar.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Priority Queue Tab Switcher ---
const QUEUE_TABS = ["All", "Connect", "Message", "Engage"];

// --- Signals Page ---
export function SignalsPage() {
  const [queueTab, setQueueTab] = useState("All");
  const [selectedLeads, setSelectedLeads] = useState(new Set());
  const [selectedLead, setSelectedLead] = useState(null);
  const { user } = useAuth();

  const {
    profiles,
    loading,
    error,
    pagination,
    goToPage,
    setPageSize,
    currentPage,
  } = useAllProfiles();

  const { metrics: statsMetrics } = useMetrics();
  const { connectionDegrees, sessions } = statsMetrics;

  const signalsData = augmentWithSignalData(profiles);

  return (
    <DashboardLayout>
      <div className="relative flex flex-col h-full overflow-hidden">
        {/* Page header */}
        <div className="glass-chrome border-b border-[var(--separator)] px-6 py-4 shrink-0 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-[20px] font-bold tracking-[-0.018em] text-[var(--text-primary)]">
              Signals
            </h1>
            <p className="text-[13px] text-[var(--text-secondary)] mt-0.5">
              Outreach intelligence across {pagination.total.toLocaleString()}{" "}
              captured People
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Session badge */}
            <div className="flex items-center gap-1.5 h-9 px-3 rounded-[10px] border border-[var(--border-hairline)] bg-[var(--surface-card)]">
              <Layers size={14} style={{ color: "var(--text-tertiary)" }} />
              <span className="text-[13px] font-medium text-[var(--text-secondary)]">
                {sessions.active > 0
                  ? `${sessions.active} sessions`
                  : "Sessions"}
              </span>
            </div>

            {/* Export button */}
            <button
              className="flex items-center gap-1.5 h-9 px-4 rounded-[10px] text-[13px] font-semibold text-white"
              style={{ background: "var(--brand-purple)" }}
            >
              <Download size={14} />
              Export signals
            </button>

            {/* Bell */}
            <button className="w-9 h-9 grid place-items-center rounded-[10px] border border-[var(--border-hairline)] bg-[var(--surface-card)] hover:bg-[var(--surface-hover)] transition-colors">
              <Bell size={16} style={{ color: "var(--text-secondary)" }} />
            </button>

            {/* Avatar */}
            <div
              className="w-9 h-9 rounded-[11px] grid place-items-center text-white text-[13px] font-bold shrink-0"
              style={{ background: "var(--brand-gradient-vivid)" }}
            >
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Top 4-card row */}
          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: "1.5fr 1.5fr 1fr 1fr" }}
          >
            <EngageReadyCard
              connectionDegrees={connectionDegrees}
              total={pagination.total}
            />
            <NetworkReachCard
              connectionDegrees={connectionDegrees}
              donutSize={120}
            />
            <MetricCard
              label="Priority Leads"
              value={connectionDegrees.first}
              icon={<Target size={18} />}
              hint="Send a connect request to warm prospects to turn them into priority leads."
              hintColor="#4f46e5"
            />
            <MetricCard
              label="Warm Intros (2nd°)"
              value={connectionDegrees.second}
              icon={<Users size={18} />}
              hint="Ask a mutual connection for an intro — 2nd degree replies 3× more often."
              hintColor="#f97316"
            />
          </div>

          {/* Priority queue — full width */}
          <div className="bg-[var(--surface-card)] border border-[var(--border-hairline)] shadow-[var(--shadow-sm)] rounded-[18px] overflow-hidden flex flex-col">
            {/* Queue header */}
            <div className="px-5 pt-5 pb-4 flex items-start justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-[11px] grid place-items-center shrink-0"
                  style={{ background: "var(--accent-tint)" }}
                >
                  <Target size={18} style={{ color: "var(--brand-purple)" }} />
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-[var(--text-primary)]">
                    Priority queue
                  </p>
                  <p className="text-[12px] text-[var(--text-tertiary)]">
                    Ranked by intent, network warmth &amp; recency
                  </p>
                </div>
              </div>

              {/* Filter tab pills */}
              <div className="flex items-center gap-0.5 p-1 rounded-[12px] bg-[var(--surface-sunken)] border border-[var(--border-hairline)] shrink-0">
                {QUEUE_TABS.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setQueueTab(tab)}
                    className="h-7 px-3 rounded-[9px] text-[12px] font-medium transition-all duration-150"
                    style={
                      queueTab === tab
                        ? {
                            background: "var(--surface-card)",
                            color: "var(--text-primary)",
                            boxShadow: "var(--shadow-sm)",
                          }
                        : { color: "var(--text-tertiary)" }
                    }
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* DataTable */}
            <DataTable
              columns={signalsColumns}
              data={signalsData}
              rowKey={(row) => row._id}
              loading={loading}
              error={error}
              selectable
              selectedKeys={selectedLeads}
              onSelectionChange={setSelectedLeads}
              onRowClick={setSelectedLead}
              emptyMessage="No priority leads"
              emptyHint="Leads will appear here as they are captured and ranked"
              maxHeight="calc(100vh - 480px)"
              pagination={{
                page: currentPage,
                pageSize: pagination.limit,
                total: signalsData.length,
                onPageChange: goToPage,
                onPageSizeChange: setPageSize,
              }}
            />
          </div>
        </div>

        {/* Lead detail drawer */}
        {selectedLead && (
          <LeadDetailSidebar
            lead={selectedLead}
            onClose={() => setSelectedLead(null)}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

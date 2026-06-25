import { useNavigate } from "react-router-dom";
import { useAuth } from "src/hooks/useAuth";
import { useMetrics } from "src/hooks/useMetrics";
import { DashboardLayout } from "src/components/DashboardLayout";
import { MetricCard } from "src/common/components/MetricCard";
import { SectionCard } from "src/common/components/SectionCard";
import { RecentCaptures } from "./components/RecentCaptures";
import {
  Users,
  Zap,
  Activity,
  TrendingUp,
  MessageCircle,
  List,
} from "lucide-react";


const TOP_SIGNALS = [
  {
    title: "Clearbit is hiring 8 SDRs",
    type: "Hiring signal",
    when: "2h ago",
    Icon: Users,
  },
  {
    title: "VerifAI raised $12M Series A",
    type: "Funding signal",
    when: "4h ago",
    Icon: TrendingUp,
  },
  {
    title: "Expandly CEO posted on revenue growth",
    type: "Engagement signal",
    when: "6h ago",
    Icon: MessageCircle,
  },
];

export function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { metrics, loading: metricsLoading } = useMetrics();

  const fmt = (val) => (metricsLoading ? "—" : (val?.toLocaleString() ?? "—"));
  const pct = (val) => (metricsLoading ? undefined : val);

  return (
    <DashboardLayout
      title={`Good morning, ${user?.name?.split(" ")[0] || "there"} 👋`}
      subtitle="Here's what's happening with your outbound today."
    >
      <div className="p-7 flex flex-col gap-6 w-full">
        {/* Chrome promo — signature gradient hero banner */}
        <div
          className="relative overflow-hidden rounded-[20px] p-6 text-white glass-sheen flex items-center gap-5"
          style={{
            background: "var(--brand-gradient-vivid)",
            boxShadow: "var(--shadow-lg)",
          }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(160deg, rgba(255,255,255,0.28), rgba(255,255,255,0) 45%)",
            }}
          />
          <span
            className="relative grid place-items-center w-12 h-12 rounded-[14px] shrink-0"
            style={{ background: "rgba(255,255,255,0.2)" }}
          >
            <svg viewBox="0 0 24 24" width="24" height="24" fill="white">
              <circle
                cx="12"
                cy="12"
                r="10"
                fill="none"
                stroke="white"
                strokeWidth="2"
              />
              <circle cx="12" cy="12" r="4" fill="white" />
            </svg>
          </span>
          <div className="relative min-w-0 flex-1">
            <h3 className="text-[18px] font-bold tracking-[-0.014em]">
              Capture leads in one click
            </h3>
            <p
              className="text-[13.5px] mt-1 leading-relaxed"
              style={{ color: "rgba(255,255,255,0.85)" }}
            >
              Add Spurly to Chrome and pull profiles straight from LinkedIn
              &amp; Sales Navigator.
            </p>
          </div>
          <button
            className="relative shrink-0 h-11 px-6 rounded-[13px] bg-white font-bold text-[14px] transition-transform active:scale-[0.97] hover:-translate-y-px"
            style={{ color: "var(--brand-purple)" }}
          >
            Add to Chrome — it's free
          </button>
        </div>

        {/* Metrics row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <MetricCard
            label="Leads captured"
            value={fmt(metrics?.leadsCapture?.thisWeek)}
            delta={pct(metrics?.leadsCapture?.percentageChange)}
            icon={<Users size={18} />}
            variant="glass"
          />
          <MetricCard
            label="Credits left"
            value={fmt(user?.creditBalance)}
            icon={<Zap size={18} />}
            hint="Each credit enriches one lead with email, phone & intent signals."
          />
          <MetricCard
            label="Sessions this week"
            value={fmt(metrics?.sessions?.thisWeek)}
            delta={pct(metrics?.sessions?.percentageChange)}
            icon={<Activity size={18} />}
          />
        </div>

        {/* Content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-6 items-start">
          {/* Left column */}
          <div className="flex flex-col gap-6">
            <RecentCaptures pageSize={5} onViewAll={() => navigate('/dashboard/leads')} />
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-6">
            {/* Top Signals */}
            <SectionCard title="Top signals" onViewAll={() => navigate('/dashboard/signals')} noPadding>
              <div className="divide-y divide-[var(--separator)]">
                {TOP_SIGNALS.map((signal, i) => (
                  <div key={i} className="flex gap-3 px-5 py-3.5">
                    <span
                      className="w-9 h-9 grid place-items-center rounded-[10px] shrink-0"
                      style={{
                        background: "var(--accent-tint)",
                        color: "var(--brand-purple)",
                      }}
                    >
                      <signal.Icon size={16} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13.5px] font-semibold text-[var(--text-primary)] leading-snug">
                        {signal.title}
                      </p>
                      <p className="text-[12px] text-[var(--text-tertiary)] mt-0.5">
                        {signal.type} · {signal.when}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        </div>

        {/* Top Titles — full width */}
        <SectionCard title="Best Industries" onViewAll={() => navigate('/dashboard/leads')} noPadding>
          <div className="divide-y divide-[var(--separator)]">
            {metricsLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3.5">
                  <span className="w-9 h-9 rounded-[10px] shrink-0 animate-pulse" style={{ background: 'var(--surface-sunken)' }} />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-40 rounded animate-pulse" style={{ background: 'var(--surface-sunken)' }} />
                    <div className="h-2.5 w-24 rounded animate-pulse" style={{ background: 'var(--surface-sunken)' }} />
                  </div>
                  <div className="h-3 w-8 rounded animate-pulse" style={{ background: 'var(--surface-sunken)' }} />
                </div>
              ))
            ) : metrics.topTitles.length === 0 ? (
              <div className="px-5 py-8 text-center text-[13px] text-[var(--text-tertiary)]">
                No title data yet
              </div>
            ) : (
              metrics.topTitles.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-5 py-3.5 hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
                >
                  <span
                    className="w-9 h-9 grid place-items-center rounded-[10px] shrink-0"
                    style={{ background: "var(--accent-tint)", color: "var(--brand-purple)" }}
                  >
                    <List size={16} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13.5px] font-semibold text-[var(--text-primary)] truncate">
                      {item.title}
                    </div>
                    <div className="text-[12px] text-[var(--text-tertiary)]">
                      Top captured role
                    </div>
                  </div>
                  <span className="text-[13px] font-bold text-[var(--text-primary)] tabular-nums">
                    {item.count}
                  </span>
                  <span className="text-[12px] text-[var(--text-tertiary)]">leads</span>
                </div>
              ))
            )}
          </div>
        </SectionCard>
      </div>
    </DashboardLayout>
  );
}

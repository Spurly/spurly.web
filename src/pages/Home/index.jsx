import { useAuth } from 'src/hooks/useAuth';
import { DashboardLayout } from 'src/components/DashboardLayout';
import { MetricCard } from 'src/common/components/MetricCard';
import { Table } from 'src/common/components/Table';
import { Badge } from 'src/common/components/Badge';
import { SectionCard } from 'src/common/components/SectionCard';
import { Users, CheckCircle, Mail, Download, TrendingUp } from 'lucide-react';
import { useState } from 'react';

export function HomePage() {
  const { user } = useAuth();

  const [recentCaptures] = useState([
    { id: 1, name: 'Sarah Chen', role: 'VP of Marketing', company: 'Clearbit', time: '2m ago', status: 'Enriched' },
    { id: 2, name: 'Arjun Patel', role: 'Founder & CEO', company: 'VerifAI', time: '5m ago', status: 'Enriching' },
    { id: 3, name: 'Michael Torres', role: 'Head of Growth', company: 'Expandly', time: '12m ago', status: 'Queued' },
    { id: 4, name: 'Emily Johnson', role: 'Growth Lead', company: 'Laminar', time: '18m ago', status: 'Enriched' },
    { id: 5, name: 'James Wilson', role: 'COO', company: 'Finwise', time: '25m ago', status: 'Enriched' },
  ]);

  const [activeLists] = useState([
    { id: 1, name: 'SaaS Founders - US', leads: 248, updated: '2h ago' },
    { id: 2, name: 'Fintech Marketing Leaders', leads: 156, updated: '5h ago' },
    { id: 3, name: 'AI Startups - Series A+', leads: 342, updated: '8h ago' },
    { id: 4, name: 'Outbound SDRs - Europe', leads: 192, updated: '1d ago' },
    { id: 5, name: 'E-commerce Growth Teams', leads: 310, updated: '2d ago' },
  ]);

  const [topSignals] = useState([
    { id: 1, title: 'Clearbit is hiring 8 SDRs', icon: Users, type: 'Hiring signal', time: '2h ago' },
    { id: 2, title: 'VerifAI raised $12M Series A', icon: TrendingUp, type: 'Funding signal', time: '4h ago' },
    { id: 3, title: 'Expandly CEO posted about revenue growth', icon: TrendingUp, type: 'Engagement signal', time: '6h ago' },
    { id: 4, title: 'Laminar is hiring a Head of Sales', icon: Users, type: 'Hiring signal', time: '8h ago' },
  ]);

  const captureColumns = [
    { key: 'name', label: 'Name' },
    { key: 'role', label: 'Role' },
    { key: 'company', label: 'Company', render: (company) => (
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-spurly bg-spurly-surface-bg flex items-center justify-center text-xs font-semibold">
          {company.charAt(0)}
        </div>
        {company}
      </div>
    )},
    { key: 'time', label: 'Time' },
    { key: 'status', label: 'Status', render: (status) => (
      <Badge variant={status === 'Enriched' ? 'success' : status === 'Enriching' ? 'primary' : 'warning'}>
        {status}
      </Badge>
    )},
  ];

  const listColumns = [
    { key: 'name', label: 'Name' },
    { key: 'leads', label: 'Leads', render: (leads) => (
      <span className="font-semibold text-spurly-navy-light">{leads}</span>
    )},
    { key: 'updated', label: 'Updated' },
  ];

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Greeting */}
        <div className="mb-8">
          <h1 className="text-section-heading font-bold text-spurly-navy-light">
            Good morning, {user?.name || 'User'}! 👋
          </h1>
          <p className="text-body text-spurly-text-secondary mt-2">
            Here's what's happening with your outbound workflow today.
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            label="Leads Captured"
            value="1,248"
            change="18.5"
            icon={Users}
          />
          <MetricCard
            label="Enriched"
            value="892"
            change="22.4"
            icon={CheckCircle}
          />
          <MetricCard
            label="Verified Emails"
            value="643"
            change="16.7"
            icon={Mail}
          />
          <MetricCard
            label="Exports"
            value="12"
            change="9.1"
            icon={Download}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - 2 columns wide */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recent Captures */}
            <SectionCard
              title="Recent Captures"
              onViewAll={() => console.log('View all captures')}
            >
              <Table columns={captureColumns} data={recentCaptures} />
            </SectionCard>

            {/* Active Lists */}
            <SectionCard
              title="Active Lists"
              onViewAll={() => console.log('View all lists')}
            >
              <Table columns={listColumns} data={activeLists} />
            </SectionCard>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Top Signals */}
            <SectionCard title="Top Signals" onViewAll={() => console.log('View all signals')}>
              <div className="space-y-4">
                {topSignals.map((signal) => (
                  <div key={signal.id} className="pb-4 border-b border-spurly-border last:border-b-0 last:pb-0">
                    <div className="flex gap-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-spurly bg-spurly-purple/10 flex items-center justify-center">
                          <signal.icon size={16} className="text-spurly-purple" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-label font-semibold text-spurly-navy-light">{signal.title}</p>
                        <p className="text-label text-spurly-text-secondary mt-1">{signal.type}</p>
                        <p className="text-label text-spurly-text-secondary">{signal.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* Chrome Extension Card */}
            <div className="bg-gradient-to-br from-spurly-purple to-spurly-blue rounded-spurly-lg p-6 text-white shadow-spurly-lg">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-dashboard-title font-bold mb-1">Add Spurly to Chrome</h3>
                  <p className="text-body opacity-90">
                    Capture leads from LinkedIn and Sales Navigator in one click.
                  </p>
                </div>
                <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Ccircle cx='12' cy='12' r='10'/%3E%3C/svg%3E" alt="Chrome" className="w-12 h-12" />
              </div>
              <ul className="space-y-2 mb-6 text-sm">
                <li className="flex items-center gap-2">
                  <span className="text-lg">✓</span>
                  <span>Capture leads from any LinkedIn page</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-lg">✓</span>
                  <span>Extract from Sales Navigator searches</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-lg">✓</span>
                  <span>Enrich and build lists instantly</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-lg">✓</span>
                  <span>100% safe & LinkedIn compliant</span>
                </li>
              </ul>
              <button className="w-full bg-white text-spurly-purple font-bold py-3 rounded-spurly hover:bg-gray-50 transition mb-3">
                Add to Chrome — It's free
              </button>
              <button className="w-full text-white text-label font-medium hover:opacity-80 transition flex items-center justify-center gap-2">
                <span>▶</span> How it works
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

import { useState } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { Badge } from '../components/ui/Badge';
import { RotateCcw, Plus, MoreVertical, CheckCircle, AlertCircle, Clock, XCircle, ExternalLink } from 'lucide-react';

export function EnrichmentQueuePage() {
  const [activeTab, setActiveTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const leads = [
    {
      id: 1,
      name: 'Michael Thompson',
      title: 'Founder & CEO',
      company: 'CloudScale',
      status: 'Processing',
      statusPercent: 75,
      email: { status: 'Verified', value: 'michael@cloudscale.com' },
      phone: { status: 'Finding', value: '+1 (415) ***-0143' },
      companyData: { status: 'Enriching', percent: 85 },
      added: '2m ago',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael',
    },
    {
      id: 2,
      name: 'Sarah Chen',
      title: 'Co-Founder',
      company: 'Clearbit',
      status: 'Processing',
      statusPercent: 45,
      email: { status: 'Verified', value: 'sarah@clearbit.com' },
      phone: { status: 'Verified', value: '+1 (415) ***-9876' },
      companyData: { status: 'Enriching', percent: 60 },
      added: '5m ago',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    },
    {
      id: 3,
      name: 'Arjun Patel',
      title: 'VP of Sales',
      company: 'VerifAI',
      status: 'Queued',
      statusPercent: 0,
      email: { status: 'Queued', value: '- Waiting' },
      phone: { status: 'Queued', value: '- Queued' },
      companyData: { status: 'Queued', percent: 0 },
      added: '12m ago',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Arjun',
    },
    {
      id: 4,
      name: 'Emily Johnson',
      title: 'Head of Growth',
      company: 'Laminar',
      status: 'Verified',
      statusPercent: 100,
      email: { status: 'Verified', value: 'emily@laminar.io' },
      phone: { status: 'Verified', value: '+1 (512) ***-3321' },
      companyData: { status: 'Enriched', percent: 100 },
      added: '18m ago',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily',
    },
    {
      id: 5,
      name: 'David Kim',
      title: 'CEO',
      company: 'Finwise',
      status: 'Partial Match',
      statusPercent: 65,
      email: { status: 'Partial', value: 'david@finwise.com' },
      phone: { status: 'Not Found', value: '-' },
      companyData: { status: 'Enriched', percent: 80 },
      added: '25m ago',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David',
    },
    {
      id: 6,
      name: 'James Wilson',
      title: 'Founder',
      company: 'Relate',
      status: 'Failed',
      statusPercent: 0,
      email: { status: 'Not Found', value: '✗ Not Found' },
      phone: { status: 'Not Found', value: '✗ Not Found' },
      companyData: { status: 'Failed', percent: 0 },
      added: '32m ago',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=James',
    },
    {
      id: 7,
      name: 'Olivia Martinez',
      title: 'VP of Sales',
      company: 'Userflow',
      status: 'Processing',
      statusPercent: 90,
      email: { status: 'Verified', value: 'olivia@userflow.com' },
      phone: { status: 'Finding', value: '+1 (213) ***-4455' },
      companyData: { status: 'Enriching', percent: 95 },
      added: '35m ago',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Olivia',
    },
    {
      id: 8,
      name: 'Priya Shah',
      title: 'Co-Founder',
      company: 'Propel',
      status: 'Queued',
      statusPercent: 0,
      email: { status: 'Queued', value: '- Waiting' },
      phone: { status: 'Queued', value: '- Queued' },
      companyData: { status: 'Queued', percent: 0 },
      added: '40m ago',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya',
    },
  ];

  const tabs = [
    { id: 'all', label: 'All', count: '156' },
    { id: 'queued', label: 'Queued', count: '28' },
    { id: 'processing', label: 'Processing', count: '38' },
    { id: 'verified', label: 'Verified', count: '72' },
    { id: 'partial', label: 'Partial', count: '12' },
    { id: 'failed', label: 'Failed', count: '6' },
  ];

  const stats = {
    total: 156,
    queued: 28,
    processing: 38,
    verified: 72,
    partial: 12,
    failed: 6,
    successRate: 87,
    avgTime: '2m 34s',
    creditsUsed: 1248,
    creditsTotal: 25000,
  };

  const activity = [
    { id: 1, icon: CheckCircle, title: '72 leads enriched successfully', time: '2m ago', color: 'text-spurly-success' },
    { id: 2, icon: AlertCircle, title: '12 leads partially enriched', time: '6m ago', color: 'text-spurly-warning' },
    { id: 3, icon: XCircle, title: '6 leads failed enrichment', time: '11m ago', color: 'text-spurly-error' },
    { id: 4, icon: Plus, title: '38 leads enrichment started', time: '15m ago', color: 'text-spurly-purple' },
    { id: 5, icon: Plus, title: '28 leads added to queue', time: '22m ago', color: 'text-spurly-blue' },
  ];

  const providers = [
    { name: 'Apollo', status: 'Healthy', online: true },
    { name: 'Hunter', status: 'Healthy', online: true },
    { name: 'Clearbit', status: 'Healthy', online: true },
    { name: 'Dropcontact', status: 'Healthy', online: true },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'Verified':
        return 'text-spurly-success';
      case 'Processing':
        return 'text-spurly-blue';
      case 'Queued':
        return 'text-spurly-warning';
      case 'Partial Match':
        return 'text-spurly-warning';
      case 'Failed':
        return 'text-spurly-error';
      default:
        return 'text-spurly-text-secondary';
    }
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'Verified':
        return 'success';
      case 'Processing':
        return 'primary';
      case 'Queued':
        return 'warning';
      case 'Partial Match':
        return 'warning';
      case 'Failed':
        return 'error';
      default:
        return 'default';
    }
  };

  const getFieldStatusIcon = (fieldStatus) => {
    switch (fieldStatus) {
      case 'Verified':
        return <CheckCircle size={14} className="text-spurly-success" />;
      case 'Finding':
        return <Clock size={14} className="text-spurly-warning" />;
      case 'Queued':
        return <Clock size={14} className="text-spurly-warning" />;
      case 'Enriching':
        return <Clock size={14} className="text-spurly-warning" />;
      case 'Not Found':
      case 'Failed':
        return <XCircle size={14} className="text-spurly-error" />;
      case 'Enriched':
        return <CheckCircle size={14} className="text-spurly-success" />;
      case 'Partial':
        return <AlertCircle size={14} className="text-spurly-warning" />;
      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="flex h-full bg-spurly-surface-bg overflow-hidden">
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-white border-b border-spurly-border px-8 py-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-dashboard-title font-bold text-spurly-navy-light">Enrichment Queue</h1>
                <p className="text-body text-spurly-text-secondary mt-1">
                  Monitor and manage lead enrichment in real-time.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button className="flex items-center gap-2 px-4 py-2 rounded-spurly hover:bg-spurly-surface-bg text-spurly-navy-light font-medium text-label transition">
                  <RotateCcw size={16} />
                  Refresh
                </button>
                <button className="flex items-center gap-2 px-4 py-3 rounded-spurly bg-spurly-purple hover:bg-spurly-blue text-white font-medium text-label transition">
                  <Plus size={16} />
                  Enrich More Leads
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-6 border-t border-spurly-border pt-4">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`text-label font-semibold transition ${
                    activeTab === tab.id
                      ? 'text-spurly-navy-light border-b-2 border-spurly-purple pb-4'
                      : 'text-spurly-text-secondary hover:text-spurly-navy-light'
                  }`}
                >
                  {tab.label} <span className="text-spurly-purple font-bold">{tab.count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-x-auto bg-white">
            <table className="w-full">
              <thead>
                <tr className="border-b border-spurly-border">
                  <th className="px-6 py-4 text-left text-label font-semibold text-spurly-navy-light">Lead</th>
                  <th className="px-6 py-4 text-left text-label font-semibold text-spurly-navy-light">Company</th>
                  <th className="px-6 py-4 text-left text-label font-semibold text-spurly-navy-light">Status</th>
                  <th className="px-6 py-4 text-left text-label font-semibold text-spurly-navy-light">Email</th>
                  <th className="px-6 py-4 text-left text-label font-semibold text-spurly-navy-light">Phone</th>
                  <th className="px-6 py-4 text-left text-label font-semibold text-spurly-navy-light">Company Data</th>
                  <th className="px-6 py-4 text-left text-label font-semibold text-spurly-navy-light">Added</th>
                  <th className="px-6 py-4 text-left text-label font-semibold text-spurly-navy-light">Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id} className="border-b border-spurly-border hover:bg-spurly-surface-bg transition last:border-b-0">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={lead.avatar}
                          alt={lead.name}
                          className="w-8 h-8 rounded-spurly object-cover"
                        />
                        <div>
                          <p className="text-label font-semibold text-spurly-navy-light">{lead.name}</p>
                          <p className="text-label text-spurly-text-secondary">{lead.title}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-spurly bg-spurly-surface-bg flex items-center justify-center text-xs font-semibold">
                          {lead.company.charAt(0)}
                        </div>
                        <p className="text-label text-spurly-navy-light">{lead.company}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Badge variant={getStatusBadgeVariant(lead.status)}>
                          <span className={getStatusColor(lead.status)}>{lead.status}</span>
                        </Badge>
                        {lead.statusPercent > 0 && (
                          <div className="w-20 h-1.5 bg-spurly-surface-bg rounded-spurly overflow-hidden">
                            <div
                              className="h-full bg-spurly-blue transition-all"
                              style={{ width: `${lead.statusPercent}%` }}
                            ></div>
                          </div>
                        )}
                        {lead.statusPercent > 0 && (
                          <span className="text-label text-spurly-text-secondary w-10">{lead.statusPercent}%</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getFieldStatusIcon(lead.email.status)}
                        <span className="text-label text-spurly-navy-light">{lead.email.value}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getFieldStatusIcon(lead.phone.status)}
                        <span className="text-label text-spurly-navy-light">{lead.phone.value}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getFieldStatusIcon(lead.companyData.status)}
                        <span className="text-label text-spurly-navy-light">{lead.companyData.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-label text-spurly-text-secondary">{lead.added}</p>
                    </td>
                    <td className="px-6 py-4">
                      <button className="p-2 hover:bg-spurly-surface-bg rounded-spurly transition">
                        <MoreVertical size={16} className="text-spurly-text-secondary" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="bg-white border-t border-spurly-border px-6 py-4 flex items-center justify-between">
            <p className="text-label text-spurly-text-secondary">Showing 1 to 8 of 156 results</p>
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-spurly-surface-bg rounded-spurly transition text-spurly-text-secondary">←</button>
              {[1, 2, 3, 4, 5].map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-2 rounded-spurly transition text-label font-medium ${
                    currentPage === page
                      ? 'bg-spurly-purple text-white'
                      : 'hover:bg-spurly-surface-bg text-spurly-navy-light'
                  }`}
                >
                  {page}
                </button>
              ))}
              <span className="px-3 py-2 text-spurly-text-secondary">...</span>
              <button className="px-3 py-2 rounded-spurly hover:bg-spurly-surface-bg transition text-spurly-navy-light text-label font-medium">
                20
              </button>
              <button className="p-2 hover:bg-spurly-surface-bg rounded-spurly transition text-spurly-text-secondary">→</button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-label text-spurly-text-secondary">Rows per page:</span>
              <select className="px-3 py-2 rounded-spurly border border-spurly-border text-label font-medium text-spurly-navy-light">
                <option>10</option>
                <option>20</option>
                <option>50</option>
              </select>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Overview */}
        <div className="w-80 bg-white border-l border-spurly-border flex flex-col overflow-y-auto">
          <div className="px-6 py-6 border-b border-spurly-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-dashboard-title font-bold text-spurly-navy-light">Enrichment Overview</h3>
              <span className="flex items-center gap-1 text-label font-semibold text-spurly-success">
                <span className="w-2 h-2 rounded-full bg-spurly-success"></span>
                Live Status
              </span>
            </div>

            {/* Donut Chart */}
            <div className="flex flex-col items-center">
              <div className="relative w-40 h-40 mb-6">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#E2E8F0" strokeWidth="12" />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#22C55E"
                    strokeWidth="12"
                    strokeDasharray={`${(stats.verified / stats.total) * 251.2} 251.2`}
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#3B82F6"
                    strokeWidth="12"
                    strokeDasharray={`${(stats.processing / stats.total) * 251.2} 251.2`}
                    strokeDashoffset={-((stats.verified / stats.total) * 251.2)}
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#F59E0B"
                    strokeWidth="12"
                    strokeDasharray={`${((stats.queued + stats.partial) / stats.total) * 251.2} 251.2`}
                    strokeDashoffset={-(((stats.verified + stats.processing) / stats.total) * 251.2)}
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#EF4444"
                    strokeWidth="12"
                    strokeDasharray={`${(stats.failed / stats.total) * 251.2} 251.2`}
                    strokeDashoffset={-(((stats.verified + stats.processing + stats.queued + stats.partial) / stats.total) * 251.2)}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-dashboard-title font-bold text-spurly-navy-light">{stats.total}</p>
                  <p className="text-label text-spurly-text-secondary">Total</p>
                </div>
              </div>

              {/* Legend */}
              <div className="w-full space-y-2">
                <div className="flex items-center justify-between text-label">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-spurly-success"></span>
                    <span className="text-spurly-text-secondary">Queued</span>
                  </div>
                  <span className="font-semibold text-spurly-navy-light">{stats.queued}</span>
                </div>
                <div className="flex items-center justify-between text-label">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-spurly-blue"></span>
                    <span className="text-spurly-text-secondary">Processing</span>
                  </div>
                  <span className="font-semibold text-spurly-navy-light">{stats.processing}</span>
                </div>
                <div className="flex items-center justify-between text-label">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-spurly-success"></span>
                    <span className="text-spurly-text-secondary">Verified</span>
                  </div>
                  <span className="font-semibold text-spurly-navy-light">{stats.verified}</span>
                </div>
                <div className="flex items-center justify-between text-label">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-spurly-warning"></span>
                    <span className="text-spurly-text-secondary">Partial</span>
                  </div>
                  <span className="font-semibold text-spurly-navy-light">{stats.partial}</span>
                </div>
                <div className="flex items-center justify-between text-label">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-spurly-error"></span>
                    <span className="text-spurly-text-secondary">Failed</span>
                  </div>
                  <span className="font-semibold text-spurly-navy-light">{stats.failed}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="px-6 py-6 border-b border-spurly-border space-y-6">
            <div>
              <p className="text-label font-semibold text-spurly-text-secondary mb-2">Success Rate</p>
              <p className="text-section-heading font-bold text-spurly-navy-light">{stats.successRate}%</p>
              <p className="text-label text-spurly-success mt-1">↑ 12% vs last 7 days</p>
            </div>
            <div>
              <p className="text-label font-semibold text-spurly-text-secondary mb-2">Avg. Time</p>
              <p className="text-section-heading font-bold text-spurly-navy-light">{stats.avgTime}</p>
              <p className="text-label text-spurly-error mt-1">↓ 18% vs last 7 days</p>
            </div>
            <div>
              <p className="text-label font-semibold text-spurly-text-secondary mb-2">Credits Used</p>
              <p className="text-section-heading font-bold text-spurly-navy-light">{stats.creditsUsed.toLocaleString()}</p>
              <div className="w-full h-2 bg-spurly-surface-bg rounded-spurly mt-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-spurly-purple to-spurly-blue"
                  style={{ width: `${(stats.creditsUsed / stats.creditsTotal) * 100}%` }}
                ></div>
              </div>
              <p className="text-label text-spurly-text-secondary mt-1">of {stats.creditsTotal.toLocaleString()}</p>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="px-6 py-6 border-b border-spurly-border">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-label font-bold text-spurly-navy-light">Recent Activity</h4>
              <a href="#" className="text-label font-medium text-spurly-purple hover:text-spurly-blue transition">
                View all
              </a>
            </div>
            <div className="space-y-3">
              {activity.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.id} className="flex items-start gap-3 pb-3 border-b border-spurly-border last:border-b-0 last:pb-0">
                    <Icon size={16} className={`${item.color} flex-shrink-0 mt-1`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-label font-medium text-spurly-navy-light">{item.title}</p>
                      <p className="text-label text-spurly-text-secondary">{item.time}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Data Providers */}
          <div className="px-6 py-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-label font-bold text-spurly-navy-light">Data Providers</h4>
              <span className="flex items-center gap-1 text-label font-semibold text-spurly-success">
                <span className="w-2 h-2 rounded-full bg-spurly-success"></span>
                All systems operational
              </span>
            </div>
            <div className="space-y-3">
              {providers.map((provider) => (
                <div key={provider.name} className="flex items-center justify-between p-3 rounded-spurly bg-spurly-surface-bg">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-spurly-success"></div>
                    <p className="text-label font-medium text-spurly-navy-light">{provider.name}</p>
                  </div>
                  <p className="text-label text-spurly-success font-semibold">{provider.status}</p>
                </div>
              ))}
            </div>
            <a href="#" className="text-label font-medium text-spurly-purple hover:text-spurly-blue transition mt-4 inline-flex items-center gap-1">
              View provider status <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

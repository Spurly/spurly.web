import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from 'src/components/DashboardLayout';
import { Badge } from 'src/common/components/Badge';
import { ChevronLeft, ChevronRight, Mail, Phone, Linkedin, MapPin, Clock, ExternalLink, Plus } from 'lucide-react';

export function LeadDetailPage() {
  const { leadId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  // Mock data - in real app, fetch from API
  const lead = {
    id: 1,
    name: 'Michael Thompson',
    title: 'Founder & CEO',
    company: 'CloudScale',
    email: 'michael@cloudscale.com',
    phone: '+1 (415) 555-0143',
    linkedin: 'https://linkedin.com/in/michaelthompson',
    location: 'San Francisco, CA, United States',
    timeInRole: '2 years 3 months',
    status: 'Actively hiring',
    badgeType: 'success',
    aiScore: 92,
    aiGrade: 'Excellent Fit',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael',
    connections: '500+ connections',
    signals: ['Hiring SDRs', 'Recently funded', 'High engagement', 'Strong growth'],
    emails: ['michael@cloudscale.com', 'm.thompson@cloudscale.com'],
    enrichedStatus: 'Verified',
    companyInfo: {
      name: 'CloudScale',
      website: 'cloudscale.com',
      description: 'Cloud infrastructure platform for modern teams.',
      industry: 'Software Development',
      funding: '$22M Series A (Mar 2024)',
      headquarters: 'San Francisco, CA',
      employees: '51-200 employees',
      founded: '2020',
      growth: '40% (last 6 months)',
    },
    keyHighlights: [
      'Actively hiring SDRs and AEs',
      'Raised $22M Series A (Mar 2024)',
      '40% headcount growth in 6 months',
      'Founder active on LinkedIn',
    ],
    signalsTimeline: [
      { date: '10 May, 2024', title: 'Company is hiring 5 SDRs and 2 Account Executives', type: 'Hiring' },
      { date: '2 May, 2024', title: 'CloudScale raised $22M Series A round led by Accel', type: 'Funding' },
      { date: '28 Apr, 2024', title: 'Michael shared a post about scaling outbound teams', type: 'Engagement' },
      { date: '18 Apr, 2024', title: 'Company headcount grew 40% in last 6 months', type: 'Growth' },
      { date: '5 Apr, 2024', title: 'Michael changed role from COO to CEO', type: 'Update' },
    ],
    activity: [
      { date: '10 May, 2024', time: '10:24 AM', user: 'Rohit Sharma', action: 'Note', description: 'Strong outbound intent. Actively hiring and recently funded.' },
      { date: '9 May, 2024', time: '4:15 PM', user: 'Rohit Sharma', action: 'Added to list', description: 'Added to list "SaaS - Actively Hiring SDRs"' },
      { date: '9 May, 2024', time: '4:10 PM', user: 'System', action: 'Enrichment', description: 'Email verified' },
    ],
    lists: [
      { name: 'SaaS - Actively Hiring SDRs', leads: 248, icon: '📋' },
      { name: 'Series A Funding - Last 6 Months', leads: 156, icon: '📊' },
      { name: 'US - SaaS Founders', leads: 342, icon: '👥' },
    ],
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'contact', label: 'Contact & Enrichment' },
    { id: 'company', label: 'Company' },
    { id: 'signals', label: 'Signals' },
    { id: 'activity', label: 'Activity' },
    { id: 'notes', label: 'Notes' },
    { id: 'lists', label: 'Lists' },
    { id: 'exports', label: 'Exports' },
  ];

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full overflow-hidden bg-white">
        {/* Header */}
        <div className="border-b border-spurly-border px-8 py-6">
          <div className="flex items-start justify-between mb-6">
            <button
              onClick={() => navigate('/dashboard/leads')}
              className="flex items-center gap-2 text-label font-semibold text-spurly-purple hover:text-spurly-blue transition"
            >
              <ChevronLeft size={18} />
              Back to Captured Leads
            </button>
            <div className="flex items-center gap-3">
              <button className="p-2 hover:bg-spurly-surface-bg rounded-spurly transition">
                <ChevronLeft size={20} className="text-spurly-text-secondary" />
              </button>
              <button className="p-2 hover:bg-spurly-surface-bg rounded-spurly transition">
                <ChevronRight size={20} className="text-spurly-text-secondary" />
              </button>
            </div>
          </div>

          <div className="flex items-start justify-between">
            <div className="flex items-start gap-6">
              <img
                src={lead.avatar}
                alt={lead.name}
                className="w-24 h-24 rounded-spurly object-cover"
              />
              <div>
                <h1 className="text-section-heading font-bold text-spurly-navy-light">{lead.name}</h1>
                <p className="text-body text-spurly-text-secondary mt-1">
                  {lead.title} at {lead.company}
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <Badge variant="success">{lead.status}</Badge>
                  <Badge variant="primary">{lead.aiGrade}</Badge>
                </div>
                <p className="text-label text-spurly-text-secondary mt-3">{lead.location} • {lead.connections}</p>
                <div className="flex gap-2 mt-4">
                  <a href={`mailto:${lead.email}`} className="p-2 hover:bg-spurly-surface-bg rounded-spurly transition">
                    <Mail size={18} className="text-spurly-purple" />
                  </a>
                  <button className="p-2 hover:bg-spurly-surface-bg rounded-spurly transition">
                    <Phone size={18} className="text-spurly-purple" />
                  </button>
                  <a href={lead.linkedin} className="p-2 hover:bg-spurly-surface-bg rounded-spurly transition">
                    <Linkedin size={18} className="text-spurly-purple" />
                  </a>
                  <button className="p-2 hover:bg-spurly-surface-bg rounded-spurly transition">
                    <ExternalLink size={18} className="text-spurly-purple" />
                  </button>
                </div>
              </div>
            </div>

            <div className="text-right">
              <p className="text-label text-spurly-text-secondary mb-2">AI Score</p>
              <div className="text-section-heading font-bold text-spurly-navy-light">{lead.aiScore}</div>
              <p className="text-label font-semibold text-spurly-success mt-1">{lead.aiGrade}</p>
              <div className="w-32 h-1 bg-spurly-surface-bg rounded-spurly mt-3 overflow-hidden">
                <div className="w-full h-full bg-spurly-success"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-spurly-border px-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`text-label font-semibold pb-4 px-6 border-b-2 transition whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-spurly-navy-light border-spurly-purple'
                  : 'text-spurly-text-secondary border-transparent hover:text-spurly-navy-light'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-8 py-6">
            {activeTab === 'overview' && (
              <div className="grid grid-cols-3 gap-8">
                <div className="col-span-2">
                  <h3 className="text-dashboard-title font-bold text-spurly-navy-light mb-4">Key Highlights</h3>
                  <ul className="space-y-3">
                    {lead.keyHighlights.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-body text-spurly-text-secondary">
                        <span className="text-spurly-success mt-1">✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-6">
                  <div>
                    <p className="text-label font-semibold text-spurly-text-secondary mb-3">Quick Actions</p>
                    <div className="space-y-2">
                      <button className="w-full px-4 py-3 rounded-spurly border border-spurly-border hover:bg-spurly-surface-bg transition text-label font-medium text-spurly-navy-light flex items-center gap-2">
                        <Plus size={16} /> Enrich Lead
                      </button>
                      <button className="w-full px-4 py-3 rounded-spurly border border-spurly-border hover:bg-spurly-surface-bg transition text-label font-medium text-spurly-navy-light flex items-center gap-2">
                        <Plus size={16} /> Add to List
                      </button>
                      <button className="w-full px-4 py-3 rounded-spurly border border-spurly-border hover:bg-spurly-surface-bg transition text-label font-medium text-spurly-navy-light flex items-center gap-2">
                        <Plus size={16} /> Export Lead
                      </button>
                      <button className="w-full px-4 py-3 rounded-spurly border border-spurly-border hover:bg-spurly-surface-bg transition text-label font-medium text-spurly-navy-light flex items-center gap-2">
                        <Plus size={16} /> Find Similar Leads
                      </button>
                      <button className="w-full px-4 py-3 rounded-spurly border border-spurly-border hover:bg-spurly-surface-bg transition text-label font-medium text-spurly-navy-light flex items-center gap-2">
                        <Plus size={16} /> Start Campaign
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'contact' && (
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <h3 className="text-dashboard-title font-bold text-spurly-navy-light mb-6">Contact Information</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-label font-semibold text-spurly-text-secondary mb-2">Email</p>
                      {lead.emails.map((email, idx) => (
                        <p key={idx} className="text-body text-spurly-purple mb-1">
                          <a href={`mailto:${email}`} className="hover:text-spurly-blue transition">
                            {email}
                          </a>
                          <Badge variant="success" className="ml-2">Verified</Badge>
                        </p>
                      ))}
                    </div>
                    <div>
                      <p className="text-label font-semibold text-spurly-text-secondary mb-2">Phone</p>
                      <p className="text-body text-spurly-navy-light">{lead.phone}</p>
                      <Badge variant="success">Verified</Badge>
                    </div>
                    <div>
                      <p className="text-label font-semibold text-spurly-text-secondary mb-2">LinkedIn</p>
                      <a href={lead.linkedin} className="text-body text-spurly-purple hover:text-spurly-blue transition">
                        linkedin.com/in/michaelthompson
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'company' && (
              <div>
                <h3 className="text-dashboard-title font-bold text-spurly-navy-light mb-6">Company Information</h3>
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <div className="flex items-start gap-4 mb-6">
                      <div className="w-12 h-12 rounded-spurly bg-spurly-surface-bg flex items-center justify-center text-lg font-bold">
                        C
                      </div>
                      <div>
                        <h4 className="text-label font-bold text-spurly-navy-light">{lead.companyInfo.name}</h4>
                        <a href={`https://${lead.companyInfo.website}`} className="text-label text-spurly-purple hover:text-spurly-blue transition">
                          {lead.companyInfo.website}
                        </a>
                      </div>
                    </div>
                    <p className="text-body text-spurly-text-secondary mb-6">{lead.companyInfo.description}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-label font-semibold text-spurly-text-secondary mb-1">Industry</p>
                      <p className="text-body text-spurly-navy-light">{lead.companyInfo.industry}</p>
                    </div>
                    <div>
                      <p className="text-label font-semibold text-spurly-text-secondary mb-1">Funding</p>
                      <p className="text-body text-spurly-navy-light">{lead.companyInfo.funding}</p>
                    </div>
                    <div>
                      <p className="text-label font-semibold text-spurly-text-secondary mb-1">Headquarters</p>
                      <p className="text-body text-spurly-navy-light">{lead.companyInfo.headquarters}</p>
                    </div>
                    <div>
                      <p className="text-label font-semibold text-spurly-text-secondary mb-1">Employees</p>
                      <p className="text-body text-spurly-navy-light">{lead.companyInfo.employees}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'signals' && (
              <div>
                <h3 className="text-dashboard-title font-bold text-spurly-navy-light mb-6">Signals Timeline</h3>
                <div className="space-y-4">
                  {lead.signalsTimeline.map((signal, idx) => (
                    <div key={idx} className="flex gap-4 pb-4 border-b border-spurly-border last:border-b-0">
                      <div className="flex-shrink-0 mt-1">
                        <div className="w-3 h-3 rounded-full bg-spurly-success"></div>
                      </div>
                      <div className="flex-1">
                        <p className="text-label font-semibold text-spurly-navy-light">{signal.date}</p>
                        <p className="text-body text-spurly-navy-light mt-1">{signal.title}</p>
                        <Badge variant="primary" className="mt-2">{signal.type}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'activity' && (
              <div>
                <h3 className="text-dashboard-title font-bold text-spurly-navy-light mb-6">Notes & Activity</h3>
                <div className="space-y-4">
                  {lead.activity.map((item, idx) => (
                    <div key={idx} className="pb-4 border-b border-spurly-border last:border-b-0">
                      <div className="flex items-start gap-3">
                        <img
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${item.user}`}
                          alt={item.user}
                          className="w-8 h-8 rounded-spurly object-cover"
                        />
                        <div className="flex-1">
                          <p className="text-label font-semibold text-spurly-navy-light">{item.user}</p>
                          <p className="text-label text-spurly-text-secondary">{item.action}</p>
                          <p className="text-body text-spurly-navy-light mt-1">{item.description}</p>
                          <p className="text-label text-spurly-text-secondary mt-2">{item.date} • {item.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'lists' && (
              <div>
                <h3 className="text-dashboard-title font-bold text-spurly-navy-light mb-6">Lists ({lead.lists.length})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {lead.lists.map((list, idx) => (
                    <div key={idx} className="border border-spurly-border rounded-spurly p-4 hover:border-spurly-purple transition cursor-pointer">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-label font-bold text-spurly-navy-light">{list.name}</p>
                          <p className="text-label text-spurly-text-secondary mt-1">{list.leads} leads</p>
                        </div>
                        <span className="text-2xl">{list.icon}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

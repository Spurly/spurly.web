import { useState } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { Tabs } from '../components/ui/Tabs';
import { ActionBar } from '../components/ui/ActionBar';
import { Badge } from '../components/ui/Badge';
import { LeadDetailSidebar } from '../components/LeadDetailSidebar';
import { Linkedin, Mail } from 'lucide-react';

export function CapturedLeadsPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [selectedLeads, setSelectedLeads] = useState(new Set());
  const [selectedLead, setSelectedLead] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const leads = [
    {
      id: 1,
      name: 'Michael Thompson',
      title: 'Founder & CEO',
      company: 'CloudScale',
      email: 'michael@cloudscale.com',
      phone: '+1 (415) 555-0143',
      linkedin: 'https://linkedin.com/in/michaelthompson',
      location: 'San Francisco, CA, United States',
      timeInRole: '2 years 3 months',
      enrichment: '100%',
      aiScore: 92,
      aiGrade: 'Excellent Fit',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael',
      capturedOn: '10 May, 2024',
      source: 'LinkedIn',
      status: 'Verified',
      badges: ['Hiring', 'Recently funded', 'High engagement'],
      aiSummary: 'Michael is the Founder & CEO of CloudScale, a fast-growing company in the infrastructure space. The company raised a Series A round 3 months ago and is actively hiring for sales roles.',
      keySignals: ['Hiring 5 SDRs and 2 Account Executives', 'Raised $12M Series A round 3 months ago', 'Company headcount grew 40% in last 6 months', 'Active on LinkedIn - posted 2 days ago'],
    },
    {
      id: 2,
      name: 'Sarah Chen',
      title: 'Co-Founder',
      company: 'Clearbit',
      email: 'sarah@clearbit.com',
      phone: '+1 (415) 555-0144',
      linkedin: 'https://linkedin.com/in/sarahchen',
      location: 'San Francisco, CA, United States',
      timeInRole: '4 years 2 months',
      enrichment: '100%',
      aiScore: 89,
      aiGrade: 'Great Fit',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
      capturedOn: '10 May, 2024',
      source: 'LinkedIn',
      status: 'Verified',
      badges: ['Hiring', 'High engagement'],
      aiSummary: 'Sarah is Co-Founder at Clearbit, leading the data enrichment space. Company is scaling and actively hiring.',
      keySignals: ['Hiring growth team', 'Series B funding', 'Strong market position', 'Active community engagement'],
    },
    {
      id: 3,
      name: 'Arjun Patel',
      title: 'VP of Sales',
      company: 'VerifAI',
      email: 'arjun@verfiai.com',
      phone: '+1 (415) 555-0145',
      linkedin: 'https://linkedin.com/in/arjunpatel',
      location: 'San Francisco, CA, United States',
      timeInRole: '1 year 8 months',
      enrichment: '100%',
      aiScore: 87,
      aiGrade: 'Great Fit',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Arjun',
      capturedOn: '10 May, 2024',
      source: 'LinkedIn',
      status: 'Verified',
      badges: ['Recently funded'],
      aiSummary: 'Arjun leads sales at VerifAI, a growing identity verification platform.',
      keySignals: ['Expanding sales team', 'Growing revenue', 'New market expansion', 'Series A funded'],
    },
    {
      id: 4,
      name: 'Emily Johnson',
      title: 'Head of Growth',
      company: 'Laminar',
      email: 'emily@laminar.io',
      phone: '+1 (415) 555-0146',
      linkedin: 'https://linkedin.com/in/emilyjohnson',
      location: 'San Francisco, CA, United States',
      timeInRole: '1 year 11 months',
      enrichment: '95%',
      aiScore: 85,
      aiGrade: 'Great Fit',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily',
      capturedOn: '10 May, 2024',
      source: 'LinkedIn',
      status: 'Verified',
      badges: ['Hiring'],
      aiSummary: 'Emily heads growth at Laminar, focusing on product-led growth strategies.',
      keySignals: ['Hiring growth roles', 'Product-led growth', 'Strong metrics', 'Team expansion'],
    },
    {
      id: 5,
      name: 'David Kim',
      title: 'CEO',
      company: 'Finwise',
      email: 'david@finwise.com',
      phone: '+1 (415) 555-0147',
      linkedin: 'https://linkedin.com/in/davidkim',
      location: 'San Francisco, CA, United States',
      timeInRole: '3 years 1 month',
      enrichment: '60%',
      aiScore: 84,
      aiGrade: 'Good Fit',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David',
      capturedOn: '10 May, 2024',
      source: 'LinkedIn',
      status: 'Partial',
      badges: [],
      aiSummary: 'David is CEO of Finwise, a fintech startup.',
      keySignals: ['Series A stage', 'Growing team', 'Active hiring', 'Market expansion'],
    },
    {
      id: 6,
      name: 'James Wilson',
      title: 'Founder',
      company: 'Relate',
      email: 'james@relate.io',
      phone: '+1 (415) 555-0148',
      linkedin: 'https://linkedin.com/in/jameswilson',
      location: 'San Francisco, CA, United States',
      timeInRole: '2 years 6 months',
      enrichment: '100%',
      aiScore: 83,
      aiGrade: 'Good Fit',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=James',
      capturedOn: '10 May, 2024',
      source: 'LinkedIn',
      status: 'Verified',
      badges: [],
      aiSummary: 'James founded Relate, a CRM platform for revenue teams.',
      keySignals: ['Growing user base', 'Hiring team', 'New features', 'Strong engagement'],
    },
  ];

  const tabs = [
    { id: 'all', label: 'All Leads', count: '1,248' },
    { id: 'new', label: 'New', count: '248' },
    { id: 'enriching', label: 'Enriching', count: '156' },
    { id: 'enriched', label: 'Enriched', count: '892' },
    { id: 'failed', label: 'Failed', count: '12' },
  ];

  const toggleLead = (leadId) => {
    const newSelected = new Set(selectedLeads);
    if (newSelected.has(leadId)) {
      newSelected.delete(leadId);
    } else {
      newSelected.add(leadId);
    }
    setSelectedLeads(newSelected);
  };

  const toggleAll = () => {
    if (selectedLeads.size === leads.length) {
      setSelectedLeads(new Set());
    } else {
      setSelectedLeads(new Set(leads.map(l => l.id)));
    }
  };

  return (
    <DashboardLayout>
      <div className="flex h-full bg-spurly-surface-bg">
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-white border-b border-spurly-border px-6 py-6">
            <h1 className="text-dashboard-title font-bold text-spurly-navy-light">Captured Leads</h1>
            <p className="text-body text-spurly-text-secondary mt-1">
              All leads captured from LinkedIn & Sales Navigator.
            </p>
          </div>

          {/* Tabs */}
          <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

          {/* Action Bar */}
          <ActionBar
            selectedCount={selectedLeads.size}
            onEnrich={() => console.log('Enrich')}
            onAddToList={() => console.log('Add to List')}
            onExport={() => console.log('Export')}
            onFilter={() => console.log('Filter')}
          />

          {/* Table */}
          <div className="flex-1 overflow-x-auto bg-white">
            <table className="w-full">
              <thead>
                <tr className="border-b border-spurly-border">
                  <th className="px-6 py-4 text-left">
                    <input
                      type="checkbox"
                      checked={selectedLeads.size === leads.length}
                      onChange={toggleAll}
                      className="rounded"
                    />
                  </th>
                  <th className="px-6 py-4 text-left text-label font-semibold text-spurly-navy-light">Name</th>
                  <th className="px-6 py-4 text-left text-label font-semibold text-spurly-navy-light">Title</th>
                  <th className="px-6 py-4 text-left text-label font-semibold text-spurly-navy-light">Company</th>
                  <th className="px-6 py-4 text-left text-label font-semibold text-spurly-navy-light">Email</th>
                  <th className="px-6 py-4 text-left text-label font-semibold text-spurly-navy-light">Enrichment</th>
                  <th className="px-6 py-4 text-left text-label font-semibold text-spurly-navy-light">AI Score</th>
                  <th className="px-6 py-4 text-left text-label font-semibold text-spurly-navy-light">Captured On</th>
                  <th className="px-6 py-4 text-left text-label font-semibold text-spurly-navy-light">Source</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr
                    key={lead.id}
                    onClick={() => setSelectedLead(lead)}
                    className="border-b border-spurly-border hover:bg-spurly-surface-bg cursor-pointer transition last:border-b-0"
                  >
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedLeads.has(lead.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleLead(lead.id);
                        }}
                        className="rounded"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={lead.avatar}
                          alt={lead.name}
                          className="w-8 h-8 rounded-spurly object-cover"
                        />
                        <div>
                          <p className="text-label font-semibold text-spurly-navy-light">{lead.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-label text-spurly-navy-light">{lead.title}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-spurly bg-spurly-surface-bg flex items-center justify-center text-xs font-semibold text-spurly-navy-light">
                          {lead.company.charAt(0)}
                        </div>
                        <p className="text-label text-spurly-navy-light">{lead.company}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <a href={`mailto:${lead.email}`} className="text-label text-spurly-purple hover:text-spurly-blue transition flex items-center gap-1">
                        {lead.email}
                        <Mail size={14} />
                      </a>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="success">{lead.enrichment}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-baseline gap-2">
                        <span className="text-label font-semibold text-spurly-navy-light">{lead.aiScore}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-label text-spurly-text-secondary">{lead.capturedOn}</p>
                    </td>
                    <td className="px-6 py-4">
                      <Linkedin size={16} className="text-spurly-purple" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="bg-white border-t border-spurly-border px-6 py-4 flex items-center justify-between">
            <p className="text-label text-spurly-text-secondary">1-50 of 1,248 results</p>
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
                25
              </button>
              <button className="p-2 hover:bg-spurly-surface-bg rounded-spurly transition text-spurly-text-secondary">→</button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-label text-spurly-text-secondary">Rows per page:</span>
              <select className="px-3 py-2 rounded-spurly border border-spurly-border text-label font-medium text-spurly-navy-light">
                <option>50</option>
                <option>100</option>
                <option>200</option>
              </select>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Lead Details */}
        <LeadDetailSidebar lead={selectedLead} onClose={() => setSelectedLead(null)} />
      </div>
    </DashboardLayout>
  );
}

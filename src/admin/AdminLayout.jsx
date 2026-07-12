import { useNavigate, useLocation } from 'react-router-dom';
import { Users, TrendingUp, DollarSign, ArrowLeft, BarChart3 } from 'lucide-react';
import { DashboardLayout } from 'src/components/DashboardLayout';
import './admin.css';

const tabs = [
  { label: 'Users', icon: Users, href: '/admin/users' },
  { label: 'Insights', icon: BarChart3, href: '/admin/insights' },
  { label: 'Transactions', icon: TrendingUp, href: '/admin/transactions' },
  { label: 'Pricing', icon: DollarSign, href: '/admin/pricing' },
];

/**
 * AdminLayout
 * Reuses the normal DashboardLayout chrome so the admin console feels like the
 * same product, and adds a sub-tab bar (Users / Transactions / Pricing) plus a
 * link back to the normal user dashboard. All admin content is wrapped in
 * `.admin-scope` so the ported styles stay contained.
 */
export function AdminLayout({ children, title, subtitle }) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <DashboardLayout title={title || 'Admin Console'} subtitle={subtitle}>
      <div className="admin-scope" style={{ minHeight: '100%', background: '#f8f9fa' }}>
        {/* Sub-tab bar */}
        <div className="flex items-center gap-1 border-b border-gray-200 bg-white px-6 pt-3">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = location.pathname === tab.href;
            return (
              <button
                key={tab.href}
                onClick={() => navigate(tab.href)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  active
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
          <div className="flex-1" />
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to dashboard
          </button>
        </div>

        {/* Page content */}
        <div className="p-6">{children}</div>
      </div>
    </DashboardLayout>
  );
}

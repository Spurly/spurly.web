import { useNavigate, useLocation } from 'react-router-dom';
import { Users, TrendingUp, DollarSign, ArrowLeft, BarChart3, Ticket, CreditCard } from 'lucide-react';
import { DashboardLayout } from 'src/platform/layout/DashboardLayout';
import './admin.css';

const tabs = [
  { label: 'Users', icon: Users, href: '/admin/users' },
  { label: 'Insights', icon: BarChart3, href: '/admin/insights' },
  { label: 'Transactions', icon: TrendingUp, href: '/admin/transactions' },
  { label: 'Pricing', icon: DollarSign, href: '/admin/pricing' },
  { label: 'Payments', icon: CreditCard, href: '/admin/payments' },
  { label: 'Billing', icon: Ticket, href: '/admin/billing' },
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
        <div className="flex items-center gap-1 border-b border-[var(--ui-border-hairline)] bg-white px-[var(--ui-pad-lg)] pt-3">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = location.pathname === tab.href;
            return (
              <button
                key={tab.href}
                onClick={() => navigate(tab.href)}
                className={`flex items-center gap-2 px-4 py-3 text-[12px] font-medium border-b-2 -mb-px transition-colors ${
                  active
                    ? 'border-[var(--ui-accent)] text-[var(--ui-accent-fg)]'
                    : 'border-transparent text-[var(--ui-text-tertiary)] hover:text-[var(--ui-text-primary)]'
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
            className="flex items-center gap-2 px-4 py-3 text-[12px] font-medium text-[var(--ui-text-tertiary)] hover:text-[var(--ui-text-primary)] transition-colors"
          >
            <ArrowLeft size={16} />
            Back to dashboard
          </button>
        </div>

        {/* Page content */}
        <div className="p-[var(--ui-pad-lg)]">{children}</div>
      </div>
    </DashboardLayout>
  );
}

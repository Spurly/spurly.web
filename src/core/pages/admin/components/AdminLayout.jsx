import { useNavigate, useLocation } from 'react-router-dom';
import { Users, TrendingUp, DollarSign, ArrowLeft, BarChart3, Ticket, CreditCard } from 'lucide-react';
import { DashboardLayout } from 'src/core/layout/DashboardLayout';
import '../admin.css';

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
 *
 * `layout` mirrors DashboardLayout's own prop and is passed straight
 * through:
 *   "card" (default) — one table filling the remaining height, same as the
 *                       Leads/Campaigns/Sequences tables: the table scrolls
 *                       internally and its own toolbar/pagination stay put.
 *                       Use this for a page that IS a table (Users,
 *                       Transactions).
 *   "page"           — the whole column scrolls. Use this for a page that
 *                       stacks other sections (stat cards, plan cards, a
 *                       filter row) above its table — forcing those into a
 *                       fixed-height card clips whatever doesn't fit rather
 *                       than showing it, which is what silently made these
 *                       pages "not scrolling" (Pricing, Payments, Insights).
 *
 * For "card", the wrapper below has to carry the flex-column/min-h-0 chain
 * all the way down to the table's own container — otherwise the table's
 * `h-full` has nothing to resolve against and the ancestor's `overflow-
 * hidden` just clips the extra rows instead of making them scrollable.
 */
export function AdminLayout({ children, title, subtitle, layout = 'card' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isCard = layout === 'card';

  return (
    <DashboardLayout title={title || 'Admin Console'} subtitle={subtitle} layout={layout}>
      <div
        className={`admin-scope ${isCard ? 'flex-1 min-h-0 flex flex-col' : ''}`}
        style={{ background: 'var(--ui-surface-page)', ...(isCard ? {} : { minHeight: '100%' }) }}
      >
        {/* Sub-tab bar */}
        <div className="shrink-0 flex items-center gap-1 border-b border-[var(--ui-border-hairline)] bg-[var(--ui-surface-card)] px-[var(--ui-pad-lg)] pt-3">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = location.pathname === tab.href;
            return (
              <button
                key={tab.href}
                onClick={() => navigate(tab.href)}
                className={`flex items-center gap-2 px-4 py-3 text-[length:var(--ui-t-label)] font-medium border-b-2 -mb-px transition-colors ${
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
            className="flex items-center gap-2 px-4 py-3 text-[length:var(--ui-t-label)] font-medium text-[var(--ui-text-tertiary)] hover:text-[var(--ui-text-primary)] transition-colors"
          >
            <ArrowLeft size={16} />
            Back to dashboard
          </button>
        </div>

        {/* Page content */}
        <div className={isCard ? 'flex-1 min-h-0 flex flex-col p-[var(--ui-pad-lg)]' : 'p-[var(--ui-pad-lg)]'}>
          {children}
        </div>
      </div>
    </DashboardLayout>
  );
}

import { useAuth } from 'src/hooks/useAuth';
import { DashboardLayout } from 'src/components/DashboardLayout';
import { Card, CardContent, CardTitle } from 'src/common/components/Card';

export function DashboardPage() {
  const { user } = useAuth();

  const stats = [
    { label: 'Total Leads', value: '0', color: 'from-spurly-purple' },
    { label: 'Sessions', value: '0', color: 'from-spurly-blue' },
    { label: 'Credits Used', value: '0', color: 'from-spurly-success' },
    { label: 'This Month', value: '0', color: 'from-spurly-warning' },
  ];

  return (
    <DashboardLayout>
      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-label text-spurly-text-secondary mb-2">{stat.label}</p>
                  <p className="text-dashboard-title font-bold text-spurly-navy-light">{stat.value}</p>
                </div>
                <div className={`bg-gradient-to-br ${stat.color} to-spurly-blue w-12 h-12 rounded-spurly flex items-center justify-center opacity-10`}></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Placeholder for features */}
      <Card>
        <CardContent className="text-center py-12">
          <h2 className="text-section-heading font-bold text-spurly-navy-light mb-4">Coming Soon</h2>
          <p className="text-body text-spurly-text-secondary">
            More features will be added to this dashboard. Stay tuned!
          </p>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}

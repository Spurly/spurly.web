import { useState } from 'react';
import { DashboardLayout } from 'src/components/DashboardLayout';
import { DataTable, FilterButton } from 'src/common/components/DataTable';
import { RefreshCw, Play } from 'lucide-react';
import { enrichmentQueueStats, enrichmentQueueColumns } from './helpers';

export function EnrichmentQueuePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(null);

  const queueItems = [
    { id: 1, name: 'Sarah Chen', company: 'TechCorp', status: 'processing', progress: 65, startedAt: '2 min ago' },
    { id: 2, name: 'Michael Park', company: 'DataFlow', status: 'queued', progress: 0, startedAt: 'Pending' },
    { id: 3, name: 'Emily Johnson', company: 'CloudNine', status: 'completed', progress: 100, startedAt: '5 min ago' },
    { id: 4, name: 'David Wilson', company: 'StartupX', status: 'failed', progress: 0, startedAt: 'Failed' },
  ];

  const filteredItems = queueItems.filter(item => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!item.name.toLowerCase().includes(query) && !item.company.toLowerCase().includes(query)) {
        return false;
      }
    }
    return true;
  });


  return (
    <DashboardLayout>
      <div className="min-h-screen bg-spurly-surface-bg">
        {/* Header */}
        <div className="bg-white border-b border-spurly-border px-8 py-6">
          <h1 className="text-dashboard-title font-bold text-spurly-navy-light">Enrichment Queue</h1>
          <p className="text-body text-spurly-text-secondary mt-1">Monitor and manage your enrichment jobs</p>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-6">
            {enrichmentQueueStats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="bg-white rounded-spurly-lg border border-spurly-border p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-label text-spurly-text-secondary">{stat.label}</p>
                      <p className="text-3xl font-bold text-spurly-navy-light mt-2">{stat.value}</p>
                    </div>
                    <div className={stat.color}>
                      <Icon size={32} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Queue Items */}
          <div className="bg-white rounded-spurly-lg border border-spurly-border overflow-hidden">
            <DataTable
              columns={enrichmentQueueColumns}
              data={filteredItems}
              rowKey={(row) => row.id}
              emptyMessage={searchQuery ? 'No jobs match your search' : 'No active jobs'}
              toolbar={{
                searchValue: searchQuery,
                onSearch: setSearchQuery,
                searchPlaceholder: 'Search by name or company...',
                actions: <FilterButton onClick={() => setStatusFilter(!statusFilter)} active={statusFilter} />,
              }}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

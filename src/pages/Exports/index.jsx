import { useState } from 'react';
import { DashboardLayout } from 'src/components/DashboardLayout';
import { DataTable, FilterButton } from 'src/common/components/DataTable';
import { Download } from 'lucide-react';
import { exportsStats, exportsColumns } from './helpers';

export function ExportsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(null);

  const exports = [
    { id: 1, name: 'Q4 Enterprise Leads', records: 1234, format: 'CSV', status: 'completed', date: 'Dec 15, 2024', size: '2.4 MB' },
    { id: 2, name: 'Marketing Contacts', records: 856, format: 'Excel', status: 'completed', date: 'Dec 14, 2024', size: '1.8 MB' },
    { id: 3, name: 'Sales Pipeline', records: 432, format: 'CSV', status: 'processing', date: 'Dec 14, 2024', size: 'Pending' },
  ];

  const filteredExports = exports.filter(item => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return item.name.toLowerCase().includes(query) || item.format.toLowerCase().includes(query);
  });


  return (
    <DashboardLayout>
      <div className="min-h-screen bg-spurly-surface-bg">
        {/* Header */}
        <div className="bg-white border-b border-spurly-border px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-dashboard-title font-bold text-spurly-navy-light">Exports</h1>
              <p className="text-body text-spurly-text-secondary mt-1">Download and manage your exported lead lists</p>
            </div>
            <button className="flex items-center gap-2 px-6 py-3 rounded-spurly bg-spurly-purple text-white font-medium text-label transition">
              <Download size={18} />
              New Export
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-6">
            {exportsStats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="bg-white rounded-spurly-lg border border-spurly-border p-6">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-spurly ${stat.bg} flex items-center justify-center`}>
                      <Icon className={stat.color} size={24} />
                    </div>
                    <div>
                      <p className="text-label text-spurly-text-secondary">{stat.label}</p>
                      <p className="text-2xl font-bold text-spurly-navy-light">{stat.value}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Exports Table */}
          <div className="bg-white rounded-spurly-lg border border-spurly-border overflow-hidden">
            <DataTable
              columns={exportsColumns}
              data={filteredExports}
              rowKey={(row) => row.id}
              emptyMessage={searchQuery ? 'No exports match your search' : 'No exports yet'}
              toolbar={{
                searchValue: searchQuery,
                onSearch: setSearchQuery,
                searchPlaceholder: 'Search by name or format...',
                actions: <FilterButton onClick={() => setStatusFilter(!statusFilter)} active={statusFilter} />,
              }}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

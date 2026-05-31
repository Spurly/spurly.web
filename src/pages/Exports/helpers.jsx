import { Badge } from 'src/common/components/Badge';
import { FileText, CheckCircle, Clock, MoreVertical } from 'lucide-react';

export const exportsStats = [
  { label: 'Total Exports', value: '47', icon: FileText, bg: 'bg-spurly-purple/10', color: 'text-spurly-purple' },
  { label: 'Completed', value: '42', icon: CheckCircle, bg: 'bg-spurly-success/10', color: 'text-spurly-success' },
  { label: 'Processing', value: '5', icon: Clock, bg: 'bg-spurly-warning/10', color: 'text-spurly-warning' },
];

export const exportsColumns = [
  {
    key: 'name',
    label: 'Name',
    sortable: true,
    render: (name) => (
      <div className="flex items-center gap-3">
        <FileText size={18} className="text-spurly-text-secondary" />
        <span className="text-label font-semibold text-spurly-navy-light">{name}</span>
      </div>
    ),
  },
  {
    key: 'records',
    label: 'Records',
    sortable: true,
    render: (records) => records.toLocaleString(),
  },
  {
    key: 'format',
    label: 'Format',
    render: (format) => <Badge variant="default">{format}</Badge>,
  },
  {
    key: 'status',
    label: 'Status',
    render: (status) => (
      <Badge variant={status === 'completed' ? 'success' : 'warning'}>{status}</Badge>
    ),
  },
  { key: 'date', label: 'Date', sortable: true, render: (v) => <span className="text-spurly-text-secondary">{v}</span> },
  { key: 'size', label: 'Size', render: (v) => <span className="text-spurly-text-secondary">{v}</span> },
  {
    key: 'actions',
    label: 'Actions',
    render: () => (
      <button className="p-2 hover:bg-spurly-surface-bg rounded-spurly transition">
        <MoreVertical size={16} className="text-spurly-text-secondary" />
      </button>
    ),
  },
];

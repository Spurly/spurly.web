import { Badge } from 'src/common/components/Badge';
import { Clock, CheckCircle, XCircle, Loader } from 'lucide-react';

export const enrichmentQueueStats = [
  { label: 'In Queue', value: '156', icon: Clock, color: 'text-spurly-warning' },
  { label: 'Processing', value: '23', icon: Loader, color: 'text-spurly-blue' },
  { label: 'Completed Today', value: '892', icon: CheckCircle, color: 'text-spurly-success' },
  { label: 'Failed', value: '12', icon: XCircle, color: 'text-spurly-error' },
];

export const statusVariant = (status) =>
  status === 'completed' ? 'success'
    : status === 'processing' ? 'primary'
    : status === 'failed' ? 'error'
    : 'default';

export const enrichmentQueueColumns = [
  {
    key: 'name',
    label: 'Lead',
    render: (name, row) => (
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-spurly bg-spurly-surface-bg flex items-center justify-center font-semibold text-spurly-navy-light">
          {name.charAt(0)}
        </div>
        <div>
          <p className="text-label font-semibold text-spurly-navy-light">{name}</p>
          <p className="text-label text-spurly-text-secondary">{row.company}</p>
        </div>
      </div>
    ),
  },
  {
    key: 'progress',
    label: 'Progress',
    width: '180px',
    render: (progress) => (
      <div className="w-32">
        <span className="text-xs text-spurly-text-secondary">{progress}%</span>
        <div className="w-full bg-spurly-surface-bg rounded-full h-2 mt-1">
          <div className="bg-spurly-purple h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>
    ),
  },
  {
    key: 'status',
    label: 'Status',
    render: (status) => <Badge variant={statusVariant(status)}>{status}</Badge>,
  },
  {
    key: 'startedAt',
    label: 'Started',
    align: 'right',
    render: (v) => <span className="text-label text-spurly-text-secondary">{v}</span>,
  },
];

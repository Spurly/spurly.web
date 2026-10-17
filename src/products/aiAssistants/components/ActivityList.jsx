import { DataTable, TextCell } from 'src/core/DataTable';
import { Badge } from 'src/core/primitives';

const WHEN = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

const columns = [
  {
    key: 'tool',
    label: 'Tool',
    width: 170,
    render: (value) => <span className="font-[family-name:var(--ui-font-mono)] text-[length:var(--ui-t-label)]">{value}</span>,
  },
  { key: 'clientName', label: 'Assistant', width: 240, render: (value) => <TextCell value={value} tone="secondary" /> },
  {
    key: 'ok',
    label: 'Result',
    width: 170,
    render: (_value, row) => <Badge tone={row.ok ? 'success' : 'danger'}>{row.ok ? 'OK' : row.errorCode ?? 'Failed'}</Badge>,
  },
  {
    key: 'at',
    label: 'When',
    width: 130,
    align: 'right',
    render: (value) => <TextCell value={value ? WHEN.format(new Date(value)) : ''} tone="tertiary" />,
  },
];

/** Recent assistant calls as a DataTable: fixed header, rows scroll inside a bounded card body. */
export function ActivityList({ calls, loading }) {
  return (
    <div className="h-[420px] flex flex-col -m-5">
      <DataTable
        className="flex-1"
        columns={columns}
        data={calls}
        rowKey={(row) => row.id}
        loading={loading}
        emptyMessage="Nothing yet"
        emptyHint="Calls from your assistants show up here for 30 days. Only the tool name and result are kept, never message text."
      />
    </div>
  );
}

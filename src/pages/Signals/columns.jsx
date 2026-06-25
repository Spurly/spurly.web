import { Lock } from 'lucide-react';
import { Tooltip } from 'src/common/components/Tooltip';

const DEGREE_STYLES = {
  '1st': { background: 'var(--accent-tint)', color: 'var(--brand-purple)' },
  '2nd': { background: 'rgba(79,70,229,0.1)', color: '#4f46e5' },
  '3rd': { background: 'rgba(6,182,212,0.1)', color: '#0891b2' },
};

function SignalLeadCell({ value, row }) {
  const name = value || '';
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex items-center gap-2.5">
      <div
        className="w-8 h-8 rounded-[9px] grid place-items-center text-white text-[12px] font-bold flex-shrink-0"
        style={{ background: 'var(--brand-gradient-vivid)' }}
      >
        {initials}
      </div>
      <div className="min-w-0">
        <span className="block text-[13.5px] font-semibold text-[var(--text-primary)] truncate">{name}</span>
        <span className="block text-[12px] text-[var(--text-tertiary)] truncate">
          {[row.title, row.company].filter(Boolean).join(' · ')}
        </span>
      </div>
    </div>
  );
}

function DegreeBadge({ value }) {
  const style = DEGREE_STYLES[value] || { background: 'var(--surface-sunken)', color: 'var(--text-tertiary)' };
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap"
      style={style}
    >
      {value}
    </span>
  );
}

function WhyNowCell({ value }) {
  if (!value) {
    return (
      <Tooltip text="Upgrade to our paid plan to unlock outreach signals for this lead.">
        <span className="inline-flex items-center gap-1.5 cursor-default">
          <span className="text-[13px]" style={{ color: 'var(--text-tertiary)' }}>Locked</span>
          <Lock size={13} style={{ color: 'var(--text-tertiary)' }} />
        </span>
      </Tooltip>
    );
  }

  return (
    <span className="text-[13px] text-[var(--text-secondary)] leading-snug">{value}</span>
  );
}

export const signalsColumns = [
  {
    key: 'name',
    label: 'Lead',
    width: '220px',
    minWidth: '180px',
    sortable: true,
    render: (value, row) => <SignalLeadCell value={value} row={row} />,
  },
  {
    key: 'connectionDegree',
    label: '',
    width: '56px',
    minWidth: '56px',
    align: 'center',
    render: (value) => <DegreeBadge value={value} />,
  },
  {
    key: 'whyNow',
    label: 'Why Now',
    width: 'auto',
    minWidth: '200px',
    render: (value) => <WhyNowCell value={value} />,
  },
];

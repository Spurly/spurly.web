const degreeTone = { '1st': 'accent', '2nd': 'info' };

export function AvatarNameCell({ value, row = {} }) {
  const avatar = row.avatar || null;
  const name = value || '';
  const degree = row.connectionDegree || null;

  const degreeStyles = {
    accent: { background: 'var(--accent-tint)', color: 'var(--brand-purple)' },
    info:   { background: 'var(--sky-tint)',    color: 'var(--sky)' },
    neutral:{ background: 'var(--surface-sunken)', color: 'var(--text-tertiary)' },
  };
  const tone = degreeTone[degree] || 'neutral';

  return (
    <div className="flex items-center gap-2.5">
      {avatar ? (
        <img
          src={avatar}
          alt={name}
          className="w-8 h-8 rounded-[9px] object-cover flex-shrink-0"
          onError={(e) => { e.target.style.display = 'none'; }}
        />
      ) : (
        <div
          className="w-8 h-8 rounded-[9px] grid place-items-center text-white text-[12px] font-bold flex-shrink-0"
          style={{ background: 'var(--brand-gradient-vivid)' }}
        >
          {name.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="min-w-0">
        <span className="block text-[13.5px] font-semibold text-[var(--text-primary)] truncate">{name}</span>
        {degree && (
          <span
            className="inline-block mt-0.5 px-1.5 py-px rounded-[999px] text-[10.5px] font-semibold leading-tight"
            style={degreeStyles[tone]}
          >
            {degree}
          </span>
        )}
      </div>
    </div>
  );
}

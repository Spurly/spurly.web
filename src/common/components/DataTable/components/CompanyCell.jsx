export function CompanyCell({ value }) {
  if (!value) return <span className="text-spurly-text-secondary">—</span>;

  return (
    <div className="flex items-center gap-2">
      <div className="w-6 h-6 rounded-spurly bg-spurly-surface-bg flex items-center justify-center text-xs font-semibold text-spurly-navy-light flex-shrink-0">
        {value.charAt(0).toUpperCase()}
      </div>
      <span className="text-label text-spurly-navy-light truncate">
        {value}
      </span>
    </div>
  );
}

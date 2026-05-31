export function MetricCard({ label, value, change, changeType = 'positive', icon: Icon }) {
  return (
    <div className="bg-white rounded-spurly-lg p-6 border border-spurly-border shadow-spurly">
      <div className="mb-6">
        <p className="text-label text-spurly-text-secondary mb-2">{label}</p>
        <p className="text-section-heading font-bold text-spurly-navy-light">{value}</p>
      </div>
      {change && (
        <div className="flex items-center gap-2">
          <span className={`text-label font-semibold ${changeType === 'positive' ? 'text-spurly-success' : 'text-spurly-error'}`}>
            {changeType === 'positive' ? '+' : '-'}{change}%
          </span>
          <span className="text-label text-spurly-text-secondary">vs last 7 days</span>
        </div>
      )}
      {Icon && (
        <div className="absolute top-4 right-4 opacity-10">
          <Icon size={40} className="text-spurly-purple" />
        </div>
      )}
    </div>
  );
}

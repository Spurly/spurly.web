export function AvatarNameCell({ value, row = {} }) {
  const avatar = row.avatar || null;
  const name = value || '';

  return (
    <div className="flex items-center gap-3">
      {avatar ? (
        <img
          src={avatar}
          alt={name}
          className="w-8 h-8 rounded-spurly object-cover flex-shrink-0"
          onError={(e) => {
            e.target.src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22%3E%3Crect fill=%22%23e0e0e0%22 width=%2224%22 height=%2224%22/%3E%3C/svg%3E';
          }}
        />
      ) : (
        <div className="w-8 h-8 rounded-spurly bg-spurly-surface-bg flex items-center justify-center text-xs font-semibold text-spurly-navy-light flex-shrink-0">
          {name.charAt(0).toUpperCase()}
        </div>
      )}
      <span className="text-label font-semibold text-spurly-navy-light truncate">
        {name}
      </span>
    </div>
  );
}

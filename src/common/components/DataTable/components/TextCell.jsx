export function TextCell({ value, className = '' }) {
  return (
    <span className={`text-label text-spurly-navy-light ${className}`}>
      {value}
    </span>
  );
}

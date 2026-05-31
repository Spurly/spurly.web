export function PhoneCell({ value }) {
  if (!value) return <span className="text-spurly-text-secondary">—</span>;

  return (
    <a
      href={`tel:${value}`}
      onClick={(e) => e.stopPropagation()}
      className="text-label text-spurly-purple hover:text-spurly-blue transition"
    >
      {value}
    </a>
  );
}

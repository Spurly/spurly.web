import { Mail } from 'lucide-react';

export function EmailCell({ value }) {
  if (!value) return <span className="text-spurly-text-secondary">—</span>;

  return (
    <a
      href={`mailto:${value}`}
      onClick={(e) => e.stopPropagation()}
      className="text-label text-spurly-purple hover:text-spurly-blue transition inline-flex items-center gap-1"
    >
      {value}
      <Mail size={14} className="flex-shrink-0" />
    </a>
  );
}

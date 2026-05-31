import { ExternalLink } from 'lucide-react';

export function LinkedInCell({ value }) {
  if (!value) {
    return <span className="text-spurly-text-secondary">—</span>;
  }

  return (
    <a
      href={value}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="text-spurly-purple hover:text-spurly-blue transition inline-flex items-center justify-center"
      title="View on Sales Navigator"
    >
      <ExternalLink size={16} />
    </a>
  );
}

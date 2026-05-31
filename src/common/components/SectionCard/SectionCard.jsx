import { ChevronRight } from 'lucide-react';

export function SectionCard({ title, onViewAll, children }) {
  return (
    <div className="bg-white rounded-spurly-lg border border-spurly-border shadow-spurly overflow-hidden">
      <div className="px-6 py-4 border-b border-spurly-border flex justify-between items-center">
        <h3 className="text-dashboard-title font-bold text-spurly-navy-light">{title}</h3>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="flex items-center gap-1 text-label font-medium text-spurly-purple hover:text-spurly-blue transition"
          >
            View all
            <ChevronRight size={16} />
          </button>
        )}
      </div>
      <div className="px-6 py-4">
        {children}
      </div>
    </div>
  );
}

import { ChevronDown, Filter, Search, List } from 'lucide-react';

export function ActionBar({ selectedCount, onEnrich, onAddToList, onExport, onFilter }) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-spurly-border gap-4">
      <div className="flex items-center gap-4">
        {selectedCount > 0 && (
          <span className="text-label font-medium text-spurly-navy-light">
            {selectedCount} selected
          </span>
        )}

        <button
          onClick={onEnrich}
          className="flex items-center gap-2 px-4 py-2 rounded-spurly bg-spurly-surface-bg hover:bg-spurly-border text-spurly-navy-light font-medium text-label transition"
        >
          Enrich
        </button>

        <button
          onClick={onAddToList}
          className="flex items-center gap-2 px-4 py-2 rounded-spurly bg-spurly-surface-bg hover:bg-spurly-border text-spurly-navy-light font-medium text-label transition"
        >
          Add to List
          <ChevronDown size={16} />
        </button>

        <button
          onClick={onExport}
          className="flex items-center gap-2 px-4 py-2 rounded-spurly bg-spurly-surface-bg hover:bg-spurly-border text-spurly-navy-light font-medium text-label transition"
        >
          Export
          <ChevronDown size={16} />
        </button>

        <button className="flex items-center gap-2 px-4 py-2 rounded-spurly bg-spurly-surface-bg hover:bg-spurly-border text-spurly-navy-light font-medium text-label transition">
          More
          <ChevronDown size={16} />
        </button>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onFilter}
          className="flex items-center gap-2 px-4 py-2 rounded-spurly hover:bg-spurly-surface-bg text-spurly-navy-light font-medium text-label transition"
        >
          <Filter size={16} />
          Filters
        </button>

        <button className="p-2 rounded-spurly hover:bg-spurly-surface-bg transition">
          <List size={16} className="text-spurly-text-secondary" />
        </button>

        <button className="p-2 rounded-spurly hover:bg-spurly-surface-bg transition">
          <Search size={16} className="text-spurly-text-secondary" />
        </button>
      </div>
    </div>
  );
}

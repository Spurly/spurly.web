export function Tabs({ tabs, activeTab, onTabChange }) {
  return (
    <div className="flex items-center gap-1 border-b border-[var(--separator)] px-5 glass-chrome">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`relative flex items-center gap-1.5 px-3 py-4 text-[13.5px] font-medium transition-colors ${
            activeTab === tab.id
              ? 'text-[var(--text-primary)] font-semibold'
              : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
          }`}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span
              className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-[6px] ${
                activeTab === tab.id
                  ? 'bg-[var(--accent-tint)] text-[var(--brand-purple)]'
                  : 'bg-[var(--surface-sunken)] text-[var(--text-tertiary)]'
              }`}
            >
              {tab.count}
            </span>
          )}
          {activeTab === tab.id && (
            <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-[var(--brand-purple)]" />
          )}
        </button>
      ))}
    </div>
  );
}

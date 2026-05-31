export function Tabs({ tabs, activeTab, onTabChange }) {
  return (
    <div className="flex items-center gap-6 border-b border-spurly-border px-6 py-4">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`text-label font-semibold pb-4 border-b-2 transition ${
            activeTab === tab.id
              ? 'text-spurly-navy-light border-spurly-purple'
              : 'text-spurly-text-secondary border-transparent hover:text-spurly-navy-light'
          }`}
        >
          {tab.label} {tab.count && <span className="text-spurly-purple">{tab.count}</span>}
        </button>
      ))}
    </div>
  );
}

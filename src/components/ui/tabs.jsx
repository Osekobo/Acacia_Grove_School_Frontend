export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-slate-100 px-2">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onChange(tab.key)}
          className={`relative whitespace-nowrap px-4 py-3 text-sm font-medium transition ${
            active === tab.key
              ? "text-brand-700"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className="ml-1.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-500">
              {tab.count}
            </span>
          )}
          {active === tab.key && (
            <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-brand-600" />
          )}
        </button>
      ))}
    </div>
  );
}
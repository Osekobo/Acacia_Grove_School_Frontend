export function BarChart({ data, height = 160, valueKey = "rate", labelKey = "label", suffix = "%" }) {
  if (!data?.length) return null;
  const max = Math.max(...data.map((d) => d[valueKey]), 1);

  return (
    <div className="w-full overflow-x-auto pb-1">
      <div
        className="flex items-end gap-2"
        style={{ height, minWidth: data.length * 34 }}
      >
        {data.map((item, index) => {
          const value = item[valueKey] ?? 0;
          const barHeight = Math.max((value / max) * (height - 28), 4);
          const highlighted = index === data.length - 1;
          return (
            <div
              key={`${item[labelKey]}-${index}`}
              className="group flex min-w-0 flex-1 flex-col items-center gap-2"
            >
              <div className="relative flex w-full items-end justify-center" style={{ height: height - 28 }}>
                <div
                  className={`w-full rounded-t-md transition-all ${
                    highlighted ? "bg-brand-600" : "bg-brand-200 group-hover:bg-brand-400"
                  }`}
                  style={{ height: barHeight }}
                  title={`${item[labelKey]}: ${value}${suffix}`}
                />
                <span className="pointer-events-none absolute -top-1 hidden -translate-y-full rounded bg-ink-900 px-1.5 py-0.5 text-[10px] font-medium text-white group-hover:block">
                  {value}
                  {suffix}
                </span>
              </div>
              <span className="truncate text-[10px] text-slate-400">{item[labelKey]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function DonutChart({ value, total, label, sublabel, size = 148 }) {
  const pct = total > 0 ? Math.min(value / total, 1) : 0;
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct);

  return (
    <div className="flex items-center gap-5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
          <circle cx="70" cy="70" r={radius} fill="none" strokeWidth="14" className="stroke-slate-100" />
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            strokeWidth="14"
            strokeLinecap="round"
            className="stroke-brand-600 transition-all duration-700"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-slate-900">{Math.round(pct * 100)}%</span>
          <span className="text-[11px] text-slate-500">{label}</span>
        </div>
      </div>
      {sublabel && (
        <div>
          <p className="text-sm font-medium text-slate-700">{sublabel}</p>
          <p className="mt-1 text-[13px] text-slate-500">
            {value.toLocaleString()} of {total.toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
}

export function ProgressRow({ label, value, max, tone = "brand" }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const tones = {
    brand: "bg-brand-600",
    gold: "bg-gold-500",
    emerald: "bg-emerald-500",
    sky: "bg-sky-500",
    rose: "bg-rose-500",
  };
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[13px]">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="tabular-nums text-slate-500">{value.toFixed(1)}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all duration-700 ${tones[tone]}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
import { Loader2 } from "lucide-react";
import { initials } from "../../lib/format";

const VARIANTS = {
  primary:
    "bg-brand-600 text-white hover:bg-brand-700 focus-visible:outline-brand-600 disabled:bg-brand-300",
  secondary:
    "bg-white text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 hover:text-slate-900",
  ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
  danger: "bg-rose-600 text-white hover:bg-rose-700 focus-visible:outline-rose-600",
  dark: "bg-ink-900 text-white hover:bg-ink-800",
  gold: "bg-gold-500 text-white hover:bg-gold-600",
};

const SIZES = {
  sm: "h-8 px-3 text-[13px]",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-5 text-sm",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  icon: Icon,
  className = "",
  children,
  type = "button",
  ...rest
}) {
  return (
    <button
      type={type}
      disabled={loading || rest.disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-70 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...rest}
    >
      {loading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        Icon && <Icon size={16} className="shrink-0" />
      )}
      {children}
    </button>
  );
}

export function Card({ className = "", children, ...rest }) {
  return (
    <section className={`card ${className}`} {...rest}>
      {children}
    </section>
  );
}

export function CardHeader({ title, subtitle, action, className = "" }) {
  return (
    <header className={`flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 ${className}`}>
      <div>
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        {subtitle && <p className="mt-0.5 text-[13px] text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}

export function Badge({ children, tone = "slate", className = "" }) {
  const tones = {
    slate: "bg-slate-100 text-slate-600 ring-slate-200",
    brand: "bg-brand-50 text-brand-700 ring-brand-200",
    gold: "bg-gold-500/10 text-gold-600 ring-gold-500/30",
    success: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    warning: "bg-amber-50 text-amber-700 ring-amber-200",
    danger: "bg-rose-50 text-rose-700 ring-rose-200",
    info: "bg-sky-50 text-sky-700 ring-sky-200",
  };
  const toneClass = tones[tone] || tone || tones.slate;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${toneClass} ${className}`}
    >
      {children}
    </span>
  );
}

export function Avatar({ name = "", size = "md", className = "" }) {
  const sizes = { sm: "h-8 w-8 text-[11px]", md: "h-10 w-10 text-xs", lg: "h-16 w-16 text-lg" };
  const palette = [
    "bg-brand-100 text-brand-700",
    "bg-gold-500/20 text-gold-600",
    "bg-sky-100 text-sky-700",
    "bg-emerald-100 text-emerald-700",
    "bg-indigo-100 text-indigo-700",
  ];
  const index = name.split("").reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % palette.length;
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold uppercase ${sizes[size]} ${palette[index]} ${className}`}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}

export function StatCard({ label, value, icon: Icon, tone = "brand", hint, trend }) {
  const tones = {
    brand: "bg-brand-50 text-brand-600",
    gold: "bg-gold-500/15 text-gold-600",
    sky: "bg-sky-50 text-sky-600",
    emerald: "bg-emerald-50 text-emerald-600",
    violet: "bg-violet-50 text-violet-600",
    slate: "bg-slate-100 text-slate-600",
  };
  return (
    <Card className="p-5 transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[13px] font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
        </div>
        {Icon && (
          <span className={`rounded-lg p-2.5 ${tones[tone] || tones.brand}`}>
            <Icon size={18} />
          </span>
        )}
      </div>
      {(hint || trend) && (
        <p className="mt-3 text-xs text-slate-500">
          {trend && <span className="mr-1 font-semibold text-emerald-600">{trend}</span>}
          {hint}
        </p>
      )}
    </Card>
  );
}

export function Spinner({ className = "" }) {
  return (
    <div className={`flex items-center justify-center py-14 ${className}`}>
      <Loader2 size={26} className="animate-spin text-brand-600" />
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      {Icon && (
        <span className="mb-3 rounded-2xl bg-slate-100 p-4 text-slate-400">
          <Icon size={26} />
        </span>
      )}
      <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
      {description && <p className="mt-1 max-w-sm text-[13px] text-slate-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
const CURRENCY_LOCALES = { KES: "en-KE", USD: "en-US", GBP: "en-GB", EUR: "de-DE" };

export function formatMoney(amount, currency = "KES", { compact = false } = {}) {
  const value = Number(amount || 0);
  return new Intl.NumberFormat(CURRENCY_LOCALES[currency] || "en-US", {
    style: "currency",
    currency,
    notation: compact ? "compact" : "standard",
    maximumFractionDigits: compact ? 1 : 2,
  }).format(value);
}

export function formatDate(value, opts = { day: "numeric", month: "short", year: "numeric" }) {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value.length <= 10 ? `${value}T00:00:00` : value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", opts).format(date);
}

export function formatDateTime(value) {
  return formatDate(value, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function relativeTime(value) {
  if (!value) return "";
  const date = new Date(value);
  const diff = Date.now() - date.getTime();
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(value);
}

export function initials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function roleLabel(role) {
  return (
    {
      admin: "Administrator",
      principal: "Principal",
      vice_principal: "Vice Principal",
      secretary: "Secretary",
      teacher: "Teacher",
      bursar: "Bursar",
      parent: "Parent",
      student: "Student",
    }[role] || role
  );
}

export const ROLE_TONE = {
  admin: "bg-violet-50 text-violet-700 ring-violet-200",
  principal: "bg-brand-50 text-brand-700 ring-brand-200",
  vice_principal: "bg-brand-50 text-brand-700 ring-brand-200",
  secretary: "bg-sky-50 text-sky-700 ring-sky-200",
  teacher: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  bursar: "bg-amber-50 text-amber-700 ring-amber-200",
  parent: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  student: "bg-cyan-50 text-cyan-700 ring-cyan-200",
};

export function statusTone(status) {
  return (
    {
      active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
      archived: "bg-slate-100 text-slate-600 ring-slate-200",
      paid: "bg-emerald-50 text-emerald-700 ring-emerald-200",
      partial: "bg-amber-50 text-amber-700 ring-amber-200",
      unpaid: "bg-rose-50 text-rose-700 ring-rose-200",
      waived: "bg-slate-100 text-slate-600 ring-slate-200",
      present: "bg-emerald-50 text-emerald-700 ring-emerald-200",
      late: "bg-amber-50 text-amber-700 ring-amber-200",
      absent: "bg-rose-50 text-rose-700 ring-rose-200",
      excused: "bg-sky-50 text-sky-700 ring-sky-200",
    }[status] || "bg-slate-100 text-slate-600 ring-slate-200"
  );
}
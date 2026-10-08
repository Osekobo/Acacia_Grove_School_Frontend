import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from "lucide-react";

const ToastContext = createContext(null);

const TONES = {
  success: { icon: CheckCircle2, cls: "text-emerald-600", bar: "bg-emerald-500" },
  error: { icon: XCircle, cls: "text-rose-600", bar: "bg-rose-500" },
  warning: { icon: AlertTriangle, cls: "text-amber-600", bar: "bg-amber-500" },
  info: { icon: Info, cls: "text-sky-600", bar: "bg-sky-500" },
};

let counter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    (message, tone = "info", ttl = 4200) => {
      const id = ++counter;
      setToasts((current) => [...current, { id, message, tone }]);
      window.setTimeout(() => dismiss(id), ttl);
    },
    [dismiss],
  );

  const value = useMemo(
    () => ({
      push,
      success: (m) => push(m, "success"),
      error: (m) => push(m, "error", 6000),
      info: (m) => push(m, "info"),
      warning: (m) => push(m, "warning"),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-full max-w-sm flex-col gap-2">
        {toasts.map((toast) => {
          const tone = TONES[toast.tone] || TONES.info;
          const Icon = tone.icon;
          return (
            <div
              key={toast.id}
              className="pointer-events-auto flex items-start gap-3 overflow-hidden rounded-xl border border-slate-200 bg-white p-3 pr-2 shadow-lg shadow-slate-900/10 animate-[slideIn_.2s_ease-out]"
            >
              <span className={`mt-0.5 h-8 w-1 rounded-full ${tone.bar}`} />
              <Icon size={18} className={`mt-0.5 shrink-0 ${tone.cls}`} />
              <p className="flex-1 text-sm text-slate-700">{toast.message}</p>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                aria-label="Dismiss notification"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
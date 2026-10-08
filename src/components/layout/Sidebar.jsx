import { NavLink } from "react-router-dom";
import { X, ShieldCheck, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { labelFor, visibleNav } from "../../lib/nav";
import { roleLabel } from "../../lib/format";

function Sidebar({ onNavigate, collapsed = false, onToggle }) {
  const { user, permissions } = useAuth();
  const sections = visibleNav(user?.role, permissions);

  return (
    <div className="flex h-full flex-col bg-ink-950 text-slate-300">
      <div
        className={`flex h-16 items-center border-b border-white/5 ${
          collapsed ? "justify-between px-2" : "gap-3 px-5"
        }`}
      >
        <span
          className={`flex shrink-0 items-center justify-center rounded-lg bg-white shadow-sm ${
            collapsed ? "h-8 w-8" : "h-9 w-9"
          }`}
        >
          <img src="/logo.svg" alt="" className="h-6 w-6 object-contain" />
        </span>
        {!collapsed && (
          <div className="min-w-0 leading-tight">
            <p className="truncate text-[15px] font-bold text-white">Acacia Grove</p>
            <p className="text-[11px] uppercase tracking-[0.14em] text-gold-400">School Portal</p>
          </div>
        )}
        {!collapsed && onNavigate && (
          <button
            type="button"
            onClick={onNavigate}
            className="ml-auto rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        )}
        {onToggle && (
          <button
            type="button"
            onClick={onToggle}
            aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
            title={collapsed ? "Expand navigation" : "Collapse navigation"}
            className={`rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white ${
              collapsed ? "" : "ml-auto hidden lg:inline-flex"
            }`}
          >
            {collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {sections.map((section) => (
          <div key={section.label}>
            {!collapsed && (
              <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                {section.label}
              </p>
            )}
            <ul className={`${collapsed ? "space-y-1" : "mt-2 space-y-0.5"}`}>
              {section.items.map((item) => {
                const Icon = item.icon;
                const label = labelFor(item, user?.role);
                return (
                  <li key={item.key}>
                    <NavLink
                      to={item.path}
                      end={item.path === "/"}
                      onClick={onNavigate}
                      title={label}
                      className={({ isActive }) =>
                        `group flex items-center rounded-lg text-sm font-medium transition ${
                          collapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2"
                        } ${
                          isActive
                            ? "bg-brand-600 text-white shadow-sm shadow-brand-900/40"
                            : "text-slate-400 hover:bg-white/5 hover:text-white"
                        }`
                      }
                    >
                      <Icon size={17} className="shrink-0" />
                      {!collapsed && label}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className={`border-t border-white/5 ${collapsed ? "p-2.5" : "p-4"}`}>
        <div
          className={`flex items-center rounded-lg bg-white/5 ${
            collapsed ? "justify-center px-0 py-2.5" : "gap-2 px-3 py-2.5"
          }`}
          title={roleLabel(user?.role)}
        >
          <ShieldCheck size={16} className="shrink-0 text-gold-400" />
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-white">{roleLabel(user?.role)}</p>
              <p className="truncate text-[11px] text-slate-400">Signed in · Secure session</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
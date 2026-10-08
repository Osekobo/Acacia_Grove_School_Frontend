import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Bell, ChevronDown, LogOut, Menu, UserCircle2, CircleHelp } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { NAV_SECTIONS, labelFor } from "../../lib/nav";
import { roleLabel } from "../../lib/format";
import { Avatar } from "../ui/primitives";

function pageTitle(pathname) {
  for (const section of NAV_SECTIONS) {
    for (const item of section.items) {
      if (item.path === "/" ? pathname === "/" : pathname.startsWith(item.path)) {
        return item;
      }
    }
  }
  if (pathname.startsWith("/students/")) return { label: "Student Record", path: "/students" };
  if (pathname.startsWith("/classes/")) return { label: "Class Detail", path: "/classes" };
  if (pathname === "/profile") return { label: "My Profile", path: "/profile" };
  return { label: "Dashboard", path: "/" };
}

function Topbar({ onOpenMenu }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const current = pageTitle(location.pathname);

  useEffect(() => {
    const onClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-slate-200/80 bg-white/85 px-4 backdrop-blur-md sm:px-6">
      <button
        type="button"
        onClick={onOpenMenu}
        className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50 lg:hidden"
        aria-label="Open navigation"
      >
        <Menu size={18} />
      </button>

      <div className="min-w-0">
        <p className="truncate text-[15px] font-semibold text-slate-900">
          {labelFor(current, user?.role)}
        </p>
        <p className="hidden text-xs text-slate-500 sm:block">
          {new Intl.DateTimeFormat("en-GB", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          }).format(new Date())}
        </p>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Link
          to="/announcements"
          className="relative rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
          aria-label="Announcements"
        >
          <Bell size={17} />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-brand-600" />
        </Link>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="flex items-center gap-2 rounded-lg border border-slate-200 py-1.5 pl-1.5 pr-2.5 transition hover:bg-slate-50"
          >
            <Avatar name={user?.full_name || ""} size="sm" />
            <span className="hidden text-left leading-tight sm:block">
              <span className="block text-[13px] font-semibold text-slate-800">
                {user?.full_name}
              </span>
              <span className="block text-[11px] text-slate-500">{roleLabel(user?.role)}</span>
            </span>
            <ChevronDown size={15} className="text-slate-400" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-60 overflow-hidden rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl shadow-slate-900/10">
              <div className="border-b border-slate-100 px-4 py-3">
                <p className="truncate text-sm font-semibold text-slate-900">{user?.full_name}</p>
                <p className="truncate text-xs text-slate-500">{user?.email}</p>
              </div>
              <Link
                to="/profile"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
              >
                <UserCircle2 size={16} className="text-slate-400" /> My profile
              </Link>
              <a
                href="/docs"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
              >
                <CircleHelp size={16} className="text-slate-400" /> API reference
              </a>
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-2.5 border-t border-slate-100 px-4 py-2.5 text-left text-sm font-medium text-rose-600 transition hover:bg-rose-50"
              >
                <LogOut size={16} /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Topbar;
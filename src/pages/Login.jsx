import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, GraduationCap } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { errorMessage } from "../lib/api";
import { Button } from "../components/ui/primitives";
import { Input } from "../components/ui/forms";

const DEMO_ACCOUNTS = [
  { label: "Admin", email: "admin@acaciagrove.sc.ke" },
  { label: "Principal", email: "principal@acaciagrove.sc.ke" },
  { label: "Secretary", email: "secretary@acaciagrove.sc.ke" },
  { label: "Teacher", email: "lucy.benson@acaciagrove.sc.ke" },
  { label: "Bursar", email: "bursar@acaciagrove.sc.ke" },
  { label: "Parent", email: "parent1@acaciagrove.sc.ke" },
  { label: "Student", email: "aiden.kariuki@acaciagrove.sc.ke" },
];

export default function Login() {
  const { user, login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (user) return <Navigate to={location.state?.from || "/"} replace />;

  const submit = async (event) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const account = await login(email, password);
      toast.success(`Welcome back, ${account.first_name || account.full_name}`);
      navigate(location.state?.from || "/", { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (demoEmail) => {
    setEmail(demoEmail);
    setPassword("AcaciaGrove!2026");
    setError(null);
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-ink-950 lg:block">
        <img
          src="/campus-life.jpg"
          alt="Acacia Grove School campus"
          className="absolute inset-0 h-full w-full object-cover opacity-45"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-ink-950 via-ink-950/85 to-brand-950/70" />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-lg">
              <img src="/logo.svg" alt="" className="h-7 w-7 object-contain" />
            </span>
            <div className="leading-tight">
              <p className="text-lg font-bold">Acacia Grove School</p>
              <p className="text-xs uppercase tracking-[0.2em] text-gold-400">Nairobi · Kenya</p>
            </div>
          </div>

          <div className="max-w-lg">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-gold-400">
              School Management Portal
            </p>
            <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight xl:text-5xl">
              One secure workspace for academics, attendance and fees.
            </h1>
            <p className="mt-5 text-[15px] leading-relaxed text-slate-300">
              Role-based access for the principal, vice principal, secretary, teachers, bursar,
              parents and students — with every record scoped to who you are.
            </p>
            <ul className="mt-8 grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
              <li className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-gold-400" /> RBAC &amp; data scoping
              </li>
              <li className="flex items-center gap-2">
                <GraduationCap size={16} className="text-gold-400" /> Admissions to results
              </li>
              <li className="flex items-center gap-2">
                <LockKeyhole size={16} className="text-gold-400" /> JWT session security
              </li>
              <li className="flex items-center gap-2">
                <Mail size={16} className="text-gold-400" /> School-wide announcements
              </li>
            </ul>
          </div>

          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} Acacia Grove School · KCSE &amp; Cambridge curricula
          </p>
        </div>
      </aside>

      <main className="flex items-center justify-center bg-slate-50 px-5 py-10 sm:px-10">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow">
              <img src="/logo.svg" alt="" className="h-6 w-6 object-contain" />
            </span>
            <p className="text-base font-bold text-slate-900">Acacia Grove School Portal</p>
          </div>

          <p className="text-sm font-semibold text-brand-600">Sign in</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Welcome back
          </h2>
          <p className="mt-1.5 text-sm text-slate-500">
            Use your school account to access the portal.
          </p>

          <form onSubmit={submit} className="mt-7 space-y-4">
            <label className="block">
              <span className="label">Email address</span>
              <div className="relative">
                <Mail
                  size={16}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <Input
                  type="email"
                  autoComplete="username"
                  required
                  placeholder="you@acaciagrove.sc.ke"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="pl-10"
                />
              </div>
            </label>

            <label className="block">
              <span className="label">Password</span>
              <div className="relative">
                <LockKeyhole
                  size={16}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <Input
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  placeholder="••••••••••"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="pl-10 pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((show) => !show)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            {error && (
              <p className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-[13px] font-medium text-rose-700">
                {error}
              </p>
            )}

            <Button type="submit" loading={loading} className="w-full" size="lg">
              Sign in to portal
            </Button>
          </form>

          <div className="mt-7 rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Demo accounts · password <span className="text-brand-600">AcaciaGrove!2026</span>
            </p>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => fillDemo(account.email)}
                  className={`rounded-full border px-2.5 py-1 text-xs font-medium transition ${
                    email === account.email
                      ? "border-brand-600 bg-brand-600 text-white"
                      : "border-slate-200 bg-slate-50 text-slate-600 hover:border-brand-300 hover:text-brand-700"
                  }`}
                >
                  {account.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
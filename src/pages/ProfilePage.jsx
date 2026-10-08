import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { KeyRound, LogOut, ShieldCheck, BadgeCheck } from "lucide-react";
import api, { errorMessage } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { formatDate, roleLabel, ROLE_TONE } from "../lib/format";
import { Button, Card, CardHeader, Badge, Avatar, Spinner } from "../components/ui/primitives";
import { Field, Input } from "../components/ui/forms";

export default function ProfilePage() {
  const { user, permissions, logout, reload } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  if (!user) return <Spinner />;

  const changePassword = async (event) => {
    event.preventDefault();
    setError(null);
    if (next !== confirm) {
      setError("New passwords do not match");
      return;
    }
    setSaving(true);
    try {
      await api.post("/auth/change-password", {
        current_password: current,
        new_password: next,
      });
      toast.success("Password updated");
      setCurrent("");
      setNext("");
      setConfirm("");
      await reload();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const signOut = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">My profile</h1>
        <p className="text-sm text-slate-500">Account details, permissions and security</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="p-6">
          <div className="flex flex-col items-center text-center">
            <Avatar name={user.full_name} size="lg" />
            <h2 className="mt-4 text-lg font-bold text-slate-900">{user.full_name}</h2>
            <p className="text-sm text-slate-500">{user.email}</p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              <Badge tone={ROLE_TONE[user.role]}>{roleLabel(user.role)}</Badge>
              <Badge tone={user.is_active ? "success" : "danger"}>
                {user.is_active ? "Active" : "Disabled"}
              </Badge>
            </div>
            <dl className="mt-6 w-full space-y-3 border-t border-slate-100 pt-5 text-left text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Phone</dt>
                <dd className="font-medium text-slate-800">{user.phone || "—"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Member since</dt>
                <dd className="font-medium text-slate-800">{formatDate(user.created_at)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Last sign-in</dt>
                <dd className="font-medium text-slate-800">
                  {user.last_login_at ? formatDate(user.last_login_at, { dateStyle: "medium", timeStyle: "short" }) : "First session"}
                </dd>
              </div>
            </dl>
            <Button variant="secondary" icon={LogOut} className="mt-5 w-full" onClick={signOut}>
              Sign out
            </Button>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            title="Permissions"
            subtitle={`What the ${roleLabel(user.role)} role can do`}
            action={<ShieldCheck size={18} className="text-emerald-500" />}
          />
          <div className="p-5">
            <div className="flex flex-wrap gap-2">
              {permissions.map((permission) => (
                <span
                  key={permission}
                  className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1 font-mono text-xs text-slate-600"
                >
                  <BadgeCheck size={12} className="text-emerald-500" />
                  {permission}
                </span>
              ))}
            </div>
            <p className="mt-4 text-[13px] leading-relaxed text-slate-500">
              Permissions are enforced by the API — every request is checked server-side against
              your role, and student data is scoped to your family where applicable.
            </p>
          </div>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader
            title="Change password"
            subtitle="Use at least 8 characters; a mix of letters, numbers and symbols is recommended."
            action={<KeyRound size={18} className="text-slate-400" />}
          />
          <form onSubmit={changePassword} className="grid gap-4 p-5 sm:grid-cols-3">
            <Field label="Current password" required>
              <Input
                type="password"
                autoComplete="current-password"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                required
              />
            </Field>
            <Field label="New password" required>
              <Input
                type="password"
                autoComplete="new-password"
                value={next}
                onChange={(e) => setNext(e.target.value)}
                required
                minLength={8}
              />
            </Field>
            <Field label="Confirm new password" required error={error || undefined}>
              <Input
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={8}
              />
            </Field>
            <div className="sm:col-span-3">
              <Button type="submit" loading={saving} disabled={!current || next.length < 8}>
                Update password
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
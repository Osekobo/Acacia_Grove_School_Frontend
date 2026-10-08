import { useMemo, useState } from "react";
import { Search, UserPlus, Pencil, KeyRound, Users2 } from "lucide-react";
import api, { errorMessage } from "../lib/api";
import { useList, useFetch, useDebounced } from "../hooks/useApi";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { formatDate, roleLabel, ROLE_TONE, statusTone } from "../lib/format";
import { Button, Card, Badge, Avatar, Spinner, EmptyState } from "../components/ui/primitives";
import { DataTable, Pagination } from "../components/ui/table";
import { Modal } from "../components/ui/overlay";
import { Field, Input, Select } from "../components/ui/forms";

const EMPTY_FORM = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  role: "",
  password: "",
  is_active: true,
};

export default function UsersPage() {
  const { user: me, has } = useAuth();
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [active, setActive] = useState("");
  const q = useDebounced(search);

  const { data: roleData } = useFetch("/users/roles");
  const { items, total, pages, page, setPage, loading, error, refresh } = useList("/users", {
    q: q || undefined,
    role: role || undefined,
    is_active: active === "" ? undefined : active === "true",
  });

  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);
  const [resetTarget, setResetTarget] = useState(null);
  const [newPassword, setNewPassword] = useState("");

  const assignable = useMemo(() => {
    const all = roleData?.all_roles || [];
    const allowed = roleData?.assignable || [];
    return all.filter((r) => allowed.includes(r.value));
  }, [roleData]);

  const canWrite = has("users:write");

  const openCreate = () => {
    setForm({ ...EMPTY_FORM, role: assignable[0]?.value || "" });
    setFormError(null);
    setModal({ mode: "create" });
  };

  const openEdit = (row) => {
    setForm({
      first_name: row.first_name,
      last_name: row.last_name,
      email: row.email,
      phone: row.phone || "",
      role: row.role,
      password: "",
      is_active: row.is_active,
    });
    setFormError(null);
    setModal({ mode: "edit", user: row });
  };

  const save = async () => {
    setSaving(true);
    setFormError(null);
    try {
      if (modal.mode === "create") {
        await api.post("/users", form);
        toast.success(`${form.first_name} ${form.last_name} created`);
      } else {
        const payload = {
          first_name: form.first_name,
          last_name: form.last_name,
          phone: form.phone || null,
          role: form.role,
          is_active: form.is_active,
        };
        if (form.password) payload.password = form.password;
        await api.patch(`/users/${modal.user.id}`, payload);
        toast.success("User updated");
      }
      setModal(null);
      refresh();
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const resetPassword = async () => {
    setSaving(true);
    try {
      await api.post(`/users/${resetTarget.id}/password`, { new_password: newPassword });
      toast.success(`Password reset for ${resetTarget.full_name}`);
      setResetTarget(null);
      setNewPassword("");
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      key: "name",
      header: "User",
      render: (row) => (
        <div className="flex items-center gap-3">
          <Avatar name={row.full_name} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-900">{row.full_name}</p>
            <p className="truncate text-xs text-slate-500">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      render: (row) => <Badge tone={ROLE_TONE[row.role]}>{roleLabel(row.role)}</Badge>,
    },
    {
      key: "phone",
      header: "Phone",
      render: (row) => row.phone || <span className="text-slate-400">—</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <Badge tone={statusTone(row.is_active ? "active" : "archived")}>
          {row.is_active ? "Active" : "Disabled"}
        </Badge>
      ),
    },
    {
      key: "last_login",
      header: "Last sign-in",
      render: (row) =>
        row.last_login_at ? (
          formatDate(row.last_login_at, { day: "numeric", month: "short", year: "numeric" })
        ) : (
          <span className="text-slate-400">Never</span>
        ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      cellClassName: "text-right",
      render: (row) =>
        canWrite && (
          <div className="flex justify-end gap-1">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                openEdit(row);
              }}
              className="rounded-lg p-2 text-slate-400 transition hover:bg-brand-50 hover:text-brand-600"
              title="Edit user"
            >
              <Pencil size={15} />
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setResetTarget(row);
                setNewPassword("");
              }}
              className="rounded-lg p-2 text-slate-400 transition hover:bg-amber-50 hover:text-amber-600"
              title="Reset password"
            >
              <KeyRound size={15} />
            </button>
          </div>
        ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Users &amp; roles</h1>
          <p className="text-sm text-slate-500">
            {total} account{total === 1 ? "" : "s"} · signed in as {roleLabel(me?.role)}
          </p>
        </div>
        {canWrite && (
          <Button icon={UserPlus} onClick={openCreate}>
            New user
          </Button>
        )}
      </div>

      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-5 py-4">
          <div className="relative min-w-52 flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search name, email or phone…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={role}
            onChange={(event) => setRole(event.target.value)}
            className="w-44"
            aria-label="Filter by role"
          >
            <option value="">All roles</option>
            {(roleData?.all_roles || []).map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </Select>
          <Select
            value={active}
            onChange={(event) => setActive(event.target.value)}
            className="w-36"
            aria-label="Filter by status"
          >
            <option value="">Any status</option>
            <option value="true">Active</option>
            <option value="false">Disabled</option>
          </Select>
        </div>

        {error ? (
          <EmptyState title="Could not load users" description={error} />
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={items}
              loading={loading}
              empty={
                <EmptyState
                  icon={Users2}
                  title="No users found"
                  description="Adjust the filters or create a new account."
                  action={canWrite && <Button icon={UserPlus} onClick={openCreate}>New user</Button>}
                />
              }
            />
            <Pagination page={page} pages={pages} total={total} onPage={setPage} />
          </>
        )}
      </Card>

      <Modal
        open={Boolean(modal)}
        onClose={() => setModal(null)}
        title={modal?.mode === "create" ? "Create user" : `Edit ${modal?.user?.full_name}`}
        subtitle={
          modal?.mode === "create"
            ? "Add a staff, parent or student account with role-based access."
            : "Update account details, role and access status."
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(null)}>
              Cancel
            </Button>
            <Button onClick={save} loading={saving}>
              {modal?.mode === "create" ? "Create account" : "Save changes"}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First name" required>
            <Input
              value={form.first_name}
              onChange={(event) => setForm({ ...form, first_name: event.target.value })}
            />
          </Field>
          <Field label="Last name" required>
            <Input
              value={form.last_name}
              onChange={(event) => setForm({ ...form, last_name: event.target.value })}
            />
          </Field>
          <Field label="Email" required>
            <Input
              type="email"
              value={form.email}
              disabled={modal?.mode === "edit"}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
            />
          </Field>
          <Field label="Phone">
            <Input
              value={form.phone}
              placeholder="+254 7…"
              onChange={(event) => setForm({ ...form, phone: event.target.value })}
            />
          </Field>
          <Field label="Role" required hint={assignable.find((r) => r.value === form.role)?.description}>
            <Select
              value={form.role}
              onChange={(event) => setForm({ ...form, role: event.target.value })}
            >
              {assignable.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            label={modal?.mode === "create" ? "Temporary password" : "New password (optional)"}
            required={modal?.mode === "create"}
            hint="Minimum 8 characters"
          >
            <Input
              type="password"
              value={form.password}
              placeholder={modal?.mode === "create" ? "At least 8 characters" : "Leave blank to keep"}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
            />
          </Field>
          <div className="sm:col-span-2">
            <label className="flex items-center gap-2.5 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(event) => setForm({ ...form, is_active: event.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              Account is active (can sign in)
            </label>
          </div>
        </div>
        {formError && (
          <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-[13px] font-medium text-rose-700">
            {formError}
          </p>
        )}
      </Modal>

      <Modal
        open={Boolean(resetTarget)}
        onClose={() => setResetTarget(null)}
        title={`Reset password · ${resetTarget?.full_name || ""}`}
        subtitle="The user will sign in with this password next time."
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setResetTarget(null)}>
              Cancel
            </Button>
            <Button onClick={resetPassword} loading={saving} disabled={newPassword.length < 8}>
              Reset password
            </Button>
          </>
        }
      >
        <Field label="New password" required hint="Minimum 8 characters">
          <Input
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
          />
        </Field>
      </Modal>
    </div>
  );
}
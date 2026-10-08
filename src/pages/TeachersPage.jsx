import { useState } from "react";
import { Search, UserPlus, Pencil, UserRoundCheck } from "lucide-react";
import api, { errorMessage } from "../lib/api";
import { useList, useFetch, useDebounced } from "../hooks/useApi";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { formatDate, statusTone } from "../lib/format";
import { Button, Card, Badge, Avatar, EmptyState } from "../components/ui/primitives";
import { DataTable, Pagination } from "../components/ui/table";
import { Modal } from "../components/ui/overlay";
import { Field, Input, Select } from "../components/ui/forms";

const EMPTY_FORM = {
  first_name: "",
  last_name: "",
  email: "",
  password: "",
  phone: "",
  employee_no: "",
  qualification: "",
  department: "",
  title: "",
  date_joined: "",
};

export default function TeachersPage() {
  const { has } = useAuth();
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const q = useDebounced(search);

  const { data: departments } = useFetch("/teachers/departments");
  const { items, total, pages, page, setPage, loading, error, refresh } = useList("/teachers", {
    q: q || undefined,
    department: department || undefined,
  });

  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);
  const canWrite = has("teachers:write");

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setFormError(null);
    setModal({ mode: "create" });
  };

  const openEdit = (row) => {
    setForm({
      first_name: row.first_name,
      last_name: row.last_name,
      email: row.email,
      password: "",
      phone: row.phone || "",
      employee_no: row.employee_no || "",
      qualification: row.qualification || "",
      department: row.department || "",
      title: row.title || "",
      date_joined: row.date_joined || "",
      is_active: row.is_active,
    });
    setFormError(null);
    setModal({ mode: "edit", teacher: row });
  };

  const save = async () => {
    setSaving(true);
    setFormError(null);
    try {
      if (modal.mode === "create") {
        await api.post("/teachers", form);
        toast.success(`${form.first_name} ${form.last_name} added to staff`);
      } else {
        const payload = { ...form };
        delete payload.email;
        delete payload.password;
        delete payload.date_joined;
        await api.patch(`/teachers/${modal.teacher.id}`, payload);
        toast.success("Teacher updated");
      }
      setModal(null);
      refresh();
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      key: "name",
      header: "Teacher",
      render: (row) => (
        <div className="flex items-center gap-3">
          <Avatar name={row.full_name} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-900">
              {row.title ? `${row.title} ` : ""}
              {row.full_name}
            </p>
            <p className="truncate text-xs text-slate-500">
              {row.employee_no || row.email}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "department",
      header: "Department",
      render: (row) => row.department || <span className="text-slate-400">—</span>,
    },
    {
      key: "qualification",
      header: "Qualification",
      render: (row) => row.qualification || <span className="text-slate-400">—</span>,
    },
    {
      key: "subjects",
      header: "Subjects",
      render: (row) =>
        row.subjects?.length ? (
          <div className="flex flex-wrap gap-1">
            {row.subjects.slice(0, 3).map((subject) => (
              <Badge key={subject} tone="brand">
                {subject}
              </Badge>
            ))}
            {row.subjects.length > 3 && (
              <Badge tone="slate">+{row.subjects.length - 3}</Badge>
            )}
          </div>
        ) : (
          <span className="text-slate-400">—</span>
        ),
    },
    {
      key: "date_joined",
      header: "Joined",
      render: (row) => formatDate(row.date_joined),
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
    ...(canWrite
      ? [
          {
            key: "actions",
            header: "",
            className: "text-right",
            cellClassName: "text-right",
            render: (row) => (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  openEdit(row);
                }}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-brand-50 hover:text-brand-600"
                title="Edit teacher"
              >
                <Pencil size={15} />
              </button>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Teachers</h1>
          <p className="text-sm text-slate-500">{total} member{total === 1 ? "" : "s"} of teaching staff</p>
        </div>
        {canWrite && (
          <Button icon={UserPlus} onClick={openCreate}>
            Add teacher
          </Button>
        )}
      </div>

      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-5 py-4">
          <div className="relative min-w-52 flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search name or email…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={department}
            onChange={(event) => setDepartment(event.target.value)}
            className="w-48"
            aria-label="Filter by department"
          >
            <option value="">All departments</option>
            {(departments?.departments || []).map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </Select>
        </div>

        {error ? (
          <EmptyState title="Could not load teachers" description={error} />
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={items}
              loading={loading}
              empty={
                <EmptyState
                  icon={UserRoundCheck}
                  title="No teachers found"
                  description="Add teaching staff to get started."
                  action={canWrite && <Button icon={UserPlus} onClick={openCreate}>Add teacher</Button>}
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
        title={modal?.mode === "create" ? "Add a teacher" : `Edit ${modal?.teacher?.full_name}`}
        subtitle={
          modal?.mode === "create"
            ? "Creates a staff account with teaching permissions."
            : "Update staff details."
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(null)}>
              Cancel
            </Button>
            <Button onClick={save} loading={saving}>
              {modal?.mode === "create" ? "Add teacher" : "Save changes"}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First name" required>
            <Input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
          </Field>
          <Field label="Last name" required>
            <Input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
          </Field>
          <Field label="Email" required>
            <Input
              type="email"
              value={form.email}
              disabled={modal?.mode === "edit"}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </Field>
          <Field label={modal?.mode === "create" ? "Password" : "New password"} required={modal?.mode === "create"} hint="Minimum 8 characters">
            <Input
              type="password"
              value={form.password}
              placeholder={modal?.mode === "create" ? "At least 8 characters" : "Leave blank to keep"}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </Field>
          <Field label="Title" hint="e.g. Mr / Mrs / Dr">
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </Field>
          <Field label="Employee no.">
            <Input value={form.employee_no} onChange={(e) => setForm({ ...form, employee_no: e.target.value })} />
          </Field>
          <Field label="Department">
            <Input value={form.department} list="departments" onChange={(e) => setForm({ ...form, department: e.target.value })} />
            <datalist id="departments">
              {(departments?.departments || []).map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </Field>
          <Field label="Qualification">
            <Input value={form.qualification} onChange={(e) => setForm({ ...form, qualification: e.target.value })} />
          </Field>
          <Field label="Phone">
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </Field>
          <Field label="Date joined">
            <Input type="date" value={form.date_joined} onChange={(e) => setForm({ ...form, date_joined: e.target.value })} />
          </Field>
          {modal?.mode === "edit" && (
            <div className="sm:col-span-2">
              <label className="flex items-center gap-2.5 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                Account is active
              </label>
            </div>
          )}
        </div>
        {formError && (
          <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-[13px] font-medium text-rose-700">
            {formError}
          </p>
        )}
      </Modal>
    </div>
  );
}
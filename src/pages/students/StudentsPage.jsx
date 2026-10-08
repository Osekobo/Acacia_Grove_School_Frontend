import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, UserPlus, GraduationCap, ArrowRight } from "lucide-react";
import api, { errorMessage } from "../../lib/api";
import { useList, useFetch, useDebounced } from "../../hooks/useApi";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { formatDate, statusTone } from "../../lib/format";
import { Button, Card, Badge, Avatar, EmptyState } from "../../components/ui/primitives";
import { DataTable, Pagination } from "../../components/ui/table";
import { Modal } from "../../components/ui/overlay";
import { Field, Input, Select } from "../../components/ui/forms";

const EMPTY_FORM = {
  first_name: "",
  last_name: "",
  email: "",
  password: "",
  phone: "",
  admission_no: "",
  date_of_birth: "",
  gender: "",
  nationality: "Kenyan",
  address: "",
  class_group_id: "",
};

export default function StudentsPage() {
  const { user, has } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [classId, setClassId] = useState("");
  const [status, setStatus] = useState("");
  const q = useDebounced(search);

  const { data: classes } = useFetch("/classes?size=100", { enabled: has("classes:read") });
  const { items, total, pages, page, setPage, loading, error, refresh } = useList("/students", {
    q: q || undefined,
    class_group_id: classId || undefined,
    status: status || undefined,
  });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  const canWrite = has("students:write");
  const isParent = user?.role === "parent";
  const isStudent = user?.role === "student";
  const title = isParent ? "My children" : isStudent ? "My record" : "Students";

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setFormError(null);
    setOpen(true);
  };

  const save = async () => {
    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        ...form,
        class_group_id: form.class_group_id ? Number(form.class_group_id) : null,
        date_of_birth: form.date_of_birth || null,
        phone: form.phone || null,
        admission_no: form.admission_no || null,
        guardian_user_ids: [],
      };
      const { data } = await api.post("/students", payload);
      toast.success(`${data.full_name} admitted`);
      setOpen(false);
      refresh();
      navigate(`/students/${data.id}`);
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      key: "student",
      header: "Student",
      render: (row) => (
        <div className="flex items-center gap-3">
          <Avatar name={row.full_name} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-900">{row.full_name}</p>
            <p className="truncate text-xs text-slate-500">{row.admission_no}</p>
          </div>
        </div>
      ),
    },
    {
      key: "class_name",
      header: "Class",
      render: (row) => row.class_name || <span className="text-slate-400">Not assigned</span>,
    },
    {
      key: "gender",
      header: "Gender",
      render: (row) => (row.gender ? row.gender[0].toUpperCase() + row.gender.slice(1) : "—"),
    },
    {
      key: "date_of_birth",
      header: "Date of birth",
      render: (row) => formatDate(row.date_of_birth),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <Badge tone={statusTone(row.status)}>{row.status}</Badge>,
    },
    {
      key: "go",
      header: "",
      className: "text-right",
      cellClassName: "text-right",
      render: (row) => (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            navigate(`/students/${row.id}`);
          }}
          className="rounded-lg p-2 text-slate-400 transition hover:bg-brand-50 hover:text-brand-600"
          title="Open record"
        >
          <ArrowRight size={16} />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{title}</h1>
          <p className="text-sm text-slate-500">{total} record{total === 1 ? "" : "s"}</p>
        </div>
        {canWrite && (
          <Button icon={UserPlus} onClick={openCreate}>
            Admit student
          </Button>
        )}
      </div>

      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-5 py-4">
          <div className="relative min-w-52 flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search name or admission number…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={classId}
            onChange={(event) => setClassId(event.target.value)}
            className="w-44"
            aria-label="Filter by class"
          >
            <option value="">All classes</option>
            {(classes?.items || []).map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </Select>
          <Select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="w-36"
            aria-label="Filter by status"
          >
            <option value="">Any status</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </Select>
        </div>

        {error ? (
          <EmptyState title="Could not load students" description={error} />
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={items}
              loading={loading}
              onRowClick={(row) => navigate(`/students/${row.id}`)}
              empty={
                <EmptyState
                  icon={GraduationCap}
                  title="No students found"
                  description="Admit a student or adjust the filters."
                  action={
                    canWrite && (
                      <Button icon={UserPlus} onClick={openCreate}>
                        Admit student
                      </Button>
                    )
                  }
                />
              }
            />
            <Pagination page={page} pages={pages} total={total} onPage={setPage} />
          </>
        )}
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Admit a new student"
        subtitle="Creates a student account, login credentials and class enrollment."
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} loading={saving}>
              Admit student
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First name" required>
            <Input
              value={form.first_name}
              onChange={(e) => setForm({ ...form, first_name: e.target.value })}
            />
          </Field>
          <Field label="Last name" required>
            <Input
              value={form.last_name}
              onChange={(e) => setForm({ ...form, last_name: e.target.value })}
            />
          </Field>
          <Field label="Email" required>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </Field>
          <Field label="Login password" required hint="Minimum 8 characters">
            <Input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </Field>
          <Field label="Admission no." hint="Leave blank to auto-generate">
            <Input
              value={form.admission_no}
              placeholder="e.g. BHS-0123"
              onChange={(e) => setForm({ ...form, admission_no: e.target.value })}
            />
          </Field>
          <Field label="Phone">
            <Input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </Field>
          <Field label="Date of birth">
            <Input
              type="date"
              value={form.date_of_birth}
              onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
            />
          </Field>
          <Field label="Gender">
            <Select
              value={form.gender}
              onChange={(e) => setForm({ ...form, gender: e.target.value })}
            >
              <option value="">Select…</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
            </Select>
          </Field>
          <Field label="Class">
            <Select
              value={form.class_group_id}
              onChange={(e) => setForm({ ...form, class_group_id: e.target.value })}
            >
              <option value="">Not assigned</option>
              {(classes?.items || []).map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Nationality">
            <Input
              value={form.nationality}
              onChange={(e) => setForm({ ...form, nationality: e.target.value })}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Residential address">
              <Input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </Field>
          </div>
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
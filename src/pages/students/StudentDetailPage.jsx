import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Pencil,
  CalendarCheck2,
  Award,
  Wallet,
  Users2,
  Mail,
  Phone,
  MapPin,
  UserPlus,
  Link2,
  Unlink,
  Search,
} from "lucide-react";
import api, { errorMessage } from "../../lib/api";
import { useFetch, useList, useDebounced } from "../../hooks/useApi";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { formatDate, formatMoney, statusTone } from "../../lib/format";
import {
  Button,
  Card,
  CardHeader,
  Badge,
  Avatar,
  StatCard,
  Spinner,
  EmptyState,
} from "../../components/ui/primitives";
import { DataTable } from "../../components/ui/table";
import { Tabs } from "../../components/ui/tabs";
import { Modal, ConfirmDialog } from "../../components/ui/overlay";
import { Field, Input, Select } from "../../components/ui/forms";

const RELATIONSHIPS = [
  { value: "mother", label: "Mother" },
  { value: "father", label: "Father" },
  { value: "guardian", label: "Guardian" },
  { value: "grandparent", label: "Grandparent" },
  { value: "other", label: "Other" },
];

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "attendance", label: "Attendance" },
  { key: "grades", label: "Grades" },
  { key: "fees", label: "Fees" },
];

export default function StudentDetailPage() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const { has } = useAuth();
  const toast = useToast();
  const [tab, setTab] = useState("overview");

  const { data: student, loading, error, refresh } = useFetch(`/students/${studentId}`);
  const { data: attendance } = useFetch(`/attendance/student/${studentId}?size=30`, {
    enabled: tab === "attendance",
  });
  const { data: gradeReport } = useFetch(`/students/${studentId}/grades`, {
    enabled: tab === "grades",
  });
  const { items: invoices, loading: feesLoading } = useList(
    "/fees/invoices",
    { student_id: studentId },
    { enabled: tab === "fees" && has("fees:read") },
  );

  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  const canManageGuardians = has("guardians:write");
  const [linkOpen, setLinkOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [picked, setPicked] = useState(null);
  const [relationship, setRelationship] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);
  const [linkSaving, setLinkSaving] = useState(false);
  const [linkError, setLinkError] = useState(null);
  const [unlinkTarget, setUnlinkTarget] = useState(null);
  const [unlinkSaving, setUnlinkSaving] = useState(false);
  const debouncedSearch = useDebounced(search, 300);
  const { items: parentResults, loading: parentLoading } = useList(
    "/users",
    { role: "parent", q: debouncedSearch.trim() || undefined },
    { enabled: linkOpen && debouncedSearch.trim().length >= 1, size: 8 },
  );

  if (loading) return <Spinner />;
  if (error) {
    return (
      <EmptyState
        icon={CalendarCheck2}
        title="Student record unavailable"
        description={error}
        action={
          <Button variant="secondary" onClick={() => navigate("/students")}>
            Back to students
          </Button>
        }
      />
    );
  }

  const openEdit = () => {
    setForm({
      first_name: student.first_name,
      last_name: student.last_name,
      phone: student.phone || "",
      admission_no: student.admission_no,
      date_of_birth: student.date_of_birth || "",
      gender: student.gender || "",
      nationality: student.nationality || "",
      address: student.address || "",
      status: student.status,
      class_group_id: student.class_group_id || "",
    });
    setFormError(null);
    setEditOpen(true);
  };

  const save = async () => {
    setSaving(true);
    setFormError(null);
    try {
      await api.patch(`/students/${studentId}`, {
        ...form,
        phone: form.phone || null,
        date_of_birth: form.date_of_birth || null,
        gender: form.gender || null,
        class_group_id: form.class_group_id ? Number(form.class_group_id) : undefined,
      });
      toast.success("Student record updated");
      setEditOpen(false);
      refresh();
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const stat = student.attendance || {};
  const linkedIds = (student.guardians || []).map((g) => g.parent_user_id);
  const candidates = (parentResults || []).filter((u) => !linkedIds.includes(u.id));

  const openLink = () => {
    setSearch("");
    setPicked(null);
    setRelationship("");
    setIsPrimary(false);
    setLinkError(null);
    setLinkOpen(true);
  };

  const linkGuardian = async () => {
    if (!picked || !relationship) return;
    setLinkSaving(true);
    setLinkError(null);
    try {
      await api.post(`/students/${studentId}/guardians`, {
        parent_user_id: picked.id,
        relationship,
        is_primary: isPrimary,
      });
      toast.success(`${picked.first_name} linked as ${relationship}`);
      setLinkOpen(false);
      refresh();
    } catch (err) {
      setLinkError(errorMessage(err));
    } finally {
      setLinkSaving(false);
    }
  };

  const unlinkGuardian = async () => {
    if (!unlinkTarget) return;
    setUnlinkSaving(true);
    try {
      await api.delete(`/students/${studentId}/guardians/${unlinkTarget.id}`);
      toast.success(`${unlinkTarget.full_name} unlinked`);
      setUnlinkTarget(null);
      refresh();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setUnlinkSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={() => navigate("/students")}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-brand-600"
      >
        <ArrowLeft size={15} /> Back to students
      </button>

      <Card className="p-5">
        <div className="flex flex-wrap items-start gap-5">
          <Avatar name={student.full_name} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl font-bold text-slate-900">{student.full_name}</h1>
              <Badge tone={statusTone(student.status)}>{student.status}</Badge>
              {!student.is_active && <Badge tone="danger">Login disabled</Badge>}
            </div>
            <p className="mt-1 text-sm text-slate-500">
              {student.admission_no} · {student.class_name || "No class assigned"} · Enrolled{" "}
              {formatDate(student.enrolled_on)}
            </p>
            <div className="mt-2.5 flex flex-wrap gap-4 text-[13px] text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <Mail size={14} className="text-slate-400" /> {student.email}
              </span>
              {student.phone && (
                <span className="inline-flex items-center gap-1.5">
                  <Phone size={14} className="text-slate-400" /> {student.phone}
                </span>
              )}
              {student.address && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin size={14} className="text-slate-400" /> {student.address}
                </span>
              )}
            </div>
          </div>
          {has("students:write") && (
            <Button variant="secondary" icon={Pencil} onClick={openEdit}>
              Edit record
            </Button>
          )}
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Attendance rate"
          value={`${stat.rate}%`}
          icon={CalendarCheck2}
          tone="emerald"
          hint={`${stat.present} present · ${stat.absent} absent`}
        />
        <StatCard label="Average score" value={student.average_score != null ? `${student.average_score}%` : "—"} icon={Award} tone="gold" hint="Across all assessments" />
        <StatCard
          label="Fee balance"
          value={formatMoney(student.fee_balance, "KES", { compact: true })}
          icon={Wallet}
          tone={student.fee_balance > 0 ? "violet" : "emerald"}
          hint={student.fee_balance > 0 ? "Outstanding on invoices" : "All invoices settled"}
        />
        <StatCard label="Guardians linked" value={student.guardians?.length || 0} icon={Users2} tone="sky" />
      </div>

      <Card>
        <Tabs tabs={TABS} active={tab} onChange={setTab} />

        {tab === "overview" && (
          <div className="grid gap-6 p-5 lg:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Personal details</h3>
                  <dl className="mt-3 grid grid-cols-1 gap-x-4 gap-y-3 text-sm sm:grid-cols-2">
                {[
                  ["Admission no.", student.admission_no],
                  ["Date of birth", formatDate(student.date_of_birth)],
                  ["Gender", student.gender ? student.gender[0].toUpperCase() + student.gender.slice(1) : "—"],
                  ["Nationality", student.nationality || "—"],
                  ["Class", student.class_name || "—"],
                  ["Enrolled on", formatDate(student.enrolled_on)],
                  ["Address", student.address || "—"],
                  ["Status", student.status],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-xs uppercase tracking-wide text-slate-400">{label}</dt>
                    <dd className="mt-0.5 font-medium text-slate-800">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div>
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-slate-900">Guardians</h3>
                {canManageGuardians && (
                  <Button variant="ghost" size="sm" onClick={openLink}>
                    <UserPlus size={15} /> Link guardian
                  </Button>
                )}
              </div>
              {!student.guardians?.length ? (
                <p className="mt-3 rounded-lg border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
                  {canManageGuardians
                    ? "No guardians linked yet."
                    : "No guardians on file."}
                </p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {student.guardians.map((guardian) => (
                    <li
                      key={guardian.id}
                      className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 px-4 py-3"
                    >
                      <Avatar name={guardian.full_name} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {guardian.full_name}
                        </p>
                        <p className="break-all text-xs text-slate-500">{guardian.email}</p>
                      </div>
                      {guardian.is_primary && <Badge tone="gold">Primary</Badge>}
                      <Badge tone={guardian.is_primary ? "brand" : "slate"}>
                        {guardian.relationship}
                      </Badge>
                      {canManageGuardians && (
                        <button
                          type="button"
                          title={`Unlink ${guardian.full_name}`}
                          onClick={() => setUnlinkTarget(guardian)}
                          className="rounded-md p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                        >
                          <Unlink size={15} />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-5 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
                <p className="font-medium text-slate-800">Attendance breakdown</p>
                <div className="mt-2 grid grid-cols-4 gap-2 text-center text-[13px]">
                  {[
                    ["Present", stat.present, "text-emerald-600"],
                    ["Late", stat.late, "text-amber-600"],
                    ["Absent", stat.absent, "text-rose-600"],
                    ["Excused", stat.excused, "text-sky-600"],
                  ].map(([label, value, cls]) => (
                    <div key={label}>
                      <p className={`text-lg font-bold ${cls}`}>{value ?? 0}</p>
                      <p className="text-xs text-slate-500">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === "attendance" && (
          <DataTable
            columns={[
              { key: "date", header: "Date", render: (r) => formatDate(r.date) },
              {
                key: "status",
                header: "Status",
                render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge>,
              },
              { key: "class_name", header: "Class", render: (r) => r.class_name || "—" },
              { key: "notes", header: "Notes", render: (r) => r.notes || <span className="text-slate-400">—</span> },
            ]}
            rows={attendance?.items || []}
            rowKey={(r) => r.id}
            empty={
              <EmptyState
                icon={CalendarCheck2}
                title="No attendance recorded"
                description="Records appear here once attendance is marked."
              />
            }
          />
        )}

        {tab === "grades" && (
          <div className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-slate-500">
                {gradeReport?.grades?.length || 0} assessment result
                {(gradeReport?.grades?.length || 0) === 1 ? "" : "s"}
              </p>
              {gradeReport?.overall_average != null && (
                <Badge tone="gold">Overall average {gradeReport.overall_average}%</Badge>
              )}
            </div>
            <DataTable
              columns={[
                { key: "title", header: "Assessment", render: (r) => r.title },
                { key: "subject", header: "Subject" },
                { key: "term", header: "Term", render: (r) => r.term },
                {
                  key: "score",
                  header: "Score",
                  render: (r) => (
                    <span className="font-semibold text-slate-900">
                      {r.score}/{r.max_score}
                    </span>
                  ),
                },
                {
                  key: "percentage",
                  header: "Result",
                  render: (r) => (
                    <div className="flex items-center gap-2">
                      <span className="w-12 font-medium">{r.percentage.toFixed(1)}%</span>
                      <Badge tone={r.percentage >= 50 ? "success" : "danger"}>{r.grade_letter}</Badge>
                    </div>
                  ),
                },
              ]}
              rows={gradeReport?.grades || []}
              rowKey={(r) => `${r.assessment_id}`}
              empty={<EmptyState icon={Award} title="No grades published" description="Results appear once assessments are graded." />}
            />
          </div>
        )}

        {tab === "fees" && (
          <DataTable
            columns={[
              { key: "invoice_no", header: "Invoice", render: (r) => <span className="font-mono text-xs">{r.invoice_no}</span> },
              { key: "description", header: "Description" },
              {
                key: "amount",
                header: "Amount",
                render: (r) => formatMoney(r.amount, r.currency),
                cellClassName: "text-right",
                className: "text-right",
              },
              {
                key: "balance",
                header: "Balance",
                render: (r) => formatMoney(r.balance, r.currency),
                cellClassName: "text-right",
                className: "text-right",
              },
              { key: "due_date", header: "Due", render: (r) => formatDate(r.due_date) },
              { key: "status", header: "Status", render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge> },
            ]}
            rows={invoices}
            loading={feesLoading}
            empty={<EmptyState icon={Wallet} title="No invoices" description="Fee invoices for this student appear here." />}
          />
        )}
      </Card>

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title={`Edit ${student.full_name}`}
        subtitle="Update personal details, class placement and status."
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} loading={saving}>
              Save changes
            </Button>
          </>
        }
      >
        {form && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="First name" required>
              <Input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
            </Field>
            <Field label="Last name" required>
              <Input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
            </Field>
            <Field label="Admission no.">
              <Input value={form.admission_no} onChange={(e) => setForm({ ...form, admission_no: e.target.value })} />
            </Field>
            <Field label="Phone">
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Field>
            <Field label="Date of birth">
              <Input type="date" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} />
            </Field>
            <Field label="Gender">
              <Select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                <option value="">Select…</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
              </Select>
            </Field>
            <Field label="Nationality">
              <Input value={form.nationality} onChange={(e) => setForm({ ...form, nationality: e.target.value })} />
            </Field>
            <Field label="Status">
              <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </Select>
            </Field>
            <div className="sm:col-span-2">
              <Field label="Address">
                <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Link to="/classes" className="text-[13px] font-medium text-brand-600 hover:underline">
                Change class placement from the Classes page →
              </Link>
            </div>
          </div>
        )}
        {formError && (
          <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-[13px] font-medium text-rose-700">
            {formError}
          </p>
        )}
      </Modal>

      <Modal
        open={linkOpen}
        onClose={() => setLinkOpen(false)}
        title="Link a guardian"
        subtitle="Search for an existing parent account and connect them to this student."
        footer={
          <>
            <Button variant="secondary" onClick={() => setLinkOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={linkGuardian}
              loading={linkSaving}
              disabled={!picked || !relationship}
            >
              <Link2 size={15} /> Link guardian
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Find parent account" hint="Search by name, email or phone number.">
            <div className="relative">
              <Search
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <Input
                className="pl-9"
                placeholder="e.g. john otieno or parent1@…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPicked(null);
                }}
              />
            </div>
          </Field>

          {search.trim().length >= 1 && (
            <div className="max-h-52 overflow-y-auto rounded-lg border border-slate-200">
              {parentLoading || search.trim() !== debouncedSearch.trim() ? (
                <div className="flex items-center justify-center gap-2 px-4 py-6 text-sm text-slate-500">
                  <Spinner /> Searching…
                </div>
              ) : candidates.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-slate-500">
                  No parent accounts match that search.
                </p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {candidates.map((user) => (
                    <li key={user.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setPicked(user);
                          setLinkError(null);
                        }}
                        className={`flex w-full items-center gap-3 px-4 py-3 text-left transition ${
                          picked?.id === user.id
                            ? "bg-brand-50 ring-1 ring-inset ring-brand-500"
                            : "hover:bg-slate-50"
                        }`}
                      >
                        <Avatar name={user.full_name} size="sm" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-slate-900">
                            {user.full_name}
                          </span>
                          <span className="block break-all text-xs text-slate-500">
                            {user.email}
                          </span>
                        </span>
                        {user.phone && (
                          <span className="hidden text-xs text-slate-400 sm:block">
                            {user.phone}
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {picked && (
            <div className="grid gap-4 rounded-lg bg-slate-50 p-4 sm:grid-cols-2">
              <Field label="Relationship" required>
                <Select value={relationship} onChange={(e) => setRelationship(e.target.value)}>
                  <option value="">Select…</option>
                  {RELATIONSHIPS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <div className="flex items-end pb-1">
                <label className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={isPrimary}
                    onChange={(e) => setIsPrimary(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                  Primary contact for this student
                </label>
              </div>
            </div>
          )}

          {linkError && (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-[13px] font-medium text-rose-700">
              {linkError}
            </p>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(unlinkTarget)}
        onClose={() => setUnlinkTarget(null)}
        onConfirm={unlinkGuardian}
        loading={unlinkSaving}
        title="Unlink guardian?"
        confirmLabel="Unlink"
        message={
          unlinkTarget
            ? `${unlinkTarget.full_name} will no longer be listed as a guardian of ${student.full_name}. Their account is not deleted.`
            : ""
        }
      />
    </div>
  );
}
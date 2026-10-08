import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  UserPlus,
  Users,
  BookOpen,
  Search,
  X,
} from "lucide-react";
import api, { errorMessage } from "../../lib/api";
import { useFetch, useDebounced } from "../../hooks/useApi";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { statusTone } from "../../lib/format";
import { Button, Card, CardHeader, Badge, Avatar, Spinner, EmptyState } from "../../components/ui/primitives";
import { DataTable } from "../../components/ui/table";
import { Tabs } from "../../components/ui/tabs";
import { Modal, ConfirmDialog } from "../../components/ui/overlay";
import { Field, Input, Select } from "../../components/ui/forms";

export default function ClassDetailPage() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const { has } = useAuth();
  const toast = useToast();
  const [tab, setTab] = useState("roster");

  const { data, loading, error, refresh } = useFetch(`/classes/${classId}`);
  const { data: subjects } = useFetch("/subjects?size=100", { enabled: has("subjects:read") });
  const { data: teachers } = useFetch("/teachers?size=100", { enabled: has("teachers:read") });

  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState(null);

  const [enrollOpen, setEnrollOpen] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");
  const q = useDebounced(studentSearch);
  const [assignSubjectId, setAssignSubjectId] = useState("");
  const [assignTeacherId, setAssignTeacherId] = useState("");

  const { items: studentResults, loading: searching } = useFetch(
    `/students?q=${encodeURIComponent(q)}`,
    { enabled: enrollOpen && q.length >= 1 },
  );

  const canWrite = has("classes:write");

  if (loading) return <Spinner />;
  if (error) {
    return (
      <EmptyState
        icon={Users}
        title="Class unavailable"
        description={error}
        action={
          <Button variant="secondary" onClick={() => navigate("/classes")}>
            Back to classes
          </Button>
        }
      />
    );
  }

  const group = data.class;
  const enrolledIds = new Set((data.students || []).map((student) => student.id));

  const openEdit = () => {
    setForm({
      name: group.name,
      level: group.level,
      room: group.room || "",
      class_teacher_id: group.class_teacher_id || "",
    });
    setFormError(null);
    setEditOpen(true);
  };

  const save = async () => {
    setSaving(true);
    setFormError(null);
    try {
      await api.patch(`/classes/${classId}`, {
        ...form,
        room: form.room || null,
        class_teacher_id: form.class_teacher_id ? Number(form.class_teacher_id) : null,
      });
      toast.success("Class updated");
      setEditOpen(false);
      refresh();
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const removeClass = async () => {
    setSaving(true);
    try {
      await api.delete(`/classes/${classId}`);
      toast.success(`${group.name} deleted`);
      navigate("/classes");
    } catch (err) {
      toast.error(errorMessage(err));
      setSaving(false);
    }
  };

  const enroll = async (student) => {
    try {
      await api.post(`/classes/${classId}/students`, { student_id: student.id });
      toast.success(`${student.full_name} enrolled`);
      setEnrollOpen(false);
      setStudentSearch("");
      refresh();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const unenroll = async () => {
    setSaving(true);
    try {
      await api.delete(`/classes/${classId}/students/${removeTarget.id}`);
      toast.success(`${removeTarget.full_name} removed from class`);
      setRemoveTarget(null);
      refresh();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const assignSubject = async () => {
    if (!assignSubjectId) return;
    setSaving(true);
    try {
      await api.post(`/classes/${classId}/subjects`, {
        subject_id: Number(assignSubjectId),
        teacher_id: assignTeacherId ? Number(assignTeacherId) : null,
      });
      toast.success("Subject assigned to class");
      setAssignSubjectId("");
      setAssignTeacherId("");
      refresh();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const unassignSubject = async (subjectId) => {
    try {
      await api.delete(`/classes/${classId}/subjects/${subjectId}`);
      toast.success("Subject removed");
      refresh();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const assignableSubjects = (subjects?.items || []).filter(
    (subject) => !(data.subjects || []).some((row) => row.subject_id === subject.id),
  );

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={() => navigate("/classes")}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-brand-600"
      >
        <ArrowLeft size={15} /> Back to classes
      </button>

      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl font-bold text-slate-900">{group.name}</h1>
              <Badge tone="info">{group.level}</Badge>
              {group.room && <Badge tone="slate">Room {group.room}</Badge>}
            </div>
            <p className="mt-1.5 text-sm text-slate-500">
              Class teacher: {group.class_teacher_name || "Not assigned"} · {data.students?.length || 0}{" "}
              student{data.students?.length === 1 ? "" : "s"} · {data.subjects?.length || 0} subject
              {data.subjects?.length === 1 ? "" : "s"}
            </p>
          </div>
          {canWrite && (
            <div className="flex gap-2">
              <Button variant="secondary" icon={Pencil} onClick={openEdit}>
                Edit
              </Button>
              <Button variant="danger" icon={Trash2} onClick={() => setDeleteOpen(true)}>
                Delete
              </Button>
            </div>
          )}
        </div>
      </Card>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Tabs
            tabs={[
              { key: "roster", label: "Roster", count: data.students?.length },
              { key: "subjects", label: "Subjects", count: data.subjects?.length },
            ]}
            active={tab}
            onChange={setTab}
          />
          {canWrite && tab === "roster" && (
            <div className="pr-4">
              <Button size="sm" icon={UserPlus} onClick={() => setEnrollOpen(true)}>
                Enrol student
              </Button>
            </div>
          )}
        </div>

        {tab === "roster" && (
          <DataTable
            columns={[
              {
                key: "student",
                header: "Student",
                render: (row) => (
                  <Link
                    to={`/students/${row.id}`}
                    className="flex items-center gap-3 hover:text-brand-700"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <Avatar name={row.full_name} size="sm" />
                    <span>
                      <span className="block font-semibold text-slate-900">{row.full_name}</span>
                      <span className="block text-xs text-slate-500">{row.admission_no}</span>
                    </span>
                  </Link>
                ),
              },
              { key: "email", header: "Email", render: (row) => row.email },
              { key: "gender", header: "Gender", render: (row) => (row.gender ? row.gender : "—") },
              {
                key: "status",
                header: "Status",
                render: (row) => <Badge tone={statusTone(row.status)}>{row.status}</Badge>,
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
                            setRemoveTarget(row);
                          }}
                          className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                          title="Remove from class"
                        >
                          <X size={15} />
                        </button>
                      ),
                    },
                  ]
                : []),
            ]}
            rows={data.students || []}
            onRowClick={(row) => navigate(`/students/${row.id}`)}
            empty={
              <EmptyState
                icon={Users}
                title="No students enrolled"
                description="Enrol students to start taking attendance for this class."
                action={
                  canWrite && (
                    <Button icon={UserPlus} onClick={() => setEnrollOpen(true)}>
                      Enrol student
                    </Button>
                  )
                }
              />
            }
          />
        )}

        {tab === "subjects" && (
          <div className="p-5">
            {canWrite && assignableSubjects.length > 0 && (
              <div className="mb-5 flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="min-w-44 flex-1">
                  <Field label="Subject">
                    <Select
                      value={assignSubjectId}
                      onChange={(e) => setAssignSubjectId(e.target.value)}
                    >
                      <option value="">Select a subject…</option>
                      {assignableSubjects.map((subject) => (
                        <option key={subject.id} value={subject.id}>
                          {subject.name} ({subject.code})
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>
                <div className="min-w-44 flex-1">
                  <Field label="Teacher">
                    <Select
                      value={assignTeacherId}
                      onChange={(e) => setAssignTeacherId(e.target.value)}
                    >
                      <option value="">Unassigned</option>
                      {(teachers?.items || []).map((teacher) => (
                        <option key={teacher.id} value={teacher.id}>
                          {teacher.full_name}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>
                <Button onClick={assignSubject} loading={saving} disabled={!assignSubjectId}>
                  Assign subject
                </Button>
              </div>
            )}

            <DataTable
              columns={[
                {
                  key: "code",
                  header: "Code",
                  render: (row) => (
                    <span className="font-mono text-xs font-semibold text-brand-700">{row.subject_code}</span>
                  ),
                },
                {
                  key: "name",
                  header: "Subject",
                  render: (row) => <span className="font-semibold text-slate-900">{row.subject_name}</span>,
                },
                {
                  key: "teacher",
                  header: "Teacher",
                  render: (row) => row.teacher_name || <span className="text-slate-400">Not assigned</span>,
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
                            onClick={() => unassignSubject(row.subject_id)}
                            className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                            title="Remove subject"
                          >
                            <X size={15} />
                          </button>
                        ),
                      },
                    ]
                  : []),
              ]}
              rows={data.subjects || []}
              rowKey={(row) => row.id}
              empty={
                <EmptyState
                  icon={BookOpen}
                  title="No subjects assigned"
                  description="Assign subjects so grades can be recorded for this class."
                />
              }
            />
          </div>
        )}
      </Card>

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title={`Edit ${group.name}`}
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
            <Field label="Class name" required>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label="Level" required>
              <Input value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} />
            </Field>
            <Field label="Room">
              <Input value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} />
            </Field>
            <Field label="Class teacher">
              <Select
                value={form.class_teacher_id}
                onChange={(e) => setForm({ ...form, class_teacher_id: e.target.value })}
              >
                <option value="">Not assigned</option>
                {(teachers?.items || []).map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.full_name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        )}
        {formError && (
          <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-[13px] font-medium text-rose-700">
            {formError}
          </p>
        )}
      </Modal>

      <Modal
        open={enrollOpen}
        onClose={() => setEnrollOpen(false)}
        title="Enrol a student"
        subtitle={`Add a student to ${group.name}.`}
        size="sm"
        footer={
          <Button variant="secondary" onClick={() => setEnrollOpen(false)}>
            Close
          </Button>
        }
      >
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            autoFocus
            placeholder="Search students by name or admission no…"
            value={studentSearch}
            onChange={(e) => setStudentSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="mt-3 max-h-72 space-y-1.5 overflow-y-auto">
          {q.length < 1 && <p className="px-1 text-sm text-slate-500">Type to search for students.</p>}
          {q.length >= 1 && searching && <p className="px-1 text-sm text-slate-500">Searching…</p>}
          {(studentResults?.items || [])
            .filter((student) => !enrolledIds.has(student.id))
            .map((student) => (
              <button
                key={student.id}
                type="button"
                onClick={() => enroll(student)}
                className="flex w-full items-center gap-3 rounded-lg border border-slate-200 px-3 py-2.5 text-left transition hover:border-brand-300 hover:bg-brand-50"
              >
                <Avatar name={student.full_name} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-slate-900">
                    {student.full_name}
                  </span>
                  <span className="block truncate text-xs text-slate-500">
                    {student.admission_no} · {student.class_name || "No class"}
                  </span>
                </span>
                <UserPlus size={15} className="text-brand-600" />
              </button>
            ))}
          {q.length >= 1 &&
            !searching &&
            (studentResults?.items || []).filter((student) => !enrolledIds.has(student.id)).length === 0 && (
              <p className="px-1 text-sm text-slate-500">No matching students available.</p>
            )}
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(removeTarget)}
        onClose={() => setRemoveTarget(null)}
        onConfirm={unenroll}
        loading={saving}
        title="Remove from class"
        message={`${removeTarget?.full_name} will be removed from ${group.name}. Their records are kept.`}
        confirmLabel="Remove"
      />

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={removeClass}
        loading={saving}
        title="Delete class"
        message={`${group.name} and its enrolments will be deleted. Students remain in the system.`}
        confirmLabel="Delete class"
      />
    </div>
  );
}
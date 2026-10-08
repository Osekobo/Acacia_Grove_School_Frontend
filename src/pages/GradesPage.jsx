import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, ClipboardCheck, Save, Award, ChevronRight } from "lucide-react";
import api, { errorMessage } from "../lib/api";
import { useFetch } from "../hooks/useApi";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { formatDate } from "../lib/format";
import { Button, Card, CardHeader, Badge, Avatar, Spinner, EmptyState } from "../components/ui/primitives";
import { Modal, ConfirmDialog } from "../components/ui/overlay";
import { Field, Input, Select } from "../components/ui/forms";

const EMPTY_FORM = {
  title: "",
  subject_id: "",
  class_group_id: "",
  term_id: "",
  assessment_type: "exam",
  max_score: 100,
  weight: 1,
  due_date: "",
};

const letterFor = (pct) => (pct >= 80 ? "A" : pct >= 70 ? "B" : pct >= 60 ? "C" : pct >= 50 ? "D" : "E");

export default function GradesPage() {
  const { has } = useAuth();
  const toast = useToast();
  const canWrite = has("grades:write");
  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [termId, setTermId] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  const { data: classes } = useFetch("/classes?size=100");
  const { data: subjects } = useFetch("/subjects?size=100", { enabled: has("subjects:read") });
  const { data: terms } = useFetch("/terms");

  const params = {
    class_group_id: classId || undefined,
    subject_id: subjectId || undefined,
    term_id: termId || undefined,
  };
  const query = new URLSearchParams(
    Object.entries(params).filter(([, value]) => value !== undefined),
  ).toString();

  const {
    data: assessments,
    loading,
    refresh: refreshAssessments,
  } = useFetch(`/assessments${query ? `?${query}` : ""}`);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const items = useMemo(() => assessments?.items || [], [assessments]);
  const selected = useMemo(
    () => items.find((item) => item.id === selectedId) || null,
    [items, selectedId],
  );

  const {
    data: gradeRows,
    loading: gradesLoading,
    setData: setGradeRows,
  } = useFetch(`/assessments/${selectedId}/grades`, { enabled: Boolean(selectedId) });

  const [scores, setScores] = useState({});

  useEffect(() => {
    if (!gradeRows) return;
    const map = {};
    for (const row of gradeRows) {
      map[row.student_id] = {
        score: row.id ? String(row.score) : "",
        remarks: row.remarks || "",
      };
    }
    setScores(map);
  }, [gradeRows]);

  const openCreate = () => {
    const currentTerm = (terms || []).find((term) => term.is_current);
    setForm({
      ...EMPTY_FORM,
      class_group_id: classId || "",
      subject_id: subjectId || "",
      term_id: currentTerm?.id || terms?.[0]?.id || "",
    });
    setFormError(null);
    setOpen(true);
  };

  const create = async () => {
    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        ...form,
        subject_id: Number(form.subject_id),
        class_group_id: Number(form.class_group_id),
        term_id: Number(form.term_id),
        max_score: Number(form.max_score),
        weight: Number(form.weight),
        due_date: form.due_date || null,
      };
      const { data } = await api.post("/assessments", payload);
      toast.success(`${data.title} created`);
      setOpen(false);
      refreshAssessments();
      setSelectedId(data.id);
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setSaving(true);
    try {
      await api.delete(`/assessments/${deleteTarget.id}`);
      toast.success("Assessment deleted");
      if (selectedId === deleteTarget.id) setSelectedId(null);
      setDeleteTarget(null);
      refreshAssessments();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const saveGrades = async () => {
    setSaving(true);
    try {
      const entries = Object.entries(scores)
        .filter(([, entry]) => entry.score !== "")
        .map(([studentId, entry]) => ({
          student_id: Number(studentId),
          score: Number(entry.score),
          remarks: entry.remarks || null,
        }));
      const { data } = await api.put(`/assessments/${selectedId}/grades`, { entries });
      setGradeRows(data);
      toast.success(`${entries.length} grade${entries.length === 1 ? "" : "s"} saved`);
      refreshAssessments();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Assessments &amp; grades</h1>
          <p className="text-sm text-slate-500">
            {items.length} assessment{items.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <Field label="Class">
            <Select value={classId} onChange={(e) => setClassId(e.target.value)} className="w-40">
              <option value="">All classes</option>
              {(classes?.items || []).map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Subject">
            <Select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className="w-40">
              <option value="">All subjects</option>
              {(subjects?.items || []).map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Term">
            <Select value={termId} onChange={(e) => setTermId(e.target.value)} className="w-40">
              <option value="">All terms</option>
              {(terms || []).map((term) => (
                <option key={term.id} value={term.id}>
                  {term.name}
                </option>
              ))}
            </Select>
          </Field>
          {canWrite && (
            <Button icon={Plus} onClick={openCreate}>
              New assessment
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[380px_1fr]">
        <Card className="h-fit">
          <CardHeader title="Assessments" subtitle="Select one to enter grades" />
          {loading ? (
            <Spinner />
          ) : items.length === 0 ? (
            <EmptyState
              icon={ClipboardCheck}
              title="No assessments"
              description="Create an assessment to start recording grades."
              action={canWrite && <Button icon={Plus} onClick={openCreate}>New assessment</Button>}
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(item.id)}
                    className={`flex w-full items-center gap-3 px-5 py-3.5 text-left transition ${
                      selectedId === item.id ? "bg-brand-50/70" : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">{item.title}</p>
                      <p className="truncate text-xs text-slate-500">
                        {item.subject_name} · {item.class_name} · {item.term_name}
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        <Badge tone="slate">{item.assessment_type}</Badge>
                        <Badge tone="gold">out of {item.max_score}</Badge>
                        <Badge tone={item.graded_count > 0 ? "success" : "slate"}>
                          {item.graded_count} graded
                        </Badge>
                      </div>
                    </div>
                    <ChevronRight size={16} className="shrink-0 text-slate-400" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          {!selected ? (
            <EmptyState
              icon={Award}
              title="Grade entry"
              description="Select an assessment on the left to record or review scores."
            />
          ) : (
            <>
              <CardHeader
                title={selected.title}
                subtitle={`${selected.subject_name} · ${selected.class_name} · ${selected.term_name} · ${
                  selected.due_date ? `due ${formatDate(selected.due_date)}` : "no due date"
                }`}
                action={
                  <div className="flex items-center gap-2">
                    {canWrite && (
                      <Button icon={Save} onClick={saveGrades} loading={saving} size="sm">
                        Save grades
                      </Button>
                    )}
                    {canWrite && (
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(selected)}
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                        title="Delete assessment"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                }
              />
              {gradesLoading ? (
                <Spinner />
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-100">
                    <thead className="bg-slate-50/70">
                      <tr>
                        <th className="table-head">Student</th>
                        <th className="table-head w-36">Score (/{selected.max_score})</th>
                        <th className="table-head w-24">%</th>
                        <th className="table-head">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(gradeRows || []).map((row) => {
                        const entry = scores[row.student_id] || { score: "", remarks: "" };
                        const pct = entry.score === "" ? null : (Number(entry.score) / selected.max_score) * 100;
                        return (
                          <tr key={row.student_id} className="hover:bg-slate-50">
                            <td className="table-cell">
                              <div className="flex items-center gap-3">
                                <Avatar name={row.student_name} size="sm" />
                                <div>
                                  <p className="font-semibold text-slate-900">{row.student_name}</p>
                                  <p className="text-xs text-slate-500">{row.admission_no}</p>
                                </div>
                              </div>
                            </td>
                            <td className="table-cell">
                              <Input
                                type="number"
                                min={0}
                                max={selected.max_score}
                                step="0.5"
                                value={entry.score}
                                disabled={!canWrite}
                                onChange={(e) =>
                                  setScores((current) => ({
                                    ...current,
                                    [row.student_id]: { ...entry, score: e.target.value },
                                  }))
                                }
                                className="!py-1.5"
                                placeholder="—"
                              />
                            </td>
                            <td className="table-cell">
                              {pct === null ? (
                                <span className="text-slate-400">—</span>
                              ) : (
                                <Badge tone={pct >= 50 ? "success" : "danger"}>
                                  {pct.toFixed(0)}% {letterFor(pct)}
                                </Badge>
                              )}
                            </td>
                            <td className="table-cell">
                              <Input
                                value={entry.remarks}
                                disabled={!canWrite}
                                placeholder="Optional note"
                                onChange={(e) =>
                                  setScores((current) => ({
                                    ...current,
                                    [row.student_id]: { ...entry, remarks: e.target.value },
                                  }))
                                }
                                className="!py-1.5"
                              />
                            </td>
                          </tr>
                        );
                      })}
                      {!gradeRows?.length && (
                        <tr>
                          <td colSpan={4}>
                            <EmptyState
                              icon={ClipboardCheck}
                              title="No students in this class"
                              description="Enrol students before recording grades."
                            />
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </Card>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="New assessment"
        subtitle="Exams, quizzes, assignments and projects."
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={create}
              loading={saving}
              disabled={!form.class_group_id || !form.subject_id || !form.term_id}
            >
              Create assessment
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Title" required hint="e.g. Term 1 Mathematics Exam">
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </Field>
          </div>
          <Field label="Class" required>
            <Select value={form.class_group_id} onChange={(e) => setForm({ ...form, class_group_id: e.target.value })}>
              <option value="">Select class…</option>
              {(classes?.items || []).map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Subject" required>
            <Select value={form.subject_id} onChange={(e) => setForm({ ...form, subject_id: e.target.value })}>
              <option value="">Select subject…</option>
              {(subjects?.items || []).map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Term" required>
            <Select value={form.term_id} onChange={(e) => setForm({ ...form, term_id: e.target.value })}>
              <option value="">Select term…</option>
              {(terms || []).map((term) => (
                <option key={term.id} value={term.id}>
                  {term.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Type">
            <Select
              value={form.assessment_type}
              onChange={(e) => setForm({ ...form, assessment_type: e.target.value })}
            >
              <option value="exam">Exam</option>
              <option value="quiz">Quiz</option>
              <option value="assignment">Assignment</option>
              <option value="project">Project</option>
              <option value="practical">Practical</option>
            </Select>
          </Field>
          <Field label="Maximum score" required>
            <Input
              type="number"
              min="1"
              value={form.max_score}
              onChange={(e) => setForm({ ...form, max_score: e.target.value })}
            />
          </Field>
          <Field label="Weight" hint="Contributes to the term average">
            <Input
              type="number"
              min="0.1"
              step="0.1"
              value={form.weight}
              onChange={(e) => setForm({ ...form, weight: e.target.value })}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Due date">
              <Input
                type="date"
                value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
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

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={remove}
        loading={saving}
        title="Delete assessment"
        message={`All grades recorded for “${deleteTarget?.title}” will be deleted.`}
        confirmLabel="Delete"
      />
    </div>
  );
}
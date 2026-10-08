import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, School, Users, BookOpen, UserRound } from "lucide-react";
import api, { errorMessage } from "../../lib/api";
import { useList, useFetch, useDebounced } from "../../hooks/useApi";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { Button, Card, Badge, Spinner, EmptyState } from "../../components/ui/primitives";
import { Pagination } from "../../components/ui/table";
import { Modal } from "../../components/ui/overlay";
import { Field, Input, Select } from "../../components/ui/forms";

const EMPTY_FORM = { name: "", level: "", room: "", academic_year_id: "", class_teacher_id: "" };

export default function ClassesPage() {
  const { has } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState("");
  const q = useDebounced(search);

  const { data: years } = useFetch("/academic-years");
  const { data: teachers } = useFetch("/teachers?size=100", { enabled: has("teachers:read") });
  const { items, total, pages, page, setPage, loading, error, refresh } = useList("/classes", {
    q: q || undefined,
    level: level || undefined,
  });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);
  const canWrite = has("classes:write");

  const openCreate = () => {
    const currentYear = (years || []).find((year) => year.is_current);
    setForm({ ...EMPTY_FORM, academic_year_id: currentYear?.id || years?.[0]?.id || "" });
    setFormError(null);
    setOpen(true);
  };

  const save = async () => {
    setSaving(true);
    setFormError(null);
    try {
      await api.post("/classes", {
        ...form,
        academic_year_id: Number(form.academic_year_id),
        class_teacher_id: form.class_teacher_id ? Number(form.class_teacher_id) : null,
      });
      toast.success(`${form.name} created`);
      setOpen(false);
      refresh();
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Classes</h1>
          <p className="text-sm text-slate-500">
            {total} class{total === 1 ? "" : "es"} ·{" "}
            {(years || []).find((year) => year.is_current)?.name || "Academic year not set"}
          </p>
        </div>
        {canWrite && (
          <Button icon={Plus} onClick={openCreate}>
            New class
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-52 flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search classes…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={level}
          onChange={(event) => setLevel(event.target.value)}
          className="w-44"
          aria-label="Filter by level"
        >
          <option value="">All levels</option>
          {[...new Set((items || []).map((group) => group.level))].map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </Select>
      </div>

      {loading ? (
        <Spinner />
      ) : error ? (
        <Card>
          <EmptyState title="Could not load classes" description={error} />
        </Card>
      ) : items.length === 0 ? (
        <Card>
          <EmptyState
            icon={School}
            title="No classes yet"
            description="Create classes to organise students, subjects and attendance."
            action={canWrite && <Button icon={Plus} onClick={openCreate}>New class</Button>}
          />
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((group) => (
              <button
                key={group.id}
                type="button"
                onClick={() => navigate(`/classes/${group.id}`)}
                className="card group p-5 text-left transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600 transition group-hover:bg-brand-600 group-hover:text-white">
                    <School size={18} />
                  </span>
                  <Badge tone="info">{group.level}</Badge>
                </div>
                <h3 className="mt-4 text-base font-bold text-slate-900">{group.name}</h3>
                <p className="mt-0.5 text-[13px] text-slate-500">
                  {group.room ? `Room ${group.room}` : "No room assigned"}
                </p>
                <div className="mt-4 flex items-center gap-4 border-t border-slate-100 pt-3 text-[13px] text-slate-500">
                  <span className="inline-flex items-center gap-1.5">
                    <Users size={14} className="text-slate-400" /> {group.student_count}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <BookOpen size={14} className="text-slate-400" /> {group.subject_count}
                  </span>
                  <span className="ml-auto inline-flex items-center gap-1.5 truncate">
                    <UserRound size={14} className="text-slate-400" />
                    <span className="truncate">{group.class_teacher_name || "—"}</span>
                  </span>
                </div>
              </button>
            ))}
          </div>
          <Card>
            <Pagination page={page} pages={pages} total={total} onPage={setPage} size={50} />
          </Card>
        </>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Create a class"
        subtitle="Classes group students for attendance, subjects and assessments."
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} loading={saving} disabled={!form.academic_year_id}>
              Create class
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Class name" required hint="e.g. Grade 4 Blue">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Level" required hint="e.g. Primary, Junior School">
            <Input value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} />
          </Field>
          <Field label="Room">
            <Input value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} />
          </Field>
          <Field label="Academic year" required>
            <Select
              value={form.academic_year_id}
              onChange={(e) => setForm({ ...form, academic_year_id: e.target.value })}
            >
              {(years || []).map((year) => (
                <option key={year.id} value={year.id}>
                  {year.name} {year.is_current ? "(current)" : ""}
                </option>
              ))}
            </Select>
          </Field>
          <div className="sm:col-span-2">
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
import { useState } from "react";
import { Search, Plus, Pencil, Trash2, BookOpen } from "lucide-react";
import api, { errorMessage } from "../lib/api";
import { useList, useDebounced } from "../hooks/useApi";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { Button, Card, Badge, EmptyState, Spinner } from "../components/ui/primitives";
import { DataTable, Pagination } from "../components/ui/table";
import { Modal, ConfirmDialog } from "../components/ui/overlay";
import { Field, Input, Textarea } from "../components/ui/forms";

const EMPTY_FORM = { name: "", code: "", level: "", description: "" };

export default function SubjectsPage() {
  const { has } = useAuth();
  const toast = useToast();
  const [search, setSearch] = useState("");
  const q = useDebounced(search);
  const { items, total, pages, page, setPage, loading, error, refresh } = useList(
    "/subjects",
    { q: q || undefined },
    { size: 50 },
  );

  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const canWrite = has("subjects:write");

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setFormError(null);
    setModal({ mode: "create" });
  };

  const openEdit = (row) => {
    setForm({
      name: row.name,
      code: row.code,
      level: row.level || "",
      description: row.description || "",
    });
    setFormError(null);
    setModal({ mode: "edit", subject: row });
  };

  const save = async () => {
    setSaving(true);
    setFormError(null);
    try {
      if (modal.mode === "create") {
        await api.post("/subjects", form);
        toast.success(`${form.name} added to the curriculum`);
      } else {
        await api.patch(`/subjects/${modal.subject.id}`, form);
        toast.success("Subject updated");
      }
      setModal(null);
      refresh();
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setSaving(true);
    try {
      await api.delete(`/subjects/${deleteTarget.id}`);
      toast.success(`${deleteTarget.name} removed`);
      setDeleteTarget(null);
      refresh();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      key: "code",
      header: "Code",
      render: (row) => <span className="font-mono text-xs font-semibold text-brand-700">{row.code}</span>,
    },
    { key: "name", header: "Subject", render: (row) => <span className="font-semibold text-slate-900">{row.name}</span> },
    {
      key: "level",
      header: "Level",
      render: (row) => (row.level ? <Badge tone="info">{row.level}</Badge> : <span className="text-slate-400">—</span>),
    },
    {
      key: "description",
      header: "Description",
      render: (row) => row.description || <span className="text-slate-400">—</span>,
    },
    ...(canWrite
      ? [
          {
            key: "actions",
            header: "",
            className: "text-right",
            cellClassName: "text-right",
            render: (row) => (
              <div className="flex justify-end gap-1">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    openEdit(row);
                  }}
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-brand-50 hover:text-brand-600"
                  title="Edit subject"
                >
                  <Pencil size={15} />
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setDeleteTarget(row);
                  }}
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                  title="Delete subject"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Subjects</h1>
          <p className="text-sm text-slate-500">{total} subject{total === 1 ? "" : "s"} in the curriculum</p>
        </div>
        {canWrite && (
          <Button icon={Plus} onClick={openCreate}>
            New subject
          </Button>
        )}
      </div>

      <Card>
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
          <div className="relative w-full max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search by name or code…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        {loading ? (
          <Spinner />
        ) : error ? (
          <EmptyState title="Could not load subjects" description={error} />
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={items}
              empty={
                <EmptyState
                  icon={BookOpen}
                  title="No subjects yet"
                  description="Add the subjects your school offers."
                  action={canWrite && <Button icon={Plus} onClick={openCreate}>New subject</Button>}
                />
              }
            />
            <Pagination page={page} pages={pages} total={total} onPage={setPage} size={50} />
          </>
        )}
      </Card>

      <Modal
        open={Boolean(modal)}
        onClose={() => setModal(null)}
        title={modal?.mode === "create" ? "New subject" : `Edit ${modal?.subject?.name}`}
        subtitle="Subjects can be assigned to classes and assessed."
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(null)}>
              Cancel
            </Button>
            <Button onClick={save} loading={saving}>
              {modal?.mode === "create" ? "Create subject" : "Save changes"}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Subject name" required>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Code" required hint="e.g. MATH101">
            <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Level" hint="e.g. Primary, Junior School, O-Level">
              <Input value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Description">
              <Textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
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
        title="Delete subject"
        message={`Remove ${deleteTarget?.name} from the curriculum? Class assignments for this subject will also be removed.`}
        confirmLabel="Delete subject"
      />
    </div>
  );
}
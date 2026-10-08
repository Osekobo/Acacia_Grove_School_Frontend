import { useState } from "react";
import { Search, Plus, Pencil, Trash2, Megaphone, Pin } from "lucide-react";
import api, { errorMessage } from "../lib/api";
import { useList, useDebounced } from "../hooks/useApi";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { formatDateTime, relativeTime } from "../lib/format";
import { Button, Card, Badge, Avatar, EmptyState } from "../components/ui/primitives";
import { Pagination } from "../components/ui/table";
import { Modal, ConfirmDialog } from "../components/ui/overlay";
import { Field, Input, Textarea, Select } from "../components/ui/forms";

const AUDIENCES = [
  { value: "all", label: "Everyone" },
  { value: "staff", label: "Staff only" },
  { value: "students", label: "Students" },
  { value: "parents", label: "Parents" },
];

const EMPTY_FORM = { title: "", body: "", audience: "all", is_pinned: false };

export default function AnnouncementsPage() {
  const { has } = useAuth();
  const toast = useToast();
  const [search, setSearch] = useState("");
  const q = useDebounced(search);
  const { items, total, pages, page, setPage, loading, error, refresh } = useList("/announcements", {
    q: q || undefined,
  });

  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const canWrite = has("announcements:write");

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setFormError(null);
    setModal({ mode: "create" });
  };

  const openEdit = (row) => {
    setForm({ title: row.title, body: row.body, audience: row.audience, is_pinned: row.is_pinned });
    setFormError(null);
    setModal({ mode: "edit", announcement: row });
  };

  const save = async () => {
    setSaving(true);
    setFormError(null);
    try {
      if (modal.mode === "create") {
        await api.post("/announcements", form);
        toast.success("Announcement published");
      } else {
        await api.patch(`/announcements/${modal.announcement.id}`, form);
        toast.success("Announcement updated");
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
      await api.delete(`/announcements/${deleteTarget.id}`);
      toast.success("Announcement removed");
      setDeleteTarget(null);
      refresh();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Announcements</h1>
          <p className="text-sm text-slate-500">{total} notice{total === 1 ? "" : "s"} published</p>
        </div>
        {canWrite && (
          <Button icon={Plus} onClick={openCreate}>
            New announcement
          </Button>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative w-full max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search notices…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {loading ? (
        <Card className="p-6">
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-24 animate-pulse rounded-lg bg-slate-100" />
            ))}
          </div>
        </Card>
      ) : error ? (
        <Card>
          <EmptyState title="Could not load announcements" description={error} />
        </Card>
      ) : items.length === 0 ? (
        <Card>
          <EmptyState
            icon={Megaphone}
            title="No announcements"
            description="Notices you publish will appear here for your audience."
            action={canWrite && <Button icon={Plus} onClick={openCreate}>New announcement</Button>}
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item.id} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {item.is_pinned && (
                      <Badge tone="gold">
                        <Pin size={11} /> Pinned
                      </Badge>
                    )}
                    <Badge tone={item.audience === "all" ? "brand" : "slate"}>
                      {AUDIENCES.find((a) => a.value === item.audience)?.label || item.audience}
                    </Badge>
                    <span className="text-xs text-slate-400">{formatDateTime(item.created_at)}</span>
                  </div>
                  <h3 className="mt-2 text-base font-semibold text-slate-900">{item.title}</h3>
                  <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-slate-600">
                    {item.body}
                  </p>
                  <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                    <Avatar name={item.author_name || "School"} size="sm" className="!h-6 !w-6 !text-[10px]" />
                    {item.author_name || "School office"} · {relativeTime(item.created_at)}
                  </div>
                </div>
                {canWrite && (
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      onClick={() => openEdit(item)}
                      className="rounded-lg p-2 text-slate-400 transition hover:bg-brand-50 hover:text-brand-600"
                      title="Edit"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(item)}
                      className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                      title="Delete"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                )}
              </div>
            </Card>
          ))}
          <Card>
            <Pagination page={page} pages={pages} total={total} onPage={setPage} size={20} />
          </Card>
        </div>
      )}

      <Modal
        open={Boolean(modal)}
        onClose={() => setModal(null)}
        title={modal?.mode === "create" ? "New announcement" : "Edit announcement"}
        subtitle="Reach the whole school or a specific audience."
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(null)}>
              Cancel
            </Button>
            <Button onClick={save} loading={saving}>
              {modal?.mode === "create" ? "Publish" : "Save changes"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Title" required>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </Field>
          <Field label="Message" required>
            <Textarea rows={6} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Audience" required>
              <Select value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })}>
                {AUDIENCES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Placement">
              <Select
                value={form.is_pinned ? "pinned" : "normal"}
                onChange={(e) => setForm({ ...form, is_pinned: e.target.value === "pinned" })}
              >
                <option value="normal">Standard notice</option>
                <option value="pinned">Pin to top</option>
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

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={remove}
        loading={saving}
        title="Delete announcement"
        message={`“${deleteTarget?.title}” will be removed for everyone. This cannot be undone.`}
        confirmLabel="Delete"
      />
    </div>
  );
}
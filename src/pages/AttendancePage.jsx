import { useEffect, useMemo, useState } from "react";
import {
  CalendarCheck2,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  Save,
  TrendingUp,
} from "lucide-react";
import api, { errorMessage } from "../lib/api";
import { useFetch, useList } from "../hooks/useApi";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { formatDate, statusTone } from "../lib/format";
import { Button, Card, CardHeader, Badge, Avatar, Spinner, EmptyState } from "../components/ui/primitives";
import { DataTable, Pagination } from "../components/ui/table";
import { Field, Input, Select } from "../components/ui/forms";
import { BarChart } from "../components/ui/charts";

const STATUSES = [
  { value: "present", label: "Present", active: "bg-emerald-600 text-white", icon: CheckCircle2 },
  { value: "late", label: "Late", active: "bg-amber-500 text-white", icon: Clock },
  { value: "absent", label: "Absent", active: "bg-rose-600 text-white", icon: XCircle },
  { value: "excused", label: "Excused", active: "bg-sky-600 text-white", icon: FileText },
];

const todayISO = () => new Date().toISOString().slice(0, 10);

export default function AttendancePage() {
  const { has } = useAuth();
  const toast = useToast();
  const canWrite = has("attendance:write");
  const canPickClass = has("classes:read");

  const [date, setDate] = useState(todayISO());
  const [classId, setClassId] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [marks, setMarks] = useState({});
  const [saving, setSaving] = useState(false);
  const [summary, setSummary] = useState(null);
  const [page, setPage] = useState(1);

  const { data: classes } = useFetch("/classes?size=100", { enabled: canPickClass });
  const { data: trend } = useFetch("/attendance/trend?days=14", { enabled: has("attendance:read") });

  const listParams = { day: date, status: statusFilter || undefined };
  const { items, total, pages, loading: listLoading } = useList("/attendance", listParams, {
    size: 50,
    enabled: has("attendance:read"),
  });

  const activeClassId = useMemo(() => {
    if (!canPickClass) return null;
    if (classId) return Number(classId);
    return classes?.items?.[0]?.id || null;
  }, [classId, classes, canPickClass]);

  const { data: roster, loading: rosterLoading } = useFetch(`/classes/${activeClassId}`, {
    enabled: Boolean(activeClassId),
  });
  const { data: dayRecords, refresh: refreshDay } = useFetch(
    `/attendance?day=${date}&class_group_id=${activeClassId || ""}`,
    { enabled: Boolean(activeClassId) },
  );

  useEffect(() => {
    if (!roster?.students) return;
    const existing = {};
    for (const record of dayRecords?.items || []) {
      existing[record.student_id] = { status: record.status, notes: record.notes || "" };
    }
    const seeded = {};
    for (const student of roster.students) {
      seeded[student.id] = existing[student.id] || { status: "present", notes: "" };
    }
    setMarks(seeded);
    setSummary(null);
  }, [roster, dayRecords, date, activeClassId]);

  const counts = useMemo(() => {
    const tally = { present: 0, late: 0, absent: 0, excused: 0 };
    Object.values(marks).forEach((entry) => {
      if (tally[entry.status] !== undefined) tally[entry.status] += 1;
    });
    return tally;
  }, [marks]);

  const totalMarks = Object.keys(marks).length;

  const save = async () => {
    if (!activeClassId) return;
    setSaving(true);
    try {
      const entries = Object.entries(marks).map(([studentId, entry]) => ({
        student_id: Number(studentId),
        status: entry.status,
        notes: entry.notes || null,
      }));
      const { data } = await api.post("/attendance", {
        date,
        class_group_id: activeClassId,
        entries,
      });
      setSummary(data);
      toast.success(`Register saved · ${data.rate}% attendance`);
      refreshDay();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const trendData = (trend || []).map((day) => ({
    label: formatDate(day.date, { day: "numeric", month: "short" }),
    rate: day.rate,
  }));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Attendance</h1>
          <p className="text-sm text-slate-500">
            {canWrite ? "Mark and review the daily register" : "Daily attendance records"}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Field label="Date">
            <Input type="date" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} />
          </Field>
          {canPickClass && (
            <Field label="Class">
              <Select value={classId} onChange={(e) => setClassId(e.target.value)} className="w-44">
                {(classes?.items || []).map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </Select>
            </Field>
          )}
        </div>
      </div>

      {canWrite && activeClassId && (
        <Card>
          <CardHeader
            title={`Register · ${roster?.class?.name || "Loading…"}`}
            subtitle={`${formatDate(date)} · ${totalMarks} student${totalMarks === 1 ? "" : "s"}`}
            action={
              <Button icon={Save} onClick={save} loading={saving} disabled={!totalMarks}>
                Save register
              </Button>
            }
          />
          {rosterLoading ? (
            <Spinner />
          ) : (
            <div className="p-5">
              <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {STATUSES.map((status) => (
                  <div key={status.value} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">
                    <p className="text-xl font-bold text-slate-900">{counts[status.value]}</p>
                    <p className="text-xs font-medium text-slate-500">{status.label}</p>
                  </div>
                ))}
              </div>

              <div className="divide-y divide-slate-100">
                {(roster?.students || []).map((student) => {
                  const entry = marks[student.id] || { status: "present" };
                  return (
                    <div
                      key={student.id}
                      className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0"
                    >
                      <Avatar name={student.full_name} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {student.full_name}
                        </p>
                        <p className="truncate text-xs text-slate-500">{student.admission_no}</p>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {STATUSES.map((status) => {
                          const Icon = status.icon;
                          const selected = entry.status === status.value;
                          return (
                            <button
                              key={status.value}
                              type="button"
                              onClick={() =>
                                setMarks((current) => ({
                                  ...current,
                                  [student.id]: { ...entry, status: status.value },
                                }))
                              }
                              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${
                                selected
                                  ? `${status.active} border-transparent shadow-sm`
                                  : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700"
                              }`}
                            >
                              <Icon size={13} />
                              {status.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                {(!roster?.students || roster.students.length === 0) && (
                  <EmptyState
                    icon={CalendarCheck2}
                    title="No students in this class"
                    description="Enrol students first to take the register."
                  />
                )}
              </div>

              {summary && (
                <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
                  Saved · {summary.present} present, {summary.late} late, {summary.absent} absent,{" "}
                  {summary.excused} excused — {summary.rate}% attendance.
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      <div className="grid gap-5 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Records"
            subtitle={`Attendance logged on ${formatDate(date)}`}
            action={
              canPickClass && (
                <Select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-36 !py-1.5 text-xs"
                  aria-label="Filter by status"
                >
                  <option value="">All statuses</option>
                  {STATUSES.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </Select>
              )
            }
          />
          <DataTable
            columns={[
              {
                key: "student",
                header: "Student",
                render: (row) => (
                  <div className="flex items-center gap-3">
                    <Avatar name={row.student_name} size="sm" />
                    <div>
                      <p className="font-semibold text-slate-900">{row.student_name}</p>
                      <p className="text-xs text-slate-500">{row.admission_no}</p>
                    </div>
                  </div>
                ),
              },
              { key: "class_name", header: "Class", render: (row) => row.class_name || "—" },
              {
                key: "status",
                header: "Status",
                render: (row) => <Badge tone={statusTone(row.status)}>{row.status}</Badge>,
              },
              { key: "notes", header: "Notes", render: (row) => row.notes || <span className="text-slate-400">—</span> },
            ]}
            rows={items}
            loading={listLoading}
            empty={
              <EmptyState
                icon={CalendarCheck2}
                title="No records for this date"
                description="Records appear once the register has been saved."
              />
            }
          />
          <Pagination page={page} pages={pages} total={total} onPage={setPage} size={50} />
        </Card>

        <Card>
          <CardHeader
            title="Attendance trend"
            subtitle="Rate over the last 14 days"
            action={<TrendingUp size={17} className="text-emerald-500" />}
          />
          <div className="p-5">
            {trendData.length ? (
              <BarChart data={trendData} />
            ) : (
              <EmptyState icon={TrendingUp} title="No trend data yet" />
            )}
            <p className="mt-4 rounded-lg bg-slate-50 px-3.5 py-2.5 text-[13px] leading-relaxed text-slate-500">
              {canWrite
                ? "Save a register to build up the daily trend. Rates include students marked present or late."
                : "Trend is calculated from all attendance records you are permitted to see."}
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
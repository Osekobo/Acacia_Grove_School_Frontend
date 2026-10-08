import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Users,
  GraduationCap,
  School,
  BookOpen,
  CalendarCheck2,
  Wallet,
  Megaphone,
  Award,
  UserRoundCheck,
  ArrowRight,
  Pin,
} from "lucide-react";
import { useFetch } from "../hooks/useApi";
import { useAuth } from "../context/AuthContext";
import { formatMoney, formatDate, relativeTime, roleLabel } from "../lib/format";
import { StatCard, Card, CardHeader, Badge, Spinner, EmptyState } from "../components/ui/primitives";
import { BarChart, DonutChart, ProgressRow } from "../components/ui/charts";

const STATUS_ORDER = ["present", "late", "absent", "excused"];

export default function Dashboard() {
  const { user, has } = useAuth();
  const [searchParams] = useSearchParams();
  const denied = searchParams.get("denied") === "1";

  const { data: stats, loading } = useFetch("/dashboard");
  const { data: trend } = useFetch("/attendance/trend?days=14", {
    enabled: has("attendance:read"),
  });

  const trendData = useMemo(
    () =>
      (trend || []).map((day) => ({
        label: formatDate(day.date, { day: "numeric", month: "short" }),
        rate: day.rate,
      })),
    [trend],
  );

  const attendanceEntries = useMemo(
    () =>
      STATUS_ORDER.map((status) => ({
        status,
        count: stats?.attendance_today?.[status] || 0,
      })),
    [stats],
  );

  const attendanceTotal = attendanceEntries.reduce((sum, entry) => sum + entry.count, 0);
  const invoiced = (stats?.fees_collected || 0) + (stats?.fees_outstanding || 0);

  if (loading) return <Spinner />;

  const isStaff = ["admin", "principal", "vice_principal", "secretary", "teacher", "bursar"].includes(
    user?.role,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {roleLabel(user?.role)} · Signed in as {user?.full_name}
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            {isStaff ? "School overview" : "Your dashboard"}
          </h1>
        </div>
        <div className="flex gap-2">
          {has("attendance:write") && (
            <Link to="/attendance" className="btn-secondary !h-9 !text-[13px]">
              Mark attendance
            </Link>
          )}
          {has("announcements:read") && (
            <Link to="/announcements" className="btn-primary !h-9 !text-[13px]">
              Announcements
            </Link>
          )}
        </div>
      </div>

      {denied && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
          You do not have permission to access that page. Contact the administrator if you believe
          this is a mistake.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isStaff ? (
          <>
            <StatCard
              label="Enrolled students"
              value={stats.students}
              icon={GraduationCap}
              tone="brand"
            />
            <StatCard label="Teaching staff" value={stats.teachers} icon={UserRoundCheck} tone="sky" />
            <StatCard label="Classes" value={stats.classes} icon={School} tone="violet" />
            <StatCard label="Subjects offered" value={stats.subjects} icon={BookOpen} tone="gold" />
          </>
        ) : (
          <>
            <StatCard
              label={user?.role === "parent" ? "Children enrolled" : "Enrolled"}
              value={stats.students}
              icon={GraduationCap}
              tone="brand"
            />
            <StatCard
              label="Attendance rate (month)"
              value={`${stats.attendance_rate}%`}
              icon={CalendarCheck2}
              tone="emerald"
            />
            <StatCard
              label="Average score"
              value={stats.average_score != null ? `${stats.average_score}%` : "—"}
              icon={Award}
              tone="gold"
            />
            <StatCard
              label="Fee balance"
              value={formatMoney(stats.fees_outstanding || 0, "KES", { compact: true })}
              icon={Wallet}
              tone="sky"
            />
          </>
        )}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader
            title="Attendance this month"
            subtitle={`${attendanceTotal} records logged`}
          />
          <div className="p-5">
            <DonutChart
              value={stats.attendance_rate}
              total={100}
              label="present"
              sublabel={`${stats.attendance_rate}% attendance rate`}
            />
            <div className="mt-5 space-y-3">
              {attendanceEntries.map((entry) => (
                <ProgressRow
                  key={entry.status}
                  label={entry.status[0].toUpperCase() + entry.status.slice(1)}
                  value={attendanceTotal ? (entry.count / attendanceTotal) * 100 : 0}
                  tone={
                    entry.status === "present"
                      ? "emerald"
                      : entry.status === "late"
                        ? "gold"
                        : entry.status === "absent"
                          ? "rose"
                          : "sky"
                  }
                />
              ))}
            </div>
          </div>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader
            title="Attendance trend"
            subtitle="Daily attendance rate, last 14 days"
            action={
              <Link
                to="/attendance"
                className="inline-flex items-center gap-1 text-[13px] font-semibold text-brand-600 hover:text-brand-700"
              >
                Open register <ArrowRight size={14} />
              </Link>
            }
          />
          <div className="p-5">
            {trendData.length ? (
              <BarChart data={trendData} />
            ) : (
              <EmptyState
                icon={CalendarCheck2}
                title="No attendance recorded yet"
                description="The trend appears once attendance is marked for a class."
              />
            )}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {has("fees:read") && (
          <Card>
            <CardHeader title="Fee collection" subtitle="Academic year to date" />
            <div className="p-5">
              <DonutChart
                value={stats.fees_collected}
                total={invoiced || 1}
                label="collected"
                sublabel={formatMoney(stats.fees_collected, "KES", { compact: true })}
              />
              <div className="mt-5 space-y-3 border-t border-slate-100 pt-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Outstanding</span>
                  <span className="font-semibold text-rose-600">
                    {formatMoney(stats.fees_outstanding, "KES")}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Invoiced</span>
                  <span className="font-semibold text-slate-800">
                    {formatMoney(invoiced, "KES")}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        )}

        <Card className={has("fees:read") ? "xl:col-span-2" : "xl:col-span-3"}>
          <CardHeader
            title="Latest announcements"
            subtitle="Updates from the school office"
            action={
              <Link
                to="/announcements"
                className="inline-flex items-center gap-1 text-[13px] font-semibold text-brand-600 hover:text-brand-700"
              >
                View all <ArrowRight size={14} />
              </Link>
            }
          />
          <div className="divide-y divide-slate-100">
            {(stats.recent_announcements || []).length === 0 && (
              <EmptyState
                icon={Megaphone}
                title="No announcements yet"
                description="Published notices will appear here."
              />
            )}
            {(stats.recent_announcements || []).map((item) => (
              <Link
                key={item.id}
                to="/announcements"
                className="flex items-start gap-3 px-5 py-4 transition hover:bg-slate-50"
              >
                <span className="mt-0.5 rounded-lg bg-brand-50 p-2 text-brand-600">
                  {item.is_pinned ? <Pin size={15} /> : <Megaphone size={15} />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="line-clamp-1 text-sm font-semibold text-slate-900">{item.title}</p>
                    <Badge tone={item.audience === "all" ? "brand" : "slate"}>
                      {item.audience}
                    </Badge>
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-[13px] text-slate-500">{item.body}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {item.author || "School office"} · {relativeTime(item.created_at)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      </div>

      {isStaff && (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Parents / guardians" value={stats.parents} icon={Users} tone="slate" />
          <StatCard label="Staff accounts" value={stats.staff} icon={UserRoundCheck} tone="sky" />
          <StatCard
            label="Published notices"
            value={stats.announcements}
            icon={Megaphone}
            tone="gold"
          />
        </div>
      )}
    </div>
  );
}
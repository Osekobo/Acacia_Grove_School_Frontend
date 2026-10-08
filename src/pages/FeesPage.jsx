import { useState } from "react";
import {
  Plus,
  Search,
  Wallet,
  CreditCard,
  Banknote,
  Receipt,
  CircleDollarSign,
} from "lucide-react";
import api, { errorMessage } from "../lib/api";
import { useList, useFetch, useDebounced } from "../hooks/useApi";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { formatDate, formatDateTime, formatMoney, statusTone } from "../lib/format";
import { Button, Card, Badge, StatCard, Avatar, EmptyState } from "../components/ui/primitives";
import { DataTable, Pagination } from "../components/ui/table";
import { Tabs } from "../components/ui/tabs";
import { Modal, ConfirmDialog } from "../components/ui/overlay";
import { Field, Input, Select } from "../components/ui/forms";
import { DonutChart } from "../components/ui/charts";

const EMPTY_INVOICE = {
  student_id: "",
  description: "",
  amount: "",
  currency: "KES",
  due_date: "",
};

export default function FeesPage() {
  const { has } = useAuth();
  const toast = useToast();
  const canWrite = has("fees:write");
  const [tab, setTab] = useState("invoices");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const q = useDebounced(search);

  const { data: summary, refresh: refreshSummary } = useFetch("/fees/summary");
  const { items, total, pages, page, setPage, loading, error, refresh } = useList("/fees/invoices", {
    q: q || undefined,
    status: status || undefined,
  });
  const { items: payments, loading: paymentsLoading } = useList(
    "/fees/payments",
    {},
    { enabled: tab === "payments" },
  );

  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState(EMPTY_INVOICE);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  const [studentQuery, setStudentQuery] = useState("");
  const debouncedStudentQuery = useDebounced(studentQuery);
  const { data: studentResults, loading: searchingStudents } = useFetch(
    `/students?q=${encodeURIComponent(debouncedStudentQuery)}`,
    { enabled: invoiceOpen && debouncedStudentQuery.length >= 1 },
  );

  const [paymentTarget, setPaymentTarget] = useState(null);
  const [paymentForm, setPaymentForm] = useState({ amount: "", method: "bank_transfer", reference: "" });
  const [waiveTarget, setWaiveTarget] = useState(null);

  const openInvoice = () => {
    setInvoiceForm(EMPTY_INVOICE);
    setStudentQuery("");
    setFormError(null);
    setInvoiceOpen(true);
  };

  const createInvoice = async () => {
    setSaving(true);
    setFormError(null);
    try {
      await api.post("/fees/invoices", {
        ...invoiceForm,
        student_id: Number(invoiceForm.student_id),
        amount: Number(invoiceForm.amount),
        due_date: invoiceForm.due_date || null,
      });
      toast.success("Invoice created");
      setInvoiceOpen(false);
      refresh();
      refreshSummary();
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const recordPayment = async () => {
    setSaving(true);
    try {
      await api.post(`/fees/invoices/${paymentTarget.id}/payments`, {
        amount: Number(paymentForm.amount),
        method: paymentForm.method,
        reference: paymentForm.reference || null,
      });
      toast.success(`Payment recorded against ${paymentTarget.invoice_no}`);
      setPaymentTarget(null);
      setPaymentForm({ amount: "", method: "bank_transfer", reference: "" });
      refresh();
      refreshSummary();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const waive = async () => {
    setSaving(true);
    try {
      await api.patch(`/fees/invoices/${waiveTarget.id}`, { status: "waived" });
      toast.success(`${waiveTarget.invoice_no} waived`);
      setWaiveTarget(null);
      refresh();
      refreshSummary();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const invoiceColumns = [
    {
      key: "invoice_no",
      header: "Invoice",
      render: (row) => <span className="font-mono text-xs font-semibold text-slate-700">{row.invoice_no}</span>,
    },
    {
      key: "student",
      header: "Student",
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={row.student_name} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-900">{row.student_name}</p>
            <p className="truncate text-xs text-slate-500">{row.admission_no}</p>
          </div>
        </div>
      ),
    },
    { key: "description", header: "Description" },
    {
      key: "amount",
      header: "Amount",
      className: "text-right",
      cellClassName: "text-right font-semibold text-slate-900",
      render: (row) => formatMoney(row.amount, row.currency),
    },
    {
      key: "balance",
      header: "Balance",
      className: "text-right",
      cellClassName: "text-right",
      render: (row) => (
        <span className={row.balance > 0 ? "font-semibold text-rose-600" : "text-emerald-600"}>
          {formatMoney(row.balance, row.currency)}
        </span>
      ),
    },
    { key: "due_date", header: "Due", render: (row) => formatDate(row.due_date) },
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
              <div className="flex justify-end gap-1">
                {row.status !== "paid" && row.status !== "waived" && (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setPaymentTarget(row);
                      setPaymentForm({
                        amount: String(row.balance),
                        method: "bank_transfer",
                        reference: "",
                      });
                    }}
                    className="rounded-lg p-2 text-slate-400 transition hover:bg-emerald-50 hover:text-emerald-600"
                    title="Record payment"
                  >
                    <CreditCard size={15} />
                  </button>
                )}
                {row.status !== "paid" && row.status !== "waived" && (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setWaiveTarget(row);
                    }}
                    className="rounded-lg p-2 text-slate-400 transition hover:bg-amber-50 hover:text-amber-600"
                    title="Waive invoice"
                  >
                    <Banknote size={15} />
                  </button>
                )}
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Fees &amp; payments</h1>
          <p className="text-sm text-slate-500">Invoicing, collections and outstanding balances</p>
        </div>
        {canWrite && (
          <Button icon={Plus} onClick={openInvoice}>
            New invoice
          </Button>
        )}
      </div>

      {summary && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Total invoiced"
              value={formatMoney(summary.total_invoiced, summary.currency, { compact: true })}
              icon={Receipt}
              tone="brand"
            />
            <StatCard
              label="Collected"
              value={formatMoney(summary.total_collected, summary.currency, { compact: true })}
              icon={CircleDollarSign}
              tone="emerald"
              trend={`${summary.collection_rate}%`}
              hint="collection rate"
            />
            <StatCard
              label="Outstanding"
              value={formatMoney(summary.total_outstanding, summary.currency, { compact: true })}
              icon={Wallet}
              tone="gold"
              hint={`${summary.unpaid_count} unpaid · ${summary.partial_count} partial`}
            />
            <StatCard
              label="Fully paid invoices"
              value={summary.paid_count}
              icon={CreditCard}
              tone="sky"
            />
          </div>

          <Card className="p-5">
            <DonutChart
              value={summary.total_collected}
              total={summary.total_invoiced || 1}
              label="collected"
              sublabel={`${formatMoney(summary.total_collected, summary.currency)} collected of ${formatMoney(summary.total_invoiced, summary.currency)}`}
            />
          </Card>
        </>
      )}

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Tabs
            tabs={[
              { key: "invoices", label: "Invoices", count: total },
              { key: "payments", label: "Payments" },
            ]}
            active={tab}
            onChange={setTab}
          />
          {tab === "invoices" && (
            <div className="flex flex-1 items-center justify-end gap-3 px-4 py-2">
              <div className="relative w-full max-w-xs">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <Input
                  placeholder="Search invoice no or description…"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="pl-9 !py-1.5 text-xs"
                />
              </div>
              <Select
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value);
                  setPage(1);
                }}
                className="w-32 !py-1.5 text-xs"
                aria-label="Filter by status"
              >
                <option value="">All statuses</option>
                <option value="unpaid">Unpaid</option>
                <option value="partial">Partial</option>
                <option value="paid">Paid</option>
                <option value="waived">Waived</option>
              </Select>
            </div>
          )}
        </div>

        {tab === "invoices" &&
          (error ? (
            <EmptyState title="Could not load invoices" description={error} />
          ) : (
            <>
              <DataTable
                columns={invoiceColumns}
                rows={items}
                loading={loading}
                empty={
                  <EmptyState
                    icon={Receipt}
                    title="No invoices"
                    description="Create an invoice to start billing families."
                    action={canWrite && <Button icon={Plus} onClick={openInvoice}>New invoice</Button>}
                  />
                }
              />
              <Pagination page={page} pages={pages} total={total} onPage={setPage} />
            </>
          ))}

        {tab === "payments" && (
          <DataTable
            columns={[
              { key: "paid_at", header: "Date", render: (row) => formatDateTime(row.paid_at) },
              {
                key: "student_name",
                header: "Student",
                render: (row) => <span className="font-semibold text-slate-900">{row.student_name}</span>,
              },
              { key: "invoice_no", header: "Invoice", render: (row) => <span className="font-mono text-xs">{row.invoice_no}</span> },
              {
                key: "amount",
                header: "Amount",
                className: "text-right",
                cellClassName: "text-right font-semibold text-emerald-700",
                render: (row) => formatMoney(row.amount),
              },
              {
                key: "method",
                header: "Method",
                render: (row) => <Badge tone="info">{String(row.method).replace(/_/g, " ")}</Badge>,
              },
              { key: "reference", header: "Reference", render: (row) => row.reference || <span className="text-slate-400">—</span> },
            ]}
            rows={payments}
            loading={paymentsLoading}
            empty={<EmptyState icon={Banknote} title="No payments recorded" description="Payments appear here once invoices are settled." />}
          />
        )}
      </Card>

      <Modal
        open={invoiceOpen}
        onClose={() => setInvoiceOpen(false)}
        title="New invoice"
        subtitle="Bill a student for tuition, trips, meals or other charges."
        footer={
          <>
            <Button variant="secondary" onClick={() => setInvoiceOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={createInvoice}
              loading={saving}
              disabled={!invoiceForm.student_id || !invoiceForm.description || !invoiceForm.amount}
            >
              Create invoice
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Student" required>
              <div className="relative">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <Input
                  placeholder="Search student by name or admission no…"
                  value={studentQuery}
                  onChange={(e) => setStudentQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              {studentQuery && (
                <div className="mt-2 max-h-44 space-y-1 overflow-y-auto rounded-lg border border-slate-200 p-1">
                  {searchingStudents && <p className="px-2 py-1.5 text-xs text-slate-500">Searching…</p>}
                  {(studentResults?.items || []).map((student) => (
                    <button
                      key={student.id}
                      type="button"
                      onClick={() => {
                        setInvoiceForm({ ...invoiceForm, student_id: student.id });
                        setStudentQuery(student.full_name);
                      }}
                      className={`flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left text-sm transition hover:bg-brand-50 ${
                        invoiceForm.student_id === student.id ? "bg-brand-50 text-brand-700" : "text-slate-700"
                      }`}
                    >
                      <span className="font-medium">{student.full_name}</span>
                      <span className="text-xs text-slate-500">{student.admission_no}</span>
                    </button>
                  ))}
                  {!searchingStudents && (studentResults?.items || []).length === 0 && (
                    <p className="px-2 py-1.5 text-xs text-slate-500">No students found.</p>
                  )}
                </div>
              )}
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Description" required hint="e.g. Term 1 tuition · Grade 4">
              <Input
                value={invoiceForm.description}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, description: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Amount" required>
            <Input
              type="number"
              min="1"
              step="0.01"
              value={invoiceForm.amount}
              onChange={(e) => setInvoiceForm({ ...invoiceForm, amount: e.target.value })}
            />
          </Field>
          <Field label="Currency">
            <Select
              value={invoiceForm.currency}
              onChange={(e) => setInvoiceForm({ ...invoiceForm, currency: e.target.value })}
            >
              <option value="KES">KES · Kenyan shilling</option>
              <option value="USD">USD · US dollar</option>
            </Select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Due date">
              <Input
                type="date"
                value={invoiceForm.due_date}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, due_date: e.target.value })}
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

      <Modal
        open={Boolean(paymentTarget)}
        onClose={() => setPaymentTarget(null)}
        title={`Record payment · ${paymentTarget?.invoice_no || ""}`}
        subtitle={`${paymentTarget?.student_name || ""} · outstanding ${formatMoney(paymentTarget?.balance || 0, paymentTarget?.currency)}`}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setPaymentTarget(null)}>
              Cancel
            </Button>
            <Button onClick={recordPayment} loading={saving} disabled={!paymentForm.amount}>
              Record payment
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Amount" required>
            <Input
              type="number"
              min="0.01"
              step="0.01"
              value={paymentForm.amount}
              onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
            />
          </Field>
          <Field label="Method" required>
            <Select
              value={paymentForm.method}
              onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}
            >
              <option value="bank_transfer">Bank transfer</option>
              <option value="mpesa">M-Pesa</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="cheque">Cheque</option>
            </Select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Reference" hint="Transaction ID, receipt no. or cheque no.">
              <Input
                value={paymentForm.reference}
                onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
              />
            </Field>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(waiveTarget)}
        onClose={() => setWaiveTarget(null)}
        onConfirm={waive}
        loading={saving}
        title="Waive invoice"
        message={`Waive ${waiveTarget?.invoice_no} (${formatMoney(waiveTarget?.amount || 0, waiveTarget?.currency)}) for ${waiveTarget?.student_name}? The balance will be written off.`}
        confirmLabel="Waive invoice"
      />
    </div>
  );
}
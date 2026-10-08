import { ChevronLeft, ChevronRight } from "lucide-react";
import { EmptyState, Spinner } from "./primitives";

export function DataTable({ columns, rows, rowKey = (row) => row.id, loading, empty, onRowClick }) {
  if (loading) return <Spinner />;
  if (!rows?.length) return empty || <EmptyState title="Nothing here yet" />;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-100 border-collapse">
        <thead className="bg-slate-50/70">
          <tr>
            {columns.map((column) => (
              <th key={column.key} className={`table-head ${column.className || ""}`}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={`transition ${
                onRowClick ? "cursor-pointer hover:bg-brand-50/40" : "hover:bg-slate-50"
              }`}
            >
              {columns.map((column) => (
                <td key={column.key} className={`table-cell ${column.cellClassName || ""}`}>
                  {column.render ? column.render(row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Pagination({ page, pages, total, onPage, size = 25 }) {
  if (!total) return null;
  const from = (page - 1) * size + 1;
  const to = Math.min(page * size, total);
  return (
    <div className="flex items-center justify-between gap-4 border-t border-slate-100 px-5 py-3">
      <p className="text-[13px] text-slate-500">
        Showing <span className="font-semibold text-slate-700">{from}–{to}</span> of{" "}
        <span className="font-semibold text-slate-700">{total}</span>
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          className="rounded-lg border border-slate-200 p-1.5 text-slate-500 transition hover:bg-slate-50 disabled:opacity-40"
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="px-2 text-[13px] font-medium text-slate-600">
          {page} / {Math.max(pages, 1)}
        </span>
        <button
          type="button"
          disabled={page >= pages}
          onClick={() => onPage(page + 1)}
          className="rounded-lg border border-slate-200 p-1.5 text-slate-500 transition hover:bg-slate-50 disabled:opacity-40"
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
import { useEffect, useMemo, useState } from "react";

export function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

export function toMoney(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

export function normalizeStatus(value) {
  return String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function Alert({ type = "error", children }) {
  const styles =
    type === "success"
      ? "border-green-200 bg-green-50 text-green-700"
      : type === "warning"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-red-200 bg-red-50 text-red-700";

  if (!children) return null;

  return <div className={`mb-6 rounded-xl border px-4 py-3 text-sm ${styles}`}>{children}</div>;
}

export function SearchField({ value, onChange, placeholder = "Search..." }) {
  return (
    <div className="relative">
      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
        search
      </span>
      <input
        className="w-64 pl-10 pr-4 py-2 bg-primary/5 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/20"
        placeholder={placeholder}
        type="text"
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
      />
    </div>
  );
}

export function FilterSelect({ label, value, options, onChange }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="font-semibold text-slate-500">{label}</span>
      <select
        className="rounded-lg border-none bg-white px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-primary/20"
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function SearchableSelect({
  label,
  value,
  options,
  onChange,
  placeholder = "Search...",
  emptyLabel = "No matches found",
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const selectedOption = useMemo(
    () => options.find((option) => String(option.value) === String(value)) || null,
    [options, value]
  );

  useEffect(() => {
    if (!open) {
      setQuery(selectedOption?.label || "");
    }
  }, [selectedOption, open]);

  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return options;
    return options.filter((option) => String(option.label || "").toLowerCase().includes(normalizedQuery));
  }, [options, query]);

  return (
    <label className="relative flex items-center gap-2 text-sm">
      <span className="font-semibold text-slate-500">{label}</span>
      <div className="relative min-w-64">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base">
          search
        </span>
        <input
          className="w-full rounded-lg border-none bg-white pl-9 pr-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-primary/20"
          type="text"
          placeholder={placeholder}
          value={query}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            window.setTimeout(() => {
              setOpen(false);
              setQuery(selectedOption?.label || "");
            }, 120);
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setOpen(false);
              setQuery(selectedOption?.label || "");
            }
          }}
        />

        {open ? (
          <div className="absolute z-30 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
            {filteredOptions.length ? (
              filteredOptions.map((option) => (
                <button
                  key={String(option.value)}
                  className={
                    String(option.value) === String(value)
                      ? "w-full px-3 py-2 text-left text-sm bg-primary/10 text-primary font-semibold"
                      : "w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                  }
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    onChange?.(option.value);
                    setQuery(option.label || "");
                    setOpen(false);
                  }}
                >
                  {option.label}
                </button>
              ))
            ) : (
              <p className="px-3 py-2 text-sm text-slate-500">{emptyLabel}</p>
            )}
          </div>
        ) : null}
      </div>
    </label>
  );
}

const STATUS_STYLES = {
  active: "bg-green-100 text-green-700",
  approved: "bg-green-100 text-green-700",
  resolved: "bg-green-100 text-green-700",
  reviewed: "bg-blue-100 text-blue-700",
  reviewing: "bg-blue-100 text-blue-700",
  paid: "bg-green-100 text-green-700",
  delivered: "bg-green-100 text-green-700",
  available: "bg-green-100 text-green-700",
  pending: "bg-amber-100 text-amber-700",
  open: "bg-amber-100 text-amber-700",
  refunded: "bg-blue-100 text-blue-700",
  suspended: "bg-red-100 text-red-700",
  rejected: "bg-red-100 text-red-700",
  cancelled: "bg-red-100 text-red-700",
  disabled: "bg-red-100 text-red-700",
  unavailable: "bg-red-100 text-red-700",
  admin: "bg-slate-900 text-white",
  restaurant_owner: "bg-primary/10 text-primary",
  customer: "bg-slate-100 text-slate-700",
};

export function StatusBadge({ value, label }) {
  const key = String(value || "").toLowerCase();
  const styles = STATUS_STYLES[key] || "bg-slate-100 text-slate-700";

  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase ${styles}`}>
      {label || normalizeStatus(value)}
    </span>
  );
}

export function EmptyState({ loading, message, loadingMessage = "Loading..." }) {
  return (
    <div className="px-6 py-10 text-sm text-slate-500">
      {loading ? loadingMessage : message}
    </div>
  );
}

export function TableShell({ children }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-primary/10 bg-white shadow-sm">
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

export function PaginationControls({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
}) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const start = total ? (page - 1) * pageSize + 1 : 0;
  const end = Math.min(total, page * pageSize);

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
      <span>
        Showing <strong>{start}</strong>-<strong>{end}</strong> of <strong>{total}</strong>
      </span>
      <div className="flex items-center gap-2">
        <select
          className="rounded-lg border-none bg-white px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-primary/20"
          value={pageSize}
          onChange={(event) => onPageSizeChange?.(Number(event.target.value))}
        >
          {[5, 10, 20, 30].map((size) => (
            <option key={size} value={size}>
              {size} / page
            </option>
          ))}
        </select>
        <button
          className="rounded-lg bg-white px-3 py-2 font-semibold shadow-sm disabled:opacity-50"
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange?.(page - 1)}
        >
          Previous
        </button>
        <span className="font-semibold">
          {page} / {pageCount}
        </span>
        <button
          className="rounded-lg bg-white px-3 py-2 font-semibold shadow-sm disabled:opacity-50"
          type="button"
          disabled={page >= pageCount}
          onClick={() => onPageChange?.(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export function ActionButton({ tone = "neutral", icon, children, ...props }) {
  const styles =
    tone === "primary"
      ? "bg-primary text-white hover:bg-primary/90"
      : tone === "danger"
        ? "bg-red-50 text-red-700 hover:bg-red-100"
        : tone === "success"
          ? "bg-green-50 text-green-700 hover:bg-green-100"
          : "bg-slate-100 text-slate-700 hover:bg-slate-200";

  return (
    <button
      {...props}
      className={`inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-60 ${styles} ${
        props.className || ""
      }`}
      type={props.type || "button"}
    >
      {icon ? <span className="material-symbols-outlined text-base">{icon}</span> : null}
      {children}
    </button>
  );
}

export function Modal({ title, subtitle, onClose, children, footer = null, maxWidth = "max-w-2xl" }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
      <div className={`max-h-[90vh] w-full ${maxWidth} overflow-hidden rounded-2xl bg-white shadow-2xl`}>
        <div className="flex items-center justify-between border-b border-slate-100 p-6">
          <div>
            <h3 className="text-xl font-bold">{title}</h3>
            {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
          </div>
          <button
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            type="button"
            onClick={onClose}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="max-h-[65vh] overflow-y-auto p-6">{children}</div>
        {footer ? <div className="flex justify-end gap-3 border-t border-slate-100 p-4">{footer}</div> : null}
      </div>
    </div>
  );
}

export function ConfirmModal({
  title,
  message,
  confirmLabel = "Confirm",
  tone = "danger",
  onCancel,
  onConfirm,
}) {
  if (!title) return null;

  return (
    <Modal
      title={title}
      subtitle={message}
      onClose={onCancel}
      maxWidth="max-w-md"
      footer={
        <>
          <ActionButton onClick={onCancel}>Cancel</ActionButton>
          <ActionButton tone={tone} onClick={onConfirm}>
            {confirmLabel}
          </ActionButton>
        </>
      }
    >
      <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
        This action requires confirmation before it changes the admin view.
      </div>
    </Modal>
  );
}

export function Toggle({ checked, onChange, disabled = false }) {
  return (
    <button
      className={checked ? "relative h-7 w-12 rounded-full bg-emerald-500" : "relative h-7 w-12 rounded-full bg-slate-300"}
      type="button"
      onClick={() => onChange?.(!checked)}
      disabled={disabled}
    >
      <span
        className={
          checked
            ? "absolute left-6 top-1 h-5 w-5 rounded-full bg-white transition-all"
            : "absolute left-1 top-1 h-5 w-5 rounded-full bg-white transition-all"
        }
      />
    </button>
  );
}

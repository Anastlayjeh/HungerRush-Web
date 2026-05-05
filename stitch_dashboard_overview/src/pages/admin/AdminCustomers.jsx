import { useEffect, useMemo, useState } from "react";
import AdminShell from "../../components/AdminShell.jsx";
import {
  ActionButton,
  Alert,
  ConfirmModal,
  EmptyState,
  FilterSelect,
  Modal,
  PaginationControls,
  SearchableSelect,
  SearchField,
  SortableTh,
  StatusBadge,
  TableShell,
  formatDate,
  formatDateTime,
  normalizeStatus,
  sortRows,
  toggleSortConfig,
} from "../../components/admin/AdminUI.jsx";
import { api } from "../../lib/api.js";
import { mockAdminData } from "../../lib/adminData.js";

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
  { value: "pending", label: "Pending" },
];

function getUserRole(user) {
  return user?.role?.value || user?.role || "customer";
}

function toId(value) {
  if (value === undefined || value === null || value === "") return "";
  return String(value);
}

function textOrDash(value) {
  if (value === undefined || value === null || value === "") return "-";
  return String(value);
}

function isCustomer(user) {
  return getUserRole(user) === "customer";
}

export default function AdminCustomers({ onNavigate, token, user, onLogout }) {
  const [users, setUsers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortConfig, setSortConfig] = useState({ key: "id", direction: "desc" });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [usingMock, setUsingMock] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [confirm, setConfirm] = useState(null);

  useEffect(() => {
    if (!token) return undefined;

    let isCancelled = false;
    const loadUsers = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await api.getAdminUsers(token);
        if (!isCancelled) {
          setUsers(response.items.length ? response.items : []);
          setUsingMock(false);
        }
      } catch (requestError) {
        if (!isCancelled) {
          setUsers(mockAdminData.users);
          setUsingMock(true);
          setError(requestError?.message || "Admin users endpoint is not available yet.");
        }
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };

    loadUsers();
    return () => {
      isCancelled = true;
    };
  }, [token]);

  const customers = useMemo(() => users.filter((current) => isCustomer(current)), [users]);

  useEffect(() => {
    setPage(1);
  }, [selectedCustomerId, search, statusFilter, pageSize]);

  const customerOptions = useMemo(
    () =>
      customers
        .map((current) => ({
          value: toId(current?.id),
          label: current?.name ? `${current.name} (#${current.id})` : `Customer #${current?.id || "-"}`,
        }))
        .sort((left, right) => left.label.localeCompare(right.label)),
    [customers]
  );

  const filteredCustomers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return customers.filter((current) => {
      const currentId = toId(current?.id);
      const status = String(current?.status || "active");
      const matchesSelected = !selectedCustomerId || currentId === selectedCustomerId;
      const matchesStatus = statusFilter === "all" || status === statusFilter;
      const matchesSearch =
        !normalizedSearch ||
        currentId.includes(normalizedSearch) ||
        String(current?.name || "").toLowerCase().includes(normalizedSearch) ||
        String(current?.email || "").toLowerCase().includes(normalizedSearch);

      return matchesSelected && matchesStatus && matchesSearch;
    });
  }, [customers, selectedCustomerId, search, statusFilter]);

  const visibleCustomers = useMemo(
    () =>
      sortRows(filteredCustomers, sortConfig, (row, key) => {
        if (key === "id") return row?.id;
        if (key === "name") return row?.name;
        if (key === "email") return row?.email;
        if (key === "status") return row?.status;
        if (key === "created_at") return row?.created_at;
        return row?.[key];
      }).slice((page - 1) * pageSize, page * pageSize),
    [filteredCustomers, sortConfig, page, pageSize]
  );

  const handleSort = (key) => {
    setSortConfig((previous) => toggleSortConfig(previous, key));
  };

  const updateCustomer = (target, patch, message) => {
    setUsers((previous) =>
      previous.map((current) => (current.id === target.id ? { ...current, ...patch } : current))
    );
    setSuccess(message);
  };

  const deleteCustomer = (target) => {
    setUsers((previous) => previous.filter((current) => current.id !== target.id));
    setSuccess(`Customer #${target.id} was removed from the admin view.`);
    setConfirm(null);
  };

  return (
    <AdminShell
      activePage="adminCustomers"
      onNavigate={onNavigate}
      user={user}
      onLogout={onLogout}
      title="Customer Management"
      headerActions={<SearchField value={search} onChange={setSearch} placeholder="Search customers..." />}
    >
      {usingMock ? <Alert type="warning">{error} Showing placeholder customers.</Alert> : <Alert>{error}</Alert>}
      <Alert type="success">{success}</Alert>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <SearchableSelect
          label="Customer"
          value={selectedCustomerId}
          options={customerOptions}
          onChange={setSelectedCustomerId}
          placeholder="Select customer"
        />
        <FilterSelect label="Status" value={statusFilter} options={STATUS_OPTIONS} onChange={setStatusFilter} />
      </div>

      <TableShell>
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
            <tr>
              <SortableTh label="Customer ID" sortKey="id" sortConfig={sortConfig} onSort={handleSort} />
              <SortableTh label="Name" sortKey="name" sortConfig={sortConfig} onSort={handleSort} />
              <SortableTh label="Email" sortKey="email" sortConfig={sortConfig} onSort={handleSort} />
              <SortableTh label="Status" sortKey="status" sortConfig={sortConfig} onSort={handleSort} />
              <SortableTh label="Created" sortKey="created_at" sortConfig={sortConfig} onSort={handleSort} />
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-primary/5">
            {visibleCustomers.length ? (
              visibleCustomers.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-bold text-primary">#{row.id}</td>
                  <td className="px-6 py-4 font-semibold">{row.name || "Unnamed Customer"}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{row.email || "-"}</td>
                  <td className="px-6 py-4"><StatusBadge value={row.status || "active"} /></td>
                  <td className="px-6 py-4 text-sm text-slate-500">{formatDate(row.created_at)}</td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <ActionButton icon="visibility" onClick={() => setSelectedCustomer(row)}>View</ActionButton>
                      <ActionButton
                        tone={row.status === "suspended" ? "success" : "danger"}
                        icon={row.status === "suspended" ? "check_circle" : "block"}
                        onClick={() =>
                          setConfirm({
                            title: row.status === "suspended" ? "Activate Customer" : "Suspend Customer",
                            message: `${row.name || "This customer"} will be ${row.status === "suspended" ? "activated" : "suspended"}.`,
                            confirmLabel: row.status === "suspended" ? "Activate" : "Suspend",
                            tone: row.status === "suspended" ? "success" : "danger",
                            onConfirm: () => {
                              const nextStatus = row.status === "suspended" ? "active" : "suspended";
                              updateCustomer(row, { status: nextStatus }, `${row.name || "Customer"} is now ${nextStatus}.`);
                              setConfirm(null);
                            },
                          })
                        }
                      >
                        {row.status === "suspended" ? "Activate" : "Suspend"}
                      </ActionButton>
                      <ActionButton
                        tone="danger"
                        icon="delete"
                        onClick={() =>
                          setConfirm({
                            title: "Delete Customer",
                            message: `Delete ${row.name || `customer #${row.id}`} from this admin view?`,
                            confirmLabel: "Delete",
                            onConfirm: () => deleteCustomer(row),
                          })
                        }
                      >
                        Delete
                      </ActionButton>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6}>
                  <EmptyState loading={loading} loadingMessage="Loading customers..." message="No customers found." />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </TableShell>

      <PaginationControls
        page={page}
        pageSize={pageSize}
        total={filteredCustomers.length}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />

      {selectedCustomer ? (
        <Modal title={selectedCustomer.name || "Customer Details"} subtitle={`Customer #${selectedCustomer.id}`} onClose={() => setSelectedCustomer(null)}>
          <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
            <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Customer ID</p><p className="mt-1 font-semibold">#{selectedCustomer.id}</p></div>
            <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Full Name</p><p className="mt-1 font-semibold">{textOrDash(selectedCustomer.name)}</p></div>
            <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Email</p><p className="mt-1 font-semibold">{textOrDash(selectedCustomer.email)}</p></div>
            <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Phone</p><p className="mt-1 font-semibold">{textOrDash(selectedCustomer.phone)}</p></div>
            <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Role</p><p className="mt-1 font-semibold">{normalizeStatus(getUserRole(selectedCustomer))}</p></div>
            <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Status</p><p className="mt-1 font-semibold">{normalizeStatus(selectedCustomer.status || "active")}</p></div>
            <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Last Login</p><p className="mt-1 font-semibold">{formatDateTime(selectedCustomer.last_login_at)}</p></div>
            <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Email Verified</p><p className="mt-1 font-semibold">{formatDateTime(selectedCustomer.email_verified_at)}</p></div>
            <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Created</p><p className="mt-1 font-semibold">{formatDateTime(selectedCustomer.created_at)}</p></div>
            <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Updated</p><p className="mt-1 font-semibold">{formatDateTime(selectedCustomer.updated_at)}</p></div>
            <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Auth Provider</p><p className="mt-1 font-semibold">{textOrDash(selectedCustomer.provider)}</p></div>
            <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Provider ID</p><p className="mt-1 font-semibold">{textOrDash(selectedCustomer.provider_id)}</p></div>
            <div className="rounded-xl bg-slate-50 p-4 md:col-span-3">
              <p className="text-xs font-bold uppercase text-slate-500">Avatar</p>
              <p className="mt-1 break-all font-semibold">{textOrDash(selectedCustomer.avatar)}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4 md:col-span-3">
              <p className="text-xs font-bold uppercase text-slate-500">Raw Customer Payload</p>
              <pre className="mt-2 max-h-56 overflow-auto rounded-lg bg-white p-3 text-xs text-slate-700">{JSON.stringify(selectedCustomer, null, 2)}</pre>
            </div>
          </div>
        </Modal>
      ) : null}

      <ConfirmModal {...(confirm || {})} onCancel={() => setConfirm(null)} />
    </AdminShell>
  );
}

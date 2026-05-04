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
  StatusBadge,
  TableShell,
  formatDate,
  formatDateTime,
  normalizeStatus,
} from "../../components/admin/AdminUI.jsx";
import { api } from "../../lib/api.js";
import { mockAdminData } from "../../lib/adminData.js";

const ROLE_OPTIONS = [
  { value: "all", label: "All Roles" },
  { value: "customer", label: "Customer" },
  { value: "restaurant_owner", label: "Restaurant Owner" },
  { value: "admin", label: "Admin" },
];

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

export default function AdminUsers({ onNavigate, token, user, onLogout }) {
  const [users, setUsers] = useState([]);
  const [selectedUserFilterId, setSelectedUserFilterId] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [usingMock, setUsingMock] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [roleEditor, setRoleEditor] = useState(null);
  const [roleDraft, setRoleDraft] = useState("customer");
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

  useEffect(() => {
    setPage(1);
  }, [selectedUserFilterId, search, roleFilter, statusFilter, pageSize]);

  const userOptions = useMemo(
    () =>
      users
        .map((current) => ({
          value: toId(current?.id),
          label: current?.name
            ? `${current.name} (#${current.id})`
            : `User #${current?.id || "-"}`,
        }))
        .sort((left, right) => left.label.localeCompare(right.label)),
    [users]
  );

  const filteredUsers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return users.filter((current) => {
      const currentId = toId(current?.id);
      const role = getUserRole(current);
      const status = String(current?.status || "active");
      const matchesSelectedUser = !selectedUserFilterId || currentId === selectedUserFilterId;
      const matchesRole = roleFilter === "all" || role === roleFilter;
      const matchesStatus = statusFilter === "all" || status === statusFilter;
      const matchesSearch =
        !normalizedSearch ||
        currentId.includes(normalizedSearch) ||
        String(current?.name || "").toLowerCase().includes(normalizedSearch) ||
        String(current?.email || "").toLowerCase().includes(normalizedSearch);

      return matchesSelectedUser && matchesRole && matchesStatus && matchesSearch;
    });
  }, [users, selectedUserFilterId, search, roleFilter, statusFilter]);

  const visibleUsers = useMemo(
    () => filteredUsers.slice((page - 1) * pageSize, page * pageSize),
    [filteredUsers, page, pageSize]
  );

  const updateUser = (target, patch, message) => {
    setUsers((previous) =>
      previous.map((current) => (current.id === target.id ? { ...current, ...patch } : current))
    );
    setSuccess(message);
  };

  const deleteUser = (target) => {
    setUsers((previous) => previous.filter((current) => current.id !== target.id));
    setSuccess(`User #${target.id} was removed from the admin view.`);
    setConfirm(null);
  };

  const openRoleEditor = (target) => {
    setRoleEditor(target);
    setRoleDraft(getUserRole(target));
  };

  const saveRole = () => {
    if (!roleEditor) return;
    updateUser(roleEditor, { role: roleDraft }, `Role updated for ${roleEditor.name || `user #${roleEditor.id}`}.`);
    setRoleEditor(null);
  };

  return (
    <AdminShell
      activePage="adminUsers"
      onNavigate={onNavigate}
      user={user}
      onLogout={onLogout}
      title="User Management"
      headerActions={<SearchField value={search} onChange={setSearch} placeholder="Search users..." />}
    >
      {usingMock ? <Alert type="warning">{error} Showing placeholder users.</Alert> : <Alert>{error}</Alert>}
      <Alert type="success">{success}</Alert>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <SearchableSelect
          label="User"
          value={selectedUserFilterId}
          options={userOptions}
          onChange={setSelectedUserFilterId}
          placeholder="Select user"
        />
        <FilterSelect label="Role" value={roleFilter} options={ROLE_OPTIONS} onChange={setRoleFilter} />
        <FilterSelect label="Status" value={statusFilter} options={STATUS_OPTIONS} onChange={setStatusFilter} />
      </div>

      <TableShell>
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
            <tr>
              <th className="px-6 py-4">User ID</th>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Created</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-primary/5">
            {visibleUsers.length ? (
              visibleUsers.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-bold text-primary">#{row.id}</td>
                  <td className="px-6 py-4 font-semibold">{row.name || "Unnamed User"}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{row.email || "-"}</td>
                  <td className="px-6 py-4"><StatusBadge value={getUserRole(row)} /></td>
                  <td className="px-6 py-4"><StatusBadge value={row.status || "active"} /></td>
                  <td className="px-6 py-4 text-sm text-slate-500">{formatDate(row.created_at)}</td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <ActionButton icon="visibility" onClick={() => setSelectedUser(row)}>View</ActionButton>
                      <ActionButton icon="manage_accounts" onClick={() => openRoleEditor(row)}>Role</ActionButton>
                      <ActionButton
                        tone={row.status === "suspended" ? "success" : "danger"}
                        icon={row.status === "suspended" ? "check_circle" : "block"}
                        onClick={() =>
                          setConfirm({
                            title: row.status === "suspended" ? "Activate User" : "Suspend User",
                            message: `${row.name || "This user"} will be ${row.status === "suspended" ? "activated" : "suspended"}.`,
                            confirmLabel: row.status === "suspended" ? "Activate" : "Suspend",
                            tone: row.status === "suspended" ? "success" : "danger",
                            onConfirm: () => {
                              const nextStatus = row.status === "suspended" ? "active" : "suspended";
                              updateUser(row, { status: nextStatus }, `${row.name || "User"} is now ${nextStatus}.`);
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
                            title: "Delete User",
                            message: `Delete ${row.name || `user #${row.id}`} from this admin view?`,
                            confirmLabel: "Delete",
                            onConfirm: () => deleteUser(row),
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
                <td colSpan={7}>
                  <EmptyState loading={loading} loadingMessage="Loading users..." message="No users found." />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </TableShell>

      <PaginationControls
        page={page}
        pageSize={pageSize}
        total={filteredUsers.length}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />

      {selectedUser ? (
        <Modal title={selectedUser.name || "User Details"} subtitle={`User #${selectedUser.id}`} onClose={() => setSelectedUser(null)}>
          <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
            <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">User ID</p><p className="mt-1 font-semibold">#{selectedUser.id}</p></div>
            <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Full Name</p><p className="mt-1 font-semibold">{textOrDash(selectedUser.name)}</p></div>
            <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Email</p><p className="mt-1 font-semibold">{textOrDash(selectedUser.email)}</p></div>
            <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Phone</p><p className="mt-1 font-semibold">{textOrDash(selectedUser.phone)}</p></div>
            <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Role</p><p className="mt-1 font-semibold">{normalizeStatus(getUserRole(selectedUser))}</p></div>
            <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Status</p><p className="mt-1 font-semibold">{normalizeStatus(selectedUser.status || "active")}</p></div>
            <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Last Login</p><p className="mt-1 font-semibold">{formatDateTime(selectedUser.last_login_at)}</p></div>
            <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Email Verified</p><p className="mt-1 font-semibold">{formatDateTime(selectedUser.email_verified_at)}</p></div>
            <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Created</p><p className="mt-1 font-semibold">{formatDateTime(selectedUser.created_at)}</p></div>
            <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Updated</p><p className="mt-1 font-semibold">{formatDateTime(selectedUser.updated_at)}</p></div>
            <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Auth Provider</p><p className="mt-1 font-semibold">{textOrDash(selectedUser.provider)}</p></div>
            <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Provider ID</p><p className="mt-1 font-semibold">{textOrDash(selectedUser.provider_id)}</p></div>
            <div className="rounded-xl bg-slate-50 p-4 md:col-span-3">
              <p className="text-xs font-bold uppercase text-slate-500">Avatar</p>
              <p className="mt-1 break-all font-semibold">{textOrDash(selectedUser.avatar)}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4 md:col-span-3">
              <p className="text-xs font-bold uppercase text-slate-500">Raw User Payload</p>
              <pre className="mt-2 max-h-56 overflow-auto rounded-lg bg-white p-3 text-xs text-slate-700">{JSON.stringify(selectedUser, null, 2)}</pre>
            </div>
          </div>
        </Modal>
      ) : null}

      {roleEditor ? (
        <Modal
          title="Edit User Role"
          subtitle={roleEditor.name || `User #${roleEditor.id}`}
          onClose={() => setRoleEditor(null)}
          maxWidth="max-w-md"
          footer={
            <>
              <ActionButton onClick={() => setRoleEditor(null)}>Cancel</ActionButton>
              <ActionButton tone="primary" onClick={saveRole}>Save Role</ActionButton>
            </>
          }
        >
          <label className="block text-sm font-semibold text-slate-600">
            Role
            <select
              className="mt-2 w-full rounded-lg border-none bg-slate-50 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20"
              value={roleDraft}
              onChange={(event) => setRoleDraft(event.target.value)}
            >
              {ROLE_OPTIONS.filter((option) => option.value !== "all").map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
        </Modal>
      ) : null}

      <ConfirmModal {...(confirm || {})} onCancel={() => setConfirm(null)} />
    </AdminShell>
  );
}

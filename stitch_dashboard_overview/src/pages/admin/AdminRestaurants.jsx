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
  { value: "approved", label: "Approved" },
  { value: "pending", label: "Pending" },
  { value: "rejected", label: "Rejected" },
  { value: "suspended", label: "Suspended" },
];

function adminRestaurantStatus(value) {
  const status = String(value || "pending");
  if (status === "active") return "approved";
  if (status === "inactive") return "suspended";
  return status;
}

function ownerName(restaurant) {
  return restaurant?.owner?.name || restaurant?.owner_name || restaurant?.ownerName || `Owner #${restaurant?.owner_user_id || "-"}`;
}

function contactInfo(restaurant) {
  return restaurant?.owner?.email || restaurant?.email || restaurant?.phone || restaurant?.address || "-";
}

function toId(value) {
  if (value === undefined || value === null || value === "") return "";
  return String(value);
}

function textOrDash(value) {
  if (value === undefined || value === null || value === "") return "-";
  return String(value);
}

function ownerDetails(restaurant) {
  const owner = restaurant?.owner || {};

  return {
    id: owner?.id || restaurant?.owner_user_id || null,
    name: owner?.name || restaurant?.owner_name || restaurant?.ownerName || "",
    email: owner?.email || restaurant?.email || "",
    phone: owner?.phone || restaurant?.phone || "",
    role: owner?.role?.value || owner?.role || "restaurant_owner",
    status: owner?.status || "",
    lastLoginAt: owner?.last_login_at || "",
    emailVerifiedAt: owner?.email_verified_at || "",
    createdAt: owner?.created_at || "",
    updatedAt: owner?.updated_at || "",
  };
}

export default function AdminRestaurants({ onNavigate, token, user, onLogout }) {
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurantFilterId, setSelectedRestaurantFilterId] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortConfig, setSortConfig] = useState({ key: "id", direction: "desc" });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [usingMock, setUsingMock] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [confirm, setConfirm] = useState(null);

  useEffect(() => {
    if (!token) return undefined;

    let isCancelled = false;
    const loadRestaurants = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await api.getAdminRestaurants(token);
        if (!isCancelled) {
          setRestaurants(response.items.length ? response.items : []);
          setUsingMock(false);
        }
      } catch (requestError) {
        if (!isCancelled) {
          setRestaurants(mockAdminData.restaurants);
          setUsingMock(true);
          setError(requestError?.message || "Admin restaurants endpoint is not available yet.");
        }
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };

    loadRestaurants();
    return () => {
      isCancelled = true;
    };
  }, [token]);

  useEffect(() => {
    setPage(1);
  }, [selectedRestaurantFilterId, search, statusFilter, pageSize]);

  const restaurantOptions = useMemo(
    () =>
      restaurants
        .map((restaurant) => ({
          value: toId(restaurant?.id),
          label: restaurant?.name || `Restaurant #${restaurant?.id || "-"}`,
        }))
        .sort((left, right) => left.label.localeCompare(right.label)),
    [restaurants]
  );

  const filteredRestaurants = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return restaurants.filter((restaurant) => {
      const restaurantId = toId(restaurant?.id);
      const status = adminRestaurantStatus(restaurant?.status);
      const matchesRestaurant = !selectedRestaurantFilterId || restaurantId === selectedRestaurantFilterId;
      const matchesStatus = statusFilter === "all" || status === statusFilter;
      const matchesSearch =
        !normalizedSearch ||
        restaurantId.includes(normalizedSearch) ||
        String(restaurant?.name || "").toLowerCase().includes(normalizedSearch) ||
        ownerName(restaurant).toLowerCase().includes(normalizedSearch) ||
        String(contactInfo(restaurant)).toLowerCase().includes(normalizedSearch);

      return matchesRestaurant && matchesStatus && matchesSearch;
    });
  }, [restaurants, selectedRestaurantFilterId, search, statusFilter]);

  const visibleRestaurants = useMemo(
    () =>
      sortRows(filteredRestaurants, sortConfig, (row, key) => {
        if (key === "id") return row?.id;
        if (key === "name") return row?.name;
        if (key === "owner") return ownerName(row);
        if (key === "contact") return contactInfo(row);
        if (key === "status") return adminRestaurantStatus(row?.status);
        if (key === "rating") return Number(row?.average_rating || row?.rating || 0);
        if (key === "created_at") return row?.created_at;
        return row?.[key];
      }).slice((page - 1) * pageSize, page * pageSize),
    [filteredRestaurants, sortConfig, page, pageSize]
  );

  const handleSort = (key) => {
    setSortConfig((previous) => toggleSortConfig(previous, key));
  };

  const updateRestaurant = (target, patch, message) => {
    setRestaurants((previous) =>
      previous.map((current) => (current.id === target.id ? { ...current, ...patch } : current))
    );
    setSuccess(message);
  };

  const deleteRestaurant = (target) => {
    setRestaurants((previous) => previous.filter((current) => current.id !== target.id));
    setSuccess(`${target.name || "Restaurant"} was removed from the admin view.`);
    setConfirm(null);
  };

  return (
    <AdminShell
      activePage="adminRestaurants"
      onNavigate={onNavigate}
      user={user}
      onLogout={onLogout}
      title="Restaurant Management"
      headerActions={<SearchField value={search} onChange={setSearch} placeholder="Search restaurants..." />}
    >
      {usingMock ? <Alert type="warning">{error} Showing placeholder restaurants.</Alert> : <Alert>{error}</Alert>}
      <Alert type="success">{success}</Alert>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <SearchableSelect
          label="Restaurant"
          value={selectedRestaurantFilterId}
          options={restaurantOptions}
          onChange={setSelectedRestaurantFilterId}
          placeholder="Select restaurant"
        />
        <FilterSelect label="Status" value={statusFilter} options={STATUS_OPTIONS} onChange={setStatusFilter} />
      </div>

      <TableShell>
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
            <tr>
              <SortableTh label="Restaurant ID" sortKey="id" sortConfig={sortConfig} onSort={handleSort} />
              <SortableTh label="Restaurant" sortKey="name" sortConfig={sortConfig} onSort={handleSort} />
              <SortableTh label="Owner" sortKey="owner" sortConfig={sortConfig} onSort={handleSort} />
              <SortableTh label="Email / Contact" sortKey="contact" sortConfig={sortConfig} onSort={handleSort} />
              <SortableTh label="Status" sortKey="status" sortConfig={sortConfig} onSort={handleSort} />
              <SortableTh label="Rating" sortKey="rating" sortConfig={sortConfig} onSort={handleSort} />
              <SortableTh label="Created" sortKey="created_at" sortConfig={sortConfig} onSort={handleSort} />
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-primary/5">
            {visibleRestaurants.length ? (
              visibleRestaurants.map((row) => {
                const status = adminRestaurantStatus(row.status);
                const isSuspended = status === "suspended";

                return (
                  <tr key={row.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-bold text-primary">#{row.id}</td>
                    <td className="px-6 py-4 font-semibold">{row.name || "Unnamed Restaurant"}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{ownerName(row)}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{contactInfo(row)}</td>
                    <td className="px-6 py-4"><StatusBadge value={status} /></td>
                    <td className="px-6 py-4 text-sm font-semibold">{Number(row.average_rating || row.rating || 0).toFixed(1)}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{formatDate(row.created_at)}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <ActionButton icon="visibility" onClick={() => setSelectedRestaurant(row)}>View</ActionButton>
                        {status !== "approved" ? (
                          <ActionButton
                            tone="success"
                            icon="check_circle"
                            onClick={() => updateRestaurant(row, { status: "approved" }, `${row.name} was approved.`)}
                          >
                            Approve
                          </ActionButton>
                        ) : null}
                        {status !== "rejected" ? (
                          <ActionButton
                            tone="danger"
                            icon="cancel"
                            onClick={() =>
                              setConfirm({
                                title: "Reject Restaurant",
                                message: `${row.name || "This restaurant"} will be marked as rejected.`,
                                confirmLabel: "Reject",
                                onConfirm: () => {
                                  updateRestaurant(row, { status: "rejected" }, `${row.name} was rejected.`);
                                  setConfirm(null);
                                },
                              })
                            }
                          >
                            Reject
                          </ActionButton>
                        ) : null}
                        <ActionButton
                          tone={isSuspended ? "success" : "danger"}
                          icon={isSuspended ? "check_circle" : "block"}
                          onClick={() =>
                            setConfirm({
                              title: isSuspended ? "Activate Restaurant" : "Suspend Restaurant",
                              message: `${row.name || "This restaurant"} will be ${isSuspended ? "activated" : "suspended"}.`,
                              confirmLabel: isSuspended ? "Activate" : "Suspend",
                              tone: isSuspended ? "success" : "danger",
                              onConfirm: () => {
                                const nextStatus = isSuspended ? "approved" : "suspended";
                                updateRestaurant(row, { status: nextStatus }, `${row.name} is now ${nextStatus}.`);
                                setConfirm(null);
                              },
                            })
                          }
                        >
                          {isSuspended ? "Activate" : "Suspend"}
                        </ActionButton>
                        <ActionButton
                          tone="danger"
                          icon="delete"
                          onClick={() =>
                            setConfirm({
                              title: "Delete Restaurant",
                              message: `Delete ${row.name || `restaurant #${row.id}`} from this admin view?`,
                              confirmLabel: "Delete",
                              onConfirm: () => deleteRestaurant(row),
                            })
                          }
                        >
                          Delete
                        </ActionButton>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8}>
                  <EmptyState loading={loading} loadingMessage="Loading restaurants..." message="No restaurants found." />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </TableShell>

      <PaginationControls page={page} pageSize={pageSize} total={filteredRestaurants.length} onPageChange={setPage} onPageSizeChange={setPageSize} />

      {selectedRestaurant ? (
        <Modal
          title={selectedRestaurant.name || "Restaurant Details"}
          subtitle={`Restaurant #${selectedRestaurant.id}`}
          onClose={() => setSelectedRestaurant(null)}
        >
          <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
            <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Restaurant ID</p><p className="mt-1 font-semibold">#{selectedRestaurant.id}</p></div>
            <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Restaurant Name</p><p className="mt-1 font-semibold">{textOrDash(selectedRestaurant.name)}</p></div>
            <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Status</p><p className="mt-1 font-semibold">{normalizeStatus(adminRestaurantStatus(selectedRestaurant.status))}</p></div>
            <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Rating</p><p className="mt-1 font-semibold">{Number(selectedRestaurant.average_rating || selectedRestaurant.rating || 0).toFixed(1)}</p></div>
            <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Orders Count</p><p className="mt-1 font-semibold">{textOrDash(selectedRestaurant.orders_count)}</p></div>
            <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Reviews Count</p><p className="mt-1 font-semibold">{textOrDash(selectedRestaurant.reviews_count)}</p></div>
            <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Menu Items Count</p><p className="mt-1 font-semibold">{textOrDash(selectedRestaurant.menu_items_count)}</p></div>
            <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Created</p><p className="mt-1 font-semibold">{formatDateTime(selectedRestaurant.created_at)}</p></div>
            <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Updated</p><p className="mt-1 font-semibold">{formatDateTime(selectedRestaurant.updated_at)}</p></div>
            <div className="rounded-xl bg-slate-50 p-4 md:col-span-3"><p className="text-xs font-bold uppercase text-slate-500">Description</p><p className="mt-1 text-slate-700">{selectedRestaurant.description || "No description available."}</p></div>
            <div className="rounded-xl bg-slate-50 p-4 md:col-span-3"><p className="text-xs font-bold uppercase text-slate-500">Address / Contact</p><p className="mt-1 text-slate-700">{textOrDash(selectedRestaurant.address)}</p><p className="mt-1 text-slate-700">{textOrDash(contactInfo(selectedRestaurant))}</p></div>
            <div className="rounded-xl bg-slate-50 p-4 md:col-span-3">
              <p className="text-xs font-bold uppercase text-slate-500">Owner Account Details</p>
              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                <div><p className="text-xs font-bold uppercase text-slate-400">Owner ID</p><p className="mt-1 font-semibold">#{textOrDash(ownerDetails(selectedRestaurant).id)}</p></div>
                <div><p className="text-xs font-bold uppercase text-slate-400">Name</p><p className="mt-1 font-semibold">{textOrDash(ownerDetails(selectedRestaurant).name)}</p></div>
                <div><p className="text-xs font-bold uppercase text-slate-400">Email</p><p className="mt-1 font-semibold">{textOrDash(ownerDetails(selectedRestaurant).email)}</p></div>
                <div><p className="text-xs font-bold uppercase text-slate-400">Phone</p><p className="mt-1 font-semibold">{textOrDash(ownerDetails(selectedRestaurant).phone)}</p></div>
                <div><p className="text-xs font-bold uppercase text-slate-400">Role</p><p className="mt-1 font-semibold">{normalizeStatus(ownerDetails(selectedRestaurant).role)}</p></div>
                <div><p className="text-xs font-bold uppercase text-slate-400">Status</p><p className="mt-1 font-semibold">{ownerDetails(selectedRestaurant).status ? normalizeStatus(ownerDetails(selectedRestaurant).status) : "-"}</p></div>
                <div><p className="text-xs font-bold uppercase text-slate-400">Last Login</p><p className="mt-1 font-semibold">{formatDateTime(ownerDetails(selectedRestaurant).lastLoginAt)}</p></div>
                <div><p className="text-xs font-bold uppercase text-slate-400">Email Verified</p><p className="mt-1 font-semibold">{formatDateTime(ownerDetails(selectedRestaurant).emailVerifiedAt)}</p></div>
                <div><p className="text-xs font-bold uppercase text-slate-400">Created</p><p className="mt-1 font-semibold">{formatDateTime(ownerDetails(selectedRestaurant).createdAt)}</p></div>
                <div><p className="text-xs font-bold uppercase text-slate-400">Updated</p><p className="mt-1 font-semibold">{formatDateTime(ownerDetails(selectedRestaurant).updatedAt)}</p></div>
              </div>
            </div>
            <div className="rounded-xl bg-slate-50 p-4 md:col-span-3">
              <p className="text-xs font-bold uppercase text-slate-500">Raw Restaurant Payload</p>
              <pre className="mt-2 max-h-56 overflow-auto rounded-lg bg-white p-3 text-xs text-slate-700">{JSON.stringify(selectedRestaurant, null, 2)}</pre>
            </div>
          </div>
        </Modal>
      ) : null}

      <ConfirmModal {...(confirm || {})} onCancel={() => setConfirm(null)} />
    </AdminShell>
  );
}

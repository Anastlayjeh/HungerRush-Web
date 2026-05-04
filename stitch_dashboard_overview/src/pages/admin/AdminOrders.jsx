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
  formatDateTime,
  normalizeStatus,
  toMoney,
} from "../../components/admin/AdminUI.jsx";
import { api } from "../../lib/api.js";
import { mockAdminData } from "../../lib/adminData.js";

const ORDER_STATUS_OPTIONS = [
  { value: "all", label: "All Order Statuses" },
  { value: "pending", label: "Pending" },
  { value: "accepted", label: "Accepted" },
  { value: "preparing", label: "Preparing" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
  { value: "rejected", label: "Rejected" },
];

const PAYMENT_STATUS_OPTIONS = [
  { value: "all", label: "All Payments" },
  { value: "unpaid", label: "Unpaid" },
  { value: "authorized", label: "Authorized" },
  { value: "paid", label: "Paid" },
  { value: "refunded", label: "Refunded" },
  { value: "failed", label: "Failed" },
];

function toId(value) {
  if (value === undefined || value === null || value === "") return "";
  return String(value);
}

function customerName(order) {
  return order?.customer?.name || `Customer #${order?.customer_id || "-"}`;
}

function restaurantName(order) {
  return order?.restaurant?.name || order?.restaurant_name || `Restaurant #${order?.restaurant_id || "-"}`;
}

function restaurantIdFromOrder(order) {
  return toId(order?.restaurant_id || order?.restaurant?.id);
}

function normalizePaymentStatus(value) {
  const status = String(value || "unpaid");
  if (status === "pending") return "unpaid";
  return status;
}

export default function AdminOrders({ onNavigate, token, user, onLogout }) {
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState("");
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [usingMock, setUsingMock] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusEditor, setStatusEditor] = useState(null);
  const [statusDraft, setStatusDraft] = useState("pending");
  const [paymentDraft, setPaymentDraft] = useState("unpaid");
  const [savingOrderUpdate, setSavingOrderUpdate] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const selectedRestaurant = useMemo(
    () => restaurants.find((restaurant) => toId(restaurant?.id) === toId(selectedRestaurantId)) || null,
    [restaurants, selectedRestaurantId]
  );

  useEffect(() => {
    if (!token) return undefined;

    let isCancelled = false;
    const loadData = async () => {
      setLoading(true);
      setError("");

      let fallbackUsed = false;
      let nextRestaurants = [];
      let nextOrders = [];
      const issues = [];

      try {
        const restaurantResponse = await api.getAdminRestaurants(token);
        nextRestaurants =
          Array.isArray(restaurantResponse?.items) && restaurantResponse.items.length
            ? restaurantResponse.items
            : mockAdminData.restaurants;
        fallbackUsed = fallbackUsed || !(Array.isArray(restaurantResponse?.items) && restaurantResponse.items.length);
      } catch (requestError) {
        nextRestaurants = mockAdminData.restaurants;
        fallbackUsed = true;
        issues.push(requestError?.message || "Restaurant list endpoint is not available yet.");
      }

      try {
        const orderResponse = await api.getAdminOrders(token);
        nextOrders =
          Array.isArray(orderResponse?.items) && orderResponse.items.length
            ? orderResponse.items
            : mockAdminData.orders;
        fallbackUsed = fallbackUsed || !(Array.isArray(orderResponse?.items) && orderResponse.items.length);
      } catch (requestError) {
        nextOrders = mockAdminData.orders;
        fallbackUsed = true;
        issues.push(requestError?.message || "Admin orders endpoint is not available yet.");
      }

      if (!isCancelled) {
        setRestaurants(nextRestaurants);
        setOrders(nextOrders);
        setUsingMock(fallbackUsed);
        setError(issues[0] || "");
        setLoading(false);
      }
    };

    loadData();
    return () => {
      isCancelled = true;
    };
  }, [token]);

  useEffect(() => {
    setPage(1);
  }, [selectedRestaurantId, search, statusFilter, paymentFilter, pageSize]);

  const restaurantOptions = useMemo(
    () => {
      const normalizedSearch = !selectedRestaurantId ? search.trim().toLowerCase() : "";
      const filteredRestaurants = normalizedSearch
        ? restaurants.filter((restaurant) =>
            String(restaurant?.name || `Restaurant #${restaurant?.id || "-"}`)
              .toLowerCase()
              .includes(normalizedSearch)
          )
        : restaurants;

      return filteredRestaurants.map((restaurant) => ({
        value: toId(restaurant?.id),
        label: restaurant?.name || `Restaurant #${restaurant?.id || "-"}`,
      }));
    },
    [restaurants, selectedRestaurantId, search]
  );

  const filteredOrders = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return orders.filter((order) => {
      const status = String(order?.status || "pending");
      const paymentStatus = String(order?.payment_status || "pending");
      const matchesRestaurant =
        selectedRestaurantId && restaurantIdFromOrder(order) === toId(selectedRestaurantId);
      const matchesStatus = statusFilter === "all" || status === statusFilter;
      const matchesPayment =
        paymentFilter === "all" ||
        normalizePaymentStatus(paymentStatus) === paymentFilter;
      const matchesSearch =
        !normalizedSearch ||
        String(order?.id || "").includes(normalizedSearch) ||
        String(customerName(order)).toLowerCase().includes(normalizedSearch) ||
        String(restaurantName(order)).toLowerCase().includes(normalizedSearch);

      return Boolean(matchesRestaurant && matchesStatus && matchesPayment && matchesSearch);
    });
  }, [orders, selectedRestaurantId, search, statusFilter, paymentFilter]);

  const visibleOrders = useMemo(
    () => filteredOrders.slice((page - 1) * pageSize, page * pageSize),
    [filteredOrders, page, pageSize]
  );

  const updateOrder = (target, patch, message) => {
    const targetId = toId(target?.id);

    setOrders((previous) =>
      previous.map((current) => (toId(current?.id) === targetId ? { ...current, ...patch } : current))
    );
    setSelectedOrder((previous) =>
      toId(previous?.id) === targetId ? { ...previous, ...patch } : previous
    );
    setSuccess(message);
  };

  const openStatusEditor = (order) => {
    setStatusEditor(order);
    setStatusDraft(String(order?.status || "pending"));
    setPaymentDraft(normalizePaymentStatus(order?.payment_status || "unpaid"));
  };

  const saveStatus = async () => {
    if (!statusEditor) return;

    setSavingOrderUpdate(true);
    setError("");

    try {
      if (usingMock) {
        updateOrder(
          statusEditor,
          { status: statusDraft, payment_status: paymentDraft },
          `Order #${statusEditor.id} updated locally.`
        );
      } else {
        const updatedOrder = await api.updateAdminOrder(token, statusEditor.id, {
          status: statusDraft,
          payment_status: paymentDraft,
        });
        updateOrder(statusEditor, updatedOrder, `Order #${statusEditor.id} updated in database.`);
      }

      setStatusEditor(null);
    } catch (requestError) {
      setError(requestError?.message || "Failed to update order.");
    } finally {
      setSavingOrderUpdate(false);
    }
  };

  const emptyMessage = selectedRestaurantId
    ? "No orders found for this restaurant."
    : "Pick a restaurant to load its orders.";

  return (
    <AdminShell
      activePage="adminOrders"
      onNavigate={onNavigate}
      user={user}
      onLogout={onLogout}
      title="Order Management"
      headerActions={<SearchField value={search} onChange={setSearch} placeholder="Search orders or restaurants..." />}
    >
      {usingMock ? (
        <Alert type="warning">{error || "Showing placeholder orders until admin endpoints are fully available."}</Alert>
      ) : (
        <Alert>{error}</Alert>
      )}
      <Alert type="success">{success}</Alert>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <SearchableSelect
          label="Restaurant"
          value={selectedRestaurantId}
          options={restaurantOptions}
          onChange={setSelectedRestaurantId}
          placeholder="Select restaurant"
        />
        <FilterSelect label="Order Status" value={statusFilter} options={ORDER_STATUS_OPTIONS} onChange={setStatusFilter} />
        <FilterSelect label="Payment" value={paymentFilter} options={PAYMENT_STATUS_OPTIONS} onChange={setPaymentFilter} />
      </div>

      {selectedRestaurant ? (
        <div className="mb-4 rounded-xl border border-primary/10 bg-white px-4 py-3 text-sm text-slate-600">
          Showing orders for <strong className="text-slate-900">{selectedRestaurant.name}</strong>
        </div>
      ) : null}

      <TableShell>
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
            <tr>
              <th className="px-6 py-4">Order ID</th>
              <th className="px-6 py-4">Customer</th>
              <th className="px-6 py-4">Restaurant</th>
              <th className="px-6 py-4">Total Price</th>
              <th className="px-6 py-4">Payment</th>
              <th className="px-6 py-4">Order Status</th>
              <th className="px-6 py-4">Created</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-primary/5">
            {visibleOrders.length ? (
              visibleOrders.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-bold text-primary">#{row.id}</td>
                  <td className="px-6 py-4 text-sm font-semibold">{customerName(row)}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{restaurantName(row)}</td>
                  <td className="px-6 py-4 text-sm font-semibold">{toMoney(row.total)}</td>
                  <td className="px-6 py-4"><StatusBadge value={row.payment_status || "unpaid"} /></td>
                  <td className="px-6 py-4"><StatusBadge value={row.status || "pending"} /></td>
                  <td className="px-6 py-4 text-sm text-slate-500">{formatDateTime(row.created_at)}</td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <ActionButton icon="visibility" onClick={() => setSelectedOrder(row)}>View</ActionButton>
                      <ActionButton icon="edit_note" onClick={() => openStatusEditor(row)}>Update</ActionButton>
                      <ActionButton
                        tone="danger"
                        icon="undo"
                        onClick={() =>
                          setConfirm({
                            title: "Cancel / Refund Order",
                            message: usingMock
                              ? `Order #${row.id} will be marked cancelled/refunded in local fallback mode.`
                              : `Order #${row.id} will be marked cancelled/refunded and saved in database.`,
                            confirmLabel: "Mark Cancelled",
                            onConfirm: async () => {
                              setError("");
                              try {
                                if (usingMock) {
                                  updateOrder(
                                    row,
                                    { status: "cancelled", payment_status: "refunded" },
                                    `Order #${row.id} was marked cancelled/refunded locally.`
                                  );
                                } else {
                                  const updatedOrder = await api.updateAdminOrder(token, row.id, {
                                    status: "cancelled",
                                    payment_status: "refunded",
                                  });
                                  updateOrder(
                                    updatedOrder,
                                    updatedOrder,
                                    `Order #${row.id} was marked cancelled/refunded in database.`
                                  );
                                }
                                setConfirm(null);
                              } catch (requestError) {
                                setError(requestError?.message || "Failed to cancel/refund order.");
                              }
                            },
                          })
                        }
                      >
                        Cancel / Refund
                      </ActionButton>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8}>
                  <EmptyState loading={loading} loadingMessage="Loading orders..." message={emptyMessage} />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </TableShell>

      <PaginationControls page={page} pageSize={pageSize} total={filteredOrders.length} onPageChange={setPage} onPageSizeChange={setPageSize} />

      {selectedOrder ? (
        <Modal title={`Order #${selectedOrder.id}`} subtitle="Order details" onClose={() => setSelectedOrder(null)}>
          <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Customer</p><p className="mt-1 font-semibold">{customerName(selectedOrder)}</p></div>
            <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Restaurant</p><p className="mt-1 font-semibold">{restaurantName(selectedOrder)}</p></div>
            <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Total</p><p className="mt-1 font-semibold">{toMoney(selectedOrder.total)}</p></div>
            <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Created</p><p className="mt-1 font-semibold">{formatDateTime(selectedOrder.created_at)}</p></div>
            <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Payment</p><p className="mt-1 font-semibold">{normalizeStatus(selectedOrder.payment_status || "unpaid")}</p></div>
            <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Status</p><p className="mt-1 font-semibold">{normalizeStatus(selectedOrder.status || "pending")}</p></div>
          </div>
        </Modal>
      ) : null}

      {statusEditor ? (
        <Modal
          title="Update Order Status"
          subtitle={`Order #${statusEditor.id}`}
          onClose={() => setStatusEditor(null)}
          maxWidth="max-w-md"
          footer={
            <>
              <ActionButton onClick={() => setStatusEditor(null)}>Cancel</ActionButton>
              <ActionButton tone="primary" onClick={saveStatus} disabled={savingOrderUpdate}>
                {savingOrderUpdate ? "Saving..." : "Save Status"}
              </ActionButton>
            </>
          }
        >
          <div className="grid grid-cols-1 gap-4">
            <label className="text-sm font-semibold text-slate-600">
              Order Status
              <select
                className="mt-2 w-full rounded-lg border-none bg-slate-50 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20"
                value={statusDraft}
                onChange={(event) => setStatusDraft(event.target.value)}
                disabled={savingOrderUpdate}
              >
                {ORDER_STATUS_OPTIONS.filter((option) => option.value !== "all").map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
            <label className="text-sm font-semibold text-slate-600">
              Payment Status
              <select
                className="mt-2 w-full rounded-lg border-none bg-slate-50 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20"
                value={paymentDraft}
                onChange={(event) => setPaymentDraft(event.target.value)}
                disabled={savingOrderUpdate}
              >
                {PAYMENT_STATUS_OPTIONS.filter((option) => option.value !== "all").map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
          </div>
        </Modal>
      ) : null}

      <ConfirmModal {...(confirm || {})} onCancel={() => setConfirm(null)} />
    </AdminShell>
  );
}

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
  formatDateTime,
  normalizeStatus,
  sortRows,
  toMoney,
  toggleSortConfig,
} from "../../components/admin/AdminUI.jsx";
import { api } from "../../lib/api.js";
import { mockAdminData } from "../../lib/adminData.js";

const ORDER_STATUS_OPTIONS = [
  { value: "all", label: "All Order Statuses" },
  { value: "pending", label: "Pending" },
  { value: "accepted", label: "Accepted" },
  { value: "preparing", label: "Preparing" },
  { value: "ready_for_pickup", label: "Ready For Pickup" },
  { value: "picked_up", label: "Picked Up" },
  { value: "on_the_way", label: "On The Way" },
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

const ORDER_STAGE_PATH = [
  "pending",
  "accepted",
  "preparing",
  "ready_for_pickup",
  "picked_up",
  "on_the_way",
  "delivered",
];

const ORDER_STAGE_KEYS = [...ORDER_STAGE_PATH, "rejected", "cancelled"];

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

function normalizeOrderStatus(value) {
  return String(value || "pending").toLowerCase();
}

function parseTimestamp(value) {
  const time = new Date(value || "").getTime();
  return Number.isNaN(time) ? null : time;
}

function getOrderStatusHistory(order) {
  const rawHistory = Array.isArray(order?.status_history)
    ? order.status_history
    : [];

  return rawHistory
    .filter((entry) => entry?.status)
    .map((entry) => ({
      id: Number(entry?.id || 0),
      status: normalizeOrderStatus(entry?.status),
      changed_at: entry?.changed_at || null,
      timestamp: parseTimestamp(entry?.changed_at),
    }))
    .sort((left, right) => {
      if (left.timestamp !== null && right.timestamp !== null) {
        return left.timestamp - right.timestamp;
      }
      if (left.timestamp !== null) return -1;
      if (right.timestamp !== null) return 1;
      return left.id - right.id;
    });
}

function buildOrderStageTimeline(order) {
  const currentStatus = normalizeOrderStatus(order?.status);
  const history = getOrderStatusHistory(order);
  const hasHistory = history.length > 0;
  const currentPathIndex = ORDER_STAGE_PATH.indexOf(currentStatus);
  const terminalStatus = currentStatus === "rejected" || currentStatus === "cancelled"
    ? currentStatus
    : null;

  const historyMeta = new Map();
  history.forEach((entry) => {
    const previous = historyMeta.get(entry.status);
    if (!previous || (entry.timestamp ?? Number.POSITIVE_INFINITY) >= (previous.timestamp ?? Number.NEGATIVE_INFINITY)) {
      historyMeta.set(entry.status, entry);
    }
  });

  return ORDER_STAGE_KEYS.map((stageKey) => {
    const historyEntry = historyMeta.get(stageKey);
    let state = "pending";

    if (historyEntry) {
      state = stageKey === currentStatus ? "current" : "completed";
    } else if (terminalStatus) {
      if (stageKey === terminalStatus) {
        state = "current";
      } else if (stageKey === "pending") {
        state = "completed";
      }
    } else if (currentPathIndex >= 0) {
      const stagePathIndex = ORDER_STAGE_PATH.indexOf(stageKey);
      if (stagePathIndex >= 0 && stagePathIndex < currentPathIndex) {
        state = "completed";
      } else if (stagePathIndex === currentPathIndex) {
        state = "current";
      }
    } else if (stageKey === currentStatus) {
      state = "current";
    }

    return {
      key: stageKey,
      label: normalizeStatus(stageKey),
      state,
      changed_at: historyEntry?.changed_at || null,
    };
  });
}

function stageClasses(state) {
  if (state === "current") {
    return "border-primary/40 bg-primary/10 text-primary";
  }
  if (state === "completed") {
    return "border-green-200 bg-green-50 text-green-700";
  }
  return "border-slate-200 bg-white text-slate-500";
}

function splitIngredientTokens(value) {
  return String(value || "")
    .replace(/\bplease\b/gi, "")
    .split(/,|\/|;|\n|\band\b/gi)
    .map((token) => token.trim().replace(/^[+\-\s]+/, "").replace(/\s+/g, " "))
    .map((token) => token.replace(/[.!?]+$/, ""))
    .filter(Boolean);
}

function normalizeIngredientToken(value) {
  const normalized = String(value || "")
    .toLowerCase()
    .replace(/^(the|a|an)\s+/, "")
    .trim();

  return normalized || null;
}

function parseIngredientChanges(notes) {
  if (!notes) {
    return { added: [], removed: [] };
  }

  const added = new Set();
  const removed = new Set();
  const normalizedNotes = String(notes);

  const addPattern = /(?:^|[\s,.;])(?:add|extra|plus)\s+([^.;\n]+)/gi;
  const removePattern = /(?:^|[\s,.;])(?:no|without|remove|minus)\s+([^.;\n]+)/gi;
  const symbolAddPattern = /(?:^|\s)\+([a-z][a-z\s-]*)/gi;
  const symbolRemovePattern = /(?:^|\s)-([a-z][a-z\s-]*)/gi;

  for (const match of normalizedNotes.matchAll(addPattern)) {
    splitIngredientTokens(match[1]).forEach((token) => {
      const item = normalizeIngredientToken(token);
      if (!item || /^(remove|without|no|minus)\b/.test(item)) return;
      added.add(item);
    });
  }

  for (const match of normalizedNotes.matchAll(removePattern)) {
    splitIngredientTokens(match[1]).forEach((token) => {
      const item = normalizeIngredientToken(token);
      if (!item || /^(add|extra|plus)\b/.test(item)) return;
      removed.add(item);
    });
  }

  for (const match of normalizedNotes.matchAll(symbolAddPattern)) {
    splitIngredientTokens(match[1]).forEach((token) => {
      const item = normalizeIngredientToken(token);
      if (!item) return;
      added.add(item);
    });
  }

  for (const match of normalizedNotes.matchAll(symbolRemovePattern)) {
    splitIngredientTokens(match[1]).forEach((token) => {
      const item = normalizeIngredientToken(token);
      if (!item) return;
      removed.add(item);
    });
  }

  return {
    added: Array.from(added),
    removed: Array.from(removed),
  };
}

function extractCustomerDescription(notes) {
  if (!notes) return "";

  const segments = String(notes)
    .split(/\s*\|\s*|\s*;\s*|\s*\n+\s*|\.\s+/)
    .map((segment) => segment.trim())
    .filter(Boolean);

  const descriptionSegments = segments.filter((segment) => {
    const normalized = segment.toLowerCase();
    if (/^(add|extra|plus|remove|without|no|minus)\b/.test(normalized)) return false;
    if (/^[+-]\s*[a-z]/.test(normalized)) return false;
    return true;
  });

  return descriptionSegments.join(". ").trim();
}

export default function AdminOrders({ onNavigate, token, user, onLogout }) {
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState("");
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [sortConfig, setSortConfig] = useState({ key: "id", direction: "desc" });
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
        !selectedRestaurantId || restaurantIdFromOrder(order) === toId(selectedRestaurantId);
      const matchesStatus = statusFilter === "all" || status === statusFilter;
      const matchesPayment =
        paymentFilter === "all" ||
        normalizePaymentStatus(paymentStatus) === paymentFilter;
      const matchesSearch =
        !normalizedSearch ||
        String(order?.id || "").includes(normalizedSearch) ||
        String(customerName(order)).toLowerCase().includes(normalizedSearch) ||
        String(restaurantName(order)).toLowerCase().includes(normalizedSearch);

      return matchesRestaurant && matchesStatus && matchesPayment && matchesSearch;
    });
  }, [orders, selectedRestaurantId, search, statusFilter, paymentFilter]);

  const visibleOrders = useMemo(
    () =>
      sortRows(filteredOrders, sortConfig, (order, key) => {
        if (key === "id") return order?.id;
        if (key === "customer") return customerName(order);
        if (key === "restaurant") return restaurantName(order);
        if (key === "total") return Number(order?.total || 0);
        if (key === "payment_status") return normalizePaymentStatus(order?.payment_status || "unpaid");
        if (key === "status") return String(order?.status || "pending");
        if (key === "created_at") return order?.created_at;
        return order?.[key];
      }).slice((page - 1) * pageSize, page * pageSize),
    [filteredOrders, sortConfig, page, pageSize]
  );

  const handleSort = (key) => {
    setSortConfig((previous) => toggleSortConfig(previous, key));
  };

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
    : "No orders found.";
  const selectedOrderItems = useMemo(
    () => (Array.isArray(selectedOrder?.items) ? selectedOrder.items : []),
    [selectedOrder]
  );
  const selectedOrderSubtotal = useMemo(() => {
    const explicitSubtotal = Number(selectedOrder?.subtotal);
    if (!Number.isNaN(explicitSubtotal) && explicitSubtotal > 0) {
      return explicitSubtotal;
    }

    return selectedOrderItems.reduce((sum, item) => {
      const quantity = Number(item?.quantity || 0);
      const unitPrice = Number(item?.unit_price || 0);
      return sum + quantity * unitPrice;
    }, 0);
  }, [selectedOrder, selectedOrderItems]);
  const selectedOrderTimeline = useMemo(
    () => (selectedOrder ? buildOrderStageTimeline(selectedOrder) : []),
    [selectedOrder]
  );
  const hasSelectedOrderHistory = useMemo(
    () => getOrderStatusHistory(selectedOrder).length > 0,
    [selectedOrder]
  );

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
              <SortableTh label="Order ID" sortKey="id" sortConfig={sortConfig} onSort={handleSort} />
              <SortableTh label="Customer" sortKey="customer" sortConfig={sortConfig} onSort={handleSort} />
              <SortableTh label="Restaurant" sortKey="restaurant" sortConfig={sortConfig} onSort={handleSort} />
              <SortableTh label="Total Price" sortKey="total" sortConfig={sortConfig} onSort={handleSort} />
              <SortableTh label="Payment" sortKey="payment_status" sortConfig={sortConfig} onSort={handleSort} />
              <SortableTh label="Order Status" sortKey="status" sortConfig={sortConfig} onSort={handleSort} />
              <SortableTh label="Created" sortKey="created_at" sortConfig={sortConfig} onSort={handleSort} />
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
        <Modal
          title={`Order #${selectedOrder.id}`}
          subtitle="Order details"
          onClose={() => setSelectedOrder(null)}
          maxWidth="max-w-6xl"
        >
          <div className="space-y-6 text-sm">
            <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase text-slate-500">Order Status</p>
                <p className="mt-1 font-semibold">{normalizeStatus(selectedOrder.status || "pending")}</p>
                <p className="mt-1 text-xs text-slate-500">Created: {formatDateTime(selectedOrder.created_at)}</p>
                <p className="text-xs text-slate-500">Updated: {formatDateTime(selectedOrder.updated_at)}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase text-slate-500">Customer</p>
                <p className="mt-1 font-semibold">
                  {selectedOrder?.is_quick_order
                    ? "Quick Order (Not Real Customer)"
                    : customerName(selectedOrder)}
                </p>
                <p className="mt-1 text-xs text-slate-500">{selectedOrder?.customer?.phone || "No phone"}</p>
                <p className="text-xs text-slate-500">{selectedOrder?.customer?.email || "No email"}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase text-slate-500">Delivery / Branch</p>
                <p className="mt-1 font-semibold">{selectedOrder?.branch?.address || "Address not available"}</p>
                <p className="mt-1 text-xs text-slate-500">
                  Branch: {selectedOrder?.branch?.name || selectedOrder?.branch_id || "Main"}
                </p>
                <p className="text-xs text-slate-500">Restaurant: {restaurantName(selectedOrder)}</p>
              </div>
            </section>

            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="border-b border-slate-100 px-4 py-3">
                <h4 className="font-bold">Order Items</h4>
              </div>
              {selectedOrderItems.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
                      <tr>
                        <th className="px-4 py-2">Item</th>
                        <th className="px-4 py-2">Qty</th>
                        <th className="px-4 py-2 text-right">Unit</th>
                        <th className="px-4 py-2 text-right">Line Total</th>
                        <th className="px-4 py-2">Add</th>
                        <th className="px-4 py-2">Remove</th>
                        <th className="px-4 py-2">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedOrderItems.map((item, index) => {
                        const itemIngredientChanges = parseIngredientChanges(item?.notes);
                        const itemCustomerDescription = extractCustomerDescription(item?.notes);
                        const quantity = Number(item?.quantity || 0);
                        const unitPrice = Number(item?.unit_price || 0);

                        return (
                          <tr key={`${item?.id || item?.menu_item_id || "item"}-${index}`}>
                            <td className="px-4 py-3 font-semibold">
                              {item?.menu_item?.name || `Item #${item?.menu_item_id || "-"}`}
                            </td>
                            <td className="px-4 py-3">{quantity}</td>
                            <td className="px-4 py-3 text-right">{toMoney(unitPrice)}</td>
                            <td className="px-4 py-3 text-right font-semibold">{toMoney(unitPrice * quantity)}</td>
                            <td className="px-4 py-3 text-slate-700">
                              {itemIngredientChanges.added.length
                                ? itemIngredientChanges.added.map((ingredient) => `add ${ingredient}`).join(", ")
                                : "-"}
                            </td>
                            <td className="px-4 py-3 text-slate-700">
                              {itemIngredientChanges.removed.length
                                ? itemIngredientChanges.removed.map((ingredient) => `remove ${ingredient}`).join(", ")
                                : "-"}
                            </td>
                            <td className="px-4 py-3 text-slate-600">{itemCustomerDescription || "-"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="px-4 py-3 text-sm text-slate-500">No items available for this order.</p>
              )}
            </section>

            <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-4">
                <h4 className="mb-2 font-bold">Payment Summary</h4>
                <p>
                  Subtotal: <span className="font-semibold">{toMoney(selectedOrderSubtotal)}</span>
                </p>
                <p>
                  Fees: <span className="font-semibold">{toMoney(selectedOrder?.fees || 0)}</span>
                </p>
                <p>
                  Total: <span className="font-semibold">{toMoney(selectedOrder?.total || 0)}</span>
                </p>
                <p className="mt-2">
                  Payment Status: <span className="font-semibold">{normalizeStatus(selectedOrder?.payment_status || "unpaid")}</span>
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase text-slate-500">Order Stages</p>
                <p className="mt-1 text-xs text-slate-500">
                  {hasSelectedOrderHistory
                    ? "Timeline uses saved stage history from the backend."
                    : "Timeline inferred from current order status."}
                </p>
                <div className="mt-3 grid grid-cols-1 gap-2">
                  {selectedOrderTimeline.map((stage) => (
                    <div key={stage.key} className={`rounded-lg border px-3 py-2 ${stageClasses(stage.state)}`}>
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold">{stage.label}</p>
                        {!(stage.key === "cancelled" && stage.state === "pending") ? (
                          <StatusBadge value={stage.state === "pending" ? "pending" : "active"} label={normalizeStatus(stage.state)} />
                        ) : null}
                      </div>
                      <p className="mt-1 text-xs">{formatDateTime(stage.changed_at)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
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

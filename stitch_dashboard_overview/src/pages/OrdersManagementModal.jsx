import { useEffect, useMemo, useState } from "react";
import RestaurantShell from "../components/RestaurantShell.jsx";
import { api } from "../lib/api.js";
import {
  ACTIVE_ORDER_STATUSES,
  ORDER_ACTION_LABEL,
  ORDER_NEXT_STATUS,
  getOrderStatusClass,
  getOrderStatusLabel,
} from "../utils/orderStatus.js";

const CANCELLABLE_ORDER_STATUSES = new Set([
  "pending",
  "accepted",
  "preparing",
  "ready_for_pickup",
]);

function toMoney(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function formatOrderTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

function estimateQueueTimeMinutes(orders) {
  const activeOrders = orders.filter((order) => ACTIVE_ORDER_STATUSES.has(order?.status));
  if (!activeOrders.length) return 0;

  const now = Date.now();
  const totalMinutes = activeOrders.reduce((sum, order) => {
    const createdAt = new Date(order?.created_at || "").getTime();
    if (Number.isNaN(createdAt)) return sum;
    return sum + Math.max(0, (now - createdAt) / 60000);
  }, 0);

  return Math.round(totalMinutes / activeOrders.length);
}

export default function OrdersManagementModal({ onNavigate, token, user, onLogout }) {
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [loadingOrderDetails, setLoadingOrderDetails] = useState(false);

  useEffect(() => {
    if (!token) return undefined;

    let isCancelled = false;

    const loadOrders = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await api.getRestaurantOrders(token);
        if (!isCancelled) {
          setOrders(Array.isArray(data) ? data : []);
        }
      } catch (requestError) {
        if (!isCancelled) {
          setError(requestError?.message || "Failed to load orders.");
        }
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };

    loadOrders();
    const timer = window.setInterval(loadOrders, 30000);

    return () => {
      isCancelled = true;
      window.clearInterval(timer);
    };
  }, [token]);

  const filteredOrders = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesStatus = statusFilter === "all" || order?.status === statusFilter;
      const matchesSearch =
        !normalizedSearch ||
        String(order?.id || "").toLowerCase().includes(normalizedSearch) ||
        String(order?.customer_id || "").toLowerCase().includes(normalizedSearch) ||
        String(order?.customer?.name || "").toLowerCase().includes(normalizedSearch) ||
        (order?.is_quick_order ? "quick order".includes(normalizedSearch) : false);

      return matchesStatus && matchesSearch;
    });
  }, [orders, searchTerm, statusFilter]);

  const queueTimeMinutes = useMemo(() => estimateQueueTimeMinutes(orders), [orders]);

  const loadOrderDetails = async (orderId) => {
    if (!orderId) return;

    setSelectedOrderId(orderId);
    setLoadingOrderDetails(true);
    setError("");
    try {
      const payload = await api.getRestaurantOrder(token, orderId);
      setOrderDetails(payload || null);
    } catch (requestError) {
      setError(requestError?.message || "Failed to load order details.");
      setOrderDetails(null);
    } finally {
      setLoadingOrderDetails(false);
    }
  };

  const closeOrderDetails = () => {
    setSelectedOrderId(null);
    setOrderDetails(null);
    setLoadingOrderDetails(false);
  };

  const refreshOrderRow = (updatedOrder) => {
    setOrders((previous) =>
      previous.map((current) => (current.id === updatedOrder.id ? { ...current, ...updatedOrder } : current))
    );
  };

  const refreshDetailsIfNeeded = async (orderId) => {
    if (selectedOrderId === orderId) {
      await loadOrderDetails(orderId);
    }
  };

  const handleStatusAdvance = async (order, event) => {
    event?.stopPropagation?.();
    const nextStatus = ORDER_NEXT_STATUS[order?.status];
    if (!nextStatus || !order?.id) return;

    setUpdatingOrderId(order.id);
    setError("");
    try {
      const updatedOrder = await api.updateOrderStatus(token, order.id, nextStatus);
      refreshOrderRow(updatedOrder);
      await refreshDetailsIfNeeded(order.id);
    } catch (requestError) {
      setError(requestError?.message || "Failed to update order status.");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleCancelOrder = async (order, event) => {
    event?.stopPropagation?.();
    if (!order?.id || !CANCELLABLE_ORDER_STATUSES.has(String(order?.status || ""))) return;

    if (!window.confirm(`Cancel order #${order.id}?`)) return;

    setUpdatingOrderId(order.id);
    setError("");
    try {
      const updatedOrder = await api.updateOrderStatus(token, order.id, "cancelled");
      refreshOrderRow(updatedOrder);
      await refreshDetailsIfNeeded(order.id);
    } catch (requestError) {
      setError(requestError?.message || "Failed to cancel order.");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  return (
    <>
      <RestaurantShell
        activePage="orders"
        onNavigate={onNavigate}
        user={user}
        onLogout={onLogout}
        title="Active Orders"
        headerActions={
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              search
            </span>
            <input
              className="pl-10 pr-4 py-2 bg-background-light border-none rounded-lg focus:ring-2 focus:ring-primary w-64 text-sm"
              placeholder="Search orders..."
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
        }
      >
        {error ? (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">
            {error}
          </div>
        ) : null}

        <div className="flex items-center gap-2 mb-6 overflow-x-auto">
          {[
            ["all", "All"],
            ["pending", "Pending"],
            ["accepted", "Accepted"],
            ["preparing", "Preparing"],
            ["ready_for_pickup", "Ready"],
            ["on_the_way", "On The Way"],
            ["delivered", "Delivered"],
            ["cancelled", "Cancelled"],
            ["rejected", "Rejected"],
          ].map(([value, label]) => (
            <button
              key={value}
              className={
                statusFilter === value
                  ? "px-4 py-2 rounded-lg bg-primary text-white font-semibold text-sm"
                  : "px-4 py-2 rounded-lg bg-white border border-primary/10 text-slate-600 text-sm font-medium hover:bg-primary/5"
              }
              type="button"
              onClick={() => setStatusFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-primary/10 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-primary/10">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Order ID</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Customer</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Summary</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Price</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Time</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/5">
              {filteredOrders.length ? (
                filteredOrders.map((order) => {
                  const nextStatus = ORDER_NEXT_STATUS[order?.status];
                  const isUpdating = updatingOrderId === order.id;

                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => loadOrderDetails(order.id)}
                    >
                      <td className="px-6 py-5 font-bold text-primary">#{order.id}</td>
                      <td className="px-6 py-5">
                        <div className="font-semibold">
                          {order?.is_quick_order
                            ? "Quick Order"
                            : order?.customer?.name || `Customer #${order.customer_id || "N/A"}`}
                        </div>
                        {order?.is_quick_order ? (
                          <span className="inline-flex mt-1 px-2 py-0.5 rounded-full bg-slate-900 text-white text-[10px] font-bold uppercase">
                            Not Real Customer
                          </span>
                        ) : null}
                      </td>
                      <td className="px-6 py-5 text-sm text-slate-600">
                        {order?.branch?.address || order?.branch?.name || "Delivery address not available"}
                      </td>
                      <td className="px-6 py-5 text-right font-bold">{toMoney(order.total)}</td>
                      <td className="px-6 py-5 text-sm text-slate-600">{formatOrderTime(order.created_at)}</td>
                      <td className="px-6 py-5 text-center">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase ${getOrderStatusClass(
                            order.status
                          )}`}
                        >
                          {getOrderStatusLabel(order.status)}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        {nextStatus || CANCELLABLE_ORDER_STATUSES.has(String(order?.status || "")) ? (
                          <div className="flex items-center justify-end gap-2">
                            {nextStatus ? (
                              <button
                                className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed"
                                type="button"
                                onClick={(event) => handleStatusAdvance(order, event)}
                                disabled={isUpdating}
                              >
                                {isUpdating ? "Updating..." : ORDER_ACTION_LABEL[nextStatus] || "Update"}
                              </button>
                            ) : null}
                            {CANCELLABLE_ORDER_STATUSES.has(String(order?.status || "")) ? (
                              <button
                                className="px-4 py-2 bg-red-50 text-red-700 text-xs font-bold rounded-lg hover:bg-red-100 disabled:opacity-60 disabled:cursor-not-allowed"
                                type="button"
                                onClick={(event) => handleCancelOrder(order, event)}
                                disabled={isUpdating}
                              >
                                {isUpdating ? "Updating..." : "Cancel"}
                              </button>
                            ) : null}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 font-semibold">No Action</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td className="px-6 py-8 text-sm text-slate-500" colSpan={7}>
                    {loading ? "Loading orders..." : "No orders found."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-primary/10 shadow-sm">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Avg Queue Time</p>
            <span className="text-2xl font-bold">{queueTimeMinutes}m</span>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-primary/10 shadow-sm">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Total Orders</p>
            <span className="text-2xl font-bold">{orders.length}</span>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-primary/10 shadow-sm">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Active Orders</p>
            <span className="text-2xl font-bold">
              {orders.filter((order) => ACTIVE_ORDER_STATUSES.has(order?.status)).length}
            </span>
          </div>
        </div>
      </RestaurantShell>

      {selectedOrderId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold">
                  Order Details #{orderDetails?.id || selectedOrderId}
                </h3>
                <p className="text-slate-500 text-sm">
                  Full delivery information for this order.
                </p>
              </div>
              <button
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
                type="button"
                onClick={closeOrderDetails}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              {loadingOrderDetails ? (
                <p className="text-sm text-slate-500">Loading order details...</p>
              ) : orderDetails ? (
                <div className="space-y-6">
                  <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-slate-50">
                      <p className="text-xs uppercase text-slate-500 font-bold">Order Status</p>
                      <p className="mt-1 font-semibold">{getOrderStatusLabel(orderDetails.status)}</p>
                      <p className="text-xs text-slate-500 mt-1">Created: {formatDateTime(orderDetails.created_at)}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50">
                      <p className="text-xs uppercase text-slate-500 font-bold">Customer</p>
                      <p className="mt-1 font-semibold">
                        {orderDetails?.is_quick_order
                          ? "Quick Order (Not Real Customer)"
                          : orderDetails?.customer?.name || `Customer #${orderDetails.customer_id || "N/A"}`}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">{orderDetails?.customer?.phone || "No phone"}</p>
                      <p className="text-xs text-slate-500">{orderDetails?.customer?.email || "No email"}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50">
                      <p className="text-xs uppercase text-slate-500 font-bold">Delivery Address</p>
                      <p className="mt-1 font-semibold">
                        {orderDetails?.branch?.address || "Address not available in current order schema"}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Branch: {orderDetails?.branch?.name || orderDetails?.branch_id || "Main"}
                      </p>
                    </div>
                  </section>

                  <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100">
                      <h4 className="font-bold">Order Items</h4>
                    </div>
                    <table className="w-full text-left">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-2 text-xs uppercase text-slate-500">Item</th>
                          <th className="px-4 py-2 text-xs uppercase text-slate-500">Qty</th>
                          <th className="px-4 py-2 text-xs uppercase text-slate-500 text-right">Unit</th>
                          <th className="px-4 py-2 text-xs uppercase text-slate-500 text-right">Line Total</th>
                          <th className="px-4 py-2 text-xs uppercase text-slate-500">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(orderDetails.items || []).map((item) => (
                          <tr key={item.id}>
                            <td className="px-4 py-3 text-sm font-semibold">
                              {item?.menu_item?.name || `Item #${item.menu_item_id}`}
                            </td>
                            <td className="px-4 py-3 text-sm">{item.quantity}</td>
                            <td className="px-4 py-3 text-sm text-right">{toMoney(item.unit_price)}</td>
                            <td className="px-4 py-3 text-sm text-right font-semibold">
                              {toMoney(Number(item.unit_price || 0) * Number(item.quantity || 0))}
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-600">{item.notes || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </section>

                  <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-slate-50">
                      <h4 className="font-bold mb-2">Payment Summary</h4>
                      <p className="text-sm">Subtotal: <span className="font-semibold">{toMoney(orderDetails.subtotal)}</span></p>
                      <p className="text-sm">Fees: <span className="font-semibold">{toMoney(orderDetails.fees)}</span></p>
                      <p className="text-sm">Total: <span className="font-semibold">{toMoney(orderDetails.total)}</span></p>
                      <p className="text-sm mt-2">Payment Status: <span className="font-semibold">{orderDetails.payment_status || "-"}</span></p>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50">
                      <h4 className="font-bold mb-2">Status Timeline</h4>
                      {(orderDetails.status_history || orderDetails.statusHistory || []).length ? (
                        <ul className="space-y-2">
                          {(orderDetails.status_history || orderDetails.statusHistory || []).map((entry) => (
                            <li key={entry.id} className="text-sm">
                              <span className="font-semibold">{getOrderStatusLabel(entry.status)}</span>
                              <span className="text-slate-500"> • {formatDateTime(entry.changed_at)}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-slate-500">No history available.</p>
                      )}
                    </div>
                  </section>
                </div>
              ) : (
                <p className="text-sm text-slate-500">Unable to load this order.</p>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

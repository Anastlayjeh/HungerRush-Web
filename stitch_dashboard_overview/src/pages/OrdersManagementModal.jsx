import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api.js";
import {
  ACTIVE_ORDER_STATUSES,
  ORDER_ACTION_LABEL,
  ORDER_NEXT_STATUS,
  getOrderStatusClass,
  getOrderStatusLabel,
} from "../utils/orderStatus.js";

function toMoney(value) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatOrderTime(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function estimateQueueTimeMinutes(orders) {
  const activeOrders = orders.filter((order) => ACTIVE_ORDER_STATUSES.has(order?.status));
  if (!activeOrders.length) {
    return 0;
  }

  const now = Date.now();
  const totalMinutes = activeOrders.reduce((sum, order) => {
    const createdAt = new Date(order?.created_at || "").getTime();
    if (Number.isNaN(createdAt)) {
      return sum;
    }
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

  useEffect(() => {
    if (!token) {
      return undefined;
    }

    let isCancelled = false;

    const loadOrders = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await api.getRestaurantOrders(token);
        if (isCancelled) {
          return;
        }
        setOrders(Array.isArray(data) ? data : []);
      } catch (requestError) {
        if (isCancelled) {
          return;
        }
        setError(requestError?.message || "Failed to load orders.");
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    loadOrders();
    const intervalId = window.setInterval(loadOrders, 30000);

    return () => {
      isCancelled = true;
      window.clearInterval(intervalId);
    };
  }, [token]);

  const filteredOrders = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesStatus = statusFilter === "all" || order?.status === statusFilter;
      const matchesSearch =
        !normalizedSearch ||
        String(order?.id || "").toLowerCase().includes(normalizedSearch) ||
        String(order?.customer_id || "").toLowerCase().includes(normalizedSearch);

      return matchesStatus && matchesSearch;
    });
  }, [orders, searchTerm, statusFilter]);

  const queueTimeMinutes = useMemo(() => estimateQueueTimeMinutes(orders), [orders]);

  const handleNav = (page) => (event) => {
    event.preventDefault();
    onNavigate?.(page);
  };

  const handleStatusAdvance = async (order) => {
    const nextStatus = ORDER_NEXT_STATUS[order?.status];
    if (!nextStatus || !order?.id) {
      return;
    }

    setError("");
    setUpdatingOrderId(order.id);

    try {
      const updatedOrder = await api.updateOrderStatus(token, order.id, nextStatus);
      setOrders((previous) =>
        previous.map((current) => (current.id === order.id ? updatedOrder : current))
      );
    } catch (requestError) {
      setError(requestError?.message || "Failed to update order status.");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100">
      <div className="flex h-screen overflow-hidden">
        <aside className="w-64 border-r border-primary/10 bg-white dark:bg-slate-900 flex flex-col shrink-0">
          <div className="p-6 flex items-center gap-3">
            <div className="bg-primary size-10 rounded-lg flex items-center justify-center text-white">
              <span className="material-symbols-outlined">restaurant</span>
            </div>
            <div>
              <h1 className="text-slate-900 dark:text-white text-base font-bold leading-none">
                HungerRush
              </h1>
              <p className="text-primary text-xs font-medium">Restaurant Management</p>
            </div>
          </div>
          <nav className="flex-1 px-4 py-4 space-y-1">
            <a
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-primary/10 hover:text-primary transition-colors"
              href="#"
              onClick={handleNav("dashboard")}
            >
              <span className="material-symbols-outlined">dashboard</span>
              <span className="text-sm font-medium">Dashboard</span>
            </a>
            <a
              className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary text-white"
              href="#"
              onClick={handleNav("orders")}
            >
              <span className="material-symbols-outlined">receipt_long</span>
              <span className="text-sm font-medium">Orders</span>
            </a>
            <a
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-primary/10 hover:text-primary transition-colors"
              href="#"
              onClick={handleNav("menu")}
            >
              <span className="material-symbols-outlined">menu_book</span>
              <span className="text-sm font-medium">Menu</span>
            </a>
            <a
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-primary/10 hover:text-primary transition-colors"
              href="#"
              onClick={handleNav("videos")}
            >
              <span className="material-symbols-outlined">videocam</span>
              <span className="text-sm font-medium">Videos</span>
            </a>
            <a
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-primary/10 hover:text-primary transition-colors"
              href="#"
              onClick={handleNav("reviews")}
            >
              <span className="material-symbols-outlined">star</span>
              <span className="text-sm font-medium">Reviews</span>
            </a>
            <a
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-primary/10 hover:text-primary transition-colors"
              href="#"
              onClick={handleNav("loyalty")}
            >
              <span className="material-symbols-outlined">card_membership</span>
              <span className="text-sm font-medium">Loyalty</span>
            </a>
            <a
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-primary/10 hover:text-primary transition-colors"
              href="#"
              onClick={handleNav("analytics")}
            >
              <span className="material-symbols-outlined">monitoring</span>
              <span className="text-sm font-medium">Analytics</span>
            </a>
          </nav>
          <div className="p-4 border-t border-primary/10">
            <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-primary/5">
              <div className="size-10 rounded-full bg-slate-300 flex items-center justify-center">
                <span className="material-symbols-outlined text-slate-500">person</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{user?.name || "Restaurant User"}</p>
                <p className="text-xs text-slate-500 truncate">
                  {String(user?.role || "restaurant_owner").replace("_", " ")}
                </p>
              </div>
              <button
                className="material-symbols-outlined text-slate-400 text-sm hover:text-red-500 transition-colors"
                type="button"
                onClick={onLogout}
                title="Logout"
              >
                logout
              </button>
            </div>
          </div>
        </aside>
        <main className="flex-1 flex flex-col overflow-hidden">
          <header className="h-16 border-b border-primary/10 bg-white dark:bg-slate-900 flex items-center justify-between px-8 shrink-0">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-bold">Active Orders</h2>
              <div className="flex items-center gap-2 px-2.5 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full text-xs font-bold uppercase tracking-widest">
                <span className="size-2 rounded-full bg-green-500 animate-pulse"></span>
                Live
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  search
                </span>
                <input
                  className="pl-10 pr-4 py-2 bg-background-light dark:bg-slate-800 border-none rounded-lg focus:ring-2 focus:ring-primary w-64 text-sm"
                  placeholder="Search orders..."
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </div>
            </div>
          </header>
          <div className="flex-1 overflow-y-auto p-8">
            {error ? (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300 px-4 py-3 text-sm">
                {error}
              </div>
            ) : null}

            <div className="flex items-center gap-2 mb-8 bg-white dark:bg-slate-900 p-1 rounded-xl w-fit shadow-sm border border-primary/5 overflow-x-auto">
              <button
                className={
                  statusFilter === "all"
                    ? "px-5 py-2 rounded-lg bg-primary text-white font-semibold text-sm"
                    : "px-5 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-primary/10 font-medium text-sm transition-colors"
                }
                type="button"
                onClick={() => setStatusFilter("all")}
              >
                All
              </button>
              {[
                "pending",
                "accepted",
                "preparing",
                "ready_for_pickup",
                "on_the_way",
                "delivered",
              ].map((status) => (
                <button
                  key={status}
                  className={
                    statusFilter === status
                      ? "px-5 py-2 rounded-lg bg-primary text-white font-semibold text-sm"
                      : "px-5 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-primary/10 font-medium text-sm transition-colors whitespace-nowrap"
                  }
                  type="button"
                  onClick={() => setStatusFilter(status)}
                >
                  {getOrderStatusLabel(status)}
                </button>
              ))}
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-primary/10 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-primary/10">
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Summary
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">
                      Price
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Time
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">
                      Status
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">
                      Actions
                    </th>
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
                          className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors"
                        >
                          <td className="px-6 py-5 font-bold text-primary">#{order.id}</td>
                          <td className="px-6 py-5">
                            <div className="font-semibold text-slate-900 dark:text-white">
                              Customer #{order.customer_id || "N/A"}
                            </div>
                          </td>
                          <td className="px-6 py-5 text-sm text-slate-600 dark:text-slate-400">
                            {order.branch_id ? `Branch #${order.branch_id}` : "Main branch order"}
                          </td>
                          <td className="px-6 py-5 text-right font-bold text-slate-900 dark:text-white">
                            {toMoney(order.total)}
                          </td>
                          <td className="px-6 py-5 text-sm text-slate-600 dark:text-slate-400">
                            {formatOrderTime(order.created_at)}
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex justify-center">
                              <span
                                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase ${getOrderStatusClass(
                                  order.status
                                )}`}
                              >
                                {getOrderStatusLabel(order.status)}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-5 text-right">
                            {nextStatus ? (
                              <button
                                className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary/90 shadow-sm transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                                type="button"
                                onClick={() => handleStatusAdvance(order)}
                                disabled={isUpdating}
                              >
                                {isUpdating ? "Updating..." : ORDER_ACTION_LABEL[nextStatus] || "Update Status"}
                              </button>
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
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-primary/10 shadow-sm">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Avg Queue Time
                </p>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-bold">{queueTimeMinutes}m</span>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-primary/10 shadow-sm">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Total Orders
                </p>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-bold">{orders.length}</span>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-primary/10 shadow-sm">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Active Orders
                </p>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-bold">
                    {orders.filter((order) => ACTIVE_ORDER_STATUSES.has(order?.status)).length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import RestaurantShell from "../components/RestaurantShell.jsx";
import { api } from "../lib/api.js";
import {
  ACTIVE_ORDER_STATUSES,
  getOrderStatusClass,
  getOrderStatusLabel,
} from "../utils/orderStatus.js";

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

function createQuickOrderRow() {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    menuItemId: "",
    quantity: 1,
    notes: "",
  };
}

export default function DashboardOverview({ onNavigate, token, user, onLogout }) {
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isQuickOrderOpen, setIsQuickOrderOpen] = useState(false);
  const [quickOrderRows, setQuickOrderRows] = useState([createQuickOrderRow()]);
  const [quickOrderError, setQuickOrderError] = useState("");
  const [creatingQuickOrder, setCreatingQuickOrder] = useState(false);

  useEffect(() => {
    if (!token) return undefined;

    let isCancelled = false;

    const loadData = async () => {
      setLoading(true);
      setError("");
      try {
        const [profileData, ordersData, menuItemsData] = await Promise.all([
          api.getRestaurantProfile(token),
          api.getRestaurantOrders(token),
          api.getMenuItems(token),
        ]);

        if (isCancelled) return;
        setProfile(profileData || null);
        setOrders(Array.isArray(ordersData) ? ordersData : []);
        setMenuItems(Array.isArray(menuItemsData) ? menuItemsData : []);
      } catch (requestError) {
        if (!isCancelled) {
          setError(requestError?.message || "Failed to load dashboard data.");
        }
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };

    loadData();
    const timer = window.setInterval(loadData, 30000);

    return () => {
      isCancelled = true;
      window.clearInterval(timer);
    };
  }, [token]);

  const dashboardStats = useMemo(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todayOrders = orders.filter((order) => {
      const createdAt = new Date(order?.created_at || "");
      return !Number.isNaN(createdAt.getTime()) && createdAt >= startOfToday;
    });

    return {
      totalOrdersToday: todayOrders.length,
      revenueToday: todayOrders.reduce((sum, order) => sum + Number(order?.total || 0), 0),
      inProgressCount: orders.filter((order) => ACTIVE_ORDER_STATUSES.has(String(order?.status || ""))).length,
    };
  }, [orders]);

  const recentOrders = useMemo(() => orders.slice(0, 5), [orders]);
  const availableMenuItems = useMemo(
    () => menuItems.filter((item) => Boolean(item?.is_available)),
    [menuItems]
  );

  const openQuickOrder = () => {
    setQuickOrderRows([createQuickOrderRow()]);
    setQuickOrderError("");
    setIsQuickOrderOpen(true);
  };

  const closeQuickOrder = () => {
    setIsQuickOrderOpen(false);
    setQuickOrderRows([createQuickOrderRow()]);
    setQuickOrderError("");
  };

  const handleQuickRowChange = (rowId, field, value) => {
    setQuickOrderRows((previous) =>
      previous.map((row) => (row.id === rowId ? { ...row, [field]: value } : row))
    );
  };

  const handleAddQuickRow = () => {
    setQuickOrderRows((previous) => [...previous, createQuickOrderRow()]);
  };

  const handleRemoveQuickRow = (rowId) => {
    setQuickOrderRows((previous) => {
      const next = previous.filter((row) => row.id !== rowId);
      return next.length ? next : [createQuickOrderRow()];
    });
  };

  const handleCreateQuickOrder = async (event) => {
    event.preventDefault();
    setQuickOrderError("");

    const items = quickOrderRows
      .map((row) => ({
        menu_item_id: Number(row.menuItemId),
        quantity: Number(row.quantity),
        notes: row.notes.trim() || undefined,
      }))
      .filter((row) => Number.isFinite(row.menu_item_id) && row.menu_item_id > 0 && row.quantity > 0);

    if (!items.length) {
      setQuickOrderError("Please add at least one valid item.");
      return;
    }

    setCreatingQuickOrder(true);
    try {
      const createdOrder = await api.createQuickOrder(token, { items });
      setOrders((previous) => [createdOrder, ...previous]);
      closeQuickOrder();
    } catch (requestError) {
      setQuickOrderError(requestError?.message || "Failed to create quick order.");
    } finally {
      setCreatingQuickOrder(false);
    }
  };

  return (
    <>
      <RestaurantShell
        activePage="dashboard"
        onNavigate={onNavigate}
        user={user}
        onLogout={onLogout}
        title={profile?.name || "Dashboard"}
        headerActions={
          <>
            <button
              className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary/90"
              type="button"
              onClick={() => onNavigate?.("menu")}
            >
              Add Food
            </button>
            <button
              className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-800"
              type="button"
              onClick={openQuickOrder}
            >
              Quick Order
            </button>
            <button
              className="bg-primary/10 text-primary border border-primary/20 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary/20"
              type="button"
              onClick={() => onNavigate?.("videoCreate")}
            >
              Upload Video
            </button>
          </>
        }
      >
        {error ? (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">
            {error}
          </div>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl border border-primary/10 shadow-sm">
            <p className="text-slate-500 text-sm font-medium">Total Orders Today</p>
            <h3 className="text-3xl font-bold mt-1">{loading ? "..." : dashboardStats.totalOrdersToday}</h3>
          </div>
          <div className="bg-white p-6 rounded-xl border border-primary/10 shadow-sm">
            <p className="text-slate-500 text-sm font-medium">Revenue Today</p>
            <h3 className="text-3xl font-bold mt-1">{loading ? "..." : toMoney(dashboardStats.revenueToday)}</h3>
          </div>
          <div className="bg-white p-6 rounded-xl border border-primary/10 shadow-sm">
            <p className="text-slate-500 text-sm font-medium">Orders in Progress</p>
            <h3 className="text-3xl font-bold mt-1">{loading ? "..." : dashboardStats.inProgressCount}</h3>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-primary/10 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-primary/10 flex items-center justify-between">
            <h3 className="text-xl font-bold">Recent Orders</h3>
            <button
              className="text-primary text-sm font-semibold hover:underline"
              type="button"
              onClick={() => onNavigate?.("orders")}
            >
              View All
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Order ID</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Time</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/5">
                {recentOrders.length ? (
                  recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-sm">#{order.id}</td>
                      <td className="px-6 py-4 text-sm text-slate-700">
                        <div className="flex items-center gap-2">
                          <span>{order?.is_quick_order ? "Quick Order" : `Customer #${order.customer_id || "N/A"}`}</span>
                          {order?.is_quick_order ? (
                            <span className="px-2 py-0.5 rounded-full bg-slate-900 text-white text-[10px] font-bold uppercase">
                              Not Real
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{formatOrderTime(order.created_at)}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${getOrderStatusClass(
                            order.status
                          )}`}
                        >
                          {getOrderStatusLabel(order.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-sm">{toMoney(order.total)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-6 py-8 text-sm text-slate-500" colSpan={5}>
                      {loading ? "Loading recent orders..." : "No orders found yet."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </RestaurantShell>

      {isQuickOrderOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold">Create Quick Order</h3>
                <p className="text-slate-500 text-sm">
                  This creates a normal order and labels it as not from a real customer.
                </p>
              </div>
              <button
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
                type="button"
                onClick={closeQuickOrder}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form className="p-6 space-y-4" onSubmit={handleCreateQuickOrder}>
              {quickOrderError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">
                  {quickOrderError}
                </div>
              ) : null}

              {quickOrderRows.map((row, index) => (
                <div key={row.id} className="grid grid-cols-1 md:grid-cols-[2fr_100px_1fr_40px] gap-3 items-start">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Item #{index + 1}</label>
                    <select
                      className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-lg text-sm"
                      value={row.menuItemId}
                      onChange={(event) => handleQuickRowChange(row.id, "menuItemId", event.target.value)}
                      required
                    >
                      <option value="">Select Menu Item</option>
                      {availableMenuItems.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} ({toMoney(item.price)})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Qty</label>
                    <input
                      className="w-full px-3 py-2.5 bg-slate-50 border-none rounded-lg text-sm"
                      type="number"
                      min="1"
                      value={row.quantity}
                      onChange={(event) => handleQuickRowChange(row.id, "quantity", event.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Notes</label>
                    <input
                      className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-lg text-sm"
                      type="text"
                      placeholder="Optional"
                      value={row.notes}
                      onChange={(event) => handleQuickRowChange(row.id, "notes", event.target.value)}
                    />
                  </div>
                  <button
                    className="mt-6 size-10 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50"
                    type="button"
                    onClick={() => handleRemoveQuickRow(row.id)}
                    disabled={quickOrderRows.length === 1}
                    title="Remove row"
                  >
                    <span className="material-symbols-outlined text-base">remove</span>
                  </button>
                </div>
              ))}

              <button
                className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200"
                type="button"
                onClick={handleAddQuickRow}
              >
                Add Item Row
              </button>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  className="px-5 py-2.5 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-100"
                  type="button"
                  onClick={closeQuickOrder}
                >
                  Cancel
                </button>
                <button
                  className="px-8 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800 disabled:opacity-60"
                  type="submit"
                  disabled={creatingQuickOrder || !availableMenuItems.length}
                >
                  {creatingQuickOrder ? "Creating..." : "Create Quick Order"}
                </button>
              </div>

              {!availableMenuItems.length ? (
                <p className="text-xs text-slate-500">
                  You need at least one available menu item to create a quick order.
                </p>
              ) : null}
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

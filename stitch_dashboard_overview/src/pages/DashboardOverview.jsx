import { useEffect, useMemo, useState } from "react";
import { bg } from "../utils/bg.js";
import { api } from "../lib/api.js";
import {
  ACTIVE_ORDER_STATUSES,
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

export default function DashboardOverview({ onNavigate, token, user, onLogout }) {
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      return undefined;
    }

    let isCancelled = false;

    const loadDashboardData = async () => {
      setLoading(true);
      setError("");

      try {
        const [profileData, ordersData] = await Promise.all([
          api.getRestaurantProfile(token),
          api.getRestaurantOrders(token),
        ]);

        if (isCancelled) {
          return;
        }

        setProfile(profileData || null);
        setOrders(Array.isArray(ordersData) ? ordersData : []);
      } catch (requestError) {
        if (isCancelled) {
          return;
        }
        setError(requestError?.message || "Failed to load dashboard data.");
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    loadDashboardData();
    const intervalId = window.setInterval(loadDashboardData, 30000);

    return () => {
      isCancelled = true;
      window.clearInterval(intervalId);
    };
  }, [token]);

  const dashboardStats = useMemo(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todayOrders = orders.filter((order) => {
      const createdAt = new Date(order?.created_at || "");
      return !Number.isNaN(createdAt.getTime()) && createdAt >= startOfToday;
    });

    const revenueToday = todayOrders.reduce((sum, order) => sum + Number(order?.total || 0), 0);
    const inProgressCount = orders.filter((order) =>
      ACTIVE_ORDER_STATUSES.has(String(order?.status || ""))
    ).length;

    return {
      totalOrdersToday: todayOrders.length,
      revenueToday,
      inProgressCount,
    };
  }, [orders]);

  const recentOrders = useMemo(() => orders.slice(0, 5), [orders]);

  const handleNav = (page) => (event) => {
    event.preventDefault();
    onNavigate?.(page);
  };

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen flex">
      <aside className="w-64 border-r border-primary/10 bg-white dark:bg-background-dark/50 flex flex-col fixed h-full">
        <div className="p-6 flex items-center gap-3">
          <div className="bg-primary size-10 rounded-lg flex items-center justify-center text-white shadow-lg shadow-primary/30">
            <span className="material-symbols-outlined">restaurant</span>
          </div>
          <div>
            <h1 className="text-slate-900 dark:text-white text-base font-bold leading-none">
              HungerRush
            </h1>
            <p className="text-primary text-[10px] font-bold uppercase tracking-wider mt-1">
              Restaurant Management
            </p>
          </div>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-1">
          <a
            className="flex items-center gap-3 px-4 py-3 rounded-lg bg-primary text-white shadow-md shadow-primary/20"
            href="#"
            onClick={handleNav("dashboard")}
          >
            <span className="material-symbols-outlined sidebar-active-icon">dashboard</span>
            <span className="text-sm font-semibold">Dashboard</span>
          </a>
          <a
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            href="#"
            onClick={handleNav("orders")}
          >
            <span className="material-symbols-outlined">receipt_long</span>
            <span className="text-sm font-medium">Orders</span>
          </a>
          <a
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            href="#"
            onClick={handleNav("menu")}
          >
            <span className="material-symbols-outlined">menu_book</span>
            <span className="text-sm font-medium">Menu</span>
          </a>
          <a
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            href="#"
            onClick={handleNav("videos")}
          >
            <span className="material-symbols-outlined">videocam</span>
            <span className="text-sm font-medium">Videos</span>
          </a>
          <a
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            href="#"
            onClick={handleNav("reviews")}
          >
            <span className="material-symbols-outlined">star</span>
            <span className="text-sm font-medium">Reviews</span>
          </a>
          <a
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            href="#"
            onClick={handleNav("loyalty")}
          >
            <span className="material-symbols-outlined">card_membership</span>
            <span className="text-sm font-medium">Loyalty</span>
          </a>
          <a
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            href="#"
            onClick={handleNav("analytics")}
          >
            <span className="material-symbols-outlined">monitoring</span>
            <span className="text-sm font-medium">Analytics</span>
          </a>
        </nav>
        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
            <div
              className="size-10 rounded-full bg-slate-300 overflow-hidden bg-cover bg-center border border-white dark:border-slate-700"
              data-alt="Profile picture of user"
              style={bg(
                "https://lh3.googleusercontent.com/aida-public/AB6AXuCfno-lRT1a7iZbsWEDWJ6YO-jEyArfY--xT5lnlmtZpoF8YE1UVYt2SPiEeQPGzdyIOCs_eq0On-YJNoEMGn-F7q5A7RfjJ_iMkwf2xmPUgXMcx-Zm-7yt6MUdIYEk1HGi6TIx6-AF81MTF4iPym1SWLEjVzxCAEGjxp2IkQpmuCjBqpqbOAi6YoPnmNVWXYFUuerZ7q3At5nv3xO_WLmzSvE-OhQslsR5lB_g-IvwEqq3eBXurgMq23NftDIFoywM9skawWxjV540"
              )}
            ></div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{user?.name || "Restaurant User"}</p>
              <p className="text-[11px] text-slate-500 truncate">
                {String(user?.role || "restaurant_owner").replace("_", " ")}
              </p>
            </div>
            <button
              className="material-symbols-outlined text-slate-400 hover:text-red-500 transition-colors text-xl"
              type="button"
              onClick={onLogout}
              title="Logout"
            >
              logout
            </button>
          </div>
        </div>
      </aside>
      <main className="flex-1 ml-64 min-h-screen flex flex-col">
        <header className="h-16 border-b border-primary/10 bg-white dark:bg-background-dark/80 backdrop-blur-md sticky top-0 z-10 px-8 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-primary">
              <span className="material-symbols-outlined font-bold">lunch_dining</span>
              <h2 className="text-slate-900 dark:text-white text-lg font-bold tracking-tight">
                {profile?.name || "Restaurant"}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-primary/90 transition-all"
                type="button"
                onClick={() => onNavigate?.("menu")}
              >
                <span className="material-symbols-outlined text-lg">add_circle</span>
                Add Food
              </button>
              <button
                className="bg-primary/10 text-primary border border-primary/20 px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-primary/20 transition-all"
                type="button"
                onClick={() => onNavigate?.("videoCreate")}
              >
                <span className="material-symbols-outlined text-lg">upload_file</span>
                Upload Video
              </button>
            </div>
          </div>
        </header>
        <div className="p-8 space-y-8">
          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300 px-4 py-3 text-sm">
              {error}
            </div>
          ) : null}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl border border-primary/10 shadow-sm">
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                Total Orders Today
              </p>
              <h3 className="text-3xl font-bold mt-1">
                {loading ? "..." : dashboardStats.totalOrdersToday}
              </h3>
            </div>
            <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl border border-primary/10 shadow-sm">
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Revenue Today</p>
              <h3 className="text-3xl font-bold mt-1">
                {loading ? "..." : toMoney(dashboardStats.revenueToday)}
              </h3>
            </div>
            <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl border border-primary/10 shadow-sm">
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                Orders in Progress
              </p>
              <h3 className="text-3xl font-bold mt-1">
                {loading ? "..." : dashboardStats.inProgressCount}
              </h3>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-primary/10 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-primary/10 flex items-center justify-between bg-white dark:bg-transparent">
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
                <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 text-xs font-bold uppercase tracking-wider">
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
                      <tr
                        key={order.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="px-6 py-4 font-bold text-sm">#{order.id}</td>
                        <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300">
                          Customer #{order.customer_id || "N/A"}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                          {formatOrderTime(order.created_at)}
                        </td>
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
        </div>
      </main>
    </div>
  );
}

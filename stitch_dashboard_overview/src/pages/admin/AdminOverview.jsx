import { useEffect, useMemo, useState } from "react";
import AdminShell from "../../components/AdminShell.jsx";
import {
  Alert,
  SortableTh,
  StatusBadge,
  TableShell,
  formatDate,
  sortRows,
  toMoney,
  toggleSortConfig,
} from "../../components/admin/AdminUI.jsx";
import { api } from "../../lib/api.js";
import { getMockAdminDashboard, mockAdminData } from "../../lib/adminData.js";

function StatCard({ label, value, icon, tone = "primary", onClick }) {
  const iconStyles =
    tone === "dark"
      ? "bg-slate-900 text-white"
      : tone === "warning"
        ? "bg-amber-100 text-amber-700"
        : tone === "danger"
          ? "bg-red-100 text-red-700"
          : "bg-primary/10 text-primary";
  const isInteractive = typeof onClick === "function";
  const classes = `rounded-xl border border-primary/10 bg-white p-5 shadow-sm ${
    isInteractive
      ? "cursor-pointer text-left transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      : ""
  }`;
  const cardContent = (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <h3 className="mt-1 text-3xl font-black text-slate-900">{value}</h3>
      </div>
      <span className={`material-symbols-outlined rounded-lg p-2 ${iconStyles}`}>{icon}</span>
    </div>
  );

  if (!isInteractive) {
    return <div className={classes}>{cardContent}</div>;
  }

  return (
    <button className={classes} type="button" onClick={onClick}>
      {cardContent}
    </button>
  );
}

export default function AdminOverview({ onNavigate, token, user, onLogout }) {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [usingMock, setUsingMock] = useState(false);
  const [orderSortConfig, setOrderSortConfig] = useState({ key: "id", direction: "desc" });
  const [reportSortConfig, setReportSortConfig] = useState({ key: "id", direction: "desc" });

  useEffect(() => {
    if (!token) return undefined;

    let isCancelled = false;

    const loadDashboard = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await api.getAdminDashboard(token);
        if (!isCancelled) {
          setDashboard(data || getMockAdminDashboard());
          setUsingMock(false);
        }
      } catch (requestError) {
        if (!isCancelled) {
          setDashboard(getMockAdminDashboard());
          setUsingMock(true);
          setError(requestError?.message || "Admin dashboard endpoint is not available yet.");
        }
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };

    loadDashboard();

    return () => {
      isCancelled = true;
    };
  }, [token]);

  const rawStats = dashboard?.stats || {};
  const stats = {
    ...mockAdminData.stats,
    ...rawStats,
    pending_orders: rawStats.pending_orders ?? mockAdminData.stats.pending_orders,
    total_revenue: rawStats.total_revenue ?? mockAdminData.stats.total_revenue,
    reported_content: rawStats.reported_content ?? rawStats.open_reports ?? mockAdminData.stats.reported_content,
    pending_approvals: rawStats.pending_approvals ?? rawStats.open_support_requests ?? mockAdminData.stats.pending_approvals,
  };
  const cards = useMemo(
    () => [
      { label: "Total Users", value: stats.users, icon: "group", tone: "primary", pageKey: "adminUsers" },
      { label: "Total Customers", value: stats.customers, icon: "person", tone: "primary", pageKey: "adminCustomers" },
      { label: "Total Restaurants", value: stats.restaurants, icon: "restaurant", tone: "primary", pageKey: "adminRestaurants" },
      { label: "Total Orders", value: stats.orders, icon: "receipt_long", tone: "dark", pageKey: "adminOrders" },
      { label: "Pending Orders", value: stats.pending_orders || 0, icon: "pending_actions", tone: "warning", pageKey: "adminOrders" },
      { label: "Total Revenue", value: toMoney(stats.total_revenue || 0), icon: "payments", tone: "dark", pageKey: "adminOrders" },
      { label: "Reported Content", value: stats.reported_content || stats.open_reports || 0, icon: "flag", tone: "danger", pageKey: "adminReports" },
      { label: "Pending Approvals", value: stats.pending_approvals || stats.open_support_requests || 0, icon: "approval", tone: "warning", pageKey: "adminNewRestaurants" },
    ],
    [stats]
  );
  const recentOrders = useMemo(
    () =>
      sortRows(dashboard?.recent_orders || [], orderSortConfig, (order, key) => {
        if (key === "id") return order?.id;
        if (key === "customer") return order?.customer?.name || `Customer #${order?.customer_id || "-"}`;
        if (key === "total") return Number(order?.total || 0);
        if (key === "status") return order?.status;
        return order?.[key];
      }),
    [dashboard?.recent_orders, orderSortConfig]
  );
  const recentReports = useMemo(
    () =>
      sortRows(dashboard?.recent_reports || [], reportSortConfig, (report, key) => {
        if (key === "id") return report?.id;
        if (key === "reason") return report?.subject || report?.message || "Reported content";
        if (key === "created_at") return report?.created_at;
        if (key === "status") return report?.status;
        return report?.[key];
      }),
    [dashboard?.recent_reports, reportSortConfig]
  );
  const handleOrderSort = (key) => {
    setOrderSortConfig((previous) => toggleSortConfig(previous, key));
  };
  const handleReportSort = (key) => {
    setReportSortConfig((previous) => toggleSortConfig(previous, key));
  };

  return (
    <AdminShell
      activePage="adminOverview"
      onNavigate={onNavigate}
      user={user}
      onLogout={onLogout}
      title="Admin Overview"
      headerActions={
        <button
          className="rounded-lg bg-primary text-sm font-bold text-white px-4 py-2 hover:bg-primary/90"
          type="button"
          onClick={() => onNavigate?.("adminReports")}
        >
          Review Reports
        </button>
      }
    >
      {usingMock ? (
        <Alert type="warning">
          {error} Showing realistic placeholder data until the backend is reachable.
        </Alert>
      ) : null}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3 xl:grid-cols-4">
        {cards.map((card) => (
          <StatCard
            key={card.label}
            label={card.label}
            value={loading ? "..." : card.value ?? 0}
            icon={card.icon}
            tone={card.tone}
            onClick={card.pageKey ? () => onNavigate?.(card.pageKey) : undefined}
          />
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-bold">Recent Orders</h3>
            <button className="text-sm font-semibold text-primary hover:underline" type="button" onClick={() => onNavigate?.("adminOrders")}>
              View All
            </button>
          </div>
          <TableShell>
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
                <tr>
                  <SortableTh className="px-5 py-3" label="Order" sortKey="id" sortConfig={orderSortConfig} onSort={handleOrderSort} />
                  <SortableTh className="px-5 py-3" label="Customer" sortKey="customer" sortConfig={orderSortConfig} onSort={handleOrderSort} />
                  <SortableTh className="px-5 py-3" label="Total" sortKey="total" sortConfig={orderSortConfig} onSort={handleOrderSort} />
                  <SortableTh className="px-5 py-3" label="Status" sortKey="status" sortConfig={orderSortConfig} onSort={handleOrderSort} />
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/5">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4 font-bold text-primary">#{order.id}</td>
                    <td className="px-5 py-4 text-sm">{order?.customer?.name || `Customer #${order.customer_id || "-"}`}</td>
                    <td className="px-5 py-4 text-sm font-semibold">{toMoney(order.total)}</td>
                    <td className="px-5 py-4"><StatusBadge value={order.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableShell>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-bold">Recent Reports</h3>
            <button className="text-sm font-semibold text-primary hover:underline" type="button" onClick={() => onNavigate?.("adminReports")}>
              Moderate
            </button>
          </div>
          <TableShell>
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
                <tr>
                  <SortableTh className="px-5 py-3" label="Report" sortKey="id" sortConfig={reportSortConfig} onSort={handleReportSort} />
                  <SortableTh className="px-5 py-3" label="Reason" sortKey="reason" sortConfig={reportSortConfig} onSort={handleReportSort} />
                  <SortableTh className="px-5 py-3" label="Date" sortKey="created_at" sortConfig={reportSortConfig} onSort={handleReportSort} />
                  <SortableTh className="px-5 py-3" label="Status" sortKey="status" sortConfig={reportSortConfig} onSort={handleReportSort} />
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/5">
                {recentReports.map((report) => (
                  <tr key={report.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4 font-bold text-primary">#{report.id}</td>
                    <td className="px-5 py-4 text-sm">{report.subject || report.message || "Reported content"}</td>
                    <td className="px-5 py-4 text-sm text-slate-500">{formatDate(report.created_at)}</td>
                    <td className="px-5 py-4"><StatusBadge value={report.status} label={report.status === "open" ? "Pending" : undefined} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableShell>
        </section>
      </div>
    </AdminShell>
  );
}

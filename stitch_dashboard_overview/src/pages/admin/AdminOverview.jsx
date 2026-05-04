import { useEffect, useMemo, useState } from "react";
import AdminShell from "../../components/AdminShell.jsx";
import { Alert, StatusBadge, TableShell, formatDate, toMoney } from "../../components/admin/AdminUI.jsx";
import { api } from "../../lib/api.js";
import { getMockAdminDashboard, mockAdminData } from "../../lib/adminData.js";

function StatCard({ label, value, icon, tone = "primary" }) {
  const iconStyles =
    tone === "dark"
      ? "bg-slate-900 text-white"
      : tone === "warning"
        ? "bg-amber-100 text-amber-700"
        : tone === "danger"
          ? "bg-red-100 text-red-700"
          : "bg-primary/10 text-primary";

  return (
    <div className="rounded-xl border border-primary/10 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <h3 className="mt-1 text-3xl font-black text-slate-900">{value}</h3>
        </div>
        <span className={`material-symbols-outlined rounded-lg p-2 ${iconStyles}`}>{icon}</span>
      </div>
    </div>
  );
}

export default function AdminOverview({ onNavigate, token, user, onLogout }) {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [usingMock, setUsingMock] = useState(false);

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
      ["Total Users", stats.users, "group", "primary"],
      ["Total Customers", stats.customers, "person", "primary"],
      ["Restaurant Owners", stats.restaurant_owners, "storefront", "primary"],
      ["Total Restaurants", stats.restaurants, "restaurant", "primary"],
      ["Total Orders", stats.orders, "receipt_long", "dark"],
      ["Pending Orders", stats.pending_orders || 0, "pending_actions", "warning"],
      ["Total Revenue", toMoney(stats.total_revenue || 0), "payments", "dark"],
      ["Reported Content", stats.reported_content || stats.open_reports || 0, "flag", "danger"],
      ["Pending Approvals", stats.pending_approvals || stats.open_support_requests || 0, "approval", "warning"],
    ],
    [stats]
  );

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
        {cards.map(([label, value, icon, tone]) => (
          <StatCard key={label} label={label} value={loading ? "..." : value ?? 0} icon={icon} tone={tone} />
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
                  <th className="px-5 py-3">Order</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Total</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/5">
                {(dashboard?.recent_orders || []).map((order) => (
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
                  <th className="px-5 py-3">Report</th>
                  <th className="px-5 py-3">Reason</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/5">
                {(dashboard?.recent_reports || []).map((report) => (
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

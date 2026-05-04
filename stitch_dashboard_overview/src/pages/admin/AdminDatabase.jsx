import { useEffect, useState } from "react";
import AdminShell from "../../components/AdminShell.jsx";
import { ActionButton, Alert, TableShell, formatDateTime } from "../../components/admin/AdminUI.jsx";
import { api } from "../../lib/api.js";
import { createDatabaseStats, mockAdminData } from "../../lib/adminData.js";

function DatabaseStatCard({ label, value, icon }) {
  return (
    <div className="rounded-xl border border-primary/10 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <h3 className="mt-1 text-3xl font-black">{value}</h3>
        </div>
        <span className="material-symbols-outlined rounded-lg bg-primary/10 p-2 text-primary">{icon}</span>
      </div>
    </div>
  );
}

export default function AdminDatabase({ onNavigate, token, user, onLogout }) {
  const [stats, setStats] = useState(createDatabaseStats(mockAdminData));
  const [activity, setActivity] = useState(mockAdminData.activity);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [usingMock, setUsingMock] = useState(false);

  const loadStats = async () => {
    setLoading(true);
    setError("");
    try {
      const dashboard = await api.getAdminDashboard(token);
      setStats(createDatabaseStats(dashboard));
      setActivity([
        ...(dashboard?.recent_orders || []).map((order) => ({
          id: `order-${order.id}`,
          label: `Order #${order.id} updated in the database`,
          created_at: order.created_at,
        })),
        ...(dashboard?.recent_reports || []).map((report) => ({
          id: `report-${report.id}`,
          label: `Report #${report.id} was recorded`,
          created_at: report.created_at,
        })),
      ].slice(0, 8));
      setUsingMock(false);
    } catch (requestError) {
      setStats(createDatabaseStats(mockAdminData));
      setActivity(mockAdminData.activity);
      setUsingMock(true);
      setError(requestError?.message || "Admin database statistics are not available yet.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadStats();
    }
  }, [token]);

  const handlePlaceholder = (label) => {
    setSuccess(`${label} placeholder started. Connect this button to a safe backend job later.`);
  };

  return (
    <AdminShell
      activePage="adminDatabase"
      onNavigate={onNavigate}
      user={user}
      onLogout={onLogout}
      title="Database Control"
      headerActions={
        <button
          className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-60"
          type="button"
          onClick={loadStats}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "Refresh Stats"}
        </button>
      }
    >
      {usingMock ? <Alert type="warning">{error} Showing read-only placeholder database stats.</Alert> : <Alert>{error}</Alert>}
      <Alert type="success">{success}</Alert>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3 xl:grid-cols-5">
        <DatabaseStatCard label="Users" value={loading ? "..." : stats.users} icon="group" />
        <DatabaseStatCard label="Restaurants" value={loading ? "..." : stats.restaurants} icon="storefront" />
        <DatabaseStatCard label="Menu Items" value={loading ? "..." : stats.menuItems} icon="restaurant_menu" />
        <DatabaseStatCard label="Orders" value={loading ? "..." : stats.orders} icon="receipt_long" />
        <DatabaseStatCard label="Reports" value={loading ? "..." : stats.reports} icon="flag" />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section className="xl:col-span-2">
          <h3 className="mb-3 text-lg font-bold">Recent Database Activity</h3>
          <TableShell>
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
                <tr>
                  <th className="px-6 py-4">Activity</th>
                  <th className="px-6 py-4">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/5">
                {activity.length ? (
                  activity.map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm font-semibold">{entry.label}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">{formatDateTime(entry.created_at)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-6 py-8 text-sm text-slate-500" colSpan={2}>No recent activity found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </TableShell>
        </section>

        <aside className="rounded-xl border border-primary/10 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold">Safe Controls</h3>
          <p className="mt-2 text-sm text-slate-500">
            These controls never expose credentials and do not delete database data from the frontend.
          </p>
          <div className="mt-5 space-y-3">
            <ActionButton tone="primary" icon="backup" className="w-full justify-center" onClick={() => handlePlaceholder("Database backup")}>
              Backup Database
            </ActionButton>
            <ActionButton icon="download" className="w-full justify-center" onClick={() => handlePlaceholder("Data export")}>
              Export Data
            </ActionButton>
            <ActionButton icon="refresh" className="w-full justify-center" onClick={loadStats}>
              Refresh Stats
            </ActionButton>
          </div>
        </aside>
      </div>
    </AdminShell>
  );
}

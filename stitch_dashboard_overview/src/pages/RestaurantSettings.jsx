import { useEffect, useState } from "react";
import RestaurantShell from "../components/RestaurantShell.jsx";
import { api } from "../lib/api.js";

function initialForm() {
  return {
    name: "",
    description: "",
    status: "active",
    ownerName: "",
    ownerEmail: "",
    defaultPrepTime: 20,
    autoAcceptOrders: false,
    notificationsEnabled: true,
    currency: "USD",
    timezone: "Asia/Beirut",
  };
}

export default function RestaurantSettings({ onNavigate, token, user, onLogout }) {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadSettings = async () => {
    setLoading(true);
    setError("");
    try {
      const payload = await api.getRestaurantSettings(token);
      setForm({
        name: payload?.restaurant?.name || "",
        description: payload?.restaurant?.description || "",
        status: payload?.restaurant?.status || "active",
        ownerName: payload?.owner?.name || "",
        ownerEmail: payload?.owner?.email || "",
        defaultPrepTime: Number(payload?.settings?.default_prep_time ?? 20),
        autoAcceptOrders: Boolean(payload?.settings?.auto_accept_orders),
        notificationsEnabled: Boolean(payload?.settings?.notifications_enabled),
        currency: payload?.settings?.currency || "USD",
        timezone: payload?.settings?.timezone || "Asia/Beirut",
      });
    } catch (requestError) {
      setError(requestError?.message || "Failed to load settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    loadSettings();
  }, [token]);

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await api.updateRestaurantSettings(token, {
        name: form.name.trim(),
        description: form.description.trim() || null,
        status: form.status,
        owner_name: form.ownerName.trim(),
        owner_email: form.ownerEmail.trim(),
        settings: {
          default_prep_time: Number(form.defaultPrepTime),
          auto_accept_orders: Boolean(form.autoAcceptOrders),
          notifications_enabled: Boolean(form.notificationsEnabled),
          currency: String(form.currency || "USD").toUpperCase(),
          timezone: form.timezone.trim() || "Asia/Beirut",
        },
      });
      setSuccess("Settings updated successfully.");
      await loadSettings();
    } catch (requestError) {
      setError(requestError?.message || "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <RestaurantShell
      activePage="settings"
      onNavigate={onNavigate}
      user={user}
      onLogout={onLogout}
      title="Settings"
      headerActions={
        <button
          className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-primary/90 disabled:opacity-60"
          type="button"
          onClick={loadSettings}
          disabled={loading}
        >
          Refresh
        </button>
      }
    >
      {error ? (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">{error}</div>
      ) : null}
      {success ? (
        <div className="mb-6 rounded-xl border border-green-200 bg-green-50 text-green-700 px-4 py-3 text-sm">{success}</div>
      ) : null}

      <form className="grid grid-cols-1 xl:grid-cols-2 gap-8" onSubmit={handleSave}>
        <section className="bg-white rounded-xl border border-primary/10 p-6 space-y-4">
          <h3 className="text-lg font-bold">Restaurant Profile</h3>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Name</label>
            <input
              className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-lg text-sm"
              type="text"
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              required
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Description</label>
            <textarea
              className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-lg text-sm resize-none"
              rows="4"
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              disabled={loading}
            ></textarea>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Status</label>
            <select
              className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-lg text-sm"
              value={form.status}
              onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}
              disabled={loading}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </section>

        <section className="bg-white rounded-xl border border-primary/10 p-6 space-y-4">
          <h3 className="text-lg font-bold">Owner Account</h3>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Owner Name</label>
            <input
              className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-lg text-sm"
              type="text"
              value={form.ownerName}
              onChange={(event) => setForm((prev) => ({ ...prev, ownerName: event.target.value }))}
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Owner Email</label>
            <input
              className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-lg text-sm"
              type="email"
              value={form.ownerEmail}
              onChange={(event) => setForm((prev) => ({ ...prev, ownerEmail: event.target.value }))}
              disabled={loading}
            />
          </div>
        </section>

        <section className="bg-white rounded-xl border border-primary/10 p-6 space-y-4">
          <h3 className="text-lg font-bold">Operations</h3>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Default Prep Time (minutes)</label>
            <input
              className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-lg text-sm"
              type="number"
              min="1"
              max="180"
              value={form.defaultPrepTime}
              onChange={(event) => setForm((prev) => ({ ...prev, defaultPrepTime: event.target.value }))}
              disabled={loading}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <label className="flex items-center justify-between p-3 rounded-lg bg-slate-50 text-sm font-medium">
              Auto Accept Orders
              <input
                type="checkbox"
                checked={form.autoAcceptOrders}
                onChange={(event) => setForm((prev) => ({ ...prev, autoAcceptOrders: event.target.checked }))}
                disabled={loading}
              />
            </label>
            <label className="flex items-center justify-between p-3 rounded-lg bg-slate-50 text-sm font-medium">
              Notifications
              <input
                type="checkbox"
                checked={form.notificationsEnabled}
                onChange={(event) => setForm((prev) => ({ ...prev, notificationsEnabled: event.target.checked }))}
                disabled={loading}
              />
            </label>
          </div>
        </section>

        <section className="bg-white rounded-xl border border-primary/10 p-6 space-y-4">
          <h3 className="text-lg font-bold">Regional Settings</h3>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Currency (3 letters)</label>
            <input
              className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-lg text-sm uppercase"
              type="text"
              maxLength={3}
              value={form.currency}
              onChange={(event) => setForm((prev) => ({ ...prev, currency: event.target.value.toUpperCase() }))}
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Timezone</label>
            <input
              className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-lg text-sm"
              type="text"
              value={form.timezone}
              onChange={(event) => setForm((prev) => ({ ...prev, timezone: event.target.value }))}
              disabled={loading}
            />
          </div>
        </section>

        <div className="xl:col-span-2 flex justify-end gap-3">
          <button
            className="px-4 py-2 rounded-lg bg-slate-100 text-sm font-semibold hover:bg-slate-200 disabled:opacity-60"
            type="button"
            onClick={loadSettings}
            disabled={loading || saving}
          >
            Reset
          </button>
          <button
            className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-60"
            type="submit"
            disabled={loading || saving}
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </form>
    </RestaurantShell>
  );
}

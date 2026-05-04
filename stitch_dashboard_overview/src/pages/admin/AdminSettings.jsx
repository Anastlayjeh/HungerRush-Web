import { useEffect, useState } from "react";
import AdminShell from "../../components/AdminShell.jsx";
import { Alert, Toggle } from "../../components/admin/AdminUI.jsx";
import { loadAdminSettings, saveAdminSettings } from "../../lib/adminData.js";

export default function AdminSettings({ onNavigate, token, user, onLogout }) {
  const [form, setForm] = useState(loadAdminSettings);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setForm(loadAdminSettings());
  }, [token]);

  const setField = (field, value) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    const commission = Number(form.commissionPercentage);
    if (!form.platformName.trim()) {
      setError("Platform name is required.");
      setSaving(false);
      return;
    }

    if (!form.supportEmail.includes("@")) {
      setError("Support email must be valid.");
      setSaving(false);
      return;
    }

    if (!Number.isFinite(commission) || commission < 0 || commission > 100) {
      setError("Commission percentage must be between 0 and 100.");
      setSaving(false);
      return;
    }

    window.setTimeout(() => {
      // Replace this local persistence with a backend admin settings endpoint when it exists.
      saveAdminSettings({ ...form, commissionPercentage: commission });
      setSuccess("Admin settings saved locally.");
      setSaving(false);
    }, 250);
  };

  return (
    <AdminShell
      activePage="adminSettings"
      onNavigate={onNavigate}
      user={user}
      onLogout={onLogout}
      title="Admin Settings"
      headerActions={
        <button
          className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-60"
          type="submit"
          form="admin-settings-form"
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>
      }
    >
      <Alert>{error}</Alert>
      <Alert type="success">{success}</Alert>
      <Alert type="warning">These settings use local placeholder state until backend admin settings endpoints are added.</Alert>

      <form id="admin-settings-form" className="grid grid-cols-1 gap-6 xl:grid-cols-2" onSubmit={handleSubmit}>
        <section className="rounded-xl border border-primary/10 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold">Platform Details</h3>
          <div className="mt-5 space-y-4">
            <label className="block text-sm font-semibold text-slate-600">
              Platform Name
              <input
                className="mt-2 w-full rounded-lg border-none bg-slate-50 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20"
                value={form.platformName}
                onChange={(event) => setField("platformName", event.target.value)}
              />
            </label>
            <label className="block text-sm font-semibold text-slate-600">
              Support Email
              <input
                className="mt-2 w-full rounded-lg border-none bg-slate-50 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20"
                type="email"
                value={form.supportEmail}
                onChange={(event) => setField("supportEmail", event.target.value)}
              />
            </label>
            <label className="block text-sm font-semibold text-slate-600">
              Commission Percentage
              <input
                className="mt-2 w-full rounded-lg border-none bg-slate-50 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={form.commissionPercentage}
                onChange={(event) => setField("commissionPercentage", event.target.value)}
              />
            </label>
          </div>
        </section>

        <section className="rounded-xl border border-primary/10 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold">Registration Controls</h3>
          <div className="mt-5 space-y-4">
            <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
              <div>
                <p className="font-semibold">Maintenance Mode</p>
                <p className="text-sm text-slate-500">Temporarily pause customer-facing activity.</p>
              </div>
              <Toggle checked={form.maintenanceMode} onChange={(value) => setField("maintenanceMode", value)} />
            </div>
            <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
              <div>
                <p className="font-semibold">Allow Restaurant Registration</p>
                <p className="text-sm text-slate-500">Let new restaurant owners create accounts.</p>
              </div>
              <Toggle checked={form.allowRestaurantRegistration} onChange={(value) => setField("allowRestaurantRegistration", value)} />
            </div>
            <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
              <div>
                <p className="font-semibold">Allow Customer Registration</p>
                <p className="text-sm text-slate-500">Let customers create new accounts.</p>
              </div>
              <Toggle checked={form.allowCustomerRegistration} onChange={(value) => setField("allowCustomerRegistration", value)} />
            </div>
          </div>
        </section>
      </form>
    </AdminShell>
  );
}

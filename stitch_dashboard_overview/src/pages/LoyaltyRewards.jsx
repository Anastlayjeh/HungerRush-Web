import { useEffect, useMemo, useState } from "react";
import RestaurantShell from "../components/RestaurantShell.jsx";
import { api } from "../lib/api.js";

const REWARD_TYPES = [
  ["discount", "Discount"],
  ["free_item", "Free Item"],
  ["free_delivery", "Free Delivery"],
];

const REWARD_STATUSES = [
  ["active", "Active"],
  ["archived", "Archived"],
];

const REWARD_FILTERS = [
  ["all", "All"],
  ["active", "Active"],
  ["archived", "Archived"],
];

const emptyForm = () => ({
  id: null,
  name: "",
  description: "",
  pointsRequired: "",
  rewardType: "discount",
  menuItemId: "",
  menuItemSearch: "",
  discountPercentage: "",
  status: "draft",
});

const fmt = (value) => new Intl.NumberFormat("en-US").format(Number(value || 0));

function statusClass(status) {
  if (status === "active") return "bg-emerald-100 text-emerald-700";
  if (status === "archived") return "bg-slate-200 text-slate-700";
  return "bg-amber-100 text-amber-700";
}

export default function LoyaltyRewards({ onNavigate, token, user, onLogout }) {
  const [overview, setOverview] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [rewardStatusFilter, setRewardStatusFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingRewardId, setDeletingRewardId] = useState(null);
  const [menuItemSearchOpen, setMenuItemSearchOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (!token) return undefined;
    let isCancelled = false;

    const loadMenuItems = async () => {
      try {
        const payload = await api.getMenuItems(token);
        if (!isCancelled) {
          setMenuItems(Array.isArray(payload) ? payload : []);
        }
      } catch {
        if (!isCancelled) {
          setMenuItems([]);
        }
      }
    };

    loadMenuItems();
    return () => {
      isCancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (!token) return undefined;
    let isCancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const payload = await api.getLoyaltyOverview(token, {
          search,
          status: rewardStatusFilter === "all" ? undefined : rewardStatusFilter,
        });
        if (!isCancelled) setOverview(payload || null);
      } catch (requestError) {
        if (!isCancelled) setError(requestError?.message || "Failed to load loyalty data.");
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };

    load();
    return () => {
      isCancelled = true;
    };
  }, [token, search, rewardStatusFilter]);

  const stats = overview?.stats || {};
  const rewards = overview?.rewards || [];
  const members = overview?.top_customers || [];
  const trend = overview?.weekly_trend || [];
  const trendMax = useMemo(() => Math.max(1, ...trend.map((row) => Number(row?.points || 0))), [trend]);
  const rewardNeedsMenuConfig = form.rewardType === "discount" || form.rewardType === "free_item";
  const selectedMenuItem = useMemo(
    () => menuItems.find((item) => String(item?.id) === String(form.menuItemId)) || null,
    [menuItems, form.menuItemId]
  );
  const previewDiscountPercentage = Number(form.discountPercentage || 0);
  const previewMenuPrice = Number(selectedMenuItem?.price || 0);
  const previewDiscountedPrice = Math.max(
    0,
    previewMenuPrice - (previewMenuPrice * previewDiscountPercentage) / 100
  );
  const filteredMenuItems = useMemo(() => {
    const searchTerm = String(form.menuItemSearch || "").trim().toLowerCase();
    if (!searchTerm) {
      return menuItems.slice(0, 12);
    }

    return menuItems
      .filter((item) => String(item?.name || "").toLowerCase().includes(searchTerm))
      .slice(0, 12);
  }, [menuItems, form.menuItemSearch]);

  const editReward = (reward) => {
    setForm({
      id: reward.id,
      name: reward.name || "",
      description: reward.description || "",
      pointsRequired: String(reward.points_required ?? ""),
      rewardType: reward.reward_type || "discount",
      menuItemId: reward.menu_item_id ? String(reward.menu_item_id) : "",
      menuItemSearch: reward.menu_item?.name || "",
      discountPercentage:
        reward.discount_percentage !== null && reward.discount_percentage !== undefined
          ? String(reward.discount_percentage)
          : "",
      status: reward.status || "draft",
    });
    setOpen(true);
  };

  const saveReward = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) return setError("Reward name is required.");
    if (form.pointsRequired === "" || Number(form.pointsRequired) < 0) {
      return setError("Points required must be zero or greater.");
    }
    if (rewardNeedsMenuConfig && !form.menuItemId) {
      return setError("Please select a menu item.");
    }
    if (rewardNeedsMenuConfig) {
      const discount = Number(form.discountPercentage);
      if (form.discountPercentage === "" || Number.isNaN(discount) || discount < 0 || discount > 100) {
        return setError("Discount percentage must be between 0 and 100.");
      }
    }

    setSaving(true);
    setError("");
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        points_required: Number(form.pointsRequired),
        reward_type: form.rewardType,
        status: form.status,
        menu_item_id: rewardNeedsMenuConfig ? Number(form.menuItemId) : null,
        discount_percentage: rewardNeedsMenuConfig ? Number(form.discountPercentage) : null,
      };

      if (form.id) {
        await api.updateLoyaltyReward(token, form.id, payload);
      } else {
        await api.createLoyaltyReward(token, payload);
      }

      setOpen(false);
      setForm(emptyForm());
      const refreshed = await api.getLoyaltyOverview(token, {
        search,
        status: rewardStatusFilter === "all" ? undefined : rewardStatusFilter,
      });
      setOverview(refreshed || null);
    } catch (requestError) {
      setError(requestError?.message || "Failed to save reward.");
    } finally {
      setSaving(false);
    }
  };

  const deleteReward = async (reward) => {
    const confirmed = window.confirm(`Delete reward "${reward.name}"?`);
    if (!confirmed) return;

    setDeletingRewardId(reward.id);
    setError("");
    try {
      await api.deleteLoyaltyReward(token, reward.id);
      const refreshed = await api.getLoyaltyOverview(token, {
        search,
        status: rewardStatusFilter === "all" ? undefined : rewardStatusFilter,
      });
      setOverview(refreshed || null);
    } catch (requestError) {
      setError(requestError?.message || "Failed to delete reward.");
    } finally {
      setDeletingRewardId(null);
    }
  };

  const handleMenuItemSearchChange = (value) => {
    const normalized = value.trim().toLowerCase();
    const exactMatch = menuItems.find(
      (item) => String(item?.name || "").trim().toLowerCase() === normalized
    );

    setForm((previous) => ({
      ...previous,
      menuItemSearch: value,
      menuItemId: exactMatch ? String(exactMatch.id) : "",
    }));
  };

  const selectMenuItem = (item) => {
    setForm((previous) => ({
      ...previous,
      menuItemId: String(item.id),
      menuItemSearch: item.name || "",
    }));
    setMenuItemSearchOpen(false);
  };

  return (
    <>
      <RestaurantShell
        activePage="loyalty"
        onNavigate={onNavigate}
        user={user}
        onLogout={onLogout}
        title="Loyalty & Rewards"
        headerActions={
          <>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                search
              </span>
              <input
                className="pl-10 pr-4 py-2 bg-slate-100 border-none rounded-lg text-sm w-64"
                placeholder="Search customers..."
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <button
              className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-primary/90"
              type="button"
              onClick={() => {
                setForm(emptyForm());
                setOpen(true);
              }}
            >
              Create Offer
            </button>
          </>
        }
      >
        {error ? (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">{error}</div>
        ) : null}

        <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl border border-primary/10"><p className="text-sm text-slate-500">Total Points Issued</p><h3 className="text-2xl font-black">{loading ? "..." : fmt(stats.total_points_issued)}</h3></div>
          <div className="bg-white p-6 rounded-xl border border-primary/10"><p className="text-sm text-slate-500">Points Redeemed</p><h3 className="text-2xl font-black">{loading ? "..." : fmt(stats.points_redeemed)}</h3></div>
          <div className="bg-white p-6 rounded-xl border border-primary/10"><p className="text-sm text-slate-500">Active Offers</p><h3 className="text-2xl font-black">{loading ? "..." : fmt(stats.active_offers)}</h3></div>
          <div className="bg-white p-6 rounded-xl border border-primary/10"><p className="text-sm text-slate-500">Redeemed Offers</p><h3 className="text-2xl font-black">{loading ? "..." : fmt(stats.redeemed_offers)}</h3></div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-xl font-bold">Offers</h3>
              <div className="flex flex-wrap gap-2">
                {REWARD_FILTERS.map(([value, label]) => (
                  <button
                    key={value}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                      rewardStatusFilter === value
                        ? "bg-primary text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                    type="button"
                    onClick={() => setRewardStatusFilter(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {rewards.length ? rewards.map((reward) => (
                <article key={reward.id} className="bg-white p-5 rounded-xl border border-primary/10">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold">{reward.name}</h4>
                    <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${statusClass(reward.status)}`}>{reward.status}</span>
                  </div>
                  <p className="text-sm text-slate-600 mt-2 min-h-[2.5rem]">{reward.description || "No description."}</p>
                  <div className="mt-3 text-xs text-slate-500">{reward.reward_type?.replaceAll("_", " ")} | {fmt(reward.points_required)} pts | {fmt(reward.usage_count)} uses</div>
                  {(reward.reward_type === "discount" || reward.reward_type === "free_item") && reward.menu_item ? (
                    <div className="mt-2 text-xs text-slate-500">
                      Item: {reward.menu_item.name} | Price: ${Number(reward.menu_item.price || 0).toFixed(2)} | Discount: {Number(reward.discount_percentage || 0).toFixed(2)}% | Final: ${Number(reward.discounted_price || 0).toFixed(2)}
                    </div>
                  ) : null}
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      className="px-3 py-1.5 rounded-lg bg-slate-100 text-xs font-semibold hover:bg-slate-200"
                      type="button"
                      onClick={() => editReward(reward)}
                    >
                      Edit
                    </button>
                    <button
                      className="px-3 py-1.5 rounded-lg bg-red-50 text-red-700 text-xs font-semibold hover:bg-red-100 disabled:opacity-60"
                      type="button"
                      onClick={() => deleteReward(reward)}
                      disabled={deletingRewardId === reward.id}
                    >
                      {deletingRewardId === reward.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </article>
              )) : <div className="col-span-full bg-white p-6 rounded-xl border border-primary/10 text-sm text-slate-500">{loading ? "Loading offers..." : "No offers found."}</div>}
            </div>
          </div>

          <div className="space-y-6">
            <section className="bg-white rounded-xl border border-primary/10 overflow-hidden">
              <header className="px-4 py-3 border-b border-primary/10"><h3 className="text-lg font-bold">Top Customers</h3></header>
              <div className="divide-y divide-primary/5">
                {members.length ? members.slice(0, 8).map((member) => (
                  <div key={member.id} className="px-4 py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate">{member.customer?.name || `Customer #${member.customer_id}`}</p>
                      <p className="text-xs text-slate-500">{member.orders_count} orders | {member.tier}</p>
                    </div>
                    <p className="text-sm font-black text-primary shrink-0">{fmt(member.points)} pts</p>
                  </div>
                )) : <p className="px-4 py-5 text-sm text-slate-500">{loading ? "Loading..." : "No members."}</p>}
              </div>
            </section>

            <section className="bg-primary/5 rounded-xl p-5 border border-primary/10">
              <h4 className="text-sm font-bold mb-4">Weekly Redemption Trend</h4>
              <div className="flex items-end gap-1 h-24">
                {(trend.length ? trend : [{}, {}, {}, {}, {}, {}, {}]).map((point, index) => (
                  <div
                    key={`${point.day || "d"}-${index}`}
                    className="w-full bg-primary/40 rounded-t-sm"
                    style={{ height: trend.length ? `${Math.max(8, Math.round((Number(point.points || 0) / trendMax) * 100))}%` : "20%" }}
                    title={trend.length ? `${point.label}: ${point.points} points` : "No data"}
                  ></div>
                ))}
              </div>
              <div className="flex justify-between mt-2 text-[10px] text-slate-400 font-bold uppercase">
                {(trend.length ? trend : [{ label: "Mon" }, { label: "Tue" }, { label: "Wed" }, { label: "Thu" }, { label: "Fri" }, { label: "Sat" }, { label: "Sun" }]).map((point, index) => (
                  <span key={`${point.label}-${index}`}>{String(point.label || "").slice(0, 1)}</span>
                ))}
              </div>
            </section>
          </div>
        </section>
      </RestaurantShell>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-visible">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-bold">{form.id ? "Edit Offer" : "Create Offer"}</h3>
              <button className="material-symbols-outlined text-slate-400 hover:text-slate-600" type="button" onClick={() => setOpen(false)}>close</button>
            </div>
            <form className="p-6 space-y-4 overflow-visible" onSubmit={saveReward}>
              <input className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-lg text-sm" placeholder="Offer title" type="text" value={form.name} onChange={(event) => setForm((previous) => ({ ...previous, name: event.target.value }))} required />
              <textarea className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-lg text-sm resize-none" placeholder="Description" rows="3" value={form.description} onChange={(event) => setForm((previous) => ({ ...previous, description: event.target.value }))}></textarea>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <input className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-lg text-sm" type="number" min="0" placeholder="Points" value={form.pointsRequired} onChange={(event) => setForm((previous) => ({ ...previous, pointsRequired: event.target.value }))} required />
                <select
                  className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-lg text-sm"
                  value={form.rewardType}
                  onChange={(event) => {
                    const nextType = event.target.value;
                    setForm((previous) => ({
                      ...previous,
                      rewardType: nextType,
                      menuItemId: nextType === "free_delivery" ? "" : previous.menuItemId,
                      menuItemSearch: nextType === "free_delivery" ? "" : previous.menuItemSearch,
                      discountPercentage: nextType === "free_delivery" ? "" : previous.discountPercentage,
                    }));
                  }}
                >
                  {REWARD_TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
                <select className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-lg text-sm" value={form.status} onChange={(event) => setForm((previous) => ({ ...previous, status: event.target.value }))}>{REWARD_STATUSES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
              </div>

              {rewardNeedsMenuConfig ? (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div className="relative z-[70]">
                    <input
                      className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-lg text-sm"
                      placeholder="Search menu item"
                      type="text"
                      value={form.menuItemSearch}
                      onFocus={() => setMenuItemSearchOpen(true)}
                      onBlur={() => {
                        setTimeout(() => setMenuItemSearchOpen(false), 120);
                      }}
                      onChange={(event) => handleMenuItemSearchChange(event.target.value)}
                    />
                    {menuItemSearchOpen ? (
                      <div className="absolute left-0 right-0 top-full z-[80] mt-1 max-h-44 w-full overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                        {filteredMenuItems.length ? filteredMenuItems.map((item) => (
                          <button
                            key={item.id}
                            className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                            type="button"
                            onMouseDown={() => selectMenuItem(item)}
                          >
                            {item.name} (${Number(item.price || 0).toFixed(2)})
                          </button>
                        )) : (
                          <p className="px-3 py-2 text-xs text-slate-500">No menu items found.</p>
                        )}
                      </div>
                    ) : null}
                    {form.menuItemId && selectedMenuItem ? (
                      <p className="mt-1 text-xs text-emerald-700">Selected: {selectedMenuItem.name}</p>
                    ) : null}
                  </div>
                  <input
                    className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-lg text-sm"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    placeholder="Discount %"
                    value={form.discountPercentage}
                    onChange={(event) => setForm((previous) => ({ ...previous, discountPercentage: event.target.value }))}
                    required
                  />
                  <div className="w-full px-4 py-2.5 bg-slate-50 rounded-lg text-sm text-slate-700">
                    Final Price: ${Number(previewDiscountedPrice || 0).toFixed(2)}
                  </div>
                </div>
              ) : null}
              <div className="pt-2 flex justify-end gap-2">
                <button className="px-4 py-2 text-sm font-semibold rounded-lg bg-slate-100 hover:bg-slate-200" type="button" onClick={() => setOpen(false)}>Cancel</button>
                <button className="px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-60" type="submit" disabled={saving}>{saving ? "Saving..." : form.id ? "Save Changes" : "Create Offer"}</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}


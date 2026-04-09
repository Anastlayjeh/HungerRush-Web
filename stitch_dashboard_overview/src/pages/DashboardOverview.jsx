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

function normalizeIngredientName(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ");
}

function titleCaseIngredient(value) {
  return String(value || "")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function parseMenuItemIngredients(value) {
  const rawList = Array.isArray(value)
    ? value
    : String(value || "")
        .split(/,|;|\n/)
        .map((entry) => entry.trim())
        .filter(Boolean);

  const seen = new Set();
  const parsed = [];
  for (const ingredient of rawList) {
    const normalized = normalizeIngredientName(ingredient);
    if (!normalized) continue;
    const key = normalized.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    parsed.push(titleCaseIngredient(normalized));
  }

  return parsed;
}

function isSameIngredient(left, right) {
  return normalizeIngredientName(left).toLowerCase() === normalizeIngredientName(right).toLowerCase();
}

function isIngredientSelected(list, ingredient) {
  return (list || []).some((entry) => isSameIngredient(entry, ingredient));
}

function toggleIngredientSelection(list, ingredient) {
  const normalized = titleCaseIngredient(normalizeIngredientName(ingredient));
  if (!normalized) return Array.isArray(list) ? list : [];

  if (isIngredientSelected(list, normalized)) {
    return (list || []).filter((entry) => !isSameIngredient(entry, normalized));
  }

  return [...(list || []), normalized];
}

function removeIngredientSelection(list, ingredient) {
  return (list || []).filter((entry) => !isSameIngredient(entry, ingredient));
}

function mergeIngredientOptions(...groups) {
  const merged = [];
  for (const group of groups) {
    for (const item of group || []) {
      const normalized = titleCaseIngredient(normalizeIngredientName(item));
      if (!normalized) continue;
      if (isIngredientSelected(merged, normalized)) continue;
      merged.push(normalized);
    }
  }
  return merged;
}

function buildQuickOrderItemNotes(row) {
  const lines = [];
  const description = String(row?.customDescription || "").trim();
  if (description) {
    lines.push(description);
  }

  (row?.addIngredients || []).forEach((ingredient) => {
    lines.push(`add ${String(ingredient).toLowerCase()}`);
  });

  (row?.removeIngredients || []).forEach((ingredient) => {
    lines.push(`remove ${String(ingredient).toLowerCase()}`);
  });

  const notes = lines.join(". ").trim();
  return notes || undefined;
}

function getQuickRowCustomizationSummary(row) {
  const description = String(row?.customDescription || "").trim();
  const add = Array.isArray(row?.addIngredients) ? row.addIngredients : [];
  const remove = Array.isArray(row?.removeIngredients) ? row.removeIngredients : [];

  const parts = [];
  if (description) parts.push(description);
  if (add.length) parts.push(`Add: ${add.join(", ")}`);
  if (remove.length) parts.push(`Remove: ${remove.join(", ")}`);

  return parts.join(" | ") || "No customization";
}

function createQuickOrderRow() {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    menuItemId: "",
    quantity: 1,
    customDescription: "",
    addIngredients: [],
    removeIngredients: [],
  };
}

export default function DashboardOverview({ onNavigate, token, user, onLogout }) {
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingRestaurantStatus, setUpdatingRestaurantStatus] = useState(false);
  const [isQuickOrderOpen, setIsQuickOrderOpen] = useState(false);
  const [quickOrderRows, setQuickOrderRows] = useState([createQuickOrderRow()]);
  const [quickOrderError, setQuickOrderError] = useState("");
  const [creatingQuickOrder, setCreatingQuickOrder] = useState(false);
  const [editingQuickRowId, setEditingQuickRowId] = useState(null);
  const [quickRowEditorDraft, setQuickRowEditorDraft] = useState({
    customDescription: "",
    addIngredients: [],
    removeIngredients: [],
  });

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
    const completedToday = todayOrders.filter((order) => String(order?.status || "") === "delivered");

    return {
      completedOrdersToday: completedToday.length,
      revenueToday: completedToday.reduce((sum, order) => sum + Number(order?.total || 0), 0),
      inProgressCount: orders.filter((order) => ACTIVE_ORDER_STATUSES.has(String(order?.status || ""))).length,
    };
  }, [orders]);

  const recentOrders = useMemo(() => orders.slice(0, 5), [orders]);
  const availableMenuItems = useMemo(
    () => menuItems.filter((item) => Boolean(item?.is_available)),
    [menuItems]
  );
  const quickRowBeingEdited = useMemo(
    () => quickOrderRows.find((row) => row.id === editingQuickRowId) || null,
    [quickOrderRows, editingQuickRowId]
  );
  const quickRowBeingEditedIndex = useMemo(
    () => quickOrderRows.findIndex((row) => row.id === editingQuickRowId),
    [quickOrderRows, editingQuickRowId]
  );
  const quickRowEditorMenuItem = useMemo(() => {
    if (!quickRowBeingEdited?.menuItemId) return null;
    return (
      availableMenuItems.find(
        (item) => String(item.id) === String(quickRowBeingEdited.menuItemId)
      ) || null
    );
  }, [availableMenuItems, quickRowBeingEdited]);
  const removableIngredientOptions = useMemo(
    () => parseMenuItemIngredients(quickRowEditorMenuItem?.ingredients),
    [quickRowEditorMenuItem]
  );
  const allMenuIngredientOptions = useMemo(() => {
    const collected = menuItems.flatMap((item) => parseMenuItemIngredients(item?.ingredients));
    return mergeIngredientOptions(collected);
  }, [menuItems]);
  const addableIngredientOptions = useMemo(
    () => mergeIngredientOptions(removableIngredientOptions, allMenuIngredientOptions),
    [removableIngredientOptions, allMenuIngredientOptions]
  );

  const openQuickOrder = () => {
    setQuickOrderRows([createQuickOrderRow()]);
    setQuickOrderError("");
    setEditingQuickRowId(null);
    setQuickRowEditorDraft({
      customDescription: "",
      addIngredients: [],
      removeIngredients: [],
    });
    setIsQuickOrderOpen(true);
  };

  const closeQuickOrder = () => {
    setIsQuickOrderOpen(false);
    setQuickOrderRows([createQuickOrderRow()]);
    setQuickOrderError("");
    setEditingQuickRowId(null);
    setQuickRowEditorDraft({
      customDescription: "",
      addIngredients: [],
      removeIngredients: [],
    });
  };

  const isRestaurantActive = String(profile?.status || "active") === "active";

  const handleToggleRestaurantStatus = async () => {
    if (!profile || updatingRestaurantStatus) {
      return;
    }

    const nextStatus = isRestaurantActive ? "inactive" : "active";
    setUpdatingRestaurantStatus(true);
    setError("");

    try {
      await api.updateRestaurantSettings(token, { status: nextStatus });
      setProfile((previous) => (previous ? { ...previous, status: nextStatus } : previous));
    } catch (requestError) {
      setError(requestError?.message || "Failed to update restaurant status.");
    } finally {
      setUpdatingRestaurantStatus(false);
    }
  };

  const handleQuickRowChange = (rowId, field, value) => {
    setQuickOrderRows((previous) =>
      previous.map((row) => {
        if (row.id !== rowId) return row;

        const next = { ...row, [field]: value };
        if (field === "menuItemId" && String(row.menuItemId) !== String(value)) {
          next.addIngredients = [];
          next.removeIngredients = [];
        }

        return next;
      })
    );
  };

  const handleAddQuickRow = () => {
    setQuickOrderRows((previous) => [...previous, createQuickOrderRow()]);
  };

  const handleRemoveQuickRow = (rowId) => {
    if (editingQuickRowId === rowId) {
      setEditingQuickRowId(null);
      setQuickRowEditorDraft({
        customDescription: "",
        addIngredients: [],
        removeIngredients: [],
      });
    }

    setQuickOrderRows((previous) => {
      const next = previous.filter((row) => row.id !== rowId);
      return next.length ? next : [createQuickOrderRow()];
    });
  };

  const handleOpenQuickRowEditor = (rowId) => {
    const targetRow = quickOrderRows.find((row) => row.id === rowId);
    if (!targetRow) return;

    setEditingQuickRowId(rowId);
    setQuickRowEditorDraft({
      customDescription: String(targetRow.customDescription || ""),
      addIngredients: Array.isArray(targetRow.addIngredients) ? targetRow.addIngredients : [],
      removeIngredients: Array.isArray(targetRow.removeIngredients) ? targetRow.removeIngredients : [],
    });
  };

  const handleCloseQuickRowEditor = () => {
    setEditingQuickRowId(null);
    setQuickRowEditorDraft({
      customDescription: "",
      addIngredients: [],
      removeIngredients: [],
    });
  };

  const handleToggleDraftIngredient = (field, ingredient) => {
    setQuickRowEditorDraft((previous) => {
      const oppositeField = field === "addIngredients" ? "removeIngredients" : "addIngredients";
      const nextFieldValue = toggleIngredientSelection(previous[field], ingredient);
      const nextOppositeFieldValue = removeIngredientSelection(previous[oppositeField], ingredient);

      return {
        ...previous,
        [field]: nextFieldValue,
        [oppositeField]: nextOppositeFieldValue,
      };
    });
  };

  const handleSaveQuickRowEditor = () => {
    if (!editingQuickRowId) return;

    setQuickOrderRows((previous) =>
      previous.map((row) =>
        row.id === editingQuickRowId
          ? {
              ...row,
              customDescription: quickRowEditorDraft.customDescription.trim(),
              addIngredients: quickRowEditorDraft.addIngredients,
              removeIngredients: quickRowEditorDraft.removeIngredients,
            }
          : row
      )
    );
    handleCloseQuickRowEditor();
  };

  const handleCreateQuickOrder = async (event) => {
    event.preventDefault();
    setQuickOrderError("");

    const items = quickOrderRows
      .map((row) => ({
        menu_item_id: Number(row.menuItemId),
        quantity: Number(row.quantity),
        notes: buildQuickOrderItemNotes(row),
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
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100">
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Restaurant</span>
              <button
                className={
                  isRestaurantActive
                    ? "w-11 h-6 rounded-full bg-emerald-500 relative disabled:opacity-60"
                    : "w-11 h-6 rounded-full bg-slate-300 relative disabled:opacity-60"
                }
                type="button"
                onClick={handleToggleRestaurantStatus}
                disabled={updatingRestaurantStatus}
                title={isRestaurantActive ? "Set restaurant inactive" : "Set restaurant active"}
              >
                <span
                  className={
                    isRestaurantActive
                      ? "absolute top-0.5 left-5 w-5 h-5 rounded-full bg-white transition-all"
                      : "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-all"
                  }
                ></span>
              </button>
              <span className="text-xs font-bold text-slate-700">
                {updatingRestaurantStatus ? "Saving..." : isRestaurantActive ? "Active" : "Inactive"}
              </span>
            </div>
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
            <p className="text-slate-500 text-sm font-medium">Completed Orders Today</p>
            <h3 className="text-3xl font-bold mt-1">{loading ? "..." : dashboardStats.completedOrdersToday}</h3>
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
                <div key={row.id} className="grid grid-cols-1 md:grid-cols-[2fr_100px_1.6fr_110px] gap-3 items-start">
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
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Customization</label>
                    <div className="min-h-10 px-3 py-2.5 rounded-lg bg-slate-50 text-xs text-slate-600 leading-relaxed">
                      {getQuickRowCustomizationSummary(row)}
                    </div>
                  </div>
                  <div className="mt-6 flex items-center gap-2">
                    <button
                      className="size-10 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"
                      type="button"
                      onClick={() => handleOpenQuickRowEditor(row.id)}
                      title="Edit item"
                    >
                      <span className="material-symbols-outlined text-base">edit</span>
                    </button>
                    <button
                      className="size-10 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50"
                      type="button"
                      onClick={() => handleRemoveQuickRow(row.id)}
                      disabled={quickOrderRows.length === 1}
                      title="Remove row"
                    >
                      <span className="material-symbols-outlined text-base">remove</span>
                    </button>
                  </div>
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

          {editingQuickRowId ? (
            <div
              className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50"
              onClick={handleCloseQuickRowEditor}
            >
              <div
                className="w-full max-w-2xl max-h-[90vh] rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden flex flex-col"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h4 className="text-lg font-bold">
                      Edit Item #{quickRowBeingEditedIndex >= 0 ? quickRowBeingEditedIndex + 1 : "-"}
                    </h4>
                    <p className="text-xs text-slate-500">
                      {quickRowEditorMenuItem
                        ? quickRowEditorMenuItem.name
                        : "Select a menu item first to customize ingredients."}
                    </p>
                  </div>
                  <button
                    className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
                    type="button"
                    onClick={handleCloseQuickRowEditor}
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                <div className="px-5 py-4 space-y-5 overflow-y-auto">
                  <section>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                      Description
                    </label>
                    <textarea
                      className="w-full min-h-24 px-4 py-3 bg-slate-50 border-none rounded-lg text-sm resize-y"
                      placeholder="Example: Make it spicy, toast the bun, no mayo..."
                      value={quickRowEditorDraft.customDescription}
                      onChange={(event) =>
                        setQuickRowEditorDraft((previous) => ({
                          ...previous,
                          customDescription: event.target.value,
                        }))
                      }
                    />
                  </section>

                  <section>
                    <p className="text-xs font-bold text-slate-500 uppercase mb-2">Remove Ingredients</p>
                    {quickRowEditorMenuItem && removableIngredientOptions.length ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {removableIngredientOptions.map((ingredient) => {
                          const removeInputId = `remove-${editingQuickRowId}-${ingredient
                            .toLowerCase()
                            .replace(/\s+/g, "-")}`;
                          return (
                            <label
                              key={removeInputId}
                              htmlFor={removeInputId}
                              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm cursor-pointer hover:bg-slate-50"
                            >
                              <input
                                id={removeInputId}
                                type="checkbox"
                                checked={isIngredientSelected(
                                  quickRowEditorDraft.removeIngredients,
                                  ingredient
                                )}
                                onChange={() =>
                                  handleToggleDraftIngredient("removeIngredients", ingredient)
                                }
                              />
                              <span>{ingredient}</span>
                            </label>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">
                        {quickRowEditorMenuItem
                          ? "No ingredient list is available for this menu item."
                          : "Select a menu item in the row before editing ingredients."}
                      </p>
                    )}
                  </section>

                  <section>
                    <p className="text-xs font-bold text-slate-500 uppercase mb-2">Add Ingredients</p>
                    {quickRowEditorMenuItem ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {addableIngredientOptions.map((ingredient) => {
                          const addInputId = `add-${editingQuickRowId}-${ingredient
                            .toLowerCase()
                            .replace(/\s+/g, "-")}`;
                          return (
                            <label
                              key={addInputId}
                              htmlFor={addInputId}
                              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm cursor-pointer hover:bg-slate-50"
                            >
                              <input
                                id={addInputId}
                                type="checkbox"
                                checked={isIngredientSelected(
                                  quickRowEditorDraft.addIngredients,
                                  ingredient
                                )}
                                onChange={() =>
                                  handleToggleDraftIngredient("addIngredients", ingredient)
                                }
                              />
                              <span>{ingredient}</span>
                            </label>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">
                        Select a menu item in the row before editing ingredients.
                      </p>
                    )}
                  </section>
                </div>

                <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100"
                    type="button"
                    onClick={handleCloseQuickRowEditor}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-5 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800"
                    type="button"
                    onClick={handleSaveQuickRowEditor}
                  >
                    Save Item
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  );
}


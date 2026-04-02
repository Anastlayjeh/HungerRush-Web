import { useEffect, useMemo, useState } from "react";
import { bg } from "../utils/bg.js";
import { api } from "../lib/api.js";

const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80",
];

function toMoney(value) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(amount);
}

function statusBadgeClasses(isAvailable) {
  return isAvailable
    ? "bg-green-100 dark:bg-green-900/30 text-green-600"
    : "bg-red-100 dark:bg-red-900/30 text-red-600";
}

function MenuCard({ item, categoryName, onDelete, onToggleAvailability, isUpdating }) {
  const isAvailable = Boolean(item?.is_available);
  const imageUrl = FALLBACK_IMAGES[Number(item?.id || 0) % FALLBACK_IMAGES.length];

  return (
    <div
      className={`bg-white dark:bg-slate-800 rounded-xl border border-primary/5 overflow-hidden shadow-sm hover:shadow-xl transition-all group${
        !isAvailable ? " opacity-80" : ""
      }`}
    >
      <div className={`relative h-48 overflow-hidden${!isAvailable ? " grayscale" : ""}`}>
        <div
          className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-500"
          data-alt={item?.name || "Menu item"}
          style={bg(imageUrl)}
        ></div>
        {!isAvailable ? (
          <div className="absolute inset-0 bg-background-dark/40 flex items-center justify-center">
            <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">
              OUT OF STOCK
            </span>
          </div>
        ) : null}
        <div className="absolute top-3 right-3 flex gap-2">
          <button
            className="w-8 h-8 rounded-full bg-white/90 backdrop-blur shadow text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors"
            type="button"
            onClick={() => onDelete?.(item)}
            title="Delete item"
          >
            <span className="material-symbols-outlined text-lg">delete</span>
          </button>
        </div>
      </div>
      <div className="p-5">
        <div className="flex justify-between items-start mb-2 gap-3">
          <h3 className="font-bold text-lg leading-tight">{item?.name || "Untitled Item"}</h3>
          <span className="text-primary font-bold whitespace-nowrap">{toMoney(item?.price)}</span>
        </div>
        <p className="text-slate-500 text-xs mb-2 line-clamp-2 italic">
          {item?.description || "No description provided."}
        </p>
        <p className="text-[11px] text-slate-400 mb-4 uppercase tracking-wider">
          {categoryName || "Uncategorized"}
        </p>
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Status</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusBadgeClasses(isAvailable)}`}>
              {isAvailable ? "AVAILABLE" : "UNAVAILABLE"}
            </span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              className="sr-only peer"
              type="checkbox"
              checked={isAvailable}
              onChange={(event) => onToggleAvailability?.(item, event.target.checked)}
              disabled={isUpdating}
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>
      </div>
    </div>
  );
}

function createInitialFormState() {
  return {
    name: "",
    price: "",
    description: "",
    categoryId: "",
    newCategoryName: "",
    prepTime: "",
    isAvailable: true,
  };
}

export default function MenuManagementModal({ onNavigate, token, user, onLogout }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingItemId, setUpdatingItemId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState(createInitialFormState);

  const categoriesById = useMemo(() => {
    return Object.fromEntries(categories.map((category) => [String(category.id), category]));
  }, [categories]);

  useEffect(() => {
    if (!token) {
      return undefined;
    }

    let isCancelled = false;

    const loadMenuData = async () => {
      setLoading(true);
      setError("");

      try {
        const [fetchedCategories, fetchedItems] = await Promise.all([
          api.getMenuCategories(token),
          api.getMenuItems(token),
        ]);

        if (isCancelled) {
          return;
        }

        setCategories(Array.isArray(fetchedCategories) ? fetchedCategories : []);
        setMenuItems(Array.isArray(fetchedItems) ? fetchedItems : []);
      } catch (requestError) {
        if (isCancelled) {
          return;
        }
        setError(requestError?.message || "Unable to load menu data.");
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    loadMenuData();

    return () => {
      isCancelled = true;
    };
  }, [token]);

  const filteredItems = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return menuItems.filter((item) => {
      const itemCategoryId = String(item?.category_id || "");
      const matchesCategory =
        activeCategoryFilter === "all" || itemCategoryId === activeCategoryFilter;
      const matchesSearch =
        !normalizedSearch ||
        String(item?.name || "").toLowerCase().includes(normalizedSearch) ||
        String(item?.description || "").toLowerCase().includes(normalizedSearch);

      return matchesCategory && matchesSearch;
    });
  }, [menuItems, activeCategoryFilter, searchTerm]);

  const handleNav = (page) => (event) => {
    event.preventDefault();
    onNavigate?.(page);
  };

  const handleDelete = async (item) => {
    if (!item?.id) {
      return;
    }

    const confirmed = window.confirm(`Delete "${item.name}" from menu?`);
    if (!confirmed) {
      return;
    }

    setError("");
    setUpdatingItemId(item.id);

    try {
      await api.deleteMenuItem(token, item.id);
      setMenuItems((previous) => previous.filter((current) => current.id !== item.id));
    } catch (requestError) {
      setError(requestError?.message || "Failed to delete menu item.");
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleToggleAvailability = async (item, nextValue) => {
    if (!item?.id) {
      return;
    }

    setError("");
    setUpdatingItemId(item.id);

    try {
      const updatedItem = await api.updateMenuItemAvailability(token, item.id, nextValue);
      setMenuItems((previous) =>
        previous.map((current) => (current.id === item.id ? updatedItem : current))
      );
    } catch (requestError) {
      setError(requestError?.message || "Failed to update availability.");
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleCreateItem = async (event) => {
    event.preventDefault();
    setError("");
    setIsSaving(true);

    try {
      let categoryId = form.categoryId ? Number(form.categoryId) : null;

      if (!categoryId && form.newCategoryName.trim()) {
        const category = await api.createMenuCategory(token, {
          name: form.newCategoryName.trim(),
        });
        categoryId = Number(category?.id || 0);
        if (category?.id) {
          setCategories((previous) => [...previous, category]);
        }
      }

      if (!categoryId) {
        throw new Error("Select a category or create a new category.");
      }

      const newItem = await api.createMenuItem(token, {
        category_id: categoryId,
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        price: Number(form.price),
        is_available: form.isAvailable,
        prep_time: form.prepTime ? Number(form.prepTime) : undefined,
      });

      setMenuItems((previous) => [newItem, ...previous]);
      setForm(createInitialFormState());
      setIsModalOpen(false);
    } catch (requestError) {
      setError(requestError?.message || "Failed to create menu item.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100">
      <div className="flex min-h-screen">
        <aside className="w-64 border-r border-primary/10 bg-white dark:bg-background-dark/50 flex flex-col fixed h-full">
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
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-primary/10 hover:text-primary transition-colors"
              href="#"
              onClick={handleNav("orders")}
            >
              <span className="material-symbols-outlined">receipt_long</span>
              <span className="text-sm font-medium">Orders</span>
            </a>
            <a
              className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary text-white"
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
        <main className="ml-64 flex-1 flex flex-col">
          <header className="h-20 flex items-center justify-between px-8 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md sticky top-0 z-10 border-b border-primary/5">
            <div className="flex items-center gap-8">
              <h2 className="text-xl font-bold tracking-tight">Menu Management</h2>
              <div className="relative w-64">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                  search
                </span>
                <input
                  className="w-full pl-10 pr-4 py-2 bg-primary/5 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:bg-white dark:focus:bg-background-dark transition-all placeholder:text-slate-400"
                  placeholder="Search menu items..."
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-lg font-bold text-sm shadow-md hover:shadow-lg hover:bg-primary/90 transition-all"
                type="button"
                onClick={() => setIsModalOpen(true)}
              >
                <span className="material-symbols-outlined text-lg">add</span>
                <span>Add New Item</span>
              </button>
            </div>
          </header>
          <div className="px-8 py-6">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <button
                className={
                  activeCategoryFilter === "all"
                    ? "px-6 py-2 rounded-full bg-primary text-white text-sm font-medium whitespace-nowrap"
                    : "px-6 py-2 rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-primary/10 text-sm font-medium whitespace-nowrap hover:border-primary/40 transition-colors"
                }
                type="button"
                onClick={() => setActiveCategoryFilter("all")}
              >
                All Items
              </button>
              {categories.map((category) => {
                const key = String(category.id);
                const isActive = activeCategoryFilter === key;

                return (
                  <button
                    key={category.id}
                    className={
                      isActive
                        ? "px-6 py-2 rounded-full bg-primary text-white text-sm font-medium whitespace-nowrap"
                        : "px-6 py-2 rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-primary/10 text-sm font-medium whitespace-nowrap hover:border-primary/40 transition-colors"
                    }
                    type="button"
                    onClick={() => setActiveCategoryFilter(key)}
                  >
                    {category.name}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="px-8 pb-12">
            {error ? (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300 px-4 py-3 text-sm">
                {error}
              </div>
            ) : null}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredItems.map((item) => (
                <MenuCard
                  key={item.id}
                  item={item}
                  categoryName={categoriesById[String(item?.category_id)]?.name || ""}
                  onDelete={handleDelete}
                  onToggleAvailability={handleToggleAvailability}
                  isUpdating={updatingItemId === item.id}
                />
              ))}
            </div>
            {!filteredItems.length ? (
              <div className="mt-8 text-sm text-slate-500">
                {loading ? "Loading menu..." : "No menu items match your filter."}
              </div>
            ) : null}
          </div>
          <button
            className="fixed bottom-8 right-8 lg:hidden bg-primary text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center text-2xl z-20"
            type="button"
            onClick={() => setIsModalOpen(true)}
          >
            <span className="material-symbols-outlined">add</span>
          </button>
        </main>
      </div>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm relative">
          <button
            className="absolute inset-0"
            type="button"
            aria-label="Close modal"
            onClick={() => setIsModalOpen(false)}
          ></button>
          <div className="relative bg-white dark:bg-slate-900 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold">Add New Menu Item</h3>
                <p className="text-slate-500 text-sm">This will create a real API record.</p>
              </div>
              <button
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                type="button"
                onClick={() => setIsModalOpen(false)}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form className="flex-1 overflow-y-auto p-6 space-y-6" onSubmit={handleCreateItem}>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">
                    Item Name
                  </label>
                  <input
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-lg focus:ring-2 focus:ring-primary/20 text-sm placeholder:text-slate-400"
                    placeholder="e.g. Classic Burger"
                    type="text"
                    value={form.name}
                    onChange={(event) => setForm((previous) => ({ ...previous, name: event.target.value }))}
                    required
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">
                    Price ($)
                  </label>
                  <input
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-lg focus:ring-2 focus:ring-primary/20 text-sm placeholder:text-slate-400"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    type="number"
                    value={form.price}
                    onChange={(event) => setForm((previous) => ({ ...previous, price: event.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">
                    Category
                  </label>
                  <select
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-lg focus:ring-2 focus:ring-primary/20 text-sm appearance-none cursor-pointer"
                    value={form.categoryId}
                    onChange={(event) =>
                      setForm((previous) => ({ ...previous, categoryId: event.target.value }))
                    }
                  >
                    <option value="">Select Category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">
                    Prep Time (mins)
                  </label>
                  <input
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-lg focus:ring-2 focus:ring-primary/20 text-sm placeholder:text-slate-400"
                    placeholder="Optional"
                    type="number"
                    min="1"
                    value={form.prepTime}
                    onChange={(event) =>
                      setForm((previous) => ({ ...previous, prepTime: event.target.value }))
                    }
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">
                  New Category (Optional)
                </label>
                <input
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-lg focus:ring-2 focus:ring-primary/20 text-sm placeholder:text-slate-400"
                  placeholder="If no category exists, type one here"
                  type="text"
                  value={form.newCategoryName}
                  onChange={(event) =>
                    setForm((previous) => ({ ...previous, newCategoryName: event.target.value }))
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">
                  Description
                </label>
                <textarea
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-lg focus:ring-2 focus:ring-primary/20 text-sm placeholder:text-slate-400 resize-none"
                  placeholder="Describe the item"
                  rows="3"
                  value={form.description}
                  onChange={(event) =>
                    setForm((previous) => ({ ...previous, description: event.target.value }))
                  }
                ></textarea>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <div className="flex flex-col">
                  <span className="text-sm font-bold">Instantly Available</span>
                  <span className="text-xs text-slate-500">
                    Show this item on the menu right away
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    className="sr-only peer"
                    type="checkbox"
                    checked={form.isAvailable}
                    onChange={(event) =>
                      setForm((previous) => ({ ...previous, isAvailable: event.target.checked }))
                    }
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  className="px-5 py-2.5 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-200/50 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-8 py-2.5 bg-primary text-white rounded-lg text-sm font-bold shadow-md hover:shadow-lg hover:bg-primary/90 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  type="submit"
                  disabled={isSaving}
                >
                  {isSaving ? "Creating..." : "Create Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

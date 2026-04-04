import { useEffect, useMemo, useState } from "react";
import RestaurantShell from "../components/RestaurantShell.jsx";
import { api } from "../lib/api.js";

function toMoney(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
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

function normalizeImageUrls(imageUrls) {
  if (!Array.isArray(imageUrls)) {
    return [];
  }

  return imageUrls
    .map((value) => String(value || "").trim())
    .filter(Boolean);
}

function MenuCard({ item, categoryName, isUpdating, onDelete, onToggleAvailability }) {
  const isAvailable = Boolean(item?.is_available);
  const imageUrls = normalizeImageUrls(item?.image_urls);
  const previewImage =
    imageUrls[0] ||
    "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80";

  return (
    <div className={`bg-white rounded-xl border border-primary/10 shadow-sm ${!isAvailable ? "opacity-75" : ""}`}>
      <div className="h-44 w-full bg-slate-100 overflow-hidden rounded-t-xl relative">
        <img alt={item?.name || "Menu item"} className="h-full w-full object-cover" src={previewImage} />
        {imageUrls.length > 1 ? (
          <span className="absolute top-2 right-2 px-2 py-1 rounded-full bg-black/60 text-white text-[10px] font-bold">
            +{imageUrls.length - 1}
          </span>
        ) : null}
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="font-bold text-lg">{item?.name || "Untitled Item"}</h3>
          <span className="text-primary font-bold">{toMoney(item?.price)}</span>
        </div>
        <p className="text-sm text-slate-600 mb-2">{item?.description || "No description provided."}</p>
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">{categoryName || "Uncategorized"}</p>
        <p className="text-[11px] text-slate-400 mb-4">
          {imageUrls.length ? `${imageUrls.length} photo${imageUrls.length > 1 ? "s" : ""}` : "No photos"}
        </p>

        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
          <span
            className={
              isAvailable
                ? "px-2 py-1 rounded-full text-[10px] font-bold bg-green-100 text-green-700"
                : "px-2 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-700"
            }
          >
            {isAvailable ? "AVAILABLE" : "UNAVAILABLE"}
          </span>

          <div className="flex items-center gap-2">
            <button
              className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 disabled:opacity-60"
              type="button"
              onClick={() => onToggleAvailability?.(item, !isAvailable)}
              disabled={isUpdating}
            >
              {isUpdating ? "Updating..." : isAvailable ? "Mark Unavailable" : "Mark Available"}
            </button>
            <button
              className="px-3 py-1.5 rounded-lg bg-red-50 text-red-700 text-xs font-semibold hover:bg-red-100"
              type="button"
              onClick={() => onDelete?.(item)}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
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
  const [photoFiles, setPhotoFiles] = useState([]);
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState([]);

  const categoriesById = useMemo(
    () => Object.fromEntries(categories.map((category) => [String(category.id), category])),
    [categories]
  );

  useEffect(() => {
    const urls = photoFiles.map((file) => URL.createObjectURL(file));
    setPhotoPreviewUrls(urls);

    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [photoFiles]);

  const closeModal = () => {
    setIsModalOpen(false);
    setForm(createInitialFormState());
    setPhotoFiles([]);
  };

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

        if (!isCancelled) {
          setCategories(Array.isArray(fetchedCategories) ? fetchedCategories : []);
          setMenuItems(Array.isArray(fetchedItems) ? fetchedItems : []);
        }
      } catch (requestError) {
        if (!isCancelled) {
          setError(requestError?.message || "Unable to load menu data.");
        }
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
      const matchesCategory = activeCategoryFilter === "all" || itemCategoryId === activeCategoryFilter;
      const matchesSearch =
        !normalizedSearch ||
        String(item?.name || "").toLowerCase().includes(normalizedSearch) ||
        String(item?.description || "").toLowerCase().includes(normalizedSearch);

      return matchesCategory && matchesSearch;
    });
  }, [menuItems, activeCategoryFilter, searchTerm]);

  const handleDelete = async (item) => {
    if (!item?.id) {
      return;
    }

    if (!window.confirm(`Delete "${item.name}" from menu?`)) {
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
    setIsSaving(true);
    setError("");

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
        throw new Error("Select a category or create a new one.");
      }

      let imageUrls = [];
      if (photoFiles.length) {
        const uploadResponse = await api.uploadMenuImages(token, photoFiles);
        imageUrls = Array.isArray(uploadResponse?.urls) ? uploadResponse.urls : [];
      }

      const newItem = await api.createMenuItem(token, {
        category_id: categoryId,
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        image_urls: imageUrls.length ? imageUrls : undefined,
        price: Number(form.price),
        is_available: form.isAvailable,
        prep_time: form.prepTime ? Number(form.prepTime) : undefined,
      });

      setMenuItems((previous) => [newItem, ...previous]);
      closeModal();
    } catch (requestError) {
      setError(requestError?.message || "Failed to create menu item.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <RestaurantShell
        activePage="menu"
        onNavigate={onNavigate}
        user={user}
        onLogout={onLogout}
        title="Menu Management"
        headerActions={
          <>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                search
              </span>
              <input
                className="w-64 pl-10 pr-4 py-2 bg-primary/5 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/20"
                placeholder="Search menu items..."
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
            <button
              className="bg-primary text-white px-5 py-2 rounded-lg font-semibold text-sm hover:bg-primary/90"
              type="button"
              onClick={() => {
                setForm(createInitialFormState());
                setPhotoFiles([]);
                setIsModalOpen(true);
              }}
            >
              Add New Item
            </button>
          </>
        }
      >
        {error ? (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">
            {error}
          </div>
        ) : null}

        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6">
          <button
            className={
              activeCategoryFilter === "all"
                ? "px-4 py-2 rounded-full bg-primary text-white text-sm font-semibold"
                : "px-4 py-2 rounded-full bg-white border border-primary/10 text-sm font-medium hover:bg-primary/5"
            }
            type="button"
            onClick={() => setActiveCategoryFilter("all")}
          >
            All Items
          </button>
          {categories.map((category) => {
            const key = String(category.id);
            return (
              <button
                key={category.id}
                className={
                  activeCategoryFilter === key
                    ? "px-4 py-2 rounded-full bg-primary text-white text-sm font-semibold"
                    : "px-4 py-2 rounded-full bg-white border border-primary/10 text-sm font-medium hover:bg-primary/5"
                }
                type="button"
                onClick={() => setActiveCategoryFilter(key)}
              >
                {category.name}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <MenuCard
              key={item.id}
              item={item}
              categoryName={categoriesById[String(item?.category_id)]?.name || ""}
              isUpdating={updatingItemId === item.id}
              onDelete={handleDelete}
              onToggleAvailability={handleToggleAvailability}
            />
          ))}
        </div>

        {!filteredItems.length ? (
          <div className="mt-8 text-sm text-slate-500">{loading ? "Loading menu..." : "No items found."}</div>
        ) : null}
      </RestaurantShell>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold">Add New Menu Item</h3>
                <p className="text-slate-500 text-sm">This will create a real API record.</p>
              </div>
              <button
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
                type="button"
                onClick={closeModal}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form className="p-6 space-y-4" onSubmit={handleCreateItem}>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Item Name</label>
                  <input
                    className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-lg focus:ring-2 focus:ring-primary/20 text-sm"
                    placeholder="e.g. Classic Burger"
                    type="text"
                    value={form.name}
                    onChange={(event) => setForm((previous) => ({ ...previous, name: event.target.value }))}
                    required
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Price ($)</label>
                  <input
                    className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-lg focus:ring-2 focus:ring-primary/20 text-sm"
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
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Category</label>
                  <select
                    className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-lg focus:ring-2 focus:ring-primary/20 text-sm"
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
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Prep Time (mins)</label>
                  <input
                    className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-lg focus:ring-2 focus:ring-primary/20 text-sm"
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
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  New Category (Optional)
                </label>
                <input
                  className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-lg focus:ring-2 focus:ring-primary/20 text-sm"
                  placeholder="Type a new category name"
                  type="text"
                  value={form.newCategoryName}
                  onChange={(event) =>
                    setForm((previous) => ({ ...previous, newCategoryName: event.target.value }))
                  }
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description</label>
                <textarea
                  className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-lg focus:ring-2 focus:ring-primary/20 text-sm resize-none"
                  placeholder="Describe the item"
                  rows="3"
                  value={form.description}
                  onChange={(event) =>
                    setForm((previous) => ({ ...previous, description: event.target.value }))
                  }
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  Food Photo(s)
                </label>
                <input
                  className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-lg focus:ring-2 focus:ring-primary/20 text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-primary file:text-white file:text-xs file:font-semibold hover:file:bg-primary/90"
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  multiple
                  onChange={(event) => {
                    setPhotoFiles(Array.from(event.target.files || []));
                  }}
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  Select one or many images from your computer.
                </p>
                {photoPreviewUrls.length ? (
                  <div className="mt-3 grid grid-cols-4 gap-2">
                    {photoPreviewUrls.map((previewUrl, index) => (
                      <img
                        key={previewUrl}
                        alt={`Preview ${index + 1}`}
                        className="h-16 w-full object-cover rounded-md border border-slate-200"
                        src={previewUrl}
                      />
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50">
                <div>
                  <span className="text-sm font-bold">Available now</span>
                  <p className="text-xs text-slate-500">Show this item to customers immediately.</p>
                </div>
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    className="sr-only"
                    type="checkbox"
                    checked={form.isAvailable}
                    onChange={(event) =>
                      setForm((previous) => ({ ...previous, isAvailable: event.target.checked }))
                    }
                  />
                  <span
                    className={
                      form.isAvailable
                        ? "px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700"
                        : "px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700"
                    }
                  >
                    {form.isAvailable ? "YES" : "NO"}
                  </span>
                </label>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  className="px-5 py-2.5 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-100"
                  type="button"
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button
                  className="px-8 py-2.5 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed"
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
    </>
  );
}

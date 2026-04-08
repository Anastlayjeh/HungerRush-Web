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
    ingredients: "",
    categoryId: "",
    newCategoryName: "",
    prepTime: "",
    isAvailable: true,
  };
}

function suggestIngredients(itemName, categoryName = "") {
  const haystack = `${String(itemName || "")} ${String(categoryName || "")}`.toLowerCase().trim();

  const rules = [
    { keywords: ["beef burger", "burger"], ingredients: "Beef patty, lettuce, tomato, onions, pickles, burger bun, cheese, house sauce" },
    { keywords: ["chicken burger", "crispy chicken"], ingredients: "Chicken fillet, lettuce, pickles, burger bun, mayo, cheddar cheese" },
    { keywords: ["pizza", "margherita"], ingredients: "Pizza dough, mozzarella cheese, tomato sauce, basil, olive oil" },
    { keywords: ["pasta", "spaghetti"], ingredients: "Pasta, garlic, olive oil, parmesan cheese, black pepper, parsley" },
    { keywords: ["shawarma"], ingredients: "Marinated meat, garlic sauce, pickles, fries, bread wrap" },
    { keywords: ["falafel"], ingredients: "Chickpeas, parsley, garlic, onion, cumin, coriander, pita bread" },
    { keywords: ["salad", "caesar"], ingredients: "Lettuce, cucumber, tomato, olive oil, lemon juice, salt, pepper" },
    { keywords: ["sandwich"], ingredients: "Fresh bread, lettuce, tomato, cheese, house dressing" },
    { keywords: ["fries", "potato"], ingredients: "Potatoes, salt, black pepper, frying oil" },
    { keywords: ["cola", "soft drink", "soda"], ingredients: "Carbonated water, sweetener, flavoring, natural color" },
    { keywords: ["juice"], ingredients: "Fresh fruit blend, cold water, ice" },
    { keywords: ["coffee"], ingredients: "Coffee beans, hot water, sugar" },
    { keywords: ["cake", "dessert"], ingredients: "Flour, sugar, eggs, butter, milk, vanilla" },
    { keywords: ["ice cream"], ingredients: "Milk, cream, sugar, vanilla" },
  ];

  for (const rule of rules) {
    if (rule.keywords.some((keyword) => haystack.includes(keyword))) {
      return rule.ingredients;
    }
  }

  return "Salt, pepper, olive oil, and chef special seasoning";
}

function createItemDetailsState(item = null, categoryName = "") {
  return {
    id: item?.id || null,
    categoryId: item?.category_id !== undefined && item?.category_id !== null ? String(item.category_id) : "",
    name: item?.name || "",
    description: item?.description || "",
    ingredients: item?.ingredients || suggestIngredients(item?.name, categoryName),
    price: item?.price !== undefined && item?.price !== null ? String(item.price) : "",
    prepTime: item?.prep_time !== undefined && item?.prep_time !== null ? String(item.prep_time) : "",
    isAvailable: Boolean(item?.is_available),
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

function MenuCard({ item, categoryName, isUpdating, onDelete, onOpenDetails, onToggleAvailability }) {
  const isAvailable = Boolean(item?.is_available);
  const imageUrls = normalizeImageUrls(item?.image_urls);
  const displayIngredients = item?.ingredients || suggestIngredients(item?.name, categoryName);
  const previewImage =
    imageUrls[0] ||
    "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80";

  return (
    <div
      className={`bg-white rounded-xl border border-primary/10 shadow-sm transition hover:shadow-md cursor-pointer ${!isAvailable ? "opacity-75" : ""}`}
      role="button"
      tabIndex={0}
      onClick={() => onOpenDetails?.(item)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpenDetails?.(item);
        }
      }}
    >
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
        <p className="text-xs text-slate-500 mb-2 line-clamp-2">
          <span className="font-semibold text-slate-600">Ingredients:</span>{" "}
          {displayIngredients}
        </p>
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
              onClick={(event) => {
                event.stopPropagation();
                onToggleAvailability?.(item, !isAvailable);
              }}
              disabled={isUpdating}
            >
              {isUpdating ? "Updating..." : isAvailable ? "Mark Unavailable" : "Mark Available"}
            </button>
            <button
              className="px-3 py-1.5 rounded-lg bg-red-50 text-red-700 text-xs font-semibold hover:bg-red-100"
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onDelete?.(item);
              }}
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
  const [isItemDetailsOpen, setIsItemDetailsOpen] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingItemId, setUpdatingItemId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [form, setForm] = useState(createInitialFormState);
  const [itemDetails, setItemDetails] = useState(createItemDetailsState);
  const [isIngredientsManuallyEdited, setIsIngredientsManuallyEdited] = useState(false);
  const [photoFiles, setPhotoFiles] = useState([]);
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState([]);
  const [detailPhotoFiles, setDetailPhotoFiles] = useState([]);
  const [detailPhotoPreviewUrls, setDetailPhotoPreviewUrls] = useState([]);

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

  useEffect(() => {
    const urls = detailPhotoFiles.map((file) => URL.createObjectURL(file));
    setDetailPhotoPreviewUrls(urls);

    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [detailPhotoFiles]);

  const closeModal = () => {
    setIsModalOpen(false);
    setForm(createInitialFormState());
    setIsIngredientsManuallyEdited(false);
    setPhotoFiles([]);
  };

  const openItemDetails = (item) => {
    const categoryName = categoriesById[String(item?.category_id)]?.name || "";
    setItemDetails(createItemDetailsState(item, categoryName));
    setDetailPhotoFiles([]);
    setError("");
    setIsItemDetailsOpen(true);
  };

  const closeItemDetails = () => {
    setIsItemDetailsOpen(false);
    setItemDetails(createItemDetailsState());
    setDetailPhotoFiles([]);
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
        String(item?.description || "").toLowerCase().includes(normalizedSearch) ||
        String(item?.ingredients || "").toLowerCase().includes(normalizedSearch);

      return matchesCategory && matchesSearch;
    });
  }, [menuItems, activeCategoryFilter, searchTerm]);

  const syncCategoriesWithItems = (nextItems) => {
    const usedCategoryIds = new Set(nextItems.map((item) => String(item?.category_id || "")));
    setCategories((previous) =>
      previous.filter((category) => usedCategoryIds.has(String(category.id)))
    );
  };

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
      setMenuItems((previous) => {
        const nextItems = previous.filter((current) => current.id !== item.id);
        syncCategoriesWithItems(nextItems);
        return nextItems;
      });
      if (itemDetails.id === item.id) {
        closeItemDetails();
      }
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
        ingredients:
          form.ingredients.trim()
          || suggestIngredients(form.name.trim(), categoriesById[String(categoryId)]?.name || ""),
        image_urls: imageUrls.length ? imageUrls : undefined,
        price: Number(form.price),
        is_available: form.isAvailable,
        prep_time: form.prepTime ? Number(form.prepTime) : undefined,
      });

      setMenuItems((previous) => [newItem, ...previous]);
      setCategories((previous) => {
        const exists = previous.some((category) => String(category.id) === String(newItem?.category_id));
        if (exists) {
          return previous;
        }

        const fallbackCategory = categoriesById[String(newItem?.category_id)];
        if (fallbackCategory) {
          return [...previous, fallbackCategory];
        }

        return previous;
      });
      closeModal();
    } catch (requestError) {
      setError(requestError?.message || "Failed to create menu item.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveItemDetails = async (event) => {
    event.preventDefault();

    if (!itemDetails.id) {
      return;
    }

    const trimmedName = String(itemDetails.name || "").trim();
    const priceValue = Number(itemDetails.price);
    const categoryIdValue = Number(itemDetails.categoryId);

    if (!trimmedName) {
      setError("Item name is required.");
      return;
    }

    if (Number.isNaN(priceValue) || priceValue < 0) {
      setError("Price must be a valid non-negative number.");
      return;
    }

    if (!itemDetails.categoryId || Number.isNaN(categoryIdValue) || categoryIdValue <= 0) {
      setError("Please select a category.");
      return;
    }

    setIsSavingDetails(true);
    setUpdatingItemId(itemDetails.id);
    setError("");

    try {
      const selectedCategoryName = categoriesById[String(itemDetails.categoryId)]?.name || "";
      const currentItem = menuItems.find((item) => item.id === itemDetails.id);
      const existingImageUrls = normalizeImageUrls(currentItem?.image_urls);
      let nextImageUrls = [...existingImageUrls];

      if (detailPhotoFiles.length) {
        const maxImages = 8;
        const remainingSlots = maxImages - existingImageUrls.length;

        if (remainingSlots <= 0) {
          throw new Error("This item already has the maximum 8 photos.");
        }

        if (detailPhotoFiles.length > remainingSlots) {
          throw new Error(
            `You can add up to ${remainingSlots} more photo${remainingSlots > 1 ? "s" : ""} for this item.`
          );
        }

        const uploadResponse = await api.uploadMenuImages(token, detailPhotoFiles);
        const uploadedImageUrls = Array.isArray(uploadResponse?.urls) ? uploadResponse.urls : [];
        nextImageUrls = [...existingImageUrls, ...uploadedImageUrls].slice(0, maxImages);
      }

      const updatedItem = await api.updateMenuItem(token, itemDetails.id, {
        category_id: categoryIdValue,
        name: trimmedName,
        description: String(itemDetails.description || "").trim() || null,
        ingredients:
          String(itemDetails.ingredients || "").trim()
          || suggestIngredients(trimmedName, selectedCategoryName),
        image_urls: nextImageUrls,
        price: priceValue,
        is_available: Boolean(itemDetails.isAvailable),
        prep_time: itemDetails.prepTime !== "" ? Number(itemDetails.prepTime) : undefined,
      });

      setMenuItems((previous) => {
        const nextItems = previous.map((current) => (current.id === updatedItem.id ? updatedItem : current));
        syncCategoriesWithItems(nextItems);
        return nextItems;
      });
      setItemDetails(createItemDetailsState(updatedItem));
      setDetailPhotoFiles([]);
    } catch (requestError) {
      setError(requestError?.message || "Failed to update menu item.");
    } finally {
      setIsSavingDetails(false);
      setUpdatingItemId(null);
    }
  };

  const selectedDetailItem = menuItems.find((item) => item.id === itemDetails.id);
  const selectedDetailItemImageUrls = normalizeImageUrls(selectedDetailItem?.image_urls);

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
                setIsIngredientsManuallyEdited(false);
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
              onOpenDetails={openItemDetails}
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
                    onChange={(event) =>
                      setForm((previous) => {
                        const nextName = event.target.value;
                        const selectedCategoryName = categoriesById[String(previous.categoryId)]?.name || "";
                        const nextSuggestedIngredients = suggestIngredients(nextName, selectedCategoryName);
                        return {
                          ...previous,
                          name: nextName,
                          ingredients:
                            isIngredientsManuallyEdited
                              ? previous.ingredients
                              : nextSuggestedIngredients,
                        };
                      })
                    }
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
                      setForm((previous) => {
                        const nextCategoryId = event.target.value;
                        const selectedCategoryName = categoriesById[String(nextCategoryId)]?.name || "";
                        const nextSuggestedIngredients = suggestIngredients(previous.name, selectedCategoryName);
                        return {
                          ...previous,
                          categoryId: nextCategoryId,
                          ingredients:
                            isIngredientsManuallyEdited
                              ? previous.ingredients
                              : nextSuggestedIngredients,
                        };
                      })
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
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase">Ingredients</label>
                  <button
                    className="text-[11px] font-semibold text-primary hover:underline"
                    type="button"
                    onClick={() => {
                      setForm((previous) => ({
                        ...previous,
                        ingredients: suggestIngredients(
                          previous.name,
                          categoriesById[String(previous.categoryId)]?.name || ""
                        ),
                      }));
                      setIsIngredientsManuallyEdited(false);
                    }}
                  >
                    Use Suggested
                  </button>
                </div>
                <textarea
                  className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-lg focus:ring-2 focus:ring-primary/20 text-sm resize-none"
                  placeholder="e.g. Beef, lettuce, tomato, cheese"
                  rows="2"
                  value={form.ingredients}
                  onChange={(event) => {
                    setIsIngredientsManuallyEdited(true);
                    setForm((previous) => ({ ...previous, ingredients: event.target.value }));
                  }}
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

      {isItemDetailsOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold">Item Details</h3>
                <p className="text-slate-500 text-sm">Read, edit, or delete this menu item.</p>
              </div>
              <button
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
                type="button"
                onClick={closeItemDetails}
                disabled={isSavingDetails}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form className="p-6 space-y-4" onSubmit={handleSaveItemDetails}>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Item Name</label>
                  <input
                    className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-lg focus:ring-2 focus:ring-primary/20 text-sm"
                    type="text"
                    value={itemDetails.name}
                    onChange={(event) =>
                      setItemDetails((previous) => ({ ...previous, name: event.target.value }))
                    }
                    required
                    disabled={isSavingDetails}
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Price ($)</label>
                  <input
                    className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-lg focus:ring-2 focus:ring-primary/20 text-sm"
                    type="number"
                    step="0.01"
                    min="0"
                    value={itemDetails.price}
                    onChange={(event) =>
                      setItemDetails((previous) => ({ ...previous, price: event.target.value }))
                    }
                    required
                    disabled={isSavingDetails}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description</label>
                <textarea
                  className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-lg focus:ring-2 focus:ring-primary/20 text-sm resize-none"
                  rows="3"
                  value={itemDetails.description}
                  onChange={(event) =>
                    setItemDetails((previous) => ({ ...previous, description: event.target.value }))
                  }
                  disabled={isSavingDetails}
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Ingredients</label>
                <textarea
                  className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-lg focus:ring-2 focus:ring-primary/20 text-sm resize-none"
                  rows="2"
                  value={itemDetails.ingredients}
                  onChange={(event) =>
                    setItemDetails((previous) => ({ ...previous, ingredients: event.target.value }))
                  }
                  disabled={isSavingDetails}
                ></textarea>
                <button
                  className="mt-2 text-[11px] font-semibold text-primary hover:underline"
                  type="button"
                  onClick={() =>
                    setItemDetails((previous) => ({
                      ...previous,
                      ingredients: suggestIngredients(
                        previous.name,
                        categoriesById[String(previous.categoryId)]?.name || ""
                      ),
                    }))
                  }
                  disabled={isSavingDetails}
                >
                  Use Suggested Ingredients
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Item Photos (Local)</label>
                <input
                  className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-lg focus:ring-2 focus:ring-primary/20 text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-primary file:text-white file:text-xs file:font-semibold hover:file:bg-primary/90"
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  multiple
                  onChange={(event) => {
                    setDetailPhotoFiles(Array.from(event.target.files || []));
                  }}
                  disabled={isSavingDetails}
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  Add one or many photos from your device. New photos are saved when you click Save Changes.
                </p>

                {selectedDetailItemImageUrls.length ? (
                  <div className="mt-3">
                    <p className="text-[11px] font-semibold text-slate-500 mb-2">
                      Current Photos ({selectedDetailItemImageUrls.length}/8)
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                      {selectedDetailItemImageUrls.map((imageUrl, index) => (
                        <img
                          key={`${imageUrl}-${index}`}
                          alt={`Current photo ${index + 1}`}
                          className="h-16 w-full object-cover rounded-md border border-slate-200"
                          src={imageUrl}
                        />
                      ))}
                    </div>
                  </div>
                ) : null}

                {detailPhotoPreviewUrls.length ? (
                  <div className="mt-3">
                    <p className="text-[11px] font-semibold text-slate-500 mb-2">
                      New Photos To Add ({detailPhotoPreviewUrls.length})
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                      {detailPhotoPreviewUrls.map((previewUrl, index) => (
                        <img
                          key={previewUrl}
                          alt={`New photo ${index + 1}`}
                          className="h-16 w-full object-cover rounded-md border border-primary/20"
                          src={previewUrl}
                        />
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Prep Time (mins)</label>
                  <input
                    className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-lg focus:ring-2 focus:ring-primary/20 text-sm"
                    type="number"
                    min="1"
                    value={itemDetails.prepTime}
                    onChange={(event) =>
                      setItemDetails((previous) => ({ ...previous, prepTime: event.target.value }))
                    }
                    disabled={isSavingDetails}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Category</label>
                  <select
                    className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-lg focus:ring-2 focus:ring-primary/20 text-sm"
                    value={itemDetails.categoryId}
                    onChange={(event) =>
                      setItemDetails((previous) => ({ ...previous, categoryId: event.target.value }))
                    }
                    disabled={isSavingDetails}
                  >
                    <option value="">Select Category</option>
                    {categories.map((category) => (
                      <option key={`detail-category-${category.id}`} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
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
                    checked={itemDetails.isAvailable}
                    onChange={(event) =>
                      setItemDetails((previous) => ({ ...previous, isAvailable: event.target.checked }))
                    }
                    disabled={isSavingDetails}
                  />
                  <span
                    className={
                      itemDetails.isAvailable
                        ? "px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700"
                        : "px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700"
                    }
                  >
                    {itemDetails.isAvailable ? "YES" : "NO"}
                  </span>
                </label>
              </div>

              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  className="px-4 py-2.5 rounded-lg text-sm font-bold text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-60"
                  type="button"
                  onClick={() => handleDelete({ id: itemDetails.id, name: itemDetails.name })}
                  disabled={isSavingDetails || updatingItemId === itemDetails.id}
                >
                  Delete Item
                </button>
                <div className="flex items-center gap-3">
                  <button
                    className="px-5 py-2.5 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-100"
                    type="button"
                    onClick={closeItemDetails}
                    disabled={isSavingDetails}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-7 py-2.5 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed"
                    type="submit"
                    disabled={isSavingDetails}
                  >
                    {isSavingDetails ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

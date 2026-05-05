import { useEffect, useMemo, useState } from "react";
import AdminShell from "../../components/AdminShell.jsx";
import {
  ActionButton,
  Alert,
  ConfirmModal,
  EmptyState,
  FilterSelect,
  Modal,
  PaginationControls,
  SearchableSelect,
  SearchField,
  SortableTh,
  StatusBadge,
  TableShell,
  sortRows,
  toMoney,
  toggleSortConfig,
} from "../../components/admin/AdminUI.jsx";
import { api } from "../../lib/api.js";
import { mockAdminData } from "../../lib/adminData.js";

const AVAILABILITY_OPTIONS = [
  { value: "all", label: "All Availability" },
  { value: "available", label: "Available" },
  { value: "disabled", label: "Disabled" },
];
const MENU_COMMISSION_RATE = 0.1;

function basePriceFromFinalPrice(finalPrice) {
  const normalizedFinal = Number(finalPrice || 0);
  if (!normalizedFinal) return 0;
  return Number((normalizedFinal / (1 + MENU_COMMISSION_RATE)).toFixed(2));
}

function commissionAmountFromFinalPrice(finalPrice) {
  const normalizedFinal = Number(finalPrice || 0);
  const basePrice = basePriceFromFinalPrice(normalizedFinal);
  return Number(Math.max(normalizedFinal - basePrice, 0).toFixed(2));
}

function toId(value) {
  if (value === undefined || value === null || value === "") return "";
  return String(value);
}

function restaurantNameFromItem(item) {
  return item?.restaurant_name || item?.restaurant?.name || "-";
}

function createEditState(item) {
  const basePrice =
    item?.base_price !== undefined && item?.base_price !== null
      ? Number(item.base_price || 0)
      : basePriceFromFinalPrice(item?.price);

  return {
    name: item?.name || "",
    category: item?.category || "",
    price: item ? String(basePrice) : "",
    availability: item?.availability || "available",
  };
}

function normalizeApiMenuItem(item, selectedRestaurantId, selectedRestaurantName, categoriesById) {
  const categoryId = toId(item?.category_id);
  const finalPrice = Number(item?.final_price ?? item?.price ?? 0);
  const basePrice =
    item?.base_price !== undefined && item?.base_price !== null
      ? Number(item.base_price || 0)
      : basePriceFromFinalPrice(finalPrice);
  const commissionAmount =
    item?.commission_amount !== undefined && item?.commission_amount !== null
      ? Number(item.commission_amount || 0)
      : commissionAmountFromFinalPrice(finalPrice);

  return {
    id: item?.id,
    restaurant_id: Number(selectedRestaurantId),
    restaurant_name: selectedRestaurantName || "-",
    image_url:
      item?.image_url ||
      "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80",
    name: item?.name || item?.title || "Untitled Item",
    category:
      item?.category_name ||
      item?.category ||
      categoriesById[categoryId] ||
      "Uncategorized",
    price: finalPrice,
    final_price: finalPrice,
    base_price: basePrice,
    commission_amount: commissionAmount,
    availability: item?.is_available === false ? "disabled" : "available",
    created_at: item?.created_at || null,
    description: item?.description || "",
  };
}

export default function AdminMenuItems({ onNavigate, token, user, onLogout }) {
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState("");
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [sortConfig, setSortConfig] = useState({ key: "id", direction: "desc" });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [usingMock, setUsingMock] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState(createEditState());
  const [confirm, setConfirm] = useState(null);

  const selectedRestaurant = useMemo(
    () => restaurants.find((restaurant) => toId(restaurant?.id) === toId(selectedRestaurantId)) || null,
    [restaurants, selectedRestaurantId]
  );

  useEffect(() => {
    if (!token) return undefined;

    let isCancelled = false;
    const loadRestaurants = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await api.getAdminRestaurants(token);
        const nextRestaurants = Array.isArray(response?.items) && response.items.length
          ? response.items
          : mockAdminData.restaurants;
        if (!isCancelled) {
          setRestaurants(nextRestaurants);
          setUsingMock(!response?.items?.length);
        }
      } catch (requestError) {
        if (!isCancelled) {
          setRestaurants(mockAdminData.restaurants);
          setUsingMock(true);
          setError(requestError?.message || "Restaurant list endpoint is not available yet.");
        }
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };

    loadRestaurants();
    return () => {
      isCancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (!token) return undefined;

    if (!selectedRestaurantId) {
      setItems([]);
      setLoading(false);
      return undefined;
    }

    let isCancelled = false;
    const loadRestaurantMenu = async () => {
      setLoading(true);
      setError("");
      try {
        const payload = await api.getCustomerRestaurantMenu(token, selectedRestaurantId);
        if (isCancelled) return;

        const categories = Array.isArray(payload?.categories) ? payload.categories : [];
        const categoriesById = Object.fromEntries(
          categories.map((category) => [toId(category?.id), category?.name || "Uncategorized"])
        );
        const restaurantName = payload?.restaurant?.name || selectedRestaurant?.name || "-";
        const apiItems = Array.isArray(payload?.menu_items) ? payload.menu_items : [];
        const normalizedItems = apiItems.map((item) =>
          normalizeApiMenuItem(item, selectedRestaurantId, restaurantName, categoriesById)
        );

        setItems(normalizedItems);
        setUsingMock(false);
      } catch (requestError) {
        if (isCancelled) return;

        const fallbackItems = mockAdminData.menuItems.filter(
          (item) => toId(item?.restaurant_id) === toId(selectedRestaurantId)
        );
        setItems(fallbackItems);
        setUsingMock(true);
        setError(requestError?.message || "Restaurant menu endpoint is not available yet.");
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };

    loadRestaurantMenu();
    return () => {
      isCancelled = true;
    };
  }, [token, selectedRestaurantId, selectedRestaurant?.name]);

  useEffect(() => {
    setCategoryFilter("all");
    setPage(1);
  }, [selectedRestaurantId]);

  useEffect(() => {
    setPage(1);
  }, [search, categoryFilter, availabilityFilter, pageSize]);

  const restaurantOptions = useMemo(
    () => {
      const normalizedSearch = !selectedRestaurantId ? search.trim().toLowerCase() : "";
      const filteredRestaurants = normalizedSearch
        ? restaurants.filter((restaurant) =>
            String(restaurant?.name || `Restaurant #${restaurant?.id || "-"}`)
              .toLowerCase()
              .includes(normalizedSearch)
          )
        : restaurants;

      return filteredRestaurants.map((restaurant) => ({
        value: toId(restaurant?.id),
        label: restaurant?.name || `Restaurant #${restaurant?.id || "-"}`,
      }));
    },
    [restaurants, selectedRestaurantId, search]
  );

  const categoryOptions = useMemo(() => {
    const categories = Array.from(new Set(items.map((item) => item.category).filter(Boolean))).sort();
    return [
      { value: "all", label: "All Categories" },
      ...categories.map((category) => ({ value: category, label: category })),
    ];
  }, [items]);

  const filteredItems = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return items.filter((item) => {
      const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
      const matchesAvailability = availabilityFilter === "all" || item.availability === availabilityFilter;
      const matchesSearch =
        !normalizedSearch ||
        String(item.id || "").includes(normalizedSearch) ||
        String(item.name || "").toLowerCase().includes(normalizedSearch) ||
        String(item.category || "").toLowerCase().includes(normalizedSearch) ||
        String(restaurantNameFromItem(item)).toLowerCase().includes(normalizedSearch);

      return matchesCategory && matchesAvailability && matchesSearch;
    });
  }, [items, search, categoryFilter, availabilityFilter]);

  const visibleItems = useMemo(
    () =>
      sortRows(filteredItems, sortConfig, (item, key) => {
        if (key === "id") return item?.id;
        if (key === "name") return item?.name;
        if (key === "restaurant") return restaurantNameFromItem(item);
        if (key === "category") return item?.category;
        if (key === "price") return Number(item?.price || 0);
        if (key === "availability") return item?.availability;
        return item?.[key];
      }).slice((page - 1) * pageSize, page * pageSize),
    [filteredItems, sortConfig, page, pageSize]
  );

  const handleSort = (key) => {
    setSortConfig((previous) => toggleSortConfig(previous, key));
  };

  const updateItem = (target, patch, message) => {
    setItems((previous) =>
      previous.map((current) => (current.id === target.id ? { ...current, ...patch } : current))
    );
    setSuccess(message);
  };

  const openEditor = (item) => {
    setEditingItem(item);
    setEditForm(createEditState(item));
  };

  const saveEdit = () => {
    if (!editingItem) return;
    const basePrice = Number(editForm.price || 0);
    const finalPrice = Number((basePrice * (1 + MENU_COMMISSION_RATE)).toFixed(2));
    const commissionAmount = Number((finalPrice - basePrice).toFixed(2));

    updateItem(
      editingItem,
      {
        ...editForm,
        price: finalPrice,
        final_price: finalPrice,
        base_price: basePrice,
        commission_amount: commissionAmount,
      },
      `${editForm.name || "Menu item"} was updated locally.`
    );
    setEditingItem(null);
  };

  const deleteItem = (target) => {
    setItems((previous) => previous.filter((current) => current.id !== target.id));
    setSuccess(`${target.name || "Menu item"} was removed from the admin view.`);
    setConfirm(null);
  };

  const emptyMessage = selectedRestaurantId
    ? "No menu items found for this restaurant."
    : "Pick a restaurant to load its menu.";

  return (
    <AdminShell
      activePage="adminMenuItems"
      onNavigate={onNavigate}
      user={user}
      onLogout={onLogout}
      title="Menu Item Management"
      headerActions={<SearchField value={search} onChange={setSearch} placeholder="search for restaurants" />}
    >
      {usingMock ? (
        <Alert type="warning">
          {error || "Restaurant-specific menu endpoint is unavailable. Showing placeholder menu data."}
        </Alert>
      ) : (
        <Alert>{error}</Alert>
      )}
      <Alert type="success">{success}</Alert>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <SearchableSelect
          label="Restaurant"
          value={selectedRestaurantId}
          options={restaurantOptions}
          onChange={setSelectedRestaurantId}
          placeholder="Select restaurant"
        />
        <FilterSelect label="Category" value={categoryFilter} options={categoryOptions} onChange={setCategoryFilter} />
        <FilterSelect
          label="Availability"
          value={availabilityFilter}
          options={AVAILABILITY_OPTIONS}
          onChange={setAvailabilityFilter}
        />
      </div>

      <TableShell>
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
            <tr>
              <SortableTh label="Item ID" sortKey="id" sortConfig={sortConfig} onSort={handleSort} />
              <th className="px-6 py-4">Image</th>
              <SortableTh label="Item" sortKey="name" sortConfig={sortConfig} onSort={handleSort} />
              <SortableTh label="Restaurant" sortKey="restaurant" sortConfig={sortConfig} onSort={handleSort} />
              <SortableTh label="Category" sortKey="category" sortConfig={sortConfig} onSort={handleSort} />
              <SortableTh label="Price" sortKey="price" sortConfig={sortConfig} onSort={handleSort} />
              <SortableTh label="Availability" sortKey="availability" sortConfig={sortConfig} onSort={handleSort} />
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-primary/5">
            {visibleItems.length ? (
              visibleItems.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-bold text-primary">#{row.id}</td>
                  <td className="px-6 py-4">
                    <img
                      className="h-12 w-16 rounded-lg object-cover"
                      src={row.image_url}
                      alt={row.name || "Menu item"}
                    />
                  </td>
                  <td className="px-6 py-4 font-semibold">{row.name || "Untitled Item"}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{restaurantNameFromItem(row)}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{row.category || "-"}</td>
                  <td className="px-6 py-4 text-sm font-semibold">
                    <div>{toMoney(row.final_price ?? row.price)}</div>
                    <div className="text-emerald-600 text-xs font-bold">
                      +{toMoney(row.commission_amount ?? commissionAmountFromFinalPrice(row.price))}
                    </div>
                  </td>
                  <td className="px-6 py-4"><StatusBadge value={row.availability} /></td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <ActionButton icon="visibility" onClick={() => setSelectedItem(row)}>View</ActionButton>
                      <ActionButton icon="edit" onClick={() => openEditor(row)}>Edit</ActionButton>
                      <ActionButton
                        tone={row.availability === "disabled" ? "success" : "danger"}
                        icon={row.availability === "disabled" ? "check_circle" : "block"}
                        onClick={() => {
                          const nextAvailability = row.availability === "disabled" ? "available" : "disabled";
                          updateItem(row, { availability: nextAvailability }, `${row.name} is now ${nextAvailability}.`);
                        }}
                      >
                        {row.availability === "disabled" ? "Enable" : "Disable"}
                      </ActionButton>
                      <ActionButton
                        tone="danger"
                        icon="delete"
                        onClick={() =>
                          setConfirm({
                            title: "Delete Menu Item",
                            message: `Delete ${row.name || `item #${row.id}`} from this admin view?`,
                            confirmLabel: "Delete",
                            onConfirm: () => deleteItem(row),
                          })
                        }
                      >
                        Delete
                      </ActionButton>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8}>
                  <EmptyState loading={loading} loadingMessage="Loading menu items..." message={emptyMessage} />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </TableShell>

      <PaginationControls
        page={page}
        pageSize={pageSize}
        total={filteredItems.length}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />

      {selectedItem ? (
        <Modal title={selectedItem.name || "Menu Item"} subtitle={`Item #${selectedItem.id}`} onClose={() => setSelectedItem(null)}>
          <div className="space-y-4">
            <img className="h-56 w-full rounded-xl object-cover" src={selectedItem.image_url} alt={selectedItem.name || "Menu item"} />
            <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Restaurant</p><p className="mt-1 font-semibold">{restaurantNameFromItem(selectedItem)}</p></div>
              <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Category</p><p className="mt-1 font-semibold">{selectedItem.category}</p></div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase text-slate-500">Price</p>
                <p className="mt-1 font-semibold">{toMoney(selectedItem.final_price ?? selectedItem.price)}</p>
                <p className="text-xs font-bold text-emerald-600">
                  +{toMoney(selectedItem.commission_amount ?? commissionAmountFromFinalPrice(selectedItem.price))}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Availability</p><p className="mt-1 font-semibold">{selectedItem.availability}</p></div>
            </div>
          </div>
        </Modal>
      ) : null}

      {editingItem ? (
        <Modal
          title="Edit Menu Item"
          subtitle="Placeholder save until admin menu endpoints exist."
          onClose={() => setEditingItem(null)}
          footer={
            <>
              <ActionButton onClick={() => setEditingItem(null)}>Cancel</ActionButton>
              <ActionButton tone="primary" onClick={saveEdit}>Save Item</ActionButton>
            </>
          }
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {[
              ["name", "Item Name", "text"],
              ["category", "Category", "text"],
              ["price", "Base Price", "number"],
            ].map(([field, label, type]) => (
              <label key={field} className="text-sm font-semibold text-slate-600">
                {label}
                <input
                  className="mt-2 w-full rounded-lg border-none bg-slate-50 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20"
                  type={type}
                  value={editForm[field]}
                  onChange={(event) => setEditForm((previous) => ({ ...previous, [field]: event.target.value }))}
                />
              </label>
            ))}
            <label className="text-sm font-semibold text-slate-600">
              Availability
              <select
                className="mt-2 w-full rounded-lg border-none bg-slate-50 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20"
                value={editForm.availability}
                onChange={(event) => setEditForm((previous) => ({ ...previous, availability: event.target.value }))}
              >
                <option value="available">Available</option>
                <option value="disabled">Disabled</option>
              </select>
            </label>
          </div>
        </Modal>
      ) : null}

      <ConfirmModal {...(confirm || {})} onCancel={() => setConfirm(null)} />
    </AdminShell>
  );
}

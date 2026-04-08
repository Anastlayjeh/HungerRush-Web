import { useEffect, useState } from "react";
import RestaurantShell from "../components/RestaurantShell.jsx";
import { api } from "../lib/api.js";
import {
  COUNTRY_DIAL_CODE_OPTIONS,
  COUNTRY_DIAL_CODES,
  DEFAULT_COUNTRY_DIAL_CODE,
} from "../constants/countryDialCodes.js";

function createLocalId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createLocationRow(location = {}) {
  return {
    localId: createLocalId(),
    id: location?.id ?? null,
    name: location?.name || "",
    address: location?.address || "",
    phone: location?.phone || "",
    latitude:
      location?.latitude === null || location?.latitude === undefined
        ? ""
        : String(location.latitude),
    longitude:
      location?.longitude === null || location?.longitude === undefined
        ? ""
        : String(location.longitude),
  };
}

const SORTED_DIAL_CODES = [...COUNTRY_DIAL_CODES].sort((first, second) => second.length - first.length);

function normalizeCountryCode(value) {
  const input = String(value || "").trim();
  if (!input) return DEFAULT_COUNTRY_DIAL_CODE;

  const withPlus = input.startsWith("+") ? input : `+${input}`;
  return COUNTRY_DIAL_CODES.includes(withPlus) ? withPlus : DEFAULT_COUNTRY_DIAL_CODE;
}

function keepDigitsOnly(value) {
  return String(value || "").replace(/\D+/g, "");
}

function splitStoredPhoneNumber(value) {
  const input = String(value || "").trim();
  if (!input) {
    return {
      countryCode: DEFAULT_COUNTRY_DIAL_CODE,
      number: "",
    };
  }

  const compact = input.replace(/\s+/g, "");
  if (compact.startsWith("+")) {
    const matchedCode = SORTED_DIAL_CODES.find((code) => compact.startsWith(code));
    if (matchedCode) {
      return {
        countryCode: matchedCode,
        number: keepDigitsOnly(compact.slice(matchedCode.length)),
      };
    }
  }

  return {
    countryCode: DEFAULT_COUNTRY_DIAL_CODE,
    number: keepDigitsOnly(compact.replace(/^\+/, "")),
  };
}

function buildPhoneNumber(countryCode, number) {
  const compactNumber = keepDigitsOnly(number);
  if (!compactNumber) return "";

  return `${normalizeCountryCode(countryCode)}${compactNumber}`;
}

function createContactNumberRow(rawValue = "") {
  const parsed = splitStoredPhoneNumber(rawValue);
  return {
    id: createLocalId(),
    countryCode: parsed.countryCode,
    number: parsed.number,
  };
}

function createLocationDraft(location = {}) {
  return {
    name: location?.name || "",
    address: location?.address || "",
    phone: location?.phone || "",
    latitude:
      location?.latitude === null || location?.latitude === undefined
        ? ""
        : String(location.latitude),
    longitude:
      location?.longitude === null || location?.longitude === undefined
        ? ""
        : String(location.longitude),
  };
}

function createEmptyLocationDraft() {
  return createLocationDraft();
}

function toLocationPayload(location) {
  return {
    id: location.id || undefined,
    name: String(location.name || "").trim(),
    address: String(location.address || "").trim(),
    phone: String(location.phone || "").trim() || null,
    latitude:
      location.latitude === "" || location.latitude === null || location.latitude === undefined
        ? null
        : Number(location.latitude),
    longitude:
      location.longitude === "" || location.longitude === null || location.longitude === undefined
        ? null
        : Number(location.longitude),
  };
}

function getRequestErrorMessage(requestError, fallbackMessage) {
  const validationErrors = requestError?.payload?.errors;
  if (validationErrors && typeof validationErrors === "object") {
    const firstKey = Object.keys(validationErrors)[0];
    if (firstKey && Array.isArray(validationErrors[firstKey]) && validationErrors[firstKey][0]) {
      return validationErrors[firstKey][0];
    }
  }

  return requestError?.message || fallbackMessage;
}

function initialForm() {
  return {
    name: "",
    description: "",
    status: "active",
    ownerName: "",
    ownerEmail: "",
    ownerPhoneCountryCode: DEFAULT_COUNTRY_DIAL_CODE,
    ownerPhoneNumber: "",
    defaultPrepTime: 20,
    autoAcceptOrders: false,
    notificationsEnabled: true,
    currency: "USD",
    timezone: "Asia/Beirut",
    contactNumbers: [createContactNumberRow("")],
    profilePhotoUrl: "",
    locations: [],
  };
}

export default function RestaurantSettings({
  onNavigate,
  token,
  user,
  onLogout,
  onUserProfilePhotoUpdate,
}) {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [pendingPhotoFile, setPendingPhotoFile] = useState(null);
  const [pendingPhotoPreviewUrl, setPendingPhotoPreviewUrl] = useState("");
  const [pendingPhotoRemoval, setPendingPhotoRemoval] = useState(false);
  const [savedLocations, setSavedLocations] = useState([]);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [locationModalMode, setLocationModalMode] = useState("add");
  const [editingLocationId, setEditingLocationId] = useState(null);
  const [editingLocationLocalId, setEditingLocationLocalId] = useState(null);
  const [locationDraft, setLocationDraft] = useState(createEmptyLocationDraft);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const closeLocationModal = () => {
    setIsLocationModalOpen(false);
    setLocationModalMode("add");
    setEditingLocationId(null);
    setEditingLocationLocalId(null);
    setLocationDraft(createEmptyLocationDraft());
  };

  const doesLocationMatchEditingTarget = (location) => {
    if (editingLocationLocalId) {
      return location.localId === editingLocationLocalId;
    }
    if (editingLocationId !== null) {
      return location.id === editingLocationId;
    }
    return false;
  };

  const loadSettings = async () => {
    setLoading(true);
    setError("");
    try {
      const payload = await api.getRestaurantSettings(token);
      const ownerPhone = splitStoredPhoneNumber(payload?.owner?.phone || "");
      const loadedLocations = Array.isArray(payload?.locations)
        ? payload.locations.map((location) => createLocationRow(location))
        : [];

      setForm({
        name: payload?.restaurant?.name || "",
        description: payload?.restaurant?.description || "",
        status: payload?.restaurant?.status || "active",
        ownerName: payload?.owner?.name || "",
        ownerEmail: payload?.owner?.email || "",
        ownerPhoneCountryCode: ownerPhone.countryCode,
        ownerPhoneNumber: ownerPhone.number,
        defaultPrepTime: Number(payload?.settings?.default_prep_time ?? 20),
        autoAcceptOrders: Boolean(payload?.settings?.auto_accept_orders),
        notificationsEnabled: Boolean(payload?.settings?.notifications_enabled),
        currency: payload?.settings?.currency || "USD",
        timezone: payload?.settings?.timezone || "Asia/Beirut",
        contactNumbers:
          Array.isArray(payload?.settings?.contact_numbers) && payload.settings.contact_numbers.length
            ? payload.settings.contact_numbers.map((value) => createContactNumberRow(value))
            : [createContactNumberRow("")],
        profilePhotoUrl: payload?.settings?.profile_photo_url || "",
        locations: loadedLocations,
      });
      setSavedLocations(loadedLocations);
      closeLocationModal();
      setPendingPhotoFile(null);
      setPendingPhotoPreviewUrl("");
      setPendingPhotoRemoval(false);
      onUserProfilePhotoUpdate?.(payload?.settings?.profile_photo_url || "");
    } catch (requestError) {
      setError(getRequestErrorMessage(requestError, "Failed to load settings."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    loadSettings();
  }, [token]);

  useEffect(() => {
    return () => {
      if (pendingPhotoPreviewUrl) {
        URL.revokeObjectURL(pendingPhotoPreviewUrl);
      }
    };
  }, [pendingPhotoPreviewUrl]);

  const handleAddLocation = () => {
    setLocationModalMode("add");
    setEditingLocationId(null);
    setEditingLocationLocalId(null);
    setLocationDraft(createEmptyLocationDraft());
    setError("");
    setSuccess("");
    setIsLocationModalOpen(true);
  };

  const handleLocationDraftChange = (field, value) => {
    setLocationDraft((previous) => ({ ...previous, [field]: value }));
  };

  const handleEditLocation = (location) => {
    const matchingLocation =
      form.locations.find(
        (row) =>
          row.localId === location.localId || (location.id !== null && row.id === location.id)
      ) || location;

    setLocationModalMode("edit");
    setEditingLocationId(matchingLocation.id ?? null);
    setEditingLocationLocalId(matchingLocation.localId ?? null);
    setLocationDraft(createLocationDraft(matchingLocation));
    setError("");
    setSuccess("");
    setIsLocationModalOpen(true);
  };

  const persistLocations = async (
    nextLocations,
    successMessage = "Locations saved successfully.",
    fallbackErrorMessage = "Failed to save locations."
  ) => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = await api.updateRestaurantSettings(token, {
        locations: nextLocations.map((location) => toLocationPayload(location)),
      });

      const persistedLocations = Array.isArray(payload?.locations)
        ? payload.locations.map((location) => createLocationRow(location))
        : [];

      setForm((previous) => ({ ...previous, locations: persistedLocations }));
      setSavedLocations(persistedLocations);
      closeLocationModal();
      setSuccess(successMessage);
      return true;
    } catch (requestError) {
      setError(getRequestErrorMessage(requestError, fallbackErrorMessage));
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmLocationModal = async () => {
    const nextDraft = {
      name: String(locationDraft.name || "").trim(),
      address: String(locationDraft.address || "").trim(),
      phone: String(locationDraft.phone || "").trim(),
      latitude: locationDraft.latitude,
      longitude: locationDraft.longitude,
    };

    if (!nextDraft.name || !nextDraft.address) {
      setError("Location name and address are required.");
      return;
    }

    let nextLocations = [];

    if (locationModalMode === "edit") {
      const hasTarget = form.locations.some((location) => doesLocationMatchEditingTarget(location));
      if (!hasTarget) {
        setError("Unable to find that location. Please refresh and try again.");
        return;
      }

      nextLocations = form.locations.map((location) =>
        doesLocationMatchEditingTarget(location) ? { ...location, ...nextDraft } : location
      );
      await persistLocations(nextLocations, "Location updated successfully.", "Failed to update location.");
    } else {
      nextLocations = [...form.locations, createLocationRow(nextDraft)];
      await persistLocations(nextLocations, "Location added successfully.", "Failed to add location.");
    }
  };

  const handleDeleteLocationFromModal = async () => {
    if (locationModalMode !== "edit") {
      return;
    }

    const hasTarget = form.locations.some((location) => doesLocationMatchEditingTarget(location));
    if (!hasTarget) {
      setError("Unable to find that location. Please refresh and try again.");
      return;
    }

    const nextLocations = form.locations.filter((location) => !doesLocationMatchEditingTarget(location));
    await persistLocations(nextLocations, "Location deleted successfully.", "Failed to delete location.");
  };

  const handleContactNumberChange = (id, field, value) => {
    setForm((previous) => ({
      ...previous,
      contactNumbers: previous.contactNumbers.map((row) =>
        row.id === id ? { ...row, [field]: value } : row
      ),
    }));
  };

  const handleAddContactNumber = () => {
    setForm((previous) => ({
      ...previous,
      contactNumbers: [...previous.contactNumbers, createContactNumberRow("")],
    }));
  };

  const handleRemoveContactNumber = (id) => {
    setForm((previous) => ({
      ...previous,
      contactNumbers: previous.contactNumbers.filter((row) => row.id !== id),
    }));
  };

  const handleProfilePhotoChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setError("");
    setSuccess("");

    if (pendingPhotoPreviewUrl) {
      URL.revokeObjectURL(pendingPhotoPreviewUrl);
    }

    setPendingPhotoRemoval(false);
    setPendingPhotoFile(file);
    setPendingPhotoPreviewUrl(URL.createObjectURL(file));
    setSuccess("Photo selected. Click Save Settings to apply.");
  };

  const handleRemoveProfilePhoto = () => {
    if (pendingPhotoPreviewUrl) {
      URL.revokeObjectURL(pendingPhotoPreviewUrl);
    }

    setPendingPhotoFile(null);
    setPendingPhotoPreviewUrl("");
    setPendingPhotoRemoval(true);
    setError("");
    setSuccess("Photo removal selected. Click Save Settings to apply.");
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      let photoUrlToSave = pendingPhotoRemoval ? null : form.profilePhotoUrl || null;

      if (pendingPhotoFile) {
        const uploadPayload = await api.uploadRestaurantProfilePhoto(token, pendingPhotoFile);
        if (!uploadPayload?.url) {
          throw new Error("Photo upload failed.");
        }
        photoUrlToSave = uploadPayload.url;
      }

      const updatedSettings = await api.updateRestaurantSettings(token, {
        name: form.name.trim(),
        description: form.description.trim() || null,
        status: form.status,
        owner_name: form.ownerName.trim(),
        owner_email: form.ownerEmail.trim(),
        owner_phone: buildPhoneNumber(form.ownerPhoneCountryCode, form.ownerPhoneNumber) || null,
        locations: form.locations.map((location) => toLocationPayload(location)),
        settings: {
          default_prep_time: Number(form.defaultPrepTime),
          auto_accept_orders: Boolean(form.autoAcceptOrders),
          notifications_enabled: Boolean(form.notificationsEnabled),
          currency: String(form.currency || "USD").toUpperCase(),
          timezone: form.timezone.trim() || "Asia/Beirut",
          profile_photo_url: photoUrlToSave,
          contact_numbers: form.contactNumbers
            .map((row) => buildPhoneNumber(row.countryCode, row.number))
            .filter((value) => value.length > 0),
        },
      });

      const savedPhotoUrl = updatedSettings?.settings?.profile_photo_url || photoUrlToSave || "";
      onUserProfilePhotoUpdate?.(savedPhotoUrl);

      if (pendingPhotoPreviewUrl) {
        URL.revokeObjectURL(pendingPhotoPreviewUrl);
      }
      setPendingPhotoFile(null);
      setPendingPhotoPreviewUrl("");
      setPendingPhotoRemoval(false);
      setSuccess("Settings updated successfully.");
      await loadSettings();
    } catch (requestError) {
      setError(getRequestErrorMessage(requestError, "Failed to save settings."));
    } finally {
      setSaving(false);
    }
  };

  const isRestaurantActive = form.status === "active";

  const handleToggleStatus = async () => {
    if (loading || updatingStatus) {
      return;
    }

    const nextStatus = isRestaurantActive ? "inactive" : "active";
    setUpdatingStatus(true);
    setError("");
    setSuccess("");

    try {
      await api.updateRestaurantSettings(token, { status: nextStatus });
      setForm((previous) => ({ ...previous, status: nextStatus }));
      setSuccess(`Restaurant marked as ${nextStatus}.`);
    } catch (requestError) {
      setError(requestError?.message || "Failed to update restaurant status.");
    } finally {
      setUpdatingStatus(false);
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
          <div className="flex items-center gap-4 p-4 rounded-lg bg-slate-50">
            <div className="size-16 rounded-full overflow-hidden bg-slate-200 flex items-center justify-center">
              {pendingPhotoPreviewUrl || (!pendingPhotoRemoval && form.profilePhotoUrl) ? (
                <img
                  className="w-full h-full object-cover"
                  src={pendingPhotoPreviewUrl || form.profilePhotoUrl}
                  alt="Profile"
                />
              ) : (
                <span className="text-slate-500 text-xs font-bold">No Photo</span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <label className="inline-flex items-center px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm font-semibold cursor-pointer hover:bg-slate-100">
                  {pendingPhotoFile ? "Photo Selected (Unsaved)" : "Change Profile Photo"}
                  <input
                    className="hidden"
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePhotoChange}
                    disabled={loading || saving}
                  />
                </label>
                <button
                  className="px-3 py-2 rounded-lg bg-red-50 text-red-700 text-sm font-semibold hover:bg-red-100 disabled:opacity-60"
                  type="button"
                  onClick={handleRemoveProfilePhoto}
                  disabled={
                    loading
                    || saving
                    || (!pendingPhotoFile && !form.profilePhotoUrl)
                    || pendingPhotoRemoval
                  }
                >
                  {pendingPhotoRemoval ? "Remove Selected" : "Remove Photo"}
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Upload JPG, PNG, or WebP up to 5MB. Changes are saved only after clicking Save Settings.
              </p>
            </div>
          </div>
          {pendingPhotoRemoval ? (
            <p className="text-xs text-red-600">Photo will be removed when you save settings.</p>
          ) : null}
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
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Status</label>
            <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-slate-50">
              <div>
                <p className="text-sm font-semibold text-slate-700">
                  {isRestaurantActive ? "Restaurant Active" : "Restaurant Inactive"}
                </p>
                <p className="text-xs text-slate-500">
                  {isRestaurantActive
                    ? "Customers can place orders."
                    : "Customers cannot place new orders."}
                </p>
              </div>
              <button
                className={
                  isRestaurantActive
                    ? "w-12 h-7 rounded-full bg-emerald-500 relative disabled:opacity-60"
                    : "w-12 h-7 rounded-full bg-slate-300 relative disabled:opacity-60"
                }
                type="button"
                onClick={handleToggleStatus}
                disabled={loading || updatingStatus}
                title={isRestaurantActive ? "Set inactive" : "Set active"}
              >
                <span
                  className={
                    isRestaurantActive
                      ? "absolute top-1 left-6 w-5 h-5 rounded-full bg-white transition-all"
                      : "absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-all"
                  }
                ></span>
              </button>
            </div>
            {updatingStatus ? <p className="mt-1 text-xs text-slate-500">Updating status...</p> : null}
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
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Owner Phone</label>
            <div className="grid grid-cols-[180px_1fr] gap-2">
              <select
                className="w-full px-3 py-2.5 bg-slate-50 border-none rounded-lg text-sm"
                value={form.ownerPhoneCountryCode}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, ownerPhoneCountryCode: event.target.value }))
                }
                disabled={loading}
              >
                {COUNTRY_DIAL_CODE_OPTIONS.map((option) => (
                  <option key={`owner-${option.code}`} value={option.code}>
                    {option.label}
                  </option>
                ))}
              </select>
              <input
                className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-lg text-sm"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Phone number"
                value={form.ownerPhoneNumber}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, ownerPhoneNumber: keepDigitsOnly(event.target.value) }))
                }
                disabled={loading}
              />
            </div>
          </div>
        </section>

        <section className="bg-white rounded-xl border border-primary/10 p-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-lg font-bold">Locations</h3>
            <div className="flex items-center gap-2">
              <button
                className="px-3 py-2 rounded-lg bg-slate-100 text-sm font-semibold hover:bg-slate-200"
                type="button"
                onClick={handleAddLocation}
                disabled={loading || saving}
              >
                Add Location
              </button>
            </div>
          </div>

          {savedLocations.length ? (
            <div className="p-4 rounded-lg bg-slate-50 text-sm text-slate-700 space-y-3">
              {savedLocations.map((location, index) => (
                <button
                  key={location.id || location.localId}
                  className="w-full text-left border-b border-slate-200 rounded-md px-2 py-2 -mx-2 hover:bg-slate-100 transition-colors last:border-b-0"
                  type="button"
                  onClick={() => handleEditLocation(location)}
                  disabled={saving}
                >
                  <p className="font-semibold">Location #{index + 1}: {location.name}</p>
                  <p>{location.address}</p>
                  {location.phone ? <p className="text-slate-600">Phone: {location.phone}</p> : null}
                  {(location.latitude || location.longitude) ? (
                    <p className="text-slate-500 text-xs">
                      Coordinates: {location.latitude || "-"}, {location.longitude || "-"}
                    </p>
                  ) : null}
                  <p className="text-primary text-xs mt-1">Click to edit or delete.</p>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-slate-50 text-sm text-slate-500">
              No locations yet. Add your first location.
            </div>
          )}
        </section>

        {isLocationModalOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-primary/10">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <h4 className="text-lg font-bold">
                  {locationModalMode === "edit" ? "Edit Location" : "Add Location"}
                </h4>
                <button
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
                  type="button"
                  onClick={closeLocationModal}
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="p-5 space-y-3">
                <input
                  className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-lg text-sm"
                  type="text"
                  placeholder="Location name"
                  value={locationDraft.name}
                  onChange={(event) => handleLocationDraftChange("name", event.target.value)}
                  disabled={saving}
                />
                <input
                  className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-lg text-sm"
                  type="text"
                  placeholder="Address"
                  value={locationDraft.address}
                  onChange={(event) => handleLocationDraftChange("address", event.target.value)}
                  disabled={saving}
                />
                <input
                  className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-lg text-sm"
                  type="text"
                  placeholder="Phone (optional)"
                  value={locationDraft.phone}
                  onChange={(event) => handleLocationDraftChange("phone", event.target.value)}
                  disabled={saving}
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-lg text-sm"
                    type="number"
                    step="0.0000001"
                    placeholder="Latitude (optional)"
                    value={locationDraft.latitude}
                    onChange={(event) => handleLocationDraftChange("latitude", event.target.value)}
                    disabled={saving}
                  />
                  <input
                    className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-lg text-sm"
                    type="number"
                    step="0.0000001"
                    placeholder="Longitude (optional)"
                    value={locationDraft.longitude}
                    onChange={(event) => handleLocationDraftChange("longitude", event.target.value)}
                    disabled={saving}
                  />
                </div>
              </div>

              <div className="p-5 border-t border-slate-100 flex items-center gap-2">
                {locationModalMode === "edit" ? (
                  <button
                    className="px-4 py-2 rounded-lg text-sm font-semibold bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-60"
                    type="button"
                    onClick={handleDeleteLocationFromModal}
                    disabled={saving}
                  >
                    Delete Location
                  </button>
                ) : null}
                <div className="ml-auto flex items-center gap-2">
                <button
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200"
                  type="button"
                  onClick={closeLocationModal}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-primary text-white hover:bg-primary/90 disabled:opacity-60"
                  type="button"
                  onClick={handleConfirmLocationModal}
                  disabled={saving}
                >
                  {locationModalMode === "edit" ? "Save Changes" : "Add Location"}
                </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}

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
          <h3 className="text-lg font-bold">Contact Numbers</h3>
          <div className="space-y-3">
            {form.contactNumbers.map((row, index) => (
              <div key={row.id} className="grid grid-cols-[180px_1fr_auto] gap-2">
                <select
                  className="w-full px-3 py-2.5 bg-slate-50 border-none rounded-lg text-sm"
                  value={row.countryCode}
                  onChange={(event) => handleContactNumberChange(row.id, "countryCode", event.target.value)}
                  disabled={loading}
                >
                  {COUNTRY_DIAL_CODE_OPTIONS.map((option) => (
                    <option key={`contact-${row.id}-${option.code}`} value={option.code}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <input
                  className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-lg text-sm"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder={`Contact number #${index + 1}`}
                  value={row.number}
                  onChange={(event) =>
                    handleContactNumberChange(row.id, "number", keepDigitsOnly(event.target.value))
                  }
                  disabled={loading}
                />
                <button
                  className="px-3 py-2 rounded-lg bg-red-50 text-red-700 text-xs font-bold hover:bg-red-100 disabled:opacity-60"
                  type="button"
                  onClick={() => handleRemoveContactNumber(row.id)}
                  disabled={loading || form.contactNumbers.length === 1}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <button
            className="px-3 py-2 rounded-lg bg-slate-100 text-sm font-semibold hover:bg-slate-200"
            type="button"
            onClick={handleAddContactNumber}
            disabled={loading}
          >
            Add Number
          </button>
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

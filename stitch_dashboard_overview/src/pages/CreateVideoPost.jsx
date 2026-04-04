import { useEffect, useMemo, useState } from "react";
import RestaurantShell from "../components/RestaurantShell.jsx";
import { api } from "../lib/api.js";
import { bg } from "../utils/bg.js";

function initialForm() {
  return {
    title: "",
    description: "",
    mediaUrl: "",
    thumbnailUrl: "",
    menuItemId: "",
  };
}

export default function CreateVideoPost({ onNavigate, token, user, onLogout }) {
  const [form, setForm] = useState(initialForm);
  const [menuItems, setMenuItems] = useState([]);
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (!token) {
      return;
    }

    let isCancelled = false;
    const loadMenuItems = async () => {
      setLoadingMenu(true);
      try {
        const items = await api.getMenuItems(token);
        if (!isCancelled) {
          setMenuItems(Array.isArray(items) ? items : []);
        }
      } catch (requestError) {
        if (!isCancelled) {
          setError(requestError?.message || "Failed to load menu items.");
        }
      } finally {
        if (!isCancelled) {
          setLoadingMenu(false);
        }
      }
    };

    loadMenuItems();

    return () => {
      isCancelled = true;
    };
  }, [token]);

  const selectedMenuItem = useMemo(
    () => menuItems.find((item) => String(item.id) === form.menuItemId) || null,
    [menuItems, form.menuItemId]
  );

  const previewThumbnail =
    form.thumbnailUrl.trim() ||
    "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=900&q=80";

  const createVideo = async (status) => {
    if (!form.title.trim() || !form.mediaUrl.trim()) {
      setError("Video title and media URL are required.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccessMessage("");
    try {
      await api.createVideo(token, {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        media_url: form.mediaUrl.trim(),
        thumbnail_url: form.thumbnailUrl.trim() || undefined,
        menu_item_id: form.menuItemId ? Number(form.menuItemId) : null,
        status,
      });

      setSuccessMessage(status === "published" ? "Video published successfully." : "Draft saved.");
      setForm(initialForm());
      window.setTimeout(() => onNavigate?.("videos"), 600);
    } catch (requestError) {
      setError(requestError?.message || "Failed to create video.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <RestaurantShell
      activePage="videos"
      onNavigate={onNavigate}
      user={user}
      onLogout={onLogout}
      title="Create Video Post"
      headerActions={
        <>
          <button
            className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-semibold hover:bg-slate-50 disabled:opacity-60"
            type="button"
            onClick={() => createVideo("draft")}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save as Draft"}
          </button>
          <button
            className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-60"
            type="button"
            onClick={() => createVideo("published")}
            disabled={saving}
          >
            {saving ? "Publishing..." : "Publish"}
          </button>
        </>
      }
    >
      {error ? (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">
          {error}
        </div>
      ) : null}
      {successMessage ? (
        <div className="mb-6 rounded-xl border border-green-200 bg-green-50 text-green-700 px-4 py-3 text-sm">
          {successMessage}
        </div>
      ) : null}

      <div className="mb-6">
        <button
          className="flex items-center gap-2 text-slate-500 hover:text-primary text-sm font-medium"
          type="button"
          onClick={() => onNavigate?.("videos")}
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Back to Video Management
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-primary/10 shadow-sm">
            <h3 className="text-lg font-bold mb-4">Video Details</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Video Title</label>
                <input
                  className="w-full p-3 bg-slate-50 border-slate-200 rounded-xl focus:ring-primary/50 focus:border-primary"
                  placeholder="e.g. Sizzling Summer Burger Special"
                  type="text"
                  value={form.title}
                  onChange={(event) => setForm((previous) => ({ ...previous, title: event.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Description</label>
                <textarea
                  className="w-full p-3 bg-slate-50 border-slate-200 rounded-xl focus:ring-primary/50 focus:border-primary resize-none"
                  placeholder="Tell your customers about this video..."
                  rows="4"
                  value={form.description}
                  onChange={(event) =>
                    setForm((previous) => ({ ...previous, description: event.target.value }))
                  }
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Video URL</label>
                <input
                  className="w-full p-3 bg-slate-50 border-slate-200 rounded-xl focus:ring-primary/50 focus:border-primary"
                  placeholder="https://example.com/video.mp4"
                  type="url"
                  value={form.mediaUrl}
                  onChange={(event) => setForm((previous) => ({ ...previous, mediaUrl: event.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Thumbnail URL (Optional)</label>
                <input
                  className="w-full p-3 bg-slate-50 border-slate-200 rounded-xl focus:ring-primary/50 focus:border-primary"
                  placeholder="https://example.com/image.jpg"
                  type="url"
                  value={form.thumbnailUrl}
                  onChange={(event) =>
                    setForm((previous) => ({ ...previous, thumbnailUrl: event.target.value }))
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Link to Menu Item</label>
                <select
                  className="w-full p-3 bg-slate-50 border-slate-200 rounded-xl focus:ring-primary/50 focus:border-primary"
                  value={form.menuItemId}
                  onChange={(event) => setForm((previous) => ({ ...previous, menuItemId: event.target.value }))}
                  disabled={loadingMenu}
                >
                  <option value="">No linked item</option>
                  {menuItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-4">Feed Preview</h2>
          <div className="relative mx-auto w-[280px] h-[580px] bg-slate-900 rounded-[3rem] border-[8px] border-slate-800 shadow-2xl overflow-hidden">
            <div className="absolute inset-0 bg-cover bg-center" style={bg(previewThumbnail)}></div>
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80"></div>

            <div className="absolute right-4 bottom-32 flex flex-col gap-4 text-white items-center">
              <div className="flex flex-col items-center">
                <span className="material-symbols-outlined !text-[28px]">favorite</span>
                <span className="text-[10px] font-bold">0</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="material-symbols-outlined !text-[28px]">chat_bubble</span>
                <span className="text-[10px] font-bold">0</span>
              </div>
            </div>

            <div className="absolute bottom-16 left-4 right-16 text-white space-y-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="size-6 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold border border-white">
                  HR
                </div>
                <span className="text-xs font-bold">HungerRush</span>
              </div>
              <p className="text-xs font-medium line-clamp-2">{form.description || "Video description preview..."}</p>
            </div>

            <div className="absolute bottom-4 left-4 right-4 bg-primary text-white py-2 rounded-lg text-center text-[10px] font-bold shadow-lg">
              {selectedMenuItem ? `ORDER NOW: ${selectedMenuItem.name}` : "Link a menu item for quick ordering"}
            </div>
          </div>
        </div>
      </div>
    </RestaurantShell>
  );
}


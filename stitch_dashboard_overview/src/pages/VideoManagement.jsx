import { useEffect, useMemo, useState } from "react";
import RestaurantShell from "../components/RestaurantShell.jsx";
import { api } from "../lib/api.js";
import { bg } from "../utils/bg.js";

function initialEditorState() {
  return {
    id: null,
    title: "",
    description: "",
    mediaUrl: "",
    thumbnailUrl: "",
    menuItemId: "",
    status: "draft",
  };
}

function buildPreviewBars(video) {
  const views = Number(video?.views_count || 0);
  const likes = Number(video?.likes_count || 0);
  const shares = Number(video?.shares_count || 0);
  const base = Math.max(views, likes, shares, 1);

  return [views, likes, shares, views * 0.65, likes * 0.8, shares * 0.7, (views + likes + shares) / 3].map(
    (value) => Math.max(10, Math.min(100, Math.round((value / base) * 100)))
  );
}

export default function VideoManagement({ onNavigate, token, user, onLogout }) {
  const [videos, setVideos] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [selectedVideoId, setSelectedVideoId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editor, setEditor] = useState(initialEditorState);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!token) {
      return undefined;
    }

    let isCancelled = false;

    const loadData = async () => {
      setLoading(true);
      setError("");

      try {
        const [videoResponse, menuData] = await Promise.all([
          api.getVideos(token),
          api.getMenuItems(token),
        ]);

        if (isCancelled) {
          return;
        }

        const nextVideos = videoResponse.items || [];
        setVideos(nextVideos);
        setMenuItems(Array.isArray(menuData) ? menuData : []);

        if (!nextVideos.length) {
          setSelectedVideoId(null);
          setEditor(initialEditorState());
          return;
        }

        const fallbackVideo = nextVideos[0];
        const activeVideo =
          nextVideos.find((video) => video.id === selectedVideoId) ||
          fallbackVideo;

        setSelectedVideoId(activeVideo.id);
        setEditor({
          id: activeVideo.id,
          title: activeVideo.title || "",
          description: activeVideo.description || "",
          mediaUrl: activeVideo.media_url || "",
          thumbnailUrl: activeVideo.thumbnail_url || "",
          menuItemId: activeVideo.menu_item_id ? String(activeVideo.menu_item_id) : "",
          status: activeVideo.status || "draft",
        });
      } catch (requestError) {
        if (!isCancelled) {
          setError(requestError?.message || "Failed to load videos.");
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isCancelled = true;
    };
  }, [token, selectedVideoId]);

  const filteredVideos = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return videos.filter((video) => {
      const matchesStatus = statusFilter === "all" || video.status === statusFilter;
      const matchesSearch =
        !normalizedSearch ||
        String(video.title || "").toLowerCase().includes(normalizedSearch) ||
        String(video.description || "").toLowerCase().includes(normalizedSearch);

      return matchesStatus && matchesSearch;
    });
  }, [videos, searchTerm, statusFilter]);

  const activeVideo = useMemo(
    () => videos.find((video) => video.id === selectedVideoId) || null,
    [videos, selectedVideoId]
  );

  const bars = useMemo(() => buildPreviewBars(activeVideo), [activeVideo]);

  const handleVideoSelect = (video) => {
    setSelectedVideoId(video.id);
    setEditor({
      id: video.id,
      title: video.title || "",
      description: video.description || "",
      mediaUrl: video.media_url || "",
      thumbnailUrl: video.thumbnail_url || "",
      menuItemId: video.menu_item_id ? String(video.menu_item_id) : "",
      status: video.status || "draft",
    });
  };

  const handleSave = async () => {
    if (!editor.id) {
      return;
    }

    setSaving(true);
    setError("");
    try {
      const updated = await api.updateVideo(token, editor.id, {
        title: editor.title.trim(),
        description: editor.description.trim() || undefined,
        media_url: editor.mediaUrl.trim(),
        thumbnail_url: editor.thumbnailUrl.trim() || undefined,
        menu_item_id: editor.menuItemId ? Number(editor.menuItemId) : null,
        status: editor.status,
      });

      setVideos((previous) => previous.map((video) => (video.id === updated.id ? updated : video)));
    } catch (requestError) {
      setError(requestError?.message || "Failed to save video.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editor.id) {
      return;
    }

    if (!window.confirm("Delete this video?")) {
      return;
    }

    setDeleting(true);
    setError("");
    try {
      await api.deleteVideo(token, editor.id);
      const nextVideos = videos.filter((video) => video.id !== editor.id);
      setVideos(nextVideos);

      if (nextVideos.length) {
        handleVideoSelect(nextVideos[0]);
      } else {
        setSelectedVideoId(null);
        setEditor(initialEditorState());
      }
    } catch (requestError) {
      setError(requestError?.message || "Failed to delete video.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <RestaurantShell
      activePage="videos"
      onNavigate={onNavigate}
      user={user}
      onLogout={onLogout}
      title="Video Feed Management"
      headerActions={
        <>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              search
            </span>
            <input
              className="pl-10 pr-4 py-2 bg-slate-100 border-none rounded-lg text-sm w-64 focus:ring-2 focus:ring-primary/20"
              placeholder="Search videos..."
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
          <button
            className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-primary/90"
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

      <div className="flex gap-2 mb-6">
        {[
          ["all", "All Videos"],
          ["published", "Published"],
          ["draft", "Drafts"],
          ["archived", "Archived"],
        ].map(([value, label]) => (
          <button
            key={value}
            className={
              statusFilter === value
                ? "px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold"
                : "px-4 py-2 rounded-lg bg-white border border-primary/10 text-sm font-medium hover:bg-primary/5"
            }
            type="button"
            onClick={() => setStatusFilter(value)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-6">
        <section className="bg-white rounded-xl border border-primary/10 p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredVideos.map((video) => {
              const isActive = video.id === selectedVideoId;
              const thumbnail =
                video.thumbnail_url ||
                "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=900&q=80";
              return (
                <button
                  key={video.id}
                  className={`relative aspect-[9/16] rounded-xl overflow-hidden text-left ${
                    isActive ? "ring-4 ring-primary" : "hover:ring-2 hover:ring-primary/50"
                  }`}
                  type="button"
                  onClick={() => handleVideoSelect(video)}
                >
                  <div className="absolute inset-0 bg-cover bg-center" style={bg(thumbnail)}></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <p className="text-xs font-semibold line-clamp-2">{video.title}</p>
                    <p className="text-[10px] mt-1 uppercase tracking-wider">{video.status}</p>
                  </div>
                </button>
              );
            })}

            <button
              className="aspect-[9/16] rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-primary hover:border-primary"
              type="button"
              onClick={() => onNavigate?.("videoCreate")}
            >
              <span className="material-symbols-outlined text-4xl">add_circle</span>
              <span className="text-sm font-bold">New Post</span>
            </button>
          </div>

          {!filteredVideos.length ? (
            <p className="text-sm text-slate-500 mt-4">{loading ? "Loading videos..." : "No videos found."}</p>
          ) : null}
        </section>

        <aside className="bg-white rounded-xl border border-primary/10 p-6 space-y-5">
          <h3 className="text-lg font-bold">Video Details</h3>
          {activeVideo ? (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Title</label>
                <input
                  className="w-full bg-slate-50 border-none rounded-lg text-sm"
                  type="text"
                  value={editor.title}
                  onChange={(event) => setEditor((previous) => ({ ...previous, title: event.target.value }))}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description</label>
                <textarea
                  className="w-full bg-slate-50 border-none rounded-lg text-sm resize-none"
                  rows="3"
                  value={editor.description}
                  onChange={(event) =>
                    setEditor((previous) => ({ ...previous, description: event.target.value }))
                  }
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Media URL</label>
                <input
                  className="w-full bg-slate-50 border-none rounded-lg text-sm"
                  type="url"
                  value={editor.mediaUrl}
                  onChange={(event) => setEditor((previous) => ({ ...previous, mediaUrl: event.target.value }))}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Thumbnail URL</label>
                <input
                  className="w-full bg-slate-50 border-none rounded-lg text-sm"
                  type="url"
                  value={editor.thumbnailUrl}
                  onChange={(event) =>
                    setEditor((previous) => ({ ...previous, thumbnailUrl: event.target.value }))
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Linked Item</label>
                  <select
                    className="w-full bg-slate-50 border-none rounded-lg text-sm"
                    value={editor.menuItemId}
                    onChange={(event) =>
                      setEditor((previous) => ({ ...previous, menuItemId: event.target.value }))
                    }
                  >
                    <option value="">None</option>
                    {menuItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Status</label>
                  <select
                    className="w-full bg-slate-50 border-none rounded-lg text-sm"
                    value={editor.status}
                    onChange={(event) => setEditor((previous) => ({ ...previous, status: event.target.value }))}
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200">
                <h4 className="text-sm font-bold mb-3">Performance</h4>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="p-3 bg-slate-50 rounded-lg text-center">
                    <p className="text-xs text-slate-500">Views</p>
                    <p className="font-bold">{activeVideo.views_count || 0}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg text-center">
                    <p className="text-xs text-slate-500">Likes</p>
                    <p className="font-bold">{activeVideo.likes_count || 0}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg text-center">
                    <p className="text-xs text-slate-500">Shares</p>
                    <p className="font-bold">{activeVideo.shares_count || 0}</p>
                  </div>
                </div>
                <div className="flex items-end justify-between gap-1 h-24">
                  {bars.map((height, index) => (
                    <div
                      key={`bar-${index}`}
                      className={index === 4 ? "flex-1 bg-primary rounded-t" : "flex-1 bg-primary/30 rounded-t"}
                      style={{ height: `${height}%` }}
                    ></div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  className="flex-1 py-3 bg-slate-900 text-white font-bold rounded-xl text-sm disabled:opacity-60"
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
                <button
                  className="px-4 py-3 border border-slate-200 text-slate-600 hover:text-red-500 rounded-xl disabled:opacity-60"
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? "..." : <span className="material-symbols-outlined">delete</span>}
                </button>
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-500">Select a video to edit details.</p>
          )}
        </aside>
      </div>
    </RestaurantShell>
  );
}


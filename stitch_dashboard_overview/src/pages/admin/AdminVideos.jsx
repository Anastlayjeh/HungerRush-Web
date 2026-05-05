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
  formatDate,
  formatDateTime,
  normalizeStatus,
  sortRows,
  toggleSortConfig,
} from "../../components/admin/AdminUI.jsx";
import { api } from "../../lib/api.js";
import { mockAdminData } from "../../lib/adminData.js";

const VIDEO_STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

const STREAM_STATE_OPTIONS = [
  { value: "all", label: "All Streams" },
  { value: "ready", label: "Ready" },
  { value: "processing", label: "Processing" },
];

function toId(value) {
  if (value === undefined || value === null || value === "") return "";
  return String(value);
}

function normalizeVideo(video) {
  const normalizedRestaurantId = video?.restaurant_id || video?.restaurant?.id || null;
  const ready = Boolean(video?.stream_ready);

  return {
    ...video,
    id: video?.id,
    restaurant_id: normalizedRestaurantId,
    restaurant_name:
      video?.restaurant_name ||
      video?.restaurant?.name ||
      (normalizedRestaurantId ? `Restaurant #${normalizedRestaurantId}` : "-"),
    menu_item:
      video?.menu_item ||
      (video?.menuItem
        ? { id: video.menuItem.id, name: video.menuItem.name }
        : null),
    title: video?.title || "Untitled Video",
    description: video?.description || "",
    status: String(video?.status || "draft"),
    stream_ready: ready,
    stream_status: video?.stream_status || (ready ? "ready" : "processing"),
    thumbnail_url: video?.thumbnail_url || "",
    media_url: video?.media_url || "",
    stream_hls_url: video?.stream_hls_url || "",
    created_at: video?.created_at || null,
    published_at: video?.published_at || null,
    views_count: Number(video?.views_count || 0),
    likes_count: Number(video?.likes_count || 0),
    shares_count: Number(video?.shares_count || 0),
    comments_count: Number(video?.comments_count || 0),
  };
}

function restaurantLabel(video) {
  return video?.restaurant_name || "-";
}

function menuItemLabel(video) {
  return video?.menu_item?.name || (video?.menu_item_id ? `Item #${video.menu_item_id}` : "-");
}

function matchesDateRange(value, from, to) {
  if (!from && !to) return true;
  const current = new Date(value || "");
  if (Number.isNaN(current.getTime())) return false;

  const currentDay = new Date(current);
  currentDay.setHours(0, 0, 0, 0);

  if (from) {
    const start = new Date(from);
    start.setHours(0, 0, 0, 0);
    if (currentDay < start) return false;
  }

  if (to) {
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    if (current > end) return false;
  }

  return true;
}

function filterVideos(videos, filters) {
  const normalizedSearch = filters.search.trim().toLowerCase();

  return videos
    .filter((video) => {
      const videoRestaurantId = toId(video?.restaurant_id);
      const matchesRestaurant =
        !filters.selectedRestaurantId || videoRestaurantId === toId(filters.selectedRestaurantId);
      const matchesStatus =
        filters.statusFilter === "all" || String(video?.status || "draft") === filters.statusFilter;
      const matchesStream =
        filters.streamFilter === "all" ||
        (filters.streamFilter === "ready" ? Boolean(video?.stream_ready) : !Boolean(video?.stream_ready));
      const matchesDate = matchesDateRange(video?.created_at, filters.createdFrom, filters.createdTo);
      const matchesSearch =
        !normalizedSearch ||
        String(video?.id || "").includes(normalizedSearch) ||
        String(video?.title || "").toLowerCase().includes(normalizedSearch) ||
        String(video?.description || "").toLowerCase().includes(normalizedSearch) ||
        String(restaurantLabel(video)).toLowerCase().includes(normalizedSearch) ||
        String(menuItemLabel(video)).toLowerCase().includes(normalizedSearch);

      return matchesRestaurant && matchesStatus && matchesStream && matchesDate && matchesSearch;
    })
    .sort((left, right) => {
      const leftTime = new Date(left?.created_at || "").getTime();
      const rightTime = new Date(right?.created_at || "").getTime();
      return (Number.isNaN(rightTime) ? 0 : rightTime) - (Number.isNaN(leftTime) ? 0 : leftTime);
    });
}

function createVideoEditorState(video) {
  return {
    title: video?.title || "",
    description: video?.description || "",
    status: String(video?.status || "draft"),
  };
}

export default function AdminVideos({ onNavigate, token, user, onLogout }) {
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [streamFilter, setStreamFilter] = useState("all");
  const [sortConfig, setSortConfig] = useState({ key: "created_at", direction: "desc" });
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [videos, setVideos] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [usingMock, setUsingMock] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [editingVideo, setEditingVideo] = useState(null);
  const [editorState, setEditorState] = useState(createVideoEditorState(null));
  const [confirm, setConfirm] = useState(null);
  const [savingVideoId, setSavingVideoId] = useState(null);
  const [deletingVideoId, setDeletingVideoId] = useState(null);

  useEffect(() => {
    if (!token) return undefined;

    let isCancelled = false;
    const loadRestaurants = async () => {
      try {
        const response = await api.getAdminRestaurants(token);
        if (isCancelled) return;
        const nextRestaurants =
          Array.isArray(response?.items) && response.items.length
            ? response.items
            : mockAdminData.restaurants;
        setRestaurants(nextRestaurants);
      } catch {
        if (isCancelled) return;
        setRestaurants(mockAdminData.restaurants);
      }
    };

    loadRestaurants();
    return () => {
      isCancelled = true;
    };
  }, [token]);

  useEffect(() => {
    setPage(1);
  }, [selectedRestaurantId, search, statusFilter, streamFilter, createdFrom, createdTo, pageSize]);

  const handleSort = (key) => {
    setSortConfig((previous) => toggleSortConfig(previous, key));
  };

  const restaurantOptions = useMemo(
    () =>
      restaurants
        .map((restaurant) => ({
          value: toId(restaurant?.id),
          label: restaurant?.name || `Restaurant #${restaurant?.id || "-"}`,
        }))
        .sort((left, right) => left.label.localeCompare(right.label)),
    [restaurants]
  );

  useEffect(() => {
    if (!token) return undefined;

    let isCancelled = false;
    const loadVideos = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await api.getAdminVideos(token, {
          page,
          perPage: pageSize,
          search,
          restaurantId: selectedRestaurantId || undefined,
          status: statusFilter === "all" ? undefined : statusFilter,
          streamState: streamFilter === "all" ? undefined : streamFilter,
          createdFrom: createdFrom || undefined,
          createdTo: createdTo || undefined,
        });

        if (isCancelled) return;

        const nextVideos = (response?.items || []).map((video) => normalizeVideo(video));
        setVideos(nextVideos);
        setTotal(Number(response?.meta?.total || nextVideos.length));
        setUsingMock(false);
      } catch (requestError) {
        if (isCancelled) return;

        const filtered = filterVideos(
          (mockAdminData.videos || []).map((video) => normalizeVideo(video)),
          {
            selectedRestaurantId,
            search,
            statusFilter,
            streamFilter,
            createdFrom,
            createdTo,
          }
        );

        const start = (page - 1) * pageSize;
        const paged = filtered.slice(start, start + pageSize);

        setVideos(paged);
        setTotal(filtered.length);
        setUsingMock(true);
        setError(requestError?.message || "Admin videos endpoint is not available yet.");
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };

    loadVideos();
    return () => {
      isCancelled = true;
    };
  }, [
    token,
    page,
    pageSize,
    search,
    selectedRestaurantId,
    statusFilter,
    streamFilter,
    createdFrom,
    createdTo,
  ]);

  const sortedVideos = useMemo(
    () =>
      sortRows(videos, sortConfig, (video, key) => {
        if (key === "id") return video?.id;
        if (key === "title") return video?.title;
        if (key === "restaurant") return restaurantLabel(video);
        if (key === "menu_item") return menuItemLabel(video);
        if (key === "status") return video?.status;
        if (key === "stream") return video?.stream_ready ? "ready" : (video?.stream_status || "processing");
        if (key === "created_at") return video?.created_at;
        if (key === "performance") return Number(video?.views_count || 0);
        return video?.[key];
      }),
    [videos, sortConfig]
  );

  const updateVideoState = (nextVideo) => {
    const normalized = normalizeVideo(nextVideo);
    setVideos((previous) =>
      previous.map((video) => (video.id === normalized.id ? normalized : video))
    );
    setSelectedVideo((previous) => (previous?.id === normalized.id ? normalized : previous));
    setEditingVideo((previous) => (previous?.id === normalized.id ? normalized : previous));
  };

  const removeVideoState = (videoId) => {
    setVideos((previous) => previous.filter((video) => video.id !== videoId));
    setSelectedVideo((previous) => (previous?.id === videoId ? null : previous));
    setEditingVideo((previous) => (previous?.id === videoId ? null : previous));
    setTotal((previous) => Math.max(0, previous - 1));
  };

  const openEditModal = (video) => {
    setEditingVideo(video);
    setEditorState(createVideoEditorState(video));
    setError("");
  };

  const handleSaveVideo = async () => {
    if (!editingVideo?.id) return;

    const title = editorState.title.trim();
    if (!title) {
      setError("Video title is required.");
      return;
    }

    setSavingVideoId(editingVideo.id);
    setError("");

    const description = editorState.description.trim();
    try {
      if (usingMock) {
        const fallbackSource = videos.find((video) => video.id === editingVideo.id) || editingVideo;
        const nextStatus = editorState.status || fallbackSource.status || "draft";
        const nowIso = new Date().toISOString();
        const nextVideo = normalizeVideo({
          ...fallbackSource,
          title,
          description,
          status: nextStatus,
          published_at:
            nextStatus === "published"
              ? fallbackSource.published_at || nowIso
              : null,
          updated_at: nowIso,
        });

        updateVideoState(nextVideo);
      } else {
        const updated = await api.updateAdminVideo(token, editingVideo.id, {
          title,
          description: description || null,
          status: editorState.status,
        });
        updateVideoState(updated);
      }

      setSuccess(`Video #${editingVideo.id} updated.`);
      setEditingVideo(null);
    } catch (requestError) {
      setError(requestError?.message || "Failed to update video.");
    } finally {
      setSavingVideoId(null);
    }
  };

  const confirmDeleteVideo = (video) => {
    if (!video?.id) return;

    setConfirm({
      title: "Delete Video",
      message: `Video #${video.id} will be permanently removed from the feed.`,
      confirmLabel: "Delete",
      onConfirm: async () => {
        setDeletingVideoId(video.id);
        setError("");

        try {
          if (!usingMock) {
            await api.deleteAdminVideo(token, video.id);
          }

          removeVideoState(video.id);
          setSuccess(`Video #${video.id} deleted.`);
          setConfirm(null);
        } catch (requestError) {
          setError(requestError?.message || "Failed to delete video.");
        } finally {
          setDeletingVideoId(null);
        }
      },
    });
  };

  return (
    <AdminShell
      activePage="adminVideos"
      onNavigate={onNavigate}
      user={user}
      onLogout={onLogout}
      title="Videos Moderation"
      headerActions={<SearchField value={search} onChange={setSearch} placeholder="Search videos, restaurants, menu items..." />}
    >
      {usingMock ? (
        <Alert type="warning">{error} Showing placeholder videos.</Alert>
      ) : (
        <Alert>{error}</Alert>
      )}
      <Alert type="success">{success}</Alert>

      <div className="mb-5 flex flex-wrap items-end gap-3">
        <SearchableSelect
          label="Restaurant"
          value={selectedRestaurantId}
          options={restaurantOptions}
          onChange={setSelectedRestaurantId}
          placeholder="Select restaurant"
        />
        <FilterSelect label="Status" value={statusFilter} options={VIDEO_STATUS_OPTIONS} onChange={setStatusFilter} />
        <FilterSelect label="Stream" value={streamFilter} options={STREAM_STATE_OPTIONS} onChange={setStreamFilter} />
        <label className="text-sm">
          <span className="font-semibold text-slate-500">From Date</span>
          <input
            className="mt-2 rounded-lg border-none bg-white px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-primary/20"
            type="date"
            value={createdFrom}
            onChange={(event) => setCreatedFrom(event.target.value)}
          />
        </label>
        <label className="text-sm">
          <span className="font-semibold text-slate-500">To Date</span>
          <input
            className="mt-2 rounded-lg border-none bg-white px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-primary/20"
            type="date"
            value={createdTo}
            onChange={(event) => setCreatedTo(event.target.value)}
          />
        </label>
      </div>

      <TableShell>
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
            <tr>
              <SortableTh label="Video ID" sortKey="id" sortConfig={sortConfig} onSort={handleSort} />
              <SortableTh label="Preview" sortKey="title" sortConfig={sortConfig} onSort={handleSort} />
              <SortableTh label="Restaurant" sortKey="restaurant" sortConfig={sortConfig} onSort={handleSort} />
              <SortableTh label="Menu Item" sortKey="menu_item" sortConfig={sortConfig} onSort={handleSort} />
              <SortableTh label="Status" sortKey="status" sortConfig={sortConfig} onSort={handleSort} />
              <SortableTh label="Stream" sortKey="stream" sortConfig={sortConfig} onSort={handleSort} />
              <SortableTh label="Created" sortKey="created_at" sortConfig={sortConfig} onSort={handleSort} />
              <SortableTh label="Performance" sortKey="performance" sortConfig={sortConfig} onSort={handleSort} />
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-primary/5">
            {sortedVideos.length ? (
              sortedVideos.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-bold text-primary">#{row.id}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {row.thumbnail_url ? (
                        <img
                          className="h-12 w-16 rounded-lg object-cover"
                          src={row.thumbnail_url}
                          alt={row.title || "Video thumbnail"}
                        />
                      ) : (
                        <div className="flex h-12 w-16 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                          <span className="material-symbols-outlined text-base">movie</span>
                        </div>
                      )}
                      <div>
                        <p className="max-w-[18rem] truncate text-sm font-semibold text-slate-900">{row.title}</p>
                        <p className="max-w-[18rem] truncate text-xs text-slate-500">{row.description || "-"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700">{restaurantLabel(row)}</td>
                  <td className="px-6 py-4 text-sm text-slate-700">{menuItemLabel(row)}</td>
                  <td className="px-6 py-4"><StatusBadge value={row.status || "draft"} /></td>
                  <td className="px-6 py-4">
                    <StatusBadge
                      value={row.stream_ready ? "active" : "pending"}
                      label={row.stream_ready ? "Ready" : normalizeStatus(row.stream_status || "processing")}
                    />
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">{formatDate(row.created_at)}</td>
                  <td className="px-6 py-4 text-xs text-slate-600">
                    <p>Views: <strong>{row.views_count}</strong></p>
                    <p>Likes: <strong>{row.likes_count}</strong></p>
                    <p>Shares: <strong>{row.shares_count}</strong></p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <ActionButton icon="visibility" onClick={() => setSelectedVideo(row)}>
                        View
                      </ActionButton>
                      <ActionButton
                        icon="edit"
                        tone="primary"
                        disabled={savingVideoId === row.id || deletingVideoId === row.id}
                        onClick={() => openEditModal(row)}
                      >
                        Edit
                      </ActionButton>
                      <ActionButton
                        icon="delete"
                        tone="danger"
                        disabled={savingVideoId === row.id || deletingVideoId === row.id}
                        onClick={() => confirmDeleteVideo(row)}
                      >
                        Delete
                      </ActionButton>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9}>
                  <EmptyState loading={loading} loadingMessage="Loading videos..." message="No videos found." />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </TableShell>

      <PaginationControls
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />

      {selectedVideo ? (
        <Modal
          title={selectedVideo.title || `Video #${selectedVideo.id}`}
          subtitle={`Video #${selectedVideo.id}`}
          onClose={() => setSelectedVideo(null)}
          footer={
            <>
              <ActionButton
                icon="edit"
                tone="primary"
                disabled={savingVideoId === selectedVideo.id || deletingVideoId === selectedVideo.id}
                onClick={() => openEditModal(selectedVideo)}
              >
                Edit Caption
              </ActionButton>
              <ActionButton
                icon="delete"
                tone="danger"
                disabled={savingVideoId === selectedVideo.id || deletingVideoId === selectedVideo.id}
                onClick={() => confirmDeleteVideo(selectedVideo)}
              >
                Delete
              </ActionButton>
            </>
          }
        >
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Restaurant</p><p className="mt-1 font-semibold">{restaurantLabel(selectedVideo)}</p></div>
              <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Menu Item</p><p className="mt-1 font-semibold">{menuItemLabel(selectedVideo)}</p></div>
              <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Status</p><p className="mt-1 font-semibold">{normalizeStatus(selectedVideo.status)}</p></div>
              <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Stream</p><p className="mt-1 font-semibold">{selectedVideo.stream_ready ? "Ready" : normalizeStatus(selectedVideo.stream_status || "processing")}</p></div>
              <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Duration</p><p className="mt-1 font-semibold">{selectedVideo.duration_seconds ? `${selectedVideo.duration_seconds}s` : "-"}</p></div>
              <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Published</p><p className="mt-1 font-semibold">{formatDateTime(selectedVideo.published_at)}</p></div>
              <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Created</p><p className="mt-1 font-semibold">{formatDateTime(selectedVideo.created_at)}</p></div>
              <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Updated</p><p className="mt-1 font-semibold">{formatDateTime(selectedVideo.updated_at)}</p></div>
              <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Views</p><p className="mt-1 font-semibold">{selectedVideo.views_count}</p></div>
              <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Likes</p><p className="mt-1 font-semibold">{selectedVideo.likes_count}</p></div>
              <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Shares</p><p className="mt-1 font-semibold">{selectedVideo.shares_count}</p></div>
              <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Comments</p><p className="mt-1 font-semibold">{selectedVideo.comments_count}</p></div>
            </div>
            {selectedVideo.description ? (
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase text-slate-500">Description</p>
                <p className="mt-2 text-slate-700">{selectedVideo.description}</p>
              </div>
            ) : null}
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-500">Media URL</p>
              <p className="mt-1 break-all font-semibold">{selectedVideo.media_url || "-"}</p>
              <p className="mt-3 text-xs font-bold uppercase text-slate-500">HLS URL</p>
              <p className="mt-1 break-all font-semibold">{selectedVideo.stream_hls_url || "-"}</p>
            </div>
          </div>
        </Modal>
      ) : null}

      {editingVideo ? (
        <Modal
          title={`Edit Video #${editingVideo.id}`}
          subtitle="Update caption text and feed visibility."
          onClose={() => setEditingVideo(null)}
          maxWidth="max-w-xl"
          footer={
            <>
              <ActionButton onClick={() => setEditingVideo(null)}>Cancel</ActionButton>
              <ActionButton
                tone="primary"
                icon="save"
                disabled={savingVideoId === editingVideo.id}
                onClick={handleSaveVideo}
              >
                {savingVideoId === editingVideo.id ? "Saving..." : "Save"}
              </ActionButton>
            </>
          }
        >
          <div className="space-y-4 text-sm">
            <label className="block">
              <span className="text-xs font-bold uppercase text-slate-500">Title</span>
              <input
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary/30 focus:ring-2 focus:ring-primary/20"
                type="text"
                value={editorState.title}
                onChange={(event) =>
                  setEditorState((previous) => ({ ...previous, title: event.target.value }))
                }
                placeholder="Video title"
              />
            </label>
            <label className="block">
              <span className="text-xs font-bold uppercase text-slate-500">Caption</span>
              <textarea
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary/30 focus:ring-2 focus:ring-primary/20"
                rows={5}
                value={editorState.description}
                onChange={(event) =>
                  setEditorState((previous) => ({ ...previous, description: event.target.value }))
                }
                placeholder="Write or edit the video caption"
              />
            </label>
            <label className="block">
              <span className="text-xs font-bold uppercase text-slate-500">Status</span>
              <select
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary/30 focus:ring-2 focus:ring-primary/20"
                value={editorState.status}
                onChange={(event) =>
                  setEditorState((previous) => ({ ...previous, status: event.target.value }))
                }
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </label>
          </div>
        </Modal>
      ) : null}

      <ConfirmModal {...(confirm || {})} onCancel={() => setConfirm(null)} />
    </AdminShell>
  );
}

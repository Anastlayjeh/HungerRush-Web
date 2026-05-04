import { useEffect, useState } from "react";
import AdminShell from "../../components/AdminShell.jsx";
import {
  ActionButton,
  Alert,
  ConfirmModal,
  EmptyState,
  Modal,
  PaginationControls,
  SearchField,
  StatusBadge,
  TableShell,
  formatDate,
} from "../../components/admin/AdminUI.jsx";
import { api } from "../../lib/api.js";
import { mockAdminData } from "../../lib/adminData.js";

function registrationStatus(value) {
  return String(value || "pending");
}

function restaurantName(registration) {
  return registration?.restaurant_name || registration?.name || "Unnamed Restaurant";
}

function ownerName(registration) {
  return registration?.owner?.name || registration?.owner_name || `Owner #${registration?.owner_user_id || "-"}`;
}

function contactInfo(registration) {
  return (
    registration?.contact_email ||
    registration?.contact_phone ||
    registration?.owner?.email ||
    registration?.owner?.phone ||
    registration?.email ||
    registration?.phone ||
    "-"
  );
}

function createdTimestamp(value) {
  const date = new Date(value || "");
  const time = date.getTime();
  return Number.isNaN(time) ? Number.POSITIVE_INFINITY : time;
}

function waitingDays(value) {
  const createdAt = new Date(value || "");
  if (Number.isNaN(createdAt.getTime())) return "-";
  const diff = Date.now() - createdAt.getTime();
  return Math.max(0, Math.floor(diff / 86400000));
}

export default function AdminNewRestaurants({ onNavigate, token, user, onLogout }) {
  const [registrations, setRegistrations] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [usingMock, setUsingMock] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [updatingRegistrationId, setUpdatingRegistrationId] = useState(null);

  useEffect(() => {
    setPage(1);
  }, [search, pageSize]);

  useEffect(() => {
    if (!token) return undefined;

    let isCancelled = false;
    const loadRegistrations = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await api.getAdminRestaurantRegistrations(token, {
          page,
          perPage: pageSize,
          search,
          status: "pending",
        });

        if (!isCancelled) {
          setRegistrations(Array.isArray(response?.items) ? response.items : []);
          setTotal(Number(response?.meta?.total || 0));
          setUsingMock(false);
        }
      } catch (requestError) {
        if (isCancelled) return;

        const normalizedSearch = search.trim().toLowerCase();
        const fallbackList = (mockAdminData.restaurantRegistrations || [])
          .filter((registration) => registrationStatus(registration?.status) === "pending")
          .filter((registration) => {
            if (!normalizedSearch) return true;

            return (
              String(registration?.id || "").includes(normalizedSearch) ||
              String(restaurantName(registration)).toLowerCase().includes(normalizedSearch) ||
              String(ownerName(registration)).toLowerCase().includes(normalizedSearch) ||
              String(contactInfo(registration)).toLowerCase().includes(normalizedSearch)
            );
          })
          .sort((left, right) => createdTimestamp(left?.created_at) - createdTimestamp(right?.created_at));

        const start = (page - 1) * pageSize;
        const paged = fallbackList.slice(start, start + pageSize);

        setRegistrations(paged);
        setTotal(fallbackList.length);
        setUsingMock(true);
        setError(requestError?.message || "Restaurant registration endpoint is not available yet.");
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };

    loadRegistrations();
    return () => {
      isCancelled = true;
    };
  }, [token, page, pageSize, search]);

  const updateRegistrationStatus = async (registration, nextStatus, reviewNote) => {
    if (!registration?.id) return;

    setUpdatingRegistrationId(registration.id);
    setError("");

    try {
      if (usingMock) {
        setRegistrations((previous) => previous.filter((current) => current.id !== registration.id));
        setSelectedRegistration((previous) => (previous?.id === registration.id ? null : previous));
        setTotal((previous) => Math.max(0, previous - 1));
      } else {
        await api.updateAdminRestaurantRegistration(token, registration.id, {
          status: nextStatus,
          review_note: reviewNote || undefined,
        });
        setRegistrations((previous) => previous.filter((current) => current.id !== registration.id));
        setSelectedRegistration((previous) => (previous?.id === registration.id ? null : previous));
        setTotal((previous) => Math.max(0, previous - 1));
      }

      setSuccess(`${restaurantName(registration)} was ${nextStatus}.`);
      setConfirm(null);
    } catch (requestError) {
      setError(requestError?.message || "Failed to update registration.");
    } finally {
      setUpdatingRegistrationId(null);
    }
  };

  return (
    <AdminShell
      activePage="adminNewRestaurants"
      onNavigate={onNavigate}
      user={user}
      onLogout={onLogout}
      title="New Registrations"
      headerActions={<SearchField value={search} onChange={setSearch} placeholder="Search pending restaurants..." />}
    >
      {usingMock ? (
        <Alert type="warning">{error || "Showing placeholder restaurants for approval queue."}</Alert>
      ) : (
        <Alert>{error}</Alert>
      )}
      <Alert type="success">{success}</Alert>

      <div className="mb-4 rounded-xl border border-primary/10 bg-white px-4 py-3 text-sm text-slate-600">
        Pending registrations are ordered by earliest submission date first.
      </div>

      <TableShell>
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
            <tr>
              <th className="px-6 py-4">Request ID</th>
              <th className="px-6 py-4">Restaurant</th>
              <th className="px-6 py-4">Owner</th>
              <th className="px-6 py-4">Email / Contact</th>
              <th className="px-6 py-4">Registered</th>
              <th className="px-6 py-4">Waiting Days</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-primary/5">
            {registrations.length ? (
              registrations.map((registration) => (
                <tr key={registration.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-bold text-primary">#{registration.id}</td>
                  <td className="px-6 py-4 font-semibold">{restaurantName(registration)}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{ownerName(registration)}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{contactInfo(registration)}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{formatDate(registration.created_at)}</td>
                  <td className="px-6 py-4 text-sm font-semibold">{waitingDays(registration.created_at)}</td>
                  <td className="px-6 py-4"><StatusBadge value="pending" /></td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <ActionButton icon="visibility" onClick={() => setSelectedRegistration(registration)}>View</ActionButton>
                      <ActionButton
                        tone="success"
                        icon="check_circle"
                        disabled={updatingRegistrationId === registration.id}
                        onClick={() => updateRegistrationStatus(registration, "approved", "Approved from admin panel.")}
                      >
                        Approve
                      </ActionButton>
                      <ActionButton
                        tone="danger"
                        icon="cancel"
                        disabled={updatingRegistrationId === registration.id}
                        onClick={() =>
                          setConfirm({
                            title: "Reject Restaurant Registration",
                            message: `${restaurantName(registration)} will be rejected and removed from the approval queue.`,
                            confirmLabel: "Reject",
                            onConfirm: () =>
                              updateRegistrationStatus(registration, "rejected", "Rejected from admin panel."),
                          })
                        }
                      >
                        Reject
                      </ActionButton>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8}>
                  <EmptyState
                    loading={loading}
                    loadingMessage="Loading pending registrations..."
                    message="No pending restaurant registrations found."
                  />
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

      {selectedRegistration ? (
        <Modal
          title={restaurantName(selectedRegistration)}
          subtitle={`Request #${selectedRegistration.id}`}
          onClose={() => setSelectedRegistration(null)}
        >
          <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-1 font-semibold">{ownerName(selectedRegistration)}</p></div>
            <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Contact</p><p className="mt-1 font-semibold">{contactInfo(selectedRegistration)}</p></div>
            <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Registered</p><p className="mt-1 font-semibold">{formatDate(selectedRegistration.created_at)}</p></div>
            <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Waiting Days</p><p className="mt-1 font-semibold">{waitingDays(selectedRegistration.created_at)}</p></div>
            <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner User ID</p><p className="mt-1 font-semibold">#{selectedRegistration.owner_user_id || "-"}</p></div>
            <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Status</p><p className="mt-1 font-semibold">{registrationStatus(selectedRegistration.status)}</p></div>
            <div className="rounded-xl bg-slate-50 p-4 md:col-span-2"><p className="text-xs font-bold uppercase text-slate-500">Description</p><p className="mt-1 text-slate-700">{selectedRegistration.description || "No description available."}</p></div>
            {selectedRegistration.review_note ? (
              <div className="rounded-xl bg-slate-50 p-4 md:col-span-2"><p className="text-xs font-bold uppercase text-slate-500">Review Note</p><p className="mt-1 text-slate-700">{selectedRegistration.review_note}</p></div>
            ) : null}
          </div>
        </Modal>
      ) : null}

      <ConfirmModal {...(confirm || {})} onCancel={() => setConfirm(null)} />
    </AdminShell>
  );
}

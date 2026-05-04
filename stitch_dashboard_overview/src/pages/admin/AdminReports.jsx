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
  SearchField,
  StatusBadge,
  TableShell,
  formatDate,
  normalizeStatus,
} from "../../components/admin/AdminUI.jsx";
import { api } from "../../lib/api.js";
import { mockAdminData } from "../../lib/adminData.js";

const REPORT_STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "open", label: "Pending" },
  { value: "reviewing", label: "Reviewed" },
  { value: "resolved", label: "Resolved" },
  { value: "dismissed", label: "Dismissed" },
];

const REPORT_TYPE_OPTIONS = [
  { value: "all", label: "All Types" },
  { value: "Restaurant", label: "Restaurant" },
  { value: "Menu Item", label: "Menu Item" },
  { value: "Review", label: "Review" },
  { value: "User", label: "User" },
  { value: "Video", label: "Video" },
  { value: "Image", label: "Image" },
  { value: "Order", label: "Order" },
];

function reportType(report) {
  if (report?.reported_item_type) return report.reported_item_type;
  if (report?.restaurant_id) return "Restaurant";
  if (report?.order_id) return "Order";
  return "User";
}

function reportReason(report) {
  return report?.subject || report?.message || "Reported content";
}

function reporterName(report) {
  return report?.reporter?.name || report?.reported_by || `User #${report?.reporter_user_id || "-"}`;
}

function reportedRestaurantName(report) {
  if (report?.restaurant?.name) return report.restaurant.name;
  if (report?.restaurant_name) return report.restaurant_name;
  if (report?.restaurant_id) return `Restaurant #${report.restaurant_id}`;
  return "-";
}

function reportStatusLabel(status) {
  if (status === "open") return "Pending";
  if (status === "reviewing") return "Reviewed";
  return normalizeStatus(status);
}

export default function AdminReports({ onNavigate, token, user, onLogout }) {
  const [reports, setReports] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [usingMock, setUsingMock] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [updatingReportId, setUpdatingReportId] = useState(null);

  useEffect(() => {
    if (!token) return undefined;

    let isCancelled = false;
    const loadReports = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await api.getAdminReports(token);
        if (!isCancelled) {
          setReports(response.items.length ? response.items : []);
          setUsingMock(false);
        }
      } catch (requestError) {
        if (!isCancelled) {
          setReports(mockAdminData.reports);
          setUsingMock(true);
          setError(requestError?.message || "Admin reports endpoint is not available yet.");
        }
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };

    loadReports();
    return () => {
      isCancelled = true;
    };
  }, [token]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, typeFilter, pageSize]);

  const filteredReports = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return reports.filter((report) => {
      const type = reportType(report);
      const status = String(report?.status || "open");
      const matchesType = typeFilter === "all" || type === typeFilter;
      const matchesStatus = statusFilter === "all" || status === statusFilter;
      const matchesSearch =
        !normalizedSearch ||
        String(report?.id || "").includes(normalizedSearch) ||
        String(reportReason(report)).toLowerCase().includes(normalizedSearch) ||
        String(reporterName(report)).toLowerCase().includes(normalizedSearch) ||
        String(reportedRestaurantName(report)).toLowerCase().includes(normalizedSearch) ||
        String(type).toLowerCase().includes(normalizedSearch);

      return matchesType && matchesStatus && matchesSearch;
    });
  }, [reports, search, statusFilter, typeFilter]);

  const visibleReports = useMemo(
    () => filteredReports.slice((page - 1) * pageSize, page * pageSize),
    [filteredReports, page, pageSize]
  );

  const replaceReport = (updatedReport) => {
    setReports((previous) =>
      previous.map((current) => (current.id === updatedReport.id ? { ...current, ...updatedReport } : current))
    );
  };

  const updateReportStatus = async (report, status, resolution) => {
    if (!report?.id) return;

    setUpdatingReportId(report.id);
    setError("");
    try {
      if (usingMock) {
        replaceReport({ ...report, status, resolution: resolution || report.resolution });
      } else {
        const updatedReport = await api.updateAdminReport(token, report.id, {
          status,
          resolution: resolution || undefined,
        });
        replaceReport(updatedReport);
      }
      setSuccess(`Report #${report.id} was marked ${reportStatusLabel(status).toLowerCase()}.`);
    } catch (requestError) {
      setError(requestError?.message || "Failed to update report.");
    } finally {
      setUpdatingReportId(null);
      setConfirm(null);
    }
  };

  return (
    <AdminShell
      activePage="adminReports"
      onNavigate={onNavigate}
      user={user}
      onLogout={onLogout}
      title="Reports and Moderation"
      headerActions={<SearchField value={search} onChange={setSearch} placeholder="Search reports..." />}
    >
      {usingMock ? <Alert type="warning">{error} Showing placeholder reports.</Alert> : <Alert>{error}</Alert>}
      <Alert type="success">{success}</Alert>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <FilterSelect label="Type" value={typeFilter} options={REPORT_TYPE_OPTIONS} onChange={setTypeFilter} />
        <FilterSelect label="Status" value={statusFilter} options={REPORT_STATUS_OPTIONS} onChange={setStatusFilter} />
      </div>

      <TableShell>
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
            <tr>
              <th className="px-6 py-4">Report ID</th>
              <th className="px-6 py-4">Reported Item Type</th>
              <th className="px-6 py-4">Report Reason</th>
              <th className="px-6 py-4">Reported Restaurant</th>
              <th className="px-6 py-4">Reported By</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Created</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-primary/5">
            {visibleReports.length ? (
              visibleReports.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-bold text-primary">#{row.id}</td>
                  <td className="px-6 py-4 text-sm font-semibold">{reportType(row)}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{reportReason(row)}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{reportedRestaurantName(row)}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{reporterName(row)}</td>
                  <td className="px-6 py-4"><StatusBadge value={row.status || "open"} label={reportStatusLabel(row.status || "open")} /></td>
                  <td className="px-6 py-4 text-sm text-slate-500">{formatDate(row.created_at)}</td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <ActionButton icon="visibility" onClick={() => setSelectedReport(row)}>View</ActionButton>
                      <ActionButton
                        icon="fact_check"
                        disabled={updatingReportId === row.id}
                        onClick={() => updateReportStatus(row, "reviewing", "Marked reviewed from the admin panel.")}
                      >
                        Reviewed
                      </ActionButton>
                      <ActionButton
                        tone="danger"
                        icon="delete_forever"
                        onClick={() =>
                          setConfirm({
                            title: "Remove Reported Content",
                            message: "This is a placeholder action. Connect a moderation delete endpoint before removing content from production.",
                            confirmLabel: "Acknowledge",
                            onConfirm: () => {
                              setSuccess(`Removal placeholder acknowledged for report #${row.id}.`);
                              setConfirm(null);
                            },
                          })
                        }
                      >
                        Remove
                      </ActionButton>
                      <ActionButton
                        tone="success"
                        icon="done_all"
                        disabled={updatingReportId === row.id}
                        onClick={() => updateReportStatus(row, "resolved", "Resolved from the admin panel.")}
                      >
                        Resolve
                      </ActionButton>
                      <ActionButton
                        tone="danger"
                        icon="close"
                        disabled={updatingReportId === row.id}
                        onClick={() =>
                          setConfirm({
                            title: "Dismiss Report",
                            message: `Dismiss report #${row.id}?`,
                            confirmLabel: "Dismiss",
                            onConfirm: () => updateReportStatus(row, "dismissed", "Dismissed from the admin panel."),
                          })
                        }
                      >
                        Dismiss
                      </ActionButton>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8}>
                  <EmptyState loading={loading} loadingMessage="Loading reports..." message="No reports found." />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </TableShell>

      <PaginationControls page={page} pageSize={pageSize} total={filteredReports.length} onPageChange={setPage} onPageSizeChange={setPageSize} />

      {selectedReport ? (
        <Modal title={`Report #${selectedReport.id}`} subtitle={reportType(selectedReport)} onClose={() => setSelectedReport(null)}>
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Reporter</p><p className="mt-1 font-semibold">{reporterName(selectedReport)}</p></div>
              <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Reported Restaurant</p><p className="mt-1 font-semibold">{reportedRestaurantName(selectedReport)}</p></div>
              <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Status</p><p className="mt-1 font-semibold">{reportStatusLabel(selectedReport.status || "open")}</p></div>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-500">Reason</p>
              <p className="mt-1 font-semibold">{selectedReport.subject || "Reported content"}</p>
              <p className="mt-2 text-slate-700">{selectedReport.message || "No additional details were provided."}</p>
            </div>
            {selectedReport.resolution ? (
              <div className="rounded-xl bg-green-50 p-4 text-green-800">
                <p className="text-xs font-bold uppercase">Resolution</p>
                <p className="mt-1">{selectedReport.resolution}</p>
              </div>
            ) : null}
          </div>
        </Modal>
      ) : null}

      <ConfirmModal {...(confirm || {})} onCancel={() => setConfirm(null)} />
    </AdminShell>
  );
}

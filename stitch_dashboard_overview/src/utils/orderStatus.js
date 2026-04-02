const STATUS_LABELS = {
  pending: "Pending",
  accepted: "Accepted",
  rejected: "Rejected",
  preparing: "Preparing",
  ready_for_pickup: "Ready for Pickup",
  picked_up: "Picked Up",
  on_the_way: "On the Way",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const STATUS_BADGE_CLASSES = {
  pending: "bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400",
  accepted: "bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400",
  rejected: "bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400",
  preparing: "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400",
  ready_for_pickup: "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400",
  picked_up: "bg-cyan-100 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400",
  on_the_way: "bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400",
  delivered: "bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400",
  cancelled: "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300",
};

export const ORDER_NEXT_STATUS = {
  pending: "accepted",
  accepted: "preparing",
  preparing: "ready_for_pickup",
  ready_for_pickup: "picked_up",
  picked_up: "on_the_way",
  on_the_way: "delivered",
};

export const ORDER_ACTION_LABEL = {
  accepted: "Accept",
  preparing: "Start Preparing",
  ready_for_pickup: "Mark Ready",
  picked_up: "Mark Picked Up",
  on_the_way: "Out for Delivery",
  delivered: "Mark Delivered",
};

export const ACTIVE_ORDER_STATUSES = new Set([
  "pending",
  "accepted",
  "preparing",
  "ready_for_pickup",
  "picked_up",
  "on_the_way",
]);

export function getOrderStatusLabel(status) {
  return STATUS_LABELS[status] || "Unknown";
}

export function getOrderStatusClass(status) {
  return (
    STATUS_BADGE_CLASSES[status] ||
    "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
  );
}

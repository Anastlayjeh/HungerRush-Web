import { useEffect, useMemo, useState } from "react";
import RestaurantShell from "../components/RestaurantShell.jsx";
import { api } from "../lib/api.js";
import { downloadCsv } from "../utils/download.js";

const RANGES = [7, 30, 90];

const toCurrency = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const toNumber = (value) => new Intl.NumberFormat("en-US").format(Number(value || 0));

const toPercent = (value) => `${Number(value || 0).toFixed(1)}%`;

function metricChangeClass(change) {
  return Number(change || 0) >= 0
    ? "bg-emerald-100 text-emerald-700"
    : "bg-red-100 text-red-700";
}

export default function AnalyticsInsights({ onNavigate, token, user, onLogout }) {
  const [range, setRange] = useState(30);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return undefined;
    let isCancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const payload = await api.getAnalytics(token, range);
        if (!isCancelled) setAnalytics(payload || null);
      } catch (requestError) {
        if (!isCancelled) setError(requestError?.message || "Failed to load analytics.");
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };

    load();
    return () => {
      isCancelled = true;
    };
  }, [token, range]);

  const metrics = analytics?.metrics || {};
  const revenueTrend = analytics?.revenue_trend || [];
  const topDishes = analytics?.top_dishes || [];
  const funnel = analytics?.video_funnel || {};
  const retention = analytics?.retention || {};
  const topVideo = analytics?.top_video || null;
  const orderSplit = analytics?.order_split || {};

  const maxRevenue = useMemo(
    () => Math.max(1, ...revenueTrend.map((point) => Number(point?.revenue || 0))),
    [revenueTrend]
  );

  const funnelRows = useMemo(() => {
    const videoViews = Number(funnel.video_views || 0);
    const itemClicks = Number(funnel.item_clicks || 0);
    const addedToCart = Number(funnel.added_to_cart || 0);
    const ordersCompleted = Number(funnel.orders_completed || 0);
    const safeBase = Math.max(1, videoViews);

    const rows = [
      ["Video Views", videoViews],
      ["Item Clicks", itemClicks],
      ["Added to Cart", addedToCart],
      ["Orders Completed", ordersCompleted],
    ];

    return rows.map(([label, value], index) => ({
      label,
      value,
      percent: Math.max(4, Math.round((Number(value) / safeBase) * 100)),
      barClass:
        index === 0
          ? "bg-primary"
          : index === 1
            ? "bg-primary/70"
            : index === 2
              ? "bg-primary/50"
              : "bg-primary/30",
    }));
  }, [funnel]);

  const exportRevenueCsv = () => {
    downloadCsv(
      `analytics-revenue-${range}d.csv`,
      ["Day", "Revenue", "Orders Count"],
      revenueTrend.map((row) => [row.day, row.revenue, row.orders_count])
    );
  };

  const deliveryCount = Number(orderSplit.delivery || 0);
  const pickupCount = Number(orderSplit.pickup || 0);
  const splitTotal = Math.max(1, deliveryCount + pickupCount);
  const deliveryWidth = Math.round((deliveryCount / splitTotal) * 100);
  const pickupWidth = 100 - deliveryWidth;

  return (
    <RestaurantShell
      activePage="analytics"
      onNavigate={onNavigate}
      user={user}
      onLogout={onLogout}
      title="Detailed Analytics"
      headerActions={
        <>
          <div className="flex bg-slate-100 p-1 rounded-lg">
            {RANGES.map((days) => (
              <button
                key={days}
                className={
                  range === days
                    ? "px-3 py-1.5 text-sm font-semibold rounded-md bg-white shadow-sm"
                    : "px-3 py-1.5 text-sm font-semibold rounded-md hover:bg-white/70"
                }
                type="button"
                onClick={() => setRange(days)}
              >
                {days} Days
              </button>
            ))}
          </div>
          <button
            className="flex items-center gap-2 px-4 py-2 border border-primary/20 rounded-lg hover:bg-primary/5 text-sm font-semibold"
            type="button"
            onClick={exportRevenueCsv}
          >
            <span className="material-symbols-outlined text-sm">download</span>
            Export
          </button>
        </>
      }
    >
      {error ? (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">
          {error}
        </div>
      ) : null}

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border border-primary/10"><p className="text-sm text-slate-500">Total Revenue</p><p className="text-2xl font-black mt-1">{loading ? "..." : toCurrency(metrics.total_revenue?.value)}</p><span className={`inline-block mt-3 text-xs font-bold px-2 py-1 rounded ${metricChangeClass(metrics.total_revenue?.change_percent)}`}>{toPercent(metrics.total_revenue?.change_percent)}</span></div>
        <div className="bg-white p-6 rounded-xl border border-primary/10"><p className="text-sm text-slate-500">Order Volume</p><p className="text-2xl font-black mt-1">{loading ? "..." : toNumber(metrics.order_volume?.value)}</p><span className={`inline-block mt-3 text-xs font-bold px-2 py-1 rounded ${metricChangeClass(metrics.order_volume?.change_percent)}`}>{toPercent(metrics.order_volume?.change_percent)}</span></div>
        <div className="bg-white p-6 rounded-xl border border-primary/10"><p className="text-sm text-slate-500">Avg. Order Value</p><p className="text-2xl font-black mt-1">{loading ? "..." : toCurrency(metrics.avg_order_value?.value)}</p><span className={`inline-block mt-3 text-xs font-bold px-2 py-1 rounded ${metricChangeClass(metrics.avg_order_value?.change_percent)}`}>{toPercent(metrics.avg_order_value?.change_percent)}</span></div>
        <div className="bg-white p-6 rounded-xl border border-primary/10"><p className="text-sm text-slate-500">Retention Rate</p><p className="text-2xl font-black mt-1">{loading ? "..." : toPercent(metrics.retention_rate?.value)}</p><span className={`inline-block mt-3 text-xs font-bold px-2 py-1 rounded ${metricChangeClass(metrics.retention_rate?.change_percent)}`}>{toPercent(metrics.retention_rate?.change_percent)}</span></div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
        <div className="bg-white p-6 rounded-xl border border-primary/10">
          <h3 className="font-bold text-lg mb-4">Revenue Trend</h3>
          <div className="h-64 flex items-end gap-1">
            {(revenueTrend.length ? revenueTrend : [{}, {}, {}, {}, {}, {}, {}]).map((point, index) => (
              <div key={`${point.day || "d"}-${index}`} className="flex-1 h-full flex flex-col justify-end">
                <div
                  className="bg-primary/50 rounded-t-sm hover:bg-primary transition-colors"
                  style={{
                    height: revenueTrend.length
                      ? `${Math.max(4, Math.round((Number(point.revenue || 0) / maxRevenue) * 100))}%`
                      : "20%",
                  }}
                  title={revenueTrend.length ? `${point.label}: ${toCurrency(point.revenue)}` : "No data"}
                ></div>
                <span className="text-[10px] text-slate-500 mt-1 truncate">
                  {revenueTrend.length ? point.label.split(" ")[1] : ""}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-primary/10">
          <h3 className="font-bold text-lg mb-4">Order Split</h3>
          <div className="h-4 w-full rounded-full overflow-hidden bg-slate-100 mb-4 flex">
            <div className="bg-primary" style={{ width: `${deliveryWidth}%` }}></div>
            <div className="bg-slate-300" style={{ width: `${pickupWidth}%` }}></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-primary/5">
              <p className="text-xs text-slate-500 uppercase">Delivery</p>
              <p className="text-xl font-black">{toNumber(deliveryCount)}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-100">
              <p className="text-xs text-slate-500 uppercase">Pick-up</p>
              <p className="text-xl font-black">{toNumber(pickupCount)}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white p-6 rounded-xl border border-primary/10 mb-8">
        <h3 className="font-bold text-lg mb-4">Video Funnel</h3>
        <div className="space-y-3">
          {funnelRows.map((row) => (
            <div key={row.label}>
              <div className="flex justify-between text-sm mb-1">
                <span>{row.label}</span>
                <span className="font-bold">{toNumber(row.value)}</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className={`${row.barClass} h-full`} style={{ width: `${row.percent}%` }}></div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 bg-white p-6 rounded-xl border border-primary/10">
          <h3 className="font-bold text-lg mb-4">Top Dishes</h3>
          <div className="space-y-3">
            {topDishes.length ? (
              topDishes.map((dish) => (
                <div key={dish.menu_item_id} className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-3">
                  <p className="font-semibold">{dish.name}</p>
                  <p className="text-sm text-slate-600">{toNumber(dish.sold)} sold</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">{loading ? "Loading dishes..." : "No dish data."}</p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-primary/10">
            <h3 className="font-bold text-lg mb-3">Retention</h3>
            <div className="space-y-2 text-sm">
              <p><span className="text-slate-500">New Customers:</span> <span className="font-bold">{toNumber(retention.new_customers)}</span></p>
              <p><span className="text-slate-500">Returning:</span> <span className="font-bold">{toNumber(retention.returning_customers)}</span></p>
              <p><span className="text-slate-500">Repeat Probability:</span> <span className="font-bold">{toPercent(retention.repeat_probability)}</span></p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-primary/10">
            <h3 className="font-bold text-lg mb-3">Top Video</h3>
            {topVideo ? (
              <>
                <div className="aspect-video bg-slate-200 rounded-lg mb-3 overflow-hidden">
                  {topVideo.thumbnail_url ? (
                    <img alt="" className="w-full h-full object-cover" src={topVideo.thumbnail_url} />
                  ) : null}
                </div>
                <p className="font-semibold">{topVideo.title}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {toNumber(topVideo.views_count)} views • {toPercent(topVideo.ctr)} CTR
                </p>
              </>
            ) : (
              <p className="text-sm text-slate-500">{loading ? "Loading video..." : "No video data."}</p>
            )}
          </div>
        </div>
      </section>
    </RestaurantShell>
  );
}

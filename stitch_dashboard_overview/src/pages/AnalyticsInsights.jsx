import { useState } from "react";
import { bg } from "../utils/bg.js";

const topMetrics = [
  {
    title: "Total Revenue",
    value: "$42,850.12",
    change: "+12.4%",
    icon: "payments",
    iconClass: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600",
    changeClass: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20",
  },
  {
    title: "Order Volume",
    value: "1,284",
    change: "+5.2%",
    icon: "shopping_cart",
    iconClass: "bg-blue-100 dark:bg-blue-900/30 text-blue-600",
    changeClass: "text-blue-600 bg-blue-50 dark:bg-blue-900/20",
  },
  {
    title: "Avg. Order Value",
    value: "$33.37",
    change: "-2.1%",
    icon: "avg_pace",
    iconClass: "bg-amber-100 dark:bg-amber-900/30 text-amber-600",
    changeClass: "text-red-600 bg-red-50 dark:bg-red-900/20",
  },
  {
    title: "Retention Rate",
    value: "64.2%",
    change: "+8.7%",
    icon: "person_celebrate",
    iconClass: "bg-purple-100 dark:bg-purple-900/30 text-purple-600",
    changeClass: "text-purple-600 bg-purple-50 dark:bg-purple-900/20",
  },
];

const topDishes = [
  {
    name: "Signature Wagyu Burger",
    sold: "428 sold",
    width: "85%",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuByNAZTfNUHluPUe-JX3r29cJxVNrUhTcmGz2B5lV77LFX30bhmqPbRaBlavOPlwiosTfSIUzs6oiED79F1R6Qy7wtITaDZWPMGzGAcgdrcQkOa3Y0jSsctuwf9k2cM31yFj1MIhss8AIB2Dr5fUR5hiN0caMWpkgKPJXRlSvw-su4QxOWkkOYtjVh3kOZdMxGd3sPghsGbhm5TG7Rag9Yxbro-Y361C1qru4H9WmKTsJChWEDsf1uX2VYh3c2vwCTOJVZOMOuRpmoA",
  },
  {
    name: "Truffle Pepperoni Pizza",
    sold: "312 sold",
    width: "65%",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuB4kRrHsjb95z55GcglUtly0ePcIwxJnI8r6VzT0kEb9zzvKgjGdci0vycyQMNrpyfDc7xmpBSo5d7BVlsagFQC9n9ScECEGT3zoOxEA8RnCego5tiwAdr906RNJRPrRKEtkwtnw3Q1AuluhNkuXqPMmd7lTDjWnyEvRhMu5BFMdM2exW6WWBUDwipLSHbjX5k10U0vH9YJ5JKlIbyM3sJHrs7nGVHxSFJEUyBuPXLh0a_lNkJoA1DKV8WlgiK1eKA4aNQla9Ml3wBw",
  },
  {
    name: "Harvest Buddha Bowl",
    sold: "285 sold",
    width: "58%",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDklKA4-t4kOnn3DWINpoMVkCUraJ9lmkbeKhjECJI0qx50BniAsDBwSdmTfEyqHjCQqhEjbkrYNLXe2DlD1ewIxpIIwZKA8zTzUJSp6yUDrF6mmT6iLwZvtZ3v-pvmBWPuAi0tCzr58Ag51mSde-XxHVHPDhvaZEL_MFqoDQZOqs2TegiVQYMoballsf4Au9-daooOzQScVvp13wFpDTeV4pfcVIxWSzjRDVEB0sLtYzGI_7XdAcbqjif9TARGQcsiICChDaGxCuYn",
  },
];

const revenueTrendData = {
  Weekly: {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    bars: [30, 45, 60, 55, 85, 95, 75],
  },
  Daily: {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"],
    bars: [25, 40, 55, 48, 70, 82, 65],
  },
};

const funnelRows = [
  { label: "Video Views", value: "245,800", width: "100%", barClass: "bg-primary" },
  { label: "Item Clicks", value: "18,432 (7.5%)", width: "40%", barClass: "bg-primary/60" },
  { label: "Added to Cart", value: "2,105 (0.8%)", width: "15%", barClass: "bg-primary/40" },
  { label: "Orders Completed", value: "842 (0.3%)", width: "5%", barClass: "bg-primary/20" },
];

export default function AnalyticsInsights({ onNavigate }) {
  const [revenueView, setRevenueView] = useState("Weekly");
  const activeRevenue = revenueTrendData[revenueView];

  const handleNav = (page) => (event) => {
    event.preventDefault();
    onNavigate?.(page);
  };

  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 min-h-screen">
      <div className="flex h-screen overflow-hidden">
        <aside className="w-64 border-r border-primary/10 bg-white dark:bg-background-dark/50 hidden md:flex flex-col">
          <div className="p-6 flex items-center gap-3">
            <div className="bg-primary size-10 rounded-lg flex items-center justify-center text-white">
              <span className="material-symbols-outlined">restaurant</span>
            </div>
            <div>
              <h1 className="text-slate-900 dark:text-white text-base font-bold leading-none">
                HungerRush
              </h1>
              <p className="text-primary text-xs font-medium">Restaurant Management</p>
            </div>
          </div>
          <nav className="flex-1 px-4 py-4 space-y-1">
            <a
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-primary/10 hover:text-primary transition-colors"
              href="#"
              onClick={handleNav("dashboard")}
            >
              <span className="material-symbols-outlined">dashboard</span>
              <span className="text-sm font-medium">Dashboard</span>
            </a>
            <a
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-primary/10 hover:text-primary transition-colors"
              href="#"
              onClick={handleNav("orders")}
            >
              <span className="material-symbols-outlined">receipt_long</span>
              <span className="text-sm font-medium">Orders</span>
            </a>
            <a
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-primary/10 hover:text-primary transition-colors"
              href="#"
              onClick={handleNav("menu")}
            >
              <span className="material-symbols-outlined">menu_book</span>
              <span className="text-sm font-medium">Menu</span>
            </a>
            <a
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-primary/10 hover:text-primary transition-colors"
              href="#"
              onClick={handleNav("videos")}
            >
              <span className="material-symbols-outlined">videocam</span>
              <span className="text-sm font-medium">Videos</span>
            </a>
            <a
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-primary/10 hover:text-primary transition-colors"
              href="#"
              onClick={handleNav("reviews")}
            >
              <span className="material-symbols-outlined">star</span>
              <span className="text-sm font-medium">Reviews</span>
            </a>
            <a
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-primary/10 hover:text-primary transition-colors"
              href="#"
              onClick={handleNav("loyalty")}
            >
              <span className="material-symbols-outlined">card_membership</span>
              <span className="text-sm font-medium">Loyalty</span>
            </a>
            <a
              className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary text-white"
              href="#"
              onClick={handleNav("analytics")}
            >
              <span className="material-symbols-outlined">monitoring</span>
              <span className="text-sm font-medium">Analytics</span>
            </a>
            <a
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-primary/10 hover:text-primary transition-colors"
              href="#"
              onClick={(event) => event.preventDefault()}
            >
              <span className="material-symbols-outlined">settings</span>
              <span className="text-sm font-medium">Settings</span>
            </a>
          </nav>
          <div className="p-4 border-t border-primary/10">
            <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-primary/5">
              <div
                className="size-10 rounded-full bg-slate-300 overflow-hidden bg-cover bg-center"
                data-alt="Profile picture of the restaurant manager Alex Miller"
                style={bg(
                  "https://lh3.googleusercontent.com/aida-public/AB6AXuCfno-lRT1a7iZbsWEDWJ6YO-jEyArfY--xT5lnlmtZpoF8YE1UVYt2SPiEeQPGzdyIOCs_eq0On-YJNoEMGn-F7q5A7RfjJ_iMkwf2xmPUgXMcx-Zm-7yt6MUdIYEk1HGi6TIx6-AF81MTF4iPym1SWLEjVzxCAEGjxp2IkQpmuCjBqpqbOAi6YoPnmNVWXYFUuerZ7q3At5nv3xO_WLmzSvE-OhQslsR5lB_g-IvwEqq3eBXurgMq23NftDIFoywM9skawWxjV540"
                )}
              ></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">Alex Miller</p>
                <p className="text-xs text-slate-500 truncate">Store Manager</p>
              </div>
              <button
                className="material-symbols-outlined text-slate-400 text-sm hover:text-red-500 transition-colors"
                type="button"
              >
                logout
              </button>
            </div>
          </div>
        </aside>
        <main className="flex-1 overflow-y-auto bg-background-light dark:bg-background-dark">
          <header className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-8 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Detailed Analytics</h1>
              <p className="text-sm text-slate-500">Real-time insights for The Golden Skillet</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                {[
                  "7 Days",
                  "30 Days",
                  "90 Days",
                  "Custom",
                ].map((label, index) => (
                  <button
                    key={label}
                    className={
                      index === 1
                        ? "px-4 py-1.5 text-sm font-medium rounded-md bg-white dark:bg-slate-700 shadow-sm transition-all"
                        : "px-4 py-1.5 text-sm font-medium rounded-md hover:bg-white dark:hover:bg-slate-700 transition-all"
                    }
                    type="button"
                  >
                    {label}
                  </button>
                ))}
              </div>
              <button
                className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                type="button"
              >
                <span className="material-symbols-outlined text-lg">download</span>
                <span className="text-sm font-semibold">Export</span>
              </button>
            </div>
          </header>
          <div className="p-8 space-y-8 max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {topMetrics.map((metric) => (
                <div
                  key={metric.title}
                  className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800"
                >
                  <div className="flex justify-between items-start mb-4">
                    <span className={`p-2 rounded-lg ${metric.iconClass}`}>
                      <span className="material-symbols-outlined">{metric.icon}</span>
                    </span>
                    <span className={`text-xs font-bold px-2 py-1 rounded ${metric.changeClass}`}>
                      {metric.change}
                    </span>
                  </div>
                  <h3 className="text-slate-500 text-sm font-medium">{metric.title}</h3>
                  <p className="text-2xl font-bold mt-1">{metric.value}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-lg">Revenue Trends</h3>
                  <select
                    className="text-xs border-slate-200 dark:border-slate-700 bg-transparent rounded-lg"
                    value={revenueView}
                    onChange={(event) => setRevenueView(event.target.value)}
                  >
                    <option>Weekly</option>
                    <option>Daily</option>
                  </select>
                </div>
                <div className="h-64 flex items-end gap-2 px-2 relative">
                  <div className="absolute inset-0 flex flex-col justify-between py-2 text-[10px] text-slate-400 pointer-events-none">
                    <span>$10k</span>
                    <span>$7.5k</span>
                    <span>$5k</span>
                    <span>$2.5k</span>
                    <span>0</span>
                  </div>
                  {activeRevenue.bars.map((height, index) => (
                    <div
                      key={`${revenueView}-${activeRevenue.labels[index]}`}
                      className="flex-1 flex flex-col items-center group relative h-full justify-end"
                    >
                      <div
                        className={`w-full ${index === 5 ? "bg-primary" : "bg-primary/10"} rounded-t-sm mb-1 transition-all group-hover:bg-primary/20`}
                        style={{ height: `${height}%` }}
                      ></div>
                      <span className="text-[10px] text-slate-500">{activeRevenue.labels[index]}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-lg">Order Volume</h3>
                  <button className="text-xs text-primary font-semibold" type="button">
                    Details
                  </button>
                </div>
                <div className="h-64 flex items-center justify-center">
                  <div className="relative w-48 h-48">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-slate-100 dark:text-slate-800"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeDasharray="100, 100"
                        strokeWidth="3"
                      ></path>
                      <path
                        className="text-primary"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeDasharray="72, 100"
                        strokeLinecap="round"
                        strokeWidth="3"
                      ></path>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-bold">1,284</span>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                        Total Orders
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex justify-center gap-6 mt-4">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-primary"></span>
                    <span className="text-xs text-slate-500">Delivery</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-slate-200 dark:bg-slate-700"></span>
                    <span className="text-xs text-slate-500">Pick-up</span>
                  </div>
                </div>
              </div>
            </div>
            <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg">Video Engagement Analytics</h3>
                  <p className="text-sm text-slate-500">
                    Track how your TikTok and Reel style menu videos convert to orders.
                  </p>
                </div>
                <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full uppercase tracking-wider">
                  New
                </span>
              </div>
              <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold uppercase text-slate-400 tracking-wider">
                      Conversion Funnel
                    </h4>
                  </div>
                  <div className="space-y-4">
                    {funnelRows.map((row) => (
                      <div key={row.label}>
                        <div className="flex justify-between text-sm mb-1">
                          <span>{row.label}</span>
                          <span className="font-bold">{row.value}</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div className={`${row.barClass} h-full`} style={{ width: row.width }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-background-light dark:bg-slate-800/50 p-6 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                  <h4 className="text-sm font-semibold mb-4">Top Performing Video</h4>
                  <div className="relative aspect-[9/16] max-h-48 mx-auto rounded-lg overflow-hidden bg-black group cursor-pointer">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <img
                      alt=""
                      className="w-full h-full object-cover opacity-80"
                      data-alt="Screenshot of a popular food marketing video showing ribs"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuAuRIGiQv9vmADmIZ43mzCbi8WRlKq88mYrZHo7-KuJll_KJ51Tluf0H9UyrDC2yH1cdd_tVWLhTRbFSQl-lREZjQRIQGCph2KYHcWTWss40pSwOr6aEwXjzwOIAnSZWN04G6Y_GW6iNg4BZtEsx6wRHPO1EDmSyM0pPoDEzTIeNtcz4K6n4mZlIGGiUkLdHVyS_OMBV_i_O-ddoUshFJMisZuPLiAoxbupP7BAXAwrF4pV2WdCCB3jRMk05rZfDnKhIBQxBs2eBlQC"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="material-symbols-outlined text-white text-4xl opacity-0 group-hover:opacity-100 transition-opacity">
                        play_circle
                      </span>
                    </div>
                    <div className="absolute bottom-2 left-2 right-2 text-white">
                      <p className="text-[10px] font-bold truncate">"Signature BBQ Ribs Prep"</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="material-symbols-outlined text-[12px]">visibility</span>
                        <span className="text-[10px]">12.4k</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-center">
                    <div className="p-2 bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700">
                      <p className="text-[10px] text-slate-500 uppercase">CTR</p>
                      <p className="text-sm font-bold">14.2%</p>
                    </div>
                    <div className="p-2 bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700">
                      <p className="text-[10px] text-slate-500 uppercase">Sales</p>
                      <p className="text-sm font-bold">$2.4k</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-lg">Top Selling Dishes</h3>
                  <button className="text-xs text-primary font-semibold" type="button">
                    View Menu Performance
                  </button>
                </div>
                <div className="space-y-4">
                  {topDishes.map((dish) => (
                    <div key={dish.name} className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0">
                        <img alt="" className="w-full h-full object-cover" src={dish.image} />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-semibold text-sm">{dish.name}</span>
                          <span className="text-xs font-bold text-slate-500">{dish.sold}</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div className="bg-primary h-full" style={{ width: dish.width }}></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
                <h3 className="font-bold text-lg mb-6">Retention Metrics</h3>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-xs text-slate-500 uppercase font-bold tracking-tight">New Customers</p>
                      <p className="text-xl font-bold">412</p>
                    </div>
                    <div className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600">
                      <span className="material-symbols-outlined">person_add</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-xs text-slate-500 uppercase font-bold tracking-tight">Returning</p>
                      <p className="text-xl font-bold">872</p>
                    </div>
                    <div className="w-10 h-10 flex items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600">
                      <span className="material-symbols-outlined">sync</span>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                    <h4 className="text-sm font-semibold mb-3">Repeat Order Probability</h4>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-black text-primary">78%</span>
                      <p className="text-xs text-slate-500 leading-tight">
                        Customers who order twice are likely to order 5+ times.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

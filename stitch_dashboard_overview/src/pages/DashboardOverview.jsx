import { bg } from "../utils/bg.js";

export default function DashboardOverview({ onNavigate }) {
  const handleNav = (page) => (event) => {
    event.preventDefault();
    onNavigate?.(page);
  };

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen flex">
      <aside className="w-64 border-r border-primary/10 bg-white dark:bg-background-dark/50 flex flex-col fixed h-full">
        <div className="p-6 flex items-center gap-3">
          <div className="bg-primary size-10 rounded-lg flex items-center justify-center text-white shadow-lg shadow-primary/30">
            <span className="material-symbols-outlined">restaurant</span>
          </div>
          <div>
            <h1 className="text-slate-900 dark:text-white text-base font-bold leading-none">
              HungerRush
            </h1>
            <p className="text-primary text-[10px] font-bold uppercase tracking-wider mt-1">
              Restaurant Management
            </p>
          </div>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-1">
          <a
            className="flex items-center gap-3 px-4 py-3 rounded-lg bg-primary text-white shadow-md shadow-primary/20"
            href="#"
            onClick={handleNav("dashboard")}
          >
            <span className="material-symbols-outlined sidebar-active-icon">dashboard</span>
            <span className="text-sm font-semibold">Dashboard</span>
          </a>
          <a
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            href="#"
            onClick={handleNav("orders")}
          >
            <span className="material-symbols-outlined">receipt_long</span>
            <span className="text-sm font-medium">Orders</span>
          </a>
          <a
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            href="#"
            onClick={handleNav("menu")}
          >
            <span className="material-symbols-outlined">menu_book</span>
            <span className="text-sm font-medium">Menu</span>
          </a>
          <a
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            href="#"
            onClick={handleNav("videos")}
          >
            <span className="material-symbols-outlined">videocam</span>
            <span className="text-sm font-medium">Videos</span>
          </a>
          <a
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            href="#"
            onClick={handleNav("reviews")}
          >
            <span className="material-symbols-outlined">star</span>
            <span className="text-sm font-medium">Reviews</span>
          </a>
          <a
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            href="#"
            onClick={handleNav("loyalty")}
          >
            <span className="material-symbols-outlined">card_membership</span>
            <span className="text-sm font-medium">Loyalty</span>
          </a>
          <a
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            href="#"
            onClick={handleNav("analytics")}
          >
            <span className="material-symbols-outlined">monitoring</span>
            <span className="text-sm font-medium">Analytics</span>
          </a>
          <a
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            href="#"
            onClick={(event) => event.preventDefault()}
          >
            <span className="material-symbols-outlined">settings</span>
            <span className="text-sm font-medium">Settings</span>
          </a>
        </nav>
        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
            <div
              className="size-10 rounded-full bg-slate-300 overflow-hidden bg-cover bg-center border border-white dark:border-slate-700"
              data-alt="Profile picture of Alex Miller"
              style={bg(
                "https://lh3.googleusercontent.com/aida-public/AB6AXuCfno-lRT1a7iZbsWEDWJ6YO-jEyArfY--xT5lnlmtZpoF8YE1UVYt2SPiEeQPGzdyIOCs_eq0On-YJNoEMGn-F7q5A7RfjJ_iMkwf2xmPUgXMcx-Zm-7yt6MUdIYEk1HGi6TIx6-AF81MTF4iPym1SWLEjVzxCAEGjxp2IkQpmuCjBqpqbOAi6YoPnmNVWXYFUuerZ7q3At5nv3xO_WLmzSvE-OhQslsR5lB_g-IvwEqq3eBXurgMq23NftDIFoywM9skawWxjV540"
              )}
            ></div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">Alex Miller</p>
              <p className="text-[11px] text-slate-500 truncate">Store Manager</p>
            </div>
            <button
              className="material-symbols-outlined text-slate-400 hover:text-red-500 transition-colors text-xl"
              type="button"
            >
              logout
            </button>
          </div>
        </div>
      </aside>
      <main className="flex-1 ml-64 min-h-screen flex flex-col">
        <header className="h-16 border-b border-primary/10 bg-white dark:bg-background-dark/80 backdrop-blur-md sticky top-0 z-10 px-8 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-primary">
              <span className="material-symbols-outlined font-bold">lunch_dining</span>
              <h2 className="text-slate-900 dark:text-white text-lg font-bold tracking-tight">
                The Burger Joint
              </h2>
            </div>
            <div className="relative group">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <span className="material-symbols-outlined text-lg">search</span>
              </span>
              <input
                className="block w-64 bg-slate-100 dark:bg-slate-800 border-none rounded-lg py-2 pl-10 pr-3 text-sm focus:ring-2 focus:ring-primary transition-all"
                placeholder="Search orders, menu..."
                type="text"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-primary/90 transition-all"
                type="button"
                onClick={() => onNavigate?.("menu")}
              >
                <span className="material-symbols-outlined text-lg">add_circle</span>
                Add Food
              </button>
              <button
                className="bg-primary/10 text-primary border border-primary/20 px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-primary/20 transition-all"
                type="button"
                onClick={() => onNavigate?.("videoCreate")}
              >
                <span className="material-symbols-outlined text-lg">upload_file</span>
                Upload Video
              </button>
            </div>
            <button
              className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full relative"
              type="button"
            >
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-2 right-2 size-2 bg-red-500 rounded-full border-2 border-white dark:border-background-dark"></span>
            </button>
          </div>
        </header>
        <div className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl border border-primary/10 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <span className="material-symbols-outlined">shopping_cart</span>
                </div>
                <span className="text-emerald-500 text-xs font-bold flex items-center bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-full">
                  <span className="material-symbols-outlined text-xs mr-0.5">trending_up</span>
                  +12%
                </span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                Total Orders Today
              </p>
              <h3 className="text-3xl font-bold mt-1">45</h3>
            </div>
            <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl border border-primary/10 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <span className="material-symbols-outlined">payments</span>
                </div>
                <span className="text-emerald-500 text-xs font-bold flex items-center bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-full">
                  <span className="material-symbols-outlined text-xs mr-0.5">trending_up</span>
                  +8%
                </span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                Revenue Today
              </p>
              <h3 className="text-3xl font-bold mt-1">$1,240</h3>
            </div>
            <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl border border-primary/10 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <span className="material-symbols-outlined">pending_actions</span>
                </div>
                <span className="text-red-500 text-xs font-bold flex items-center bg-red-50 dark:bg-red-500/10 px-2 py-1 rounded-full">
                  <span className="material-symbols-outlined text-xs mr-0.5">trending_down</span>
                  -2%
                </span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                Orders in Progress
              </p>
              <h3 className="text-3xl font-bold mt-1">12</h3>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800/50 p-8 rounded-xl border border-primary/10 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-bold">Weekly Revenue</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Total revenue performance for the past 7 days
                </p>
              </div>
              <div className="flex gap-2">
                <div className="flex items-center gap-2 mr-4">
                  <span className="size-3 rounded-full bg-primary"></span>
                  <span className="text-xs font-medium text-slate-500">
                    Current Week
                  </span>
                </div>
                <select className="bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-xs font-medium px-3 py-1.5 focus:ring-primary">
                  <option>Last 7 Days</option>
                  <option>Last 30 Days</option>
                </select>
              </div>
            </div>
            <div className="relative h-64 w-full">
              <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 800 200">
                <defs>
                  <linearGradient id="gradient" x1="0%" x2="0%" y1="0%" y2="100%">
                    <stop offset="0%" stopColor="#ff7b47" stopOpacity="0.3"></stop>
                    <stop offset="100%" stopColor="#ff7b47" stopOpacity="0"></stop>
                  </linearGradient>
                </defs>
                <path
                  d="M0,150 Q50,140 100,100 T200,80 T300,120 T400,60 T500,40 T600,90 T700,50 T800,70 L800,200 L0,200 Z"
                  fill="url(#gradient)"
                ></path>
                <path
                  d="M0,150 Q50,140 100,100 T200,80 T300,120 T400,60 T500,40 T600,90 T700,50 T800,70"
                  fill="none"
                  stroke="#ff7b47"
                  strokeLinecap="round"
                  strokeWidth="4"
                ></path>
              </svg>
              <div className="flex justify-between mt-4 text-xs font-bold text-slate-400 px-2 uppercase tracking-wider">
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
                <span>Sun</span>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-primary/10 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-primary/10 flex items-center justify-between bg-white dark:bg-transparent">
              <h3 className="text-xl font-bold">Recent Orders</h3>
              <button
                className="text-primary text-sm font-semibold hover:underline"
                type="button"
                onClick={() => onNavigate?.("orders")}
              >
                View All
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Order ID</th>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Item</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary/5">
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 font-bold text-sm">#ORD-8921</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="size-8 rounded-full bg-slate-200 bg-cover bg-center"
                          data-alt="Avatar of customer James Miller"
                          style={bg(
                            "https://lh3.googleusercontent.com/aida-public/AB6AXuDTzQK5wFw5oYZNCeR8b4D2FwBHqHr6Qw-b6P3Mum2afz_1yhDlr-z93m7pbbG5-GSqMGREOM7CDWS8TNl0HazI-T7B_n7qMbV0qFXO9llhCUajEa7j2BqV3VGIW58EFdTVYENmZYlFEub2a2junkXEyPUAXGxWPlHSZqKzz0DW27lQv8UeWsP5ilcBTFwSbTMZx2c6EFqGCVclgarFB6C4RBraVd4e_CFw4Cs3k-jXGBqFeFuImMDjfVPTfS-80PXX66iaO9UfFuSp"
                          )}
                        ></div>
                        <span className="text-sm font-medium">James Miller</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                      Classic Wagyu Burger
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                        Delivered
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-sm">$24.50</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        className="material-symbols-outlined text-slate-400 hover:text-primary transition-colors"
                        type="button"
                      >
                        more_vert
                      </button>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 font-bold text-sm">#ORD-8922</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="size-8 rounded-full bg-slate-200 bg-cover bg-center"
                          data-alt="Avatar of customer Sarah Wilson"
                          style={bg(
                            "https://lh3.googleusercontent.com/aida-public/AB6AXuBIKv-HO5eEqKRV2xoZqylJ5nuPGM58Fqi7twF_uO4LTaqyHOSNL7ctmNNqcw5Akk6LfIwpxSQqIKlA2P-mAwEF75axvTqxv7ar_lOnC64-TsD4jh_Wmbe916nT9jPiOdlPAN8L-uJeFwicPUo6-Nabc1aR7IoxCBkHQo8pyrdc_gYsbRTFsMfhofpo6186ZOqzOtBaYYFGmvdSIga6oaH7c14576JGHp-_ZTJV_Vei4ijgKRYXEZu3mAdbFppiqY5BkiO1_5GSviMc"
                          )}
                        ></div>
                        <span className="text-sm font-medium">Sarah Wilson</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                      Cheesy Bacon Fries
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400">
                        Preparing
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-sm">$12.90</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        className="material-symbols-outlined text-slate-400 hover:text-primary transition-colors"
                        type="button"
                      >
                        more_vert
                      </button>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 font-bold text-sm">#ORD-8923</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="size-8 rounded-full bg-slate-200 bg-cover bg-center"
                          data-alt="Avatar of customer Michael Chen"
                          style={bg(
                            "https://lh3.googleusercontent.com/aida-public/AB6AXuBqpePnSEYe1ydMJUg6Klrq-IkDeGQfnDWeHSR8Jk77Y3_4YWAgyfHJ1nS5zw85DQV84H9MpvaloVEZs-HgEwoepwtx2V4n7gMVUkwc3YqZkjBVyL4a4fgoctbhLw0uTrF1VsiduNXS9ArF7-9IIMlGNqH0m_tLTHdilLHA3nvZYj7_PxENpP8cb1dl14uZqYOZk7Fk7-QBhIrbHISHNyyzUPWyQWsFUQJ0wIdwT0QctqqWvj1G8H5bkaOU0l4XJOzlKjMn0KqMupjS"
                          )}
                        ></div>
                        <span className="text-sm font-medium">Michael Chen</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                      Double BBQ Stack
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400">
                        On the Way
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-sm">$18.00</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        className="material-symbols-outlined text-slate-400 hover:text-primary transition-colors"
                        type="button"
                      >
                        more_vert
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

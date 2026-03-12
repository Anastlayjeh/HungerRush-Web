import { bg } from "../utils/bg.js";

export default function CustomerReviews({ onNavigate }) {
  const handleNav = (page) => (event) => {
    event.preventDefault();
    onNavigate?.(page);
  };

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen">
      <div className="flex h-screen overflow-hidden">
        <aside className="w-64 border-r border-primary/10 bg-white dark:bg-background-dark/50 flex flex-col shrink-0">
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
              className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary text-white shadow-lg shadow-primary/20"
              href="#"
              onClick={handleNav("reviews")}
            >
              <span className="material-symbols-outlined filled-star">star</span>
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
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-primary/10 hover:text-primary transition-colors"
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
                data-alt="Profile picture of the store manager Alex Miller"
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
        <main className="flex-1 overflow-y-auto scroll-smooth">
          <div className="max-w-5xl mx-auto p-8">
            <header className="mb-8 flex justify-between items-end">
              <div>
                <h2 className="text-3xl font-black tracking-tight mb-2">Customer Reviews</h2>
                <p className="text-slate-500 dark:text-slate-400">
                  Manage and respond to your restaurant feedback in real-time.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  className="flex items-center gap-2 px-4 py-2 border border-primary/20 rounded-lg hover:bg-primary/5 transition-colors"
                  type="button"
                >
                  <span className="material-symbols-outlined text-sm">download</span>
                  <span className="text-sm font-semibold">Export</span>
                </button>
              </div>
            </header>
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
              <div className="lg:col-span-1 bg-white dark:bg-background-dark p-6 rounded-xl shadow-sm border border-primary/10 flex flex-col items-center justify-center text-center">
                <p className="text-5xl font-black text-primary mb-2">4.8</p>
                <div className="flex gap-0.5 text-primary mb-3">
                  <span className="material-symbols-outlined filled-star">star</span>
                  <span className="material-symbols-outlined filled-star">star</span>
                  <span className="material-symbols-outlined filled-star">star</span>
                  <span className="material-symbols-outlined filled-star">star</span>
                  <span className="material-symbols-outlined filled-star">star_half</span>
                </div>
                <p className="text-sm font-medium text-slate-500">Based on 1,248 reviews</p>
              </div>
              <div className="lg:col-span-2 bg-white dark:bg-background-dark p-6 rounded-xl shadow-sm border border-primary/10">
                <div className="space-y-3">
                  {[
                    { rating: "5", width: "70%", percent: "70%" },
                    { rating: "4", width: "20%", percent: "20%" },
                    { rating: "3", width: "5%", percent: "5%" },
                    { rating: "2", width: "3%", percent: "3%" },
                    { rating: "1", width: "2%", percent: "2%" },
                  ].map((row) => (
                    <div key={row.rating} className="grid grid-cols-[24px_1fr_48px] items-center gap-4">
                      <span className="text-sm font-bold">{row.rating}</span>
                      <div className="h-2.5 w-full bg-primary/10 rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: row.width }}></div>
                      </div>
                      <span className="text-xs text-slate-500 text-right">{row.percent}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
            <div className="flex flex-wrap items-center gap-2 mb-6">
              <button className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold" type="button">
                All Reviews
              </button>
              {[
                "5 Stars",
                "4 Stars",
                "3 Stars",
                "2 Stars",
                "1 Star",
              ].map((label) => (
                <button
                  key={label}
                  className="px-4 py-2 rounded-lg bg-white dark:bg-background-dark border border-primary/10 hover:border-primary text-sm font-semibold transition-colors"
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="space-y-4">
              <div className="bg-white dark:bg-background-dark p-6 rounded-xl shadow-sm border border-primary/5 flex gap-4 items-start hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-primary">person</span>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-bold text-lg leading-tight">Sarah Johnson</h4>
                      <div className="flex items-center gap-2">
                        <div className="flex text-primary">
                          <span className="material-symbols-outlined text-sm filled-star">star</span>
                          <span className="material-symbols-outlined text-sm filled-star">star</span>
                          <span className="material-symbols-outlined text-sm filled-star">star</span>
                          <span className="material-symbols-outlined text-sm filled-star">star</span>
                          <span className="material-symbols-outlined text-sm filled-star">star</span>
                        </div>
                        <span className="text-xs text-slate-400">- 2 hours ago</span>
                      </div>
                    </div>
                    <button className="text-primary hover:underline text-sm font-bold" type="button">
                      Reply
                    </button>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                    The pepperoni pizza was absolutely divine! Crust was perfectly thin and crispy, and it arrived much
                    faster than expected. HungerRush never disappoints!
                  </p>
                  <div className="flex gap-2">
                    <div className="w-20 h-20 rounded-lg bg-slate-100 overflow-hidden">
                      <img
                        alt="Review photo"
                        className="object-cover"
                        data-alt="A photo of a delicious pepperoni pizza"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuB2WibSQcndQUrqjoTMi5sTNfHrxKRb8QlNkDlGy8FLS1FdELgatTSdzsuzEjCfnJU-zWefOK6UBwNNHzo5MMM_fqPTPrTYJvaLiZ795z_6rgvu7whATLu-Xy5vbh9P1uFJ3I0WiKCt_RMQOhJRa81b0dK0G7L820MqfjCP1oMG3gpESC2s6B--iGMX6vRrRWrsTg65S33kyEJV3q5MiqBZa7fgt5WpbGoVtYs26mE-tj5AbR-XVl5WQ6GWL9adzRdmr9XFinEGR7G0"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-background-dark p-6 rounded-xl shadow-sm border border-primary/5 flex gap-4 items-start hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-primary">person</span>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-bold text-lg leading-tight">Michael Chen</h4>
                      <div className="flex items-center gap-2">
                        <div className="flex text-primary">
                          <span className="material-symbols-outlined text-sm filled-star">star</span>
                          <span className="material-symbols-outlined text-sm filled-star">star</span>
                          <span className="material-symbols-outlined text-sm filled-star">star</span>
                          <span className="material-symbols-outlined text-sm filled-star">star</span>
                          <span className="material-symbols-outlined text-sm">star</span>
                        </div>
                        <span className="text-xs text-slate-400">- Yesterday</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-green-500 flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">check_circle</span>
                        Replied
                      </span>
                      <button className="text-primary hover:underline text-sm font-bold" type="button">
                        View
                      </button>
                    </div>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    Good burger, but the fries were a bit cold when they arrived. Hopefully just a one-time thing. The
                    packaging was neat and professional though.
                  </p>
                  <div className="mt-4 p-4 rounded-lg bg-primary/5 border-l-2 border-primary">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-primary">HungerRush Admin</span>
                      <span className="text-[10px] text-slate-400">12h ago</span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 italic">
                      "Hi Michael, we're sorry about the fries! We're looking into our thermal bag inventory to ensure
                      this doesn't happen again. We'd like to send you a coupon for your next order!"
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-background-dark p-6 rounded-xl shadow-sm border border-primary/5 flex gap-4 items-start hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-primary">person</span>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-bold text-lg leading-tight">Emma Williams</h4>
                      <div className="flex items-center gap-2">
                        <div className="flex text-primary">
                          <span className="material-symbols-outlined text-sm filled-star">star</span>
                          <span className="material-symbols-outlined text-sm filled-star">star</span>
                          <span className="material-symbols-outlined text-sm filled-star">star</span>
                          <span className="material-symbols-outlined text-sm filled-star">star</span>
                          <span className="material-symbols-outlined text-sm filled-star">star</span>
                        </div>
                        <span className="text-xs text-slate-400">- Oct 24, 2023</span>
                      </div>
                    </div>
                    <button className="text-primary hover:underline text-sm font-bold" type="button">
                      Reply
                    </button>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    The vegan pasta options are surprisingly good. I love the variety you guys have added lately. Five
                    stars well deserved for being inclusive and delicious!
                  </p>
                </div>
              </div>
            </div>
            <div className="flex justify-center items-center gap-2 mt-8 py-4">
              <button
                className="w-10 h-10 rounded-lg flex items-center justify-center border border-primary/10 hover:bg-primary/5"
                type="button"
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <button className="w-10 h-10 rounded-lg bg-primary text-white font-bold" type="button">
                1
              </button>
              <button className="w-10 h-10 rounded-lg font-bold hover:bg-primary/5" type="button">
                2
              </button>
              <button className="w-10 h-10 rounded-lg font-bold hover:bg-primary/5" type="button">
                3
              </button>
              <span className="px-2">...</span>
              <button className="w-10 h-10 rounded-lg font-bold hover:bg-primary/5" type="button">
                12
              </button>
              <button
                className="w-10 h-10 rounded-lg flex items-center justify-center border border-primary/10 hover:bg-primary/5"
                type="button"
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

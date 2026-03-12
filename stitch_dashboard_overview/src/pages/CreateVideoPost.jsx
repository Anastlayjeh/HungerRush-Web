import { bg } from "../utils/bg.js";

export default function CreateVideoPost({ onNavigate }) {
  const handleNav = (page) => (event) => {
    event.preventDefault();
    onNavigate?.(page);
  };

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100">
      <div className="flex h-screen overflow-hidden">
        <aside className="w-64 border-r border-primary/10 bg-white dark:bg-slate-900 flex flex-col shrink-0">
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
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              href="#"
              onClick={handleNav("dashboard")}
            >
              <span className="material-symbols-outlined">dashboard</span>
              <span className="text-sm font-medium">Dashboard</span>
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
              className="flex items-center gap-3 px-4 py-3 rounded-lg bg-primary text-white shadow-md shadow-primary/20"
              href="#"
              onClick={handleNav("videos")}
            >
              <span className="material-symbols-outlined">videocam</span>
              <span className="text-sm font-semibold">Videos</span>
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
          <div className="p-4 border-t border-primary/10">
            <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-primary/5">
              <div
                className="size-10 rounded-full bg-slate-300 overflow-hidden bg-cover bg-center"
                data-alt="Profile picture of the store manager"
                style={bg(
                  "https://lh3.googleusercontent.com/aida-public/AB6AXuAP0I14UhgLsbtIC9t3WQ8WVGV1e0XbMnuB75MwBxlNyFX9U1clan1RvbslKRLfdtA4xlOr_prSOc55f26W3bV2WH_KytYKasnDg_Y-FoWNan5nLWfb0YiUMHbbeYkCjtReWLYsA-TgS6p-Yi07Yj1lz8D3RR6jPg6BXFaqOwE9GDkT2F-MqZOJEKvNwP3G42C6ydsYaUYjRQYDL4ejaR2MAl4US8ioFIfjRJdc4WV7Eys37JwHmfCWkyknPNGwqeZ1OS28cFZmPRBI"
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
        <main className="flex-1 flex flex-col overflow-hidden">
          <header className="h-16 border-b border-primary/10 bg-white dark:bg-slate-900 flex items-center justify-between px-8 shrink-0">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  search
                </span>
                <input
                  className="pl-10 pr-4 py-2 bg-background-light dark:bg-slate-800 border-none rounded-lg focus:ring-2 focus:ring-primary w-64 text-sm"
                  placeholder="Search orders, videos, menu..."
                  type="text"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                className="size-10 flex items-center justify-center rounded-lg bg-background-light dark:bg-slate-800 text-slate-600 dark:text-slate-400 relative"
                type="button"
              >
                <span className="material-symbols-outlined">notifications</span>
                <span className="absolute top-2 right-2 size-2 bg-primary rounded-full border-2 border-white dark:border-slate-800"></span>
              </button>
              <button
                className="size-10 flex items-center justify-center rounded-lg bg-background-light dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                type="button"
              >
                <span className="material-symbols-outlined">chat_bubble</span>
              </button>
            </div>
          </header>
          <div className="flex-1 overflow-y-auto bg-background-light dark:bg-slate-900/50 p-8">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <button
                    className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors text-sm font-medium mb-2"
                    type="button"
                    onClick={() => onNavigate?.("videos")}
                  >
                    <span className="material-symbols-outlined text-sm">arrow_back</span>
                    Back to Video Management
                  </button>
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                    Create Video Post
                  </h1>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    type="button"
                  >
                    Save as Draft
                  </button>
                  <button
                    className="px-5 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
                    type="button"
                  >
                    Publish to Feed
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white dark:bg-background-dark p-1 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                    <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-12 flex flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-800/30">
                      <div className="size-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
                        <span className="material-symbols-outlined text-3xl">cloud_upload</span>
                      </div>
                      <h3 className="text-lg font-bold mb-1">Upload your video</h3>
                      <p className="text-slate-500 text-sm mb-6 text-center">
                        Drag and drop your video file here, or click to browse.
                        <br />
                        Supported formats: MP4, MOV. Max size: 50MB.
                      </p>
                      <button
                        className="px-6 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold shadow-sm hover:border-primary transition-colors"
                        type="button"
                      >
                        Select File
                      </button>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-background-dark p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-6">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary">edit_note</span>
                      Video Details
                    </h2>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                          Video Title
                        </label>
                        <input
                          className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl focus:ring-primary/50 focus:border-primary"
                          placeholder="e.g. Sizzling Summer Burger Special"
                          type="text"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                          Description
                        </label>
                        <textarea
                          className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl focus:ring-primary/50 focus:border-primary"
                          placeholder="Tell your customers about this video... Use #hashtags to trend!"
                          rows="4"
                        ></textarea>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded">
                            #summer_vibes
                          </span>
                          <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded">
                            #foodie
                          </span>
                          <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded">
                            #burger_love
                          </span>
                        </div>
                      </div>
                      <div className="pt-2">
                        <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                          Link to Menu Item
                        </label>
                        <div className="relative">
                          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                            search
                          </span>
                          <select
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl focus:ring-primary/50 focus:border-primary appearance-none"
                            defaultValue=""
                          >
                            <option value="">Select a menu item for quick ordering</option>
                            <option value="1">Double Cheese Blaze Burger</option>
                            <option value="2">Crispy Buffalo Wings</option>
                            <option value="3">Vegan Garden Salad</option>
                            <option value="4">Zesty Fries with Dip</option>
                          </select>
                          <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                            expand_more
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="lg:col-span-1">
                  <div className="sticky top-8">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-4 px-2">
                      Feed Preview
                    </h2>
                    <div className="relative mx-auto w-[280px] h-[580px] bg-slate-900 rounded-[3rem] border-[8px] border-slate-800 shadow-2xl overflow-hidden ring-1 ring-slate-900/10">
                      <div className="absolute inset-0 bg-slate-200 flex flex-col overflow-hidden">
                        <div
                          className="relative flex-1 bg-cover bg-center"
                          data-alt="Vertical video preview of a delicious burger"
                          style={bg(
                            "https://lh3.googleusercontent.com/aida-public/AB6AXuBRc-3D2ZVf5rDcmV9kOhVmWlwkWCG2rnkW2SrIobDrgneitTJ-f6q7IiEAolTGkAH__yPkNcpIR-3sqhokUEEI2rvLQwlkW6Jv-Y6vJsP9G1bKfkX57-RcxlvMHllae32Wfwr12BpObpkTRCfz5tR2DV9fPrWiqQQ7GaBvpiK-ArdcSBCg7UWFRTqS3rQ3QPyyM415uslypVHLZ-1okzOunTwyfcRW4gWZyngCmIJAf5DJ89uwf8X94ZT_j4WOf9LtmZdIrQp64gju"
                          )}
                        >
                          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80"></div>
                          <div className="flex justify-between px-6 pt-3 text-[10px] text-white font-medium">
                            <span>9:41</span>
                            <div className="flex gap-1">
                              <span className="material-symbols-outlined !text-[12px]">
                                signal_cellular_4_bar
                              </span>
                              <span className="material-symbols-outlined !text-[12px]">wifi</span>
                              <span className="material-symbols-outlined !text-[12px]">
                                battery_full
                              </span>
                            </div>
                          </div>
                          <div className="absolute right-4 bottom-32 flex flex-col gap-5 text-white items-center">
                            <div className="flex flex-col items-center">
                              <span className="material-symbols-outlined !text-[28px] drop-shadow-md">
                                favorite
                              </span>
                              <span className="text-[10px] font-bold">1.2k</span>
                            </div>
                            <div className="flex flex-col items-center">
                              <span className="material-symbols-outlined !text-[28px] drop-shadow-md">
                                chat_bubble
                              </span>
                              <span className="text-[10px] font-bold">84</span>
                            </div>
                            <div className="flex flex-col items-center">
                              <span className="material-symbols-outlined !text-[28px] drop-shadow-md">
                                share
                              </span>
                              <span className="text-[10px] font-bold">Share</span>
                            </div>
                          </div>
                          <div className="absolute bottom-16 left-4 right-16 text-white space-y-1">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="size-6 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold border border-white">
                                HR
                              </div>
                              <span className="text-xs font-bold">HungerRush</span>
                            </div>
                            <p className="text-xs font-medium line-clamp-2">
                              Sizzling Summer Burger Special! Grab yours now while it lasts... #burger_love
                            </p>
                          </div>
                          <div className="absolute bottom-4 left-4 right-4 bg-primary text-white py-2 rounded-lg text-center text-[10px] font-bold shadow-lg">
                            ORDER NOW: Double Cheese Blaze...
                          </div>
                          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-20 h-1 bg-white/40 rounded-full"></div>
                        </div>
                      </div>
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-slate-800 rounded-b-2xl"></div>
                    </div>
                    <p className="text-center text-xs text-slate-500 mt-4 italic">
                      This is how your post will appear in the customer app
                    </p>
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

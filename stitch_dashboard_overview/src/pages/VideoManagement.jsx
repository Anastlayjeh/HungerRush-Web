import { useState } from "react";
import { bg } from "../utils/bg.js";

const videos = [
  {
    id: "ribeye",
    title: "Perfect Sizzling Ribeye Technique",
    description:
      "Master the crust on your ribeye with our signature dry-rub and cast iron method. #SteakLovers #GrillMaster #Foodie",
    views: "12.4k",
    likes: "3.2k",
    thumbnail:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDnuKDYUEqamxwng05w-v8EADZkD0rKkUG2BflFyeqLk68KdXPEINjftbArltQuCKJmQ-jAR-K4jvfRmcRQTASRtVHwrluqXimUbKVrzEIv8FemDmIUI94VcrQa0FGxxDnxzcCXyTKFgQUnXYzdAiZN1ODtKtFrcYz1Y9jEkaiDoCFp0arYZ7RgqIeg5nGNec27ISPVgdgwAVi_IhPcUJRkVM8P2kyfmARtbXe9eDORerMDIUUKzaNHfqzYkWKjUpsvh646f4enHZZe",
    linkedItem: {
      name: "Signature Ribeye Steak",
      price: "$34.99",
      status: "In Stock",
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuAdRZv_l1X2Wpx_s_3n4dFqoX3r8oFH_n-NRvLrWCraY92KAKGTrTquBpk1MVLSoF1btAuB7JpuQr9lYplabkY4miYThz_gNA1IPhDZvwRKaJGK8NuTJoGO81idVKSp2f9nHHhaKZdrmQkyBjpjgGNuurvcACNiFDRNQMjS4bo3utKVjrKBeSRZkMH64N_AMibR3QB27oMTAVbH1U_KUjcSPUvaRgY4Kg91S7L37qvhmlA2qJKy5o7dMTtAKrqHcGdfbe3ZQfN3PN4T",
    },
    performance: {
      orders: "142",
      ordersChange: "12%",
      revenue: "$4.9k",
      revenueChange: "8.4%",
      bars: [40, 60, 55, 80, 95, 70, 45],
    },
  },
  {
    id: "pasta",
    title: "Fresh Pasta Roll-Up",
    description:
      "Hand-rolled tagliatelle with herb butter and parmesan. #PastaNight #ChefMade",
    views: "8.1k",
    likes: "1.2k",
    thumbnail:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuA5jMIw9316EtJXQ6aiAH7cSxHdS044Drb7u8Rlcn9nyTtuTRa4UHQYuj5lDAbiZ5j1jzQr95oBAbUGeWt-Yumc0sjJ91EW1Ms8xNcEAbSz-wD-i7IRJhOP2Wba1rsGOahOiuYAuUAKHGhfrw5DOm5jMeksf1eRRdbbAsVQSr2WV1V8x8xgQy9rGeN5hGiylp4Wsojd2sxdgnLkFoiMguSvZFYCp9qQbMDH2LvRCiFCJ65CCTwNOUmoRfZltp_vLh7G1135g9oVkoaU",
    linkedItem: {
      name: "House Alfredo Pasta",
      price: "$18.75",
      status: "In Stock",
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuDklKA4-t4kOnn3DWINpoMVkCUraJ9lmkbeKhjECJI0qx50BniAsDBwSdmTfEyqHjCQqhEjbkrYNLXe2DlD1ewIxpIIwZKA8zTzUJSp6yUDrF6mmT6iLwZvtZ3v-pvmBWPuAi0tCzr58Ag51mSde-XxHVHPDhvaZEL_MFqoDQZOqs2TegiVQYMoballsf4Au9-daooOzQScVvp13wFpDTeV4pfcVIxWSzjRDVEB0sLtYzGI_7XdAcbqjif9TARGQcsiICChDaGxCuYn",
    },
    performance: {
      orders: "96",
      ordersChange: "6%",
      revenue: "$2.8k",
      revenueChange: "5.1%",
      bars: [30, 45, 60, 52, 68, 62, 40],
    },
  },
  {
    id: "salad",
    title: "Crisp Summer Salad Toss",
    description:
      "Bright greens, citrus vinaigrette, and crunchy toppings. #FreshBites #HealthyChoice",
    views: "4.5k",
    likes: "740",
    thumbnail:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAtJdyRrs-3PftUfary003dYiu4Naq4nKjICm-BsSPrUpv3GFFyTmJZhPBIMk6q9mlZxLCfHegsoykj643I-Wqn-RvzHn4DPtb2SYj4y7nMneAzuXxMrbPsji7kl4C11c3JuLpAg8lpG6jHZUqN3uh7xRx8o3vQGUs-9PAyyaeeOuEdb9DD5ax8J_ghrgrV9M5Jkmy_44EmYpH5KU7YOQi2PO5SDeVIY4qoFQzDaOiwvOcCHGlwB89QcwzpuYUBMlJc_5CnH5PiMNQe",
    linkedItem: {
      name: "Harvest Buddha Bowl",
      price: "$12.50",
      status: "In Stock",
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuDklKA4-t4kOnn3DWINpoMVkCUraJ9lmkbeKhjECJI0qx50BniAsDBwSdmTfEyqHjCQqhEjbkrYNLXe2DlD1ewIxpIIwZKA8zTzUJSp6yUDrF6mmT6iLwZvtZ3v-pvmBWPuAi0tCzr58Ag51mSde-XxHVHPDhvaZEL_MFqoDQZOqs2TegiVQYMoballsf4Au9-daooOzQScVvp13wFpDTeV4pfcVIxWSzjRDVEB0sLtYzGI_7XdAcbqjif9TARGQcsiICChDaGxCuYn",
    },
    performance: {
      orders: "58",
      ordersChange: "3%",
      revenue: "$1.4k",
      revenueChange: "2.2%",
      bars: [20, 35, 42, 38, 50, 44, 30],
    },
  },
  {
    id: "lava",
    title: "Lava Cake Break",
    description:
      "Warm molten center with a dusting of cocoa and vanilla cream. #DessertTime #Sweet",
    views: "6.2k",
    likes: "1.6k",
    thumbnail:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBO2jR1yt9g9DTA3cOLpn3x0v8h27vcyGiDGKuB-R4oWfGy_pWZ1A7sfz0DrmabmQ2GLoKhLxsIgtlbOAL_tcSOTRLsg79CyW8lZhSfbnaR_CvctLFd1wp4Nk8Nl_85WykDkpLhaPG6VEtfROQiqYLF_shbKoMcns26PBnC9phGfgYscS4CwKFFubZ1XlofHBHTvaVMgl9n50EX08xE6eAQ2sFojZFnYr4wpovgET3yZ0C4HYwbJANsZNp7pNcNh7-BBTgLerhd2151",
    linkedItem: {
      name: "Molten Chocolate Cake",
      price: "$7.25",
      status: "Limited",
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBO2jR1yt9g9DTA3cOLpn3x0v8h27vcyGiDGKuB-R4oWfGy_pWZ1A7sfz0DrmabmQ2GLoKhLxsIgtlbOAL_tcSOTRLsg79CyW8lZhSfbnaR_CvctLFd1wp4Nk8Nl_85WykDkpLhaPG6VEtfROQiqYLF_shbKoMcns26PBnC9phGfgYscS4CwKFFubZ1XlofHBHTvaVMgl9n50EX08xE6eAQ2sFojZFnYr4wpovgET3yZ0C4HYwbJANsZNp7pNcNh7-BBTgLerhd2151",
    },
    performance: {
      orders: "112",
      ordersChange: "9%",
      revenue: "$2.1k",
      revenueChange: "6.7%",
      bars: [25, 40, 55, 62, 70, 66, 48],
    },
  },
];

export default function VideoManagement({ onNavigate }) {
  const [activeId, setActiveId] = useState(videos[0].id);
  const activeVideo = videos.find((video) => video.id === activeId) ?? videos[0];

  const handleNav = (page) => (event) => {
    event.preventDefault();
    onNavigate?.(page);
  };

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen">
      <div className="flex h-screen overflow-hidden">
        <aside className="w-64 border-r border-primary/10 bg-white dark:bg-background-dark/50 flex flex-col">
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
              className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary text-white"
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
                data-alt="Profile picture of the restaurant manager"
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
        <main className="flex-1 flex flex-col overflow-hidden">
          <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-background-dark/80 backdrop-blur-md flex items-center justify-between px-8 z-10">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold">Video Feed Management</h1>
              <div className="h-4 w-px bg-slate-300 dark:bg-slate-700"></div>
              <div className="flex gap-4">
                <button
                  className="text-sm font-bold text-primary border-b-2 border-primary pb-1"
                  type="button"
                >
                  All Videos
                </button>
                <button
                  className="text-sm font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  type="button"
                >
                  Scheduled
                </button>
                <button
                  className="text-sm font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  type="button"
                >
                  Drafts
                </button>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  search
                </span>
                <input
                  className="pl-10 pr-4 py-1.5 bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-sm w-64 focus:ring-2 focus:ring-primary/50 transition-all"
                  placeholder="Search content..."
                  type="text"
                />
              </div>
              <button
                className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-primary/20"
                type="button"
                onClick={() => onNavigate?.("videoCreate")}
              >
                <span className="material-symbols-outlined text-sm">cloud_upload</span>
                Upload Video
              </button>
            </div>
          </header>
          <div className="flex-1 flex overflow-hidden">
            <section className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-transparent">
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {videos.map((video) => {
                  const isActive = video.id === activeId;
                  return (
                    <button
                      key={video.id}
                      type="button"
                      className={`relative aspect-[9/16] rounded-xl overflow-hidden group cursor-pointer transition-all ${
                        isActive
                          ? "ring-4 ring-primary ring-offset-2 dark:ring-offset-background-dark"
                          : "hover:ring-2 hover:ring-primary/50"
                      }`}
                      onClick={() => setActiveId(video.id)}
                    >
                      <div
                        className="absolute inset-0 bg-cover bg-center"
                        data-alt={video.title}
                        style={bg(video.thumbnail)}
                      ></div>
                      <div
                        className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent ${
                          isActive ? "" : "opacity-60 group-hover:opacity-100 transition-opacity"
                        }`}
                      ></div>
                      <div
                        className={`absolute bottom-4 left-4 right-4 text-white ${
                          isActive ? "" : "opacity-0 group-hover:opacity-100 transition-opacity"
                        }`}
                      >
                        <div className="flex items-center gap-4 mb-1">
                          <div className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">visibility</span>
                            <span className="text-xs font-bold">{video.views}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">favorite</span>
                            <span className="text-xs font-bold">{video.likes}</span>
                          </div>
                        </div>
                        <p className="text-xs font-medium line-clamp-2">{video.title}</p>
                      </div>
                      {isActive ? (
                        <div className="absolute top-2 right-2 px-2 py-1 bg-primary text-[10px] font-black uppercase rounded text-white tracking-wider">
                          Active
                        </div>
                      ) : null}
                    </button>
                  );
                })}
                <button
                  className="aspect-[9/16] rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-primary hover:border-primary transition-all group"
                  type="button"
                  onClick={() => onNavigate?.("videoCreate")}
                >
                  <span className="material-symbols-outlined text-4xl">add_circle</span>
                  <span className="text-sm font-bold">New Post</span>
                </button>
              </div>
            </section>
            <aside className="w-[420px] border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-background-dark/40 overflow-y-auto p-6 space-y-8">
              <div>
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-4">
                  Video Details
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Title</label>
                    <input
                      className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-sm font-medium focus:ring-primary"
                      type="text"
                      defaultValue={activeVideo.title}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Description</label>
                    <textarea
                      className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-sm focus:ring-primary"
                      rows="3"
                      defaultValue={activeVideo.description}
                    ></textarea>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Linked Menu Item</label>
                    <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-xl">
                      <div
                        className="size-12 rounded-lg bg-cover bg-center"
                        data-alt={activeVideo.linkedItem.name}
                        style={bg(activeVideo.linkedItem.image)}
                      ></div>
                      <div className="flex-1">
                        <p className="text-sm font-bold">{activeVideo.linkedItem.name}</p>
                        <p className="text-xs text-slate-500">
                          {activeVideo.linkedItem.price} - {activeVideo.linkedItem.status}
                        </p>
                      </div>
                      <button className="text-primary hover:text-primary/70" type="button">
                        <span className="material-symbols-outlined">swap_horiz</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="pt-8 border-t border-slate-200 dark:border-slate-800">
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-4">
                  Performance Analytics
                </h3>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-xl">
                    <p className="text-xs text-slate-500 font-bold mb-1">Orders Generated</p>
                    <p className="text-2xl font-black text-primary">{activeVideo.performance.orders}</p>
                    <p className="text-[10px] text-green-500 font-bold flex items-center gap-0.5 mt-1">
                      <span className="material-symbols-outlined text-[10px]">trending_up</span>
                      {activeVideo.performance.ordersChange}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-xl">
                    <p className="text-xs text-slate-500 font-bold mb-1">Revenue</p>
                    <p className="text-2xl font-black text-slate-900 dark:text-white">
                      {activeVideo.performance.revenue}
                    </p>
                    <p className="text-[10px] text-green-500 font-bold flex items-center gap-0.5 mt-1">
                      <span className="material-symbols-outlined text-[10px]">trending_up</span>
                      {activeVideo.performance.revenueChange}
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-end justify-between gap-1 h-32 px-2">
                    {activeVideo.performance.bars.map((height, index) => (
                      <div
                        key={`${activeVideo.id}-bar-${index}`}
                        className={`flex-1 ${
                          index === 4 ? "bg-primary" : "bg-primary/40"
                        } rounded-t`}
                        style={{ height: `${height}%` }}
                      ></div>
                    ))}
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold px-1 uppercase tracking-tighter">
                    {[
                      "Mon",
                      "Tue",
                      "Wed",
                      "Thu",
                      "Fri",
                      "Sat",
                      "Sun",
                    ].map((label) => (
                      <span key={`${activeVideo.id}-${label}`}>{label}</span>
                    ))}
                  </div>
                  <p className="text-center text-xs font-bold text-slate-400 pt-2">
                    Orders Generated from Video (Weekly)
                  </p>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  className="flex-1 py-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold rounded-xl text-sm transition-transform active:scale-95"
                  type="button"
                >
                  Save Changes
                </button>
                <button
                  className="px-3 py-3 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-red-500 rounded-xl transition-colors"
                  type="button"
                >
                  <span className="material-symbols-outlined">delete</span>
                </button>
              </div>
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
}

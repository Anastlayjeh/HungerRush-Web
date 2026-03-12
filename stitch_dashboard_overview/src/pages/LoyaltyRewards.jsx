import { bg } from "../utils/bg.js";

export default function LoyaltyRewards({ onNavigate }) {
  const handleNav = (page) => (event) => {
    event.preventDefault();
    onNavigate?.(page);
  };

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display">
      <div className="flex min-h-screen">
        <aside className="w-64 border-r border-primary/10 bg-white dark:bg-background-dark/50 flex flex-col fixed h-full z-10">
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
              className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary text-white"
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
        <main className="ml-64 flex-1 flex flex-col min-h-screen">
          <header className="h-16 border-b border-primary/10 bg-white dark:bg-background-dark flex items-center justify-between px-8 sticky top-0 z-10">
            <h2 className="text-lg font-bold">Loyalty & Rewards</h2>
            <div className="flex items-center gap-4">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">
                  search
                </span>
                <input
                  className="pl-10 pr-4 py-2 bg-primary/5 border-none rounded-lg text-sm w-64 focus:ring-1 focus:ring-primary"
                  placeholder="Search customers..."
                  type="text"
                />
              </div>
              <button
                className="size-10 flex items-center justify-center rounded-lg bg-primary/5 text-slate-600 hover:bg-primary/10 transition-colors"
                type="button"
              >
                <span className="material-symbols-outlined">notifications</span>
              </button>
            </div>
          </header>
          <div className="p-8 space-y-8">
            <div className="flex items-end justify-between">
              <div>
                <h1 className="text-3xl font-black tracking-tight">Loyalty Program</h1>
                <p className="text-slate-500 mt-1">
                  Boost customer retention with tailored rewards and points tracking.
                </p>
              </div>
              <button
                className="bg-primary text-white px-6 py-2.5 rounded-lg font-bold text-sm shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center gap-2"
                type="button"
              >
                <span className="material-symbols-outlined text-xl">add_circle</span>
                Create New Reward
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-background-dark p-6 rounded-xl border border-primary/10 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <span className="material-symbols-outlined p-2 bg-blue-50 text-blue-500 rounded-lg">
                    stars
                  </span>
                  <span className="text-emerald-500 text-xs font-bold flex items-center bg-emerald-50 px-2 py-1 rounded-full">
                    +12.4%
                  </span>
                </div>
                <p className="text-slate-500 text-sm font-medium">Total Points Issued</p>
                <h3 className="text-2xl font-black mt-1">1,250,400</h3>
              </div>
              <div className="bg-white dark:bg-background-dark p-6 rounded-xl border border-primary/10 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <span className="material-symbols-outlined p-2 bg-orange-50 text-orange-500 rounded-lg">
                    redeem
                  </span>
                  <span className="text-emerald-500 text-xs font-bold flex items-center bg-emerald-50 px-2 py-1 rounded-full">
                    +5.2%
                  </span>
                </div>
                <p className="text-slate-500 text-sm font-medium">Points Redeemed</p>
                <h3 className="text-2xl font-black mt-1">840,200</h3>
              </div>
              <div className="bg-white dark:bg-background-dark p-6 rounded-xl border border-primary/10 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <span className="material-symbols-outlined p-2 bg-purple-50 text-purple-500 rounded-lg">
                    groups
                  </span>
                  <span className="text-emerald-500 text-xs font-bold flex items-center bg-emerald-50 px-2 py-1 rounded-full">
                    +8.1%
                  </span>
                </div>
                <p className="text-slate-500 text-sm font-medium">Active Members</p>
                <h3 className="text-2xl font-black mt-1">12,450</h3>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">Active Rewards</h2>
                  <button className="text-primary text-sm font-bold hover:underline" type="button">
                    View All
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-background-dark p-5 rounded-xl border-l-4 border-primary shadow-sm border border-primary/5">
                    <div className="flex justify-between items-start">
                      <div className="bg-primary/10 p-2 rounded-lg text-primary mb-3 inline-block">
                        <span className="material-symbols-outlined">percent</span>
                      </div>
                      <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded">
                        Active
                      </span>
                    </div>
                    <h4 className="font-bold text-lg">10% Off Loyal Special</h4>
                    <p className="text-sm text-slate-500 mt-1">Unlocked after 5 completed orders</p>
                    <div className="mt-4 pt-4 border-t border-primary/5 flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-400">Used 1,240 times</span>
                      <button className="text-slate-400 hover:text-primary transition-colors" type="button">
                        <span className="material-symbols-outlined">edit</span>
                      </button>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-background-dark p-5 rounded-xl border-l-4 border-slate-300 shadow-sm border border-primary/5">
                    <div className="flex justify-between items-start">
                      <div className="bg-slate-100 p-2 rounded-lg text-slate-500 mb-3 inline-block">
                        <span className="material-symbols-outlined">lunch_dining</span>
                      </div>
                      <span className="bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded">
                        Draft
                      </span>
                    </div>
                    <h4 className="font-bold text-lg text-slate-700">Free Dessert Voucher</h4>
                    <p className="text-sm text-slate-500 mt-1">Redeemable for 500 loyalty points</p>
                    <div className="mt-4 pt-4 border-t border-primary/5 flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-400">Not yet active</span>
                      <button className="text-slate-400 hover:text-primary transition-colors" type="button">
                        <span className="material-symbols-outlined">edit</span>
                      </button>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-background-dark p-5 rounded-xl border-l-4 border-primary shadow-sm border border-primary/5">
                    <div className="flex justify-between items-start">
                      <div className="bg-primary/10 p-2 rounded-lg text-primary mb-3 inline-block">
                        <span className="material-symbols-outlined">local_shipping</span>
                      </div>
                      <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded">
                        Active
                      </span>
                    </div>
                    <h4 className="font-bold text-lg">Free Delivery Weekend</h4>
                    <p className="text-sm text-slate-500 mt-1">For members with 1000+ points</p>
                    <div className="mt-4 pt-4 border-t border-primary/5 flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-400">Used 450 times</span>
                      <button className="text-slate-400 hover:text-primary transition-colors" type="button">
                        <span className="material-symbols-outlined">edit</span>
                      </button>
                    </div>
                  </div>
                  <button
                    className="border-2 border-dashed border-primary/20 rounded-xl p-5 flex flex-col items-center justify-center gap-2 hover:bg-primary/5 transition-colors group"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-primary/40 group-hover:text-primary text-3xl">
                      add_circle
                    </span>
                    <span className="text-sm font-bold text-primary/60 group-hover:text-primary">
                      Add New Incentive
                    </span>
                  </button>
                </div>
              </div>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">Top Loyal Customers</h2>
                  <span className="material-symbols-outlined text-slate-400 cursor-pointer">more_horiz</span>
                </div>
                <div className="bg-white dark:bg-background-dark rounded-xl border border-primary/10 overflow-hidden shadow-sm">
                  <div className="divide-y divide-primary/5">
                    {[
                      {
                        name: "David Chen",
                        orders: "42 Orders",
                        points: "8,450",
                        image:
                          "https://lh3.googleusercontent.com/aida-public/AB6AXuDLDT3fybAegy_8_OEHMW3tevSo09fjl0WgpaxG5ay2J5qZyILR0Um-EQmMVrp6mL1mmcJt57rK2J0lpqz7ulb4ed-TbrAuCDoBaHecd_dnWCA4sVfbDsrRT746wiwCWfsyi0M2B7h368a2wmKZ_bxwPuNQJSTY31cOEErmbiewMpbhZxw8ZVe9cNn59Ylz1d7LImo3rnAx9vyKhvncBUp_qmSMWj4f1VfJVWhjENpdWl0a-2gnee0p5cPz0uID1RsQpW1gIlPSgFnU",
                      },
                      {
                        name: "Sarah Johnson",
                        orders: "38 Orders",
                        points: "7,120",
                        image:
                          "https://lh3.googleusercontent.com/aida-public/AB6AXuBNTdi8C42vTyXeeFce_E7uv2rKGz7MnOLmGeW6Q6Wbebn3hXmCLpkBO8nER4rJNpSy4471s7twgbio0bLX9rGrJwTRa0VGl5v02v2hX_ZSwrag_B2T18ssn6jr-_c2XzvZ_sBBwc1qW3kl2RUsm97qSSmMoQDg53QBGCCPtfOmCkBYVsPWROkZyQWHHELXenU3jPAATCEz_1ztLCwmo33-epRjvtUiiHIojdaV4ma8KNvo3nWFzOmSR3gHE0dflDLN0ka0gSRddW7u",
                      },
                      {
                        name: "Marcus Williams",
                        orders: "31 Orders",
                        points: "6,550",
                        image:
                          "https://lh3.googleusercontent.com/aida-public/AB6AXuDXUc4nZUio3Nc_GCBfc1rIEIi9oH7Zqxj15XE-bYHdbJxFmpieuyO970HsjGJeNvfWUVR4XpIDH_aflRexZPZWtpE5WVAZiqjDQT1U18sLy0ldCKZvhoj_UJBhr5DJBmMe-CACO4y9XQ8d7f-1y--VwxAtAphih1erTt7idxPWWEIfbOZHDlWOIAOyAXLpA5WoEl6xLCOQL-Uauu7ugt16UW8T2LDdNVvaqoBvEXZ9VyhMUBKEhTnE_U8nHO6NLlNvSa0W1IhGQ85K",
                      },
                      {
                        name: "Elena Rodriguez",
                        orders: "29 Orders",
                        points: "5,980",
                        image:
                          "https://lh3.googleusercontent.com/aida-public/AB6AXuDKIZSJ1SYiOETi4NFQlMJX8AWigFhZ9ouaqSvpwYzrlqJJxUlmEhdbQvFy5_BXC-sfQchXOZ_cpfcAVXaNQbFtmMexW2ykwD2ostGyYg762BbLNKL0fhtc8bngdz_OHzwGlWvq8Ty-HJJ7CAu-MzaZEeDtvIaDKuk5jitG2NpuHJVHyySIXMOhHEVB033FeQJyUvtFLNxFqz_o9__hod0o0h0OSMTnphtjnsN6QoCArQYrAr_acw404EFFl5w5OE-0C8WG-yMQiwGM",
                      },
                    ].map((customer) => (
                      <div
                        key={customer.name}
                        className="p-4 flex items-center gap-3 hover:bg-primary/5 transition-colors cursor-pointer"
                      >
                        <img alt="" className="size-10 rounded-full" src={customer.image} />
                        <div className="flex-1 min-w-0">
                          <h5 className="text-sm font-bold truncate">{customer.name}</h5>
                          <p className="text-xs text-slate-500">{customer.orders}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-primary">{customer.points}</p>
                          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-tighter">
                            pts
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    className="w-full py-4 text-xs font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 transition-colors uppercase tracking-widest border-t border-primary/5"
                    type="button"
                  >
                    Full Ranking Table
                  </button>
                </div>
                <div className="bg-primary/5 rounded-xl p-6 border border-primary/10">
                  <h4 className="text-sm font-bold mb-4">Weekly Redemption Trend</h4>
                  <div className="flex items-end justify-between h-24 gap-1">
                    {["40%", "60%", "45%", "90%", "70%", "85%", "55%"].map((height, index) => (
                      <div
                        key={height + index}
                        className={
                          index === 3
                            ? "bg-primary w-full rounded-t-sm shadow-lg shadow-primary/20"
                            : "bg-primary/40 w-full rounded-t-sm"
                        }
                        style={{ height }}
                        title={["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][index]}
                      ></div>
                    ))}
                  </div>
                  <div className="flex justify-between mt-2 text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                    <span>M</span>
                    <span>T</span>
                    <span>W</span>
                    <span>T</span>
                    <span>F</span>
                    <span>S</span>
                    <span>S</span>
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

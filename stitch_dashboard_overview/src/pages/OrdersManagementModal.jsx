import { useState } from "react";
import { bg } from "../utils/bg.js";

export default function OrdersManagementModal({ onNavigate }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

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
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-primary/10 hover:text-primary transition-colors"
              href="#"
              onClick={handleNav("dashboard")}
            >
              <span className="material-symbols-outlined">dashboard</span>
              <span className="text-sm font-medium">Dashboard</span>
            </a>
            <a
              className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary text-white"
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
                data-alt="Profile picture of the store manager"
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
          <header className="h-16 border-b border-primary/10 bg-white dark:bg-slate-900 flex items-center justify-between px-8 shrink-0">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-bold">Active Orders</h2>
              <div className="flex items-center gap-2 px-2.5 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full text-xs font-bold uppercase tracking-widest">
                <span className="size-2 rounded-full bg-green-500 animate-pulse"></span>
                Live
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  search
                </span>
                <input
                  className="pl-10 pr-4 py-2 bg-background-light dark:bg-slate-800 border-none rounded-lg focus:ring-2 focus:ring-primary w-64 text-sm"
                  placeholder="Search orders..."
                  type="text"
                />
              </div>
              <button
                className="size-10 flex items-center justify-center rounded-lg bg-background-light dark:bg-slate-800 text-slate-600 dark:text-slate-400 relative"
                type="button"
              >
                <span className="material-symbols-outlined">notifications</span>
                <span className="absolute top-2 right-2 size-2 bg-primary rounded-full border-2 border-white dark:border-slate-800"></span>
              </button>
            </div>
          </header>
          <div className="flex-1 overflow-y-auto p-8">
            <div className="flex items-center gap-2 mb-8 bg-white dark:bg-slate-900 p-1 rounded-xl w-fit shadow-sm border border-primary/5">
              <button
                className="px-5 py-2 rounded-lg bg-primary text-white font-semibold text-sm"
                type="button"
              >
                All Orders
              </button>
              <button
                className="px-5 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-primary/10 font-medium text-sm transition-colors"
                type="button"
              >
                Pending
              </button>
              <button
                className="px-5 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-primary/10 font-medium text-sm transition-colors"
                type="button"
              >
                Preparing
              </button>
              <button
                className="px-5 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-primary/10 font-medium text-sm transition-colors"
                type="button"
              >
                Ready
              </button>
              <button
                className="px-5 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-primary/10 font-medium text-sm transition-colors"
                type="button"
              >
                Out for Delivery
              </button>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-primary/10 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-primary/10">
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Items
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">
                      Price
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Time
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">
                      Status
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary/5">
                  <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-5 font-bold text-primary">#1024</td>
                    <td className="px-6 py-5">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        John Doe
                      </div>
                      <div className="text-xs text-slate-500">Delivery - 1.2 miles away</div>
                    </td>
                    <td className="px-6 py-5 text-sm">
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        2x Big Burger Extra Cheese
                      </span>
                      <div className="text-xs text-slate-500">No onions, extra sauce</div>
                    </td>
                    <td className="px-6 py-5 text-right font-bold text-slate-900 dark:text-white">
                      $24.50
                    </td>
                    <td className="px-6 py-5 text-sm text-slate-600 dark:text-slate-400">
                      12:05 PM
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex justify-center">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
                          PENDING
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button
                        className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary/90 shadow-sm transition-all active:scale-95"
                        type="button"
                      >
                        Accept
                      </button>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-5 font-bold text-primary">#1023</td>
                    <td className="px-6 py-5">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        Jane Smith
                      </div>
                      <div className="text-xs text-slate-500">Pickup - 12:15 PM</div>
                    </td>
                    <td className="px-6 py-5 text-sm">
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        1x Veggie Wrap, 1x Coke Zero
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right font-bold text-slate-900 dark:text-white">
                      $18.00
                    </td>
                    <td className="px-6 py-5 text-sm text-slate-600 dark:text-slate-400">
                      11:58 AM
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex justify-center">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                          PREPARING
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button
                        className="px-4 py-2 bg-background-light dark:bg-slate-800 border border-primary/20 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg hover:bg-primary/10 transition-all"
                        type="button"
                      >
                        Update Status
                      </button>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-5 font-bold text-primary">#1022</td>
                    <td className="px-6 py-5">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        Robert Brown
                      </div>
                      <div className="text-xs text-slate-500">Delivery - Priority</div>
                    </td>
                    <td className="px-6 py-5 text-sm">
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        3x Street Tacos, 1x Fries
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right font-bold text-slate-900 dark:text-white">
                      $15.75
                    </td>
                    <td className="px-6 py-5 text-sm text-slate-600 dark:text-slate-400">
                      11:45 AM
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex justify-center">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                          READY
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button
                        className="px-4 py-2 bg-background-light dark:bg-slate-800 border border-primary/20 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg hover:bg-primary/10 transition-all"
                        type="button"
                      >
                        Update Status
                      </button>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-5 font-bold text-primary">#1021</td>
                    <td className="px-6 py-5">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        Emily Davis
                      </div>
                      <div className="text-xs text-slate-500">Delivery - DoorDash</div>
                    </td>
                    <td className="px-6 py-5 text-sm">
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        1x Pepperoni Pizza Large
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right font-bold text-slate-900 dark:text-white">
                      $21.00
                    </td>
                    <td className="px-6 py-5 text-sm text-slate-600 dark:text-slate-400">
                      11:30 AM
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex justify-center">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                          IN TRANSIT
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button
                        className="px-4 py-2 bg-background-light dark:bg-slate-800 border border-primary/20 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg hover:bg-primary/10 transition-all"
                        type="button"
                      >
                        Track Order
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-primary/10 shadow-sm">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Queue Time
                </p>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-bold">12m</span>
                  <span className="text-green-500 text-xs font-bold mb-1 flex items-center">
                    <span className="material-symbols-outlined text-sm">trending_down</span>
                    2m
                  </span>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-primary/10 shadow-sm">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Total Orders
                </p>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-bold">48</span>
                  <span className="text-primary text-xs font-bold mb-1">Today</span>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-primary/10 shadow-sm">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Active Chefs
                </p>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-bold">6</span>
                  <span className="text-slate-400 text-xs font-bold mb-1">Online</span>
                </div>
              </div>
              <button
                className="bg-primary hover:bg-primary/90 text-white p-6 rounded-2xl border border-primary/10 shadow-lg shadow-primary/20 flex items-center justify-center gap-3 transition-all active:scale-95 group"
                type="button"
                onClick={() => setIsModalOpen(true)}
              >
                <span className="material-symbols-outlined text-3xl group-hover:rotate-90 transition-transform">
                  add_circle
                </span>
                <span className="text-lg font-bold">Manual Order</span>
              </button>
            </div>
          </div>
        </main>
      </div>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            type="button"
            aria-label="Close modal"
            onClick={() => setIsModalOpen(false)}
          ></button>
          <div className="relative bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-primary/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-primary size-10 rounded-lg flex items-center justify-center text-white">
                  <span className="material-symbols-outlined">add_shopping_cart</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  New Manual Order
                </h3>
              </div>
              <button
                className="size-10 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
                type="button"
                onClick={() => setIsModalOpen(false)}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-8 overflow-y-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                    Customer Name
                  </label>
                  <input
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    placeholder="e.g. Michael Scott"
                    type="text"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                    Phone Number
                  </label>
                  <input
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    placeholder="+1 (555) 000-0000"
                    type="tel"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                  Delivery Address
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    location_on
                  </span>
                  <input
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    placeholder="1725 Slough Avenue, Scranton, PA"
                    type="text"
                  />
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                  Search & Select Items
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      search
                    </span>
                    <input
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                      placeholder="Search menu items..."
                      type="text"
                    />
                  </div>
                  <div className="w-24">
                    <input
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-center"
                      min="1"
                      placeholder="Qty"
                      type="number"
                      defaultValue={1}
                    />
                  </div>
                  <button
                    className="bg-primary/10 text-primary p-3 rounded-xl hover:bg-primary/20 transition-colors"
                    type="button"
                  >
                    <span className="material-symbols-outlined">add</span>
                  </button>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-dashed border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between text-sm py-2 px-2 border-b border-slate-100 dark:border-slate-700/50">
                    <span className="font-medium">1x Large Pepperoni Pizza</span>
                    <div className="flex items-center gap-4">
                      <span className="font-bold">$18.00</span>
                      <button className="text-slate-400 hover:text-red-500" type="button">
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm py-2 px-2">
                    <span className="font-medium">2x Garlic Knots</span>
                    <div className="flex items-center gap-4">
                      <span className="font-bold">$6.50</span>
                      <button className="text-slate-400 hover:text-red-500" type="button">
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                    Payment Method
                  </label>
                  <select className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all appearance-none cursor-pointer">
                    <option>Cash on Delivery</option>
                    <option>Credit/Debit Card</option>
                    <option>In-Store Payment</option>
                    <option>Loyalty Points</option>
                  </select>
                </div>
                <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-slate-500 font-medium">Subtotal</span>
                    <span className="text-sm font-bold">$24.50</span>
                  </div>
                  <div className="flex justify-between items-center mb-2 pb-2 border-b border-primary/10">
                    <span className="text-xs text-slate-500 font-medium">Tax & Fees</span>
                    <span className="text-sm font-bold">$3.20</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Total
                    </span>
                    <span className="text-2xl font-black text-primary">$27.70</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-primary/10 bg-slate-50 dark:bg-slate-800/30 flex gap-4">
              <button
                className="flex-1 px-6 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                type="button"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="flex-[2] px-6 py-3.5 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95"
                type="button"
                onClick={() => setIsModalOpen(false)}
              >
                Create Order
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

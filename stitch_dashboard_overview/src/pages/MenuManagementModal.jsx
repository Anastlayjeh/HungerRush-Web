import { useState } from "react";
import { bg } from "../utils/bg.js";

const menuItems = [
  {
    title: "Spicy Chicken Burger",
    price: "$12.99",
    description: "Zesty fried chicken breast, jalapenos, and spicy mayo on a toasted bun.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuA55eemX_b_rDY3V6bykDpd7WAywAuB_C-lIX3inBwe_U9cdOdFOaIe7PvNsf5BP0GMAjtFlfCjwf2ckEG0Os5wRhzgqbRqtJiJX9gy8qDiYt9LBHW6VQ95lijm8Yp61n7rXbtyc7Y_P7ivrosidB1kAL2qGt5oisHZBocmr8_9LuodLvTPGDAO5lmRmJHLx7Ph57YeSNfvUthy8o-IdfBvQZq6k423AszZvX4GZo1axnpMnOljOTXaQFTElKAzrFAuN2uhVf5fKBvU",
    status: "AVAILABLE",
    statusClass: "bg-green-100 dark:bg-green-900/30 text-green-600",
    available: true,
  },
  {
    title: "Double Beef BBQ",
    price: "$15.50",
    description: "Two prime beef patties, smoked cheddar, bacon, and tangy BBQ sauce.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBKEeXeZNCb8wLrS6oc4vZpFZOEkgWB9ptuN2EVBylNgfWXiXiOsVmDlC5ZqjIzIBxScNjuFyFib7tPKgHNY4PCeCBm1BpCfMQzrSYgsN4OKZadjTiXEdo4HKArqKHY4UgdSKZxnRW_2itolfPWqgEN09scjRWCwxetmVKiDAB4WPfdBKqglBft6mXykgOSZuI-7_gmGHwrqfXAz6kGGnsnzhHfX24spseazbuPHG4c-QH-igHTGCuQNkNuU2ANaiYOiuM1ocmZmUn_",
    status: "AVAILABLE",
    statusClass: "bg-green-100 dark:bg-green-900/30 text-green-600",
    available: true,
  },
  {
    title: "Truffle Fries",
    price: "$6.99",
    description:
      "Golden fries tossed in truffle oil and garnished with parmesan and parsley.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBmjNDF09qenABQvipXKdSvei4V-zH8Sa4Ok6jMj5DZwSBWYfqomg0wgaRkXqbG9nz7I9chnz1_V3AcY6hgLPJ_kWkIDQokhKqzgb2cNdKsAtZR0DlzJxIxutxUufDS2TXkf7c7QqU39p6eybFnRQQPfPQ0EWcgj1jxCH2-npJLG3o01hPJBavYERpY6ePw0w_z6419WSCn0U17A6-bJg_zFVRY8sSo-A58SiSJS7nGJEC9BSoVEG05L0t5JPMzDvK1EHaySZj1maj1",
    status: "AVAILABLE",
    statusClass: "bg-green-100 dark:bg-green-900/30 text-green-600",
    available: true,
  },
  {
    title: "Giant Onion Rings",
    price: "$5.50",
    description:
      "Beer-battered thick-cut onion rings served with ranch dipping sauce.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCsf2ACnowr7SHOsHOlJOarCqz0ruPEj_xC2upwRqLMlIZhAbvXXf3fz-qiiNJoO8BqVNpZsXtuhoBR1k0JXWDUCJdfxqm60s5S1gFpOzQld7e_sOqg16F1_1oKPVT5Dp4ckveiYxaHETQlyjDOlAlB2f4xwj8axlc1jxIE3Kv9EVX4vFwINeyghVHcFhrfm-0UnALbLaWPDJ90jmrF11_wdfNnDG_YcAL8ka_RMIG6rw2n6e-ItClKrkmW1IF4Q6f9_1nXxy0YF9QR",
    status: "UNAVAILABLE",
    statusClass: "bg-red-100 dark:bg-red-900/30 text-red-600",
    available: false,
    outOfStock: true,
  },
  {
    title: "Cold Brew Cola",
    price: "$3.50",
    description:
      "Artisanal craft cola made with real kola nuts and a hint of vanilla.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAjVruuaawfZZ7WGVgttTY17yYgpAw5U-4tcMv7XsRNcH6jS4QNPHIj7TbGChPJxygVPbY5spN_jFikOXA7RtJBcUZT8dYTtmod9VwoB0lge0Qge9k2ECSGYyokx_TzkF6q0CWJ5isii6qMKLXr2EpvdT8exWOF5G7yciQnX_klDhYeUxqA2BEFX4oXZGSBDq_f4gH_vcoezcwwEr2mAi5UmpH2JDJZRtLIk4PCYU7RIg8hSGE9LbwhMC9_xAgngNFGj5BwxrlTBjqh",
    status: "AVAILABLE",
    statusClass: "bg-green-100 dark:bg-green-900/30 text-green-600",
    available: true,
  },
  {
    title: "Garden Caesar",
    price: "$10.99",
    description:
      "Fresh romaine lettuce, shaved parmesan, house-made croutons.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuB0ctFrO0RvSQc40CxSzazuPqHp8rvFos99ffAC42K8u4OuyA1hEaI2b15NRi_Ze2yjzmuZCJnFz1-vsvXAjF0eLht5-BZ4LLypqAk8Yyfv60aCbpJhTsoaKIeF9BXj3knEKj-EL98fsHGVNBaLK1WZ1QoMNn1Nx9JrdKUjm9JwOjDDjjnFlupi6WK5V6li-tGO8NblPd0BH9T9m43psY6v1AI4XY3CZ4afhP6678XXRieHUn5TO-HZcp8MT9npEopaT1Dthd1_8kqQ",
    status: "AVAILABLE",
    statusClass: "bg-green-100 dark:bg-green-900/30 text-green-600",
    available: true,
  },
];

function MenuCard({ item }) {
  return (
    <div
      className={`bg-white dark:bg-slate-800 rounded-xl border border-primary/5 overflow-hidden shadow-sm hover:shadow-xl transition-all group${
        item.outOfStock ? " opacity-80" : ""
      }`}
    >
      <div className={`relative h-48 overflow-hidden${item.outOfStock ? " grayscale" : ""}`}>
        <div
          className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-500"
          data-alt={item.title}
          style={bg(item.image)}
        ></div>
        {item.outOfStock ? (
          <div className="absolute inset-0 bg-background-dark/40 flex items-center justify-center">
            <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">
              OUT OF STOCK
            </span>
          </div>
        ) : null}
        <div className="absolute top-3 right-3 flex gap-2">
          <button
            className="w-8 h-8 rounded-full bg-white/90 backdrop-blur shadow text-slate-700 flex items-center justify-center hover:bg-primary hover:text-white transition-colors"
            type="button"
          >
            <span className="material-symbols-outlined text-lg">edit</span>
          </button>
          <button
            className="w-8 h-8 rounded-full bg-white/90 backdrop-blur shadow text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors"
            type="button"
          >
            <span className="material-symbols-outlined text-lg">delete</span>
          </button>
        </div>
      </div>
      <div className="p-5">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-lg leading-tight">{item.title}</h3>
          <span className="text-primary font-bold">{item.price}</span>
        </div>
        <p className="text-slate-500 text-xs mb-4 line-clamp-2 italic">
          {item.description}
        </p>
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Status</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${item.statusClass}`}>
              {item.status}
            </span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input className="sr-only peer" type="checkbox" defaultChecked={item.available} />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>
      </div>
    </div>
  );
}

export default function MenuManagementModal({ onNavigate }) {
  const [isModalOpen, setIsModalOpen] = useState(true);

  const handleNav = (page) => (event) => {
    event.preventDefault();
    onNavigate?.(page);
  };

  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100">
      <div className="flex min-h-screen">
        <aside className="w-64 border-r border-primary/10 bg-white dark:bg-background-dark/50 flex flex-col fixed h-full">
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
              className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary text-white"
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
        <main className="ml-64 flex-1 flex flex-col">
          <header className="h-20 flex items-center justify-between px-8 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md sticky top-0 z-10 border-b border-primary/5">
            <div className="flex items-center gap-8">
              <h2 className="text-xl font-bold tracking-tight">Menu Management</h2>
              <div className="relative w-64">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                  search
                </span>
                <input
                  className="w-full pl-10 pr-4 py-2 bg-primary/5 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:bg-white dark:focus:bg-background-dark transition-all placeholder:text-slate-400"
                  placeholder="Search menu items..."
                  type="text"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-lg font-bold text-sm shadow-md hover:shadow-lg hover:bg-primary/90 transition-all"
                type="button"
                onClick={() => setIsModalOpen(true)}
              >
                <span className="material-symbols-outlined text-lg">add</span>
                <span>Add New Item</span>
              </button>
              <button
                className="p-2 text-slate-500 hover:bg-primary/5 rounded-lg transition-colors"
                type="button"
              >
                <span className="material-symbols-outlined">notifications</span>
              </button>
            </div>
          </header>
          <div className="px-8 py-6">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {[
                "All Items",
                "Burgers",
                "Sides",
                "Drinks",
                "Desserts",
                "Offers",
              ].map((label, index) => (
                <button
                  key={label}
                  className={
                    index === 0
                      ? "px-6 py-2 rounded-full bg-primary text-white text-sm font-medium whitespace-nowrap"
                      : "px-6 py-2 rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-primary/10 text-sm font-medium whitespace-nowrap hover:border-primary/40 transition-colors"
                  }
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="px-8 pb-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {menuItems.map((item) => (
                <MenuCard key={item.title} item={item} />
              ))}
            </div>
          </div>
          <button
            className="fixed bottom-8 right-8 lg:hidden bg-primary text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center text-2xl z-20"
            type="button"
            onClick={() => setIsModalOpen(true)}
          >
            <span className="material-symbols-outlined">add</span>
          </button>
        </main>
      </div>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm relative">
          <button
            className="absolute inset-0"
            type="button"
            aria-label="Close modal"
            onClick={() => setIsModalOpen(false)}
          ></button>
          <div className="relative bg-white dark:bg-slate-900 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold">Add New Menu Item</h3>
                <p className="text-slate-500 text-sm">Fill in the details for your new dish</p>
              </div>
              <button
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                type="button"
                onClick={() => setIsModalOpen(false)}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="relative group cursor-pointer">
                <div className="w-full h-40 rounded-xl border-2 border-dashed border-primary/20 bg-primary/5 flex flex-col items-center justify-center gap-2 group-hover:border-primary/40 group-hover:bg-primary/10 transition-all">
                  <span className="material-symbols-outlined text-primary text-3xl">add_a_photo</span>
                  <span className="text-xs font-bold text-primary uppercase tracking-widest">
                    Upload Item Image
                  </span>
                  <p className="text-[10px] text-slate-400">PNG, JPG up to 10MB</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">
                    Item Name
                  </label>
                  <input
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-lg focus:ring-2 focus:ring-primary/20 text-sm placeholder:text-slate-400"
                    placeholder="e.g. Classic Margherita"
                    type="text"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">
                    Price ($)
                  </label>
                  <input
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-lg focus:ring-2 focus:ring-primary/20 text-sm placeholder:text-slate-400"
                    placeholder="0.00"
                    step="0.01"
                    type="number"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">
                  Category
                </label>
                <select className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-lg focus:ring-2 focus:ring-primary/20 text-sm appearance-none cursor-pointer">
                  <option value="">Select Category</option>
                  <option value="burgers">Burgers</option>
                  <option value="sides">Sides</option>
                  <option value="drinks">Drinks</option>
                  <option value="desserts">Desserts</option>
                  <option value="offers">Offers</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">
                  Description
                </label>
                <textarea
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-lg focus:ring-2 focus:ring-primary/20 text-sm placeholder:text-slate-400 resize-none"
                  placeholder="Describe the item ingredients, taste..."
                  rows="3"
                ></textarea>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <div className="flex flex-col">
                  <span className="text-sm font-bold">Instantly Available</span>
                  <span className="text-xs text-slate-500">
                    Show this item on the menu right away
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input className="sr-only peer" type="checkbox" defaultChecked />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            </form>
            <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3 bg-slate-50/50 dark:bg-slate-800/20">
              <button
                className="px-5 py-2.5 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-200/50 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
                type="button"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="px-8 py-2.5 bg-primary text-white rounded-lg text-sm font-bold shadow-md hover:shadow-lg hover:bg-primary/90 transition-all"
                type="button"
                onClick={() => setIsModalOpen(false)}
              >
                Create Item
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

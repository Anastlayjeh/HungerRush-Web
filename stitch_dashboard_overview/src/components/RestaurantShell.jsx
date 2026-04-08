const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: "dashboard" },
  { key: "orders", label: "Orders", icon: "receipt_long" },
  { key: "menu", label: "Menu", icon: "menu_book" },
  { key: "videos", label: "Videos", icon: "videocam" },
  { key: "reviews", label: "Reviews", icon: "star" },
  { key: "loyalty", label: "Loyalty", icon: "card_membership" },
  { key: "analytics", label: "Analytics", icon: "monitoring" },
  { key: "settings", label: "Settings", icon: "settings" },
];

export default function RestaurantShell({
  activePage,
  onNavigate,
  user,
  onLogout,
  title,
  headerActions = null,
  children,
}) {
  const profilePhotoUrl = user?.profilePhotoUrl || "";

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen">
      <aside className="w-64 border-r border-primary/10 bg-white dark:bg-background-dark/50 fixed h-full flex flex-col">
        <div className="p-6 flex items-center gap-3">
          <div className="bg-primary size-10 rounded-lg flex items-center justify-center text-white">
            <span className="material-symbols-outlined">restaurant</span>
          </div>
          <div>
            <h1 className="text-base font-bold leading-none">HungerRush</h1>
            <p className="text-primary text-xs font-semibold">Restaurant Management</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = item.key === activePage;
            return (
              <button
                key={item.key}
                className={
                  isActive
                    ? "w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-primary text-white"
                    : "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-primary/10 hover:text-primary transition-colors"
                }
                type="button"
                onClick={() => onNavigate?.(item.key)}
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-primary/10">
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-primary/5">
            {profilePhotoUrl ? (
              <img
                className="size-10 rounded-full object-cover border border-slate-200"
                src={profilePhotoUrl}
                alt="Profile"
              />
            ) : (
              <div className="size-10 rounded-full bg-slate-300 flex items-center justify-center text-slate-600">
                <span className="material-symbols-outlined">person</span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{user?.name || "Restaurant User"}</p>
              <p className="text-xs text-slate-500 truncate">
                {String(user?.role || "restaurant_owner").replaceAll("_", " ")}
              </p>
            </div>
            <button
              className="material-symbols-outlined text-slate-400 text-sm hover:text-red-500 transition-colors"
              type="button"
              onClick={onLogout}
              title="Logout"
            >
              logout
            </button>
          </div>
        </div>
      </aside>

      <main className="ml-64 min-h-screen">
        <header className="h-16 border-b border-primary/10 bg-white dark:bg-background-dark/80 backdrop-blur-md sticky top-0 z-10 px-8 flex items-center justify-between">
          <h2 className="text-xl font-bold">{title}</h2>
          <div className="flex items-center gap-3">{headerActions}</div>
        </header>
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}

import RestaurantShell from "./RestaurantShell.jsx";

const ADMIN_NAV_ITEMS = [
  { key: "adminOverview", label: "Overview", icon: "dashboard" },
  { key: "adminUsers", label: "Users", icon: "group" },
  { key: "adminCustomers", label: "Customers", icon: "person" },
  { key: "adminRestaurants", label: "Restaurants", icon: "storefront" },
  { key: "adminNewRestaurants", label: "New Registrations", icon: "hourglass_top" },
  { key: "adminMenuItems", label: "Menu Items", icon: "restaurant_menu" },
  { key: "adminVideos", label: "Videos", icon: "smart_display" },
  { key: "adminOrders", label: "Orders", icon: "receipt_long" },
  { key: "adminReports", label: "Reports", icon: "flag" },
  { key: "adminDatabase", label: "Database", icon: "database" },
  { key: "adminSettings", label: "Settings", icon: "settings" },
];

export default function AdminShell(props) {
  return (
    <RestaurantShell
      {...props}
      navItems={ADMIN_NAV_ITEMS}
      brandIcon="admin_panel_settings"
      brandTitle="HungerRush"
      brandSubtitle="Admin Panel"
    />
  );
}

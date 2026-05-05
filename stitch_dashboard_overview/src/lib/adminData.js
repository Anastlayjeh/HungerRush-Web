export const ADMIN_SETTINGS_STORAGE_KEY = "hungerrush_admin_settings";

const now = new Date();
const daysAgo = (days) => new Date(now.getTime() - days * 86400000).toISOString();

export const mockAdminData = {
  stats: {
    users: 1248,
    customers: 1034,
    restaurant_owners: 186,
    restaurants: 214,
    orders: 8912,
    pending_orders: 38,
    total_revenue: 284930.75,
    reported_content: 17,
    pending_approvals: 14,
    menu_items: 2860,
  },
  users: [
    { id: 1001, name: "Maya Hassan", email: "maya@example.com", role: "customer", status: "active", created_at: daysAgo(2) },
    { id: 1002, name: "Omar Haddad", email: "omar@cedargrill.test", role: "restaurant_owner", status: "active", created_at: daysAgo(8) },
    { id: 1003, name: "Nour Khalil", email: "nour@example.com", role: "customer", status: "pending", created_at: daysAgo(11) },
    { id: 1004, name: "Admin User", email: "admin@hungerrush.local", role: "admin", status: "active", created_at: daysAgo(22) },
    { id: 1005, name: "Rami Farah", email: "rami@example.com", role: "customer", status: "suspended", created_at: daysAgo(31) },
    { id: 1006, name: "Leila Mansour", email: "leila@pizzabloom.test", role: "restaurant_owner", status: "pending", created_at: daysAgo(42) },
  ],
  restaurants: [
    { id: 201, name: "Cedar Grill", owner_name: "Omar Haddad", email: "omar@cedargrill.test", phone: "+961 70 111 222", status: "approved", average_rating: 4.7, created_at: daysAgo(7) },
    { id: 202, name: "Pizza Bloom", owner_name: "Leila Mansour", email: "leila@pizzabloom.test", phone: "+961 71 222 333", status: "pending", average_rating: 0, created_at: daysAgo(15), description: "Wood-fired pizza concept awaiting final compliance approval." },
    { id: 205, name: "Falafel District", owner_name: "Hadi Salameh", email: "hadi@falafeldistrict.test", phone: "+961 79 410 901", status: "pending", average_rating: 0, created_at: daysAgo(23), description: "Quick-service falafel and mezze kiosk with delivery-only launch." },
    { id: 206, name: "Noodle Port", owner_name: "Lina Chou", email: "lina@noodleport.test", phone: "+961 81 602 115", status: "pending", average_rating: 0, created_at: daysAgo(19), description: "Pan-Asian noodle bar waiting on menu verification." },
    { id: 207, name: "Roast & Rice", owner_name: "Samir Ataya", email: "samir@roastandrice.test", phone: "+961 70 552 019", status: "pending", average_rating: 0, created_at: daysAgo(12), description: "Family kitchen requesting onboarding approval for weekday lunch service." },
    { id: 208, name: "Pita Avenue", owner_name: "Dina Bazzi", email: "dina@pitaavenue.test", phone: "+961 76 887 234", status: "pending", average_rating: 0, created_at: daysAgo(9), description: "Wrap and pita concept with late-night operations in progress." },
    { id: 209, name: "Sultan Bites", owner_name: "Jad Mroueh", email: "jad@sultanbites.test", phone: "+961 03 119 883", status: "pending", average_rating: 0, created_at: daysAgo(6), description: "Traditional grill house submitted trade documents and awaiting confirmation." },
    { id: 203, name: "Saffron Bowl", owner_name: "Karim Nader", email: "karim@saffron.test", phone: "+961 76 333 444", status: "suspended", average_rating: 3.9, created_at: daysAgo(28) },
    { id: 204, name: "Urban Wraps", owner_name: "Tala Saad", email: "tala@wraps.test", phone: "+961 78 444 555", status: "rejected", average_rating: 0, created_at: daysAgo(37) },
  ],
  restaurantRegistrations: [
    { id: 3001, owner_user_id: 1002, restaurant_name: "North Fork Kitchen", description: "Levant grill concept with dine-in and delivery service.", contact_email: "omar@cedargrill.test", contact_phone: "+961 70 111 222", status: "pending", created_at: daysAgo(12), owner: { id: 1002, name: "Omar Haddad", email: "omar@cedargrill.test", phone: "+961 70 111 222", role: "restaurant_owner", status: "active" } },
    { id: 3002, owner_user_id: 1006, restaurant_name: "Blue Lantern Bistro", description: "Wood-fired kitchen focused on seasonal plates.", contact_email: "leila@pizzabloom.test", contact_phone: "+961 71 222 333", status: "pending", created_at: daysAgo(10), owner: { id: 1006, name: "Leila Mansour", email: "leila@pizzabloom.test", phone: "+961 71 222 333", role: "restaurant_owner", status: "pending" } },
    { id: 3003, owner_user_id: 1101, restaurant_name: "Harbor Tacos Lab", description: "Fast casual taco and mezze fusion plates.", contact_email: "hadi@falafeldistrict.test", contact_phone: "+961 79 410 901", status: "pending", created_at: daysAgo(9), owner: { id: 1101, name: "Hadi Salameh", email: "hadi@falafeldistrict.test", phone: "+961 79 410 901", role: "restaurant_owner", status: "active" } },
    { id: 3004, owner_user_id: 1102, restaurant_name: "Sizzle Cart Co", description: "Late-night grill cart pilot branch application.", contact_email: "lina@noodleport.test", contact_phone: "+961 81 602 115", status: "pending", created_at: daysAgo(7), owner: { id: 1102, name: "Lina Chou", email: "lina@noodleport.test", phone: "+961 81 602 115", role: "restaurant_owner", status: "active" } },
    { id: 3005, owner_user_id: 1103, restaurant_name: "Maple Oven House", description: "Family-style baked meals and rice platters.", contact_email: "samir@roastandrice.test", contact_phone: "+961 70 552 019", status: "pending", created_at: daysAgo(5), owner: { id: 1103, name: "Samir Ataya", email: "samir@roastandrice.test", phone: "+961 70 552 019", role: "restaurant_owner", status: "active" } },
    { id: 3006, owner_user_id: 1104, restaurant_name: "Pita Avenue", description: "Modern pita wraps and late-night kitchen.", contact_email: "dina@pitaavenue.test", contact_phone: "+961 76 887 234", status: "approved", reviewed_at: daysAgo(4), review_note: "Approved after business document review.", created_at: daysAgo(8), owner: { id: 1104, name: "Dina Bazzi", email: "dina@pitaavenue.test", phone: "+961 76 887 234", role: "restaurant_owner", status: "active" } },
  ],
  menuItems: [
    { id: 501, restaurant_id: 201, image_url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=500&q=80", name: "Classic Burger", restaurant_name: "Cedar Grill", category: "Burgers", price: 9.5, availability: "available", created_at: daysAgo(4) },
    { id: 502, restaurant_id: 202, image_url: "https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=500&q=80", name: "Margherita Pizza", restaurant_name: "Pizza Bloom", category: "Pizza", price: 11, availability: "disabled", created_at: daysAgo(13) },
    { id: 503, restaurant_id: 203, image_url: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=500&q=80", name: "Halloumi Salad", restaurant_name: "Saffron Bowl", category: "Salads", price: 7.25, availability: "available", created_at: daysAgo(18) },
    { id: 504, restaurant_id: 204, image_url: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&w=500&q=80", name: "Chicken Shawarma", restaurant_name: "Urban Wraps", category: "Wraps", price: 6.75, availability: "available", created_at: daysAgo(29) },
  ],
  videos: [
    { id: 6101, restaurant_id: 201, restaurant_name: "Cedar Grill", title: "Burger Assembly in 20 Seconds", description: "Behind-the-scenes burger assembly with fresh ingredients.", thumbnail_url: "https://images.unsplash.com/photo-1551782450-a2132b4ba21d?auto=format&fit=crop&w=900&q=80", media_url: "https://example.com/videos/cedar-burger-6101.mp4", stream_hls_url: "https://example.com/stream/cedar-burger-6101.m3u8", status: "published", stream_ready: true, stream_status: "ready", duration_seconds: 24, views_count: 4823, likes_count: 1190, shares_count: 206, comments_count: 48, menu_item: { id: 501, name: "Classic Burger" }, created_at: daysAgo(1.2), published_at: daysAgo(1.1) },
    { id: 6102, restaurant_id: 202, restaurant_name: "Pizza Bloom", title: "Stone Oven Margherita", description: "Pizza Bloom signature margherita fresh from the stone oven.", thumbnail_url: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=900&q=80", media_url: "https://example.com/videos/pizza-bloom-6102.mp4", stream_hls_url: "https://example.com/stream/pizza-bloom-6102.m3u8", status: "draft", stream_ready: false, stream_status: "processing", duration_seconds: 19, views_count: 0, likes_count: 0, shares_count: 0, comments_count: 0, menu_item: { id: 502, name: "Margherita Pizza" }, created_at: daysAgo(0.35), published_at: null },
    { id: 6103, restaurant_id: 203, restaurant_name: "Saffron Bowl", title: "Healthy Lunch Combo", description: "Quick look at our saffron rice and halloumi combo plate.", thumbnail_url: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80", media_url: "https://example.com/videos/saffron-6103.mp4", stream_hls_url: "https://example.com/stream/saffron-6103.m3u8", status: "published", stream_ready: true, stream_status: "ready", duration_seconds: 31, views_count: 2310, likes_count: 602, shares_count: 91, comments_count: 23, menu_item: { id: 503, name: "Halloumi Salad" }, created_at: daysAgo(3.1), published_at: daysAgo(3.0) },
    { id: 6104, restaurant_id: 204, restaurant_name: "Urban Wraps", title: "Late Night Shawarma Roll", description: "Urban Wraps shawarma roll prep at high speed.", thumbnail_url: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&w=900&q=80", media_url: "https://example.com/videos/urban-6104.mp4", stream_hls_url: "https://example.com/stream/urban-6104.m3u8", status: "archived", stream_ready: true, stream_status: "ready", duration_seconds: 27, views_count: 987, likes_count: 204, shares_count: 33, comments_count: 10, menu_item: { id: 504, name: "Chicken Shawarma" }, created_at: daysAgo(7.4), published_at: daysAgo(7.2) },
    { id: 6105, restaurant_id: 201, restaurant_name: "Cedar Grill", title: "Lunch Rush Prep", description: "Team prep before lunch rush at Cedar Grill.", thumbnail_url: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80", media_url: "https://example.com/videos/cedar-6105.mp4", stream_hls_url: "https://example.com/stream/cedar-6105.m3u8", status: "published", stream_ready: true, stream_status: "ready", duration_seconds: 42, views_count: 6240, likes_count: 1404, shares_count: 287, comments_count: 67, menu_item: { id: 501, name: "Classic Burger" }, created_at: daysAgo(0.8), published_at: daysAgo(0.75) },
  ],
  orders: [
    {
      id: 8001,
      restaurant_id: 201,
      customer: { name: "Maya Hassan", phone: "+961 70 100 200", email: "maya@example.com" },
      restaurant: { id: 201, name: "Cedar Grill" },
      branch: { id: 1, name: "Cedar Grill Downtown", address: "Hamra Main Street, Beirut" },
      subtotal: 28,
      fees: 3.5,
      total: 31.5,
      payment_status: "paid",
      status: "pending",
      created_at: daysAgo(0.1),
      updated_at: daysAgo(0.08),
      items: [
        {
          id: 1,
          menu_item_id: 501,
          quantity: 2,
          unit_price: 9.5,
          notes: "add cheese; no onions; please cut in half",
          menu_item: {
            id: 501,
            name: "Classic Burger",
            description: "Beef burger with cheddar and fresh vegetables.",
            ingredients: ["beef patty", "cheddar", "lettuce", "onion", "tomato"],
          },
        },
        {
          id: 2,
          menu_item_id: 507,
          quantity: 1,
          unit_price: 9,
          notes: "extra sauce",
          menu_item: {
            id: 507,
            name: "Crispy Fries Basket",
            description: "Crispy potato fries with house sauce.",
            ingredients: ["potato", "salt", "house sauce"],
          },
        },
      ],
      status_history: [{ id: 1, status: "pending", changed_at: daysAgo(0.1) }],
    },
    {
      id: 8002,
      restaurant_id: 202,
      customer: { name: "Rami Farah", phone: "+961 71 220 330", email: "rami@example.com" },
      restaurant: { id: 202, name: "Pizza Bloom" },
      branch: { id: 2, name: "Pizza Bloom Ashrafieh", address: "Monot Street, Beirut" },
      subtotal: 15,
      fees: 3,
      total: 18,
      payment_status: "paid",
      status: "delivered",
      created_at: daysAgo(1),
      updated_at: daysAgo(0.77),
      items: [
        {
          id: 3,
          menu_item_id: 502,
          quantity: 1,
          unit_price: 11,
          notes: "add basil",
          menu_item: {
            id: 502,
            name: "Margherita Pizza",
            description: "Stone oven margherita with mozzarella and basil.",
            ingredients: ["dough", "tomato sauce", "mozzarella", "basil"],
          },
        },
        {
          id: 4,
          menu_item_id: 508,
          quantity: 1,
          unit_price: 4,
          notes: "no ice",
          menu_item: {
            id: 508,
            name: "Lemon Soda",
            description: "Fresh lemon soda with mint.",
            ingredients: ["lemon", "soda", "mint", "ice"],
          },
        },
      ],
      status_history: [
        { id: 1, status: "pending", changed_at: daysAgo(1) },
        { id: 2, status: "accepted", changed_at: daysAgo(0.96) },
        { id: 3, status: "preparing", changed_at: daysAgo(0.93) },
        { id: 4, status: "ready_for_pickup", changed_at: daysAgo(0.9) },
        { id: 5, status: "picked_up", changed_at: daysAgo(0.86) },
        { id: 6, status: "on_the_way", changed_at: daysAgo(0.82) },
        { id: 7, status: "delivered", changed_at: daysAgo(0.78) },
      ],
    },
    {
      id: 8003,
      restaurant_id: 203,
      customer: { name: "Nour Khalil", phone: "+961 76 333 444", email: "nour@example.com" },
      restaurant: { id: 203, name: "Saffron Bowl" },
      branch: { id: 3, name: "Saffron Bowl Verdun", address: "Verdun Avenue, Beirut" },
      subtotal: 38.75,
      fees: 4,
      total: 42.75,
      payment_status: "pending",
      status: "preparing",
      created_at: daysAgo(2),
      updated_at: daysAgo(1.9),
      items: [
        {
          id: 5,
          menu_item_id: 503,
          quantity: 2,
          unit_price: 7.25,
          notes: "without olives",
          menu_item: {
            id: 503,
            name: "Halloumi Salad",
            description: "Halloumi salad with mixed greens and dressing.",
            ingredients: ["halloumi", "lettuce", "olive", "tomato", "dressing"],
          },
        },
        {
          id: 6,
          menu_item_id: 509,
          quantity: 1,
          unit_price: 24.25,
          notes: "add avocado",
          menu_item: {
            id: 509,
            name: "Saffron Chicken Bowl",
            description: "Saffron rice with grilled chicken and vegetables.",
            ingredients: ["rice", "chicken", "carrot", "pepper", "avocado"],
          },
        },
      ],
      status_history: [
        { id: 1, status: "pending", changed_at: daysAgo(2) },
        { id: 2, status: "accepted", changed_at: daysAgo(1.95) },
        { id: 3, status: "preparing", changed_at: daysAgo(1.9) },
      ],
    },
    {
      id: 8004,
      restaurant_id: 204,
      customer: { name: "Guest Order", phone: "", email: "" },
      restaurant: { id: 204, name: "Urban Wraps" },
      branch: { id: 4, name: "Urban Wraps Jnah", address: "Jnah Coastal Road, Beirut" },
      subtotal: 11.25,
      fees: 2,
      total: 13.25,
      payment_status: "refunded",
      status: "cancelled",
      created_at: daysAgo(3),
      updated_at: daysAgo(2.9),
      items: [
        {
          id: 7,
          menu_item_id: 504,
          quantity: 1,
          unit_price: 6.75,
          notes: "no garlic",
          menu_item: {
            id: 504,
            name: "Chicken Shawarma",
            description: "Chicken shawarma wrap with fries.",
            ingredients: ["chicken", "garlic sauce", "pickles", "fries", "bread"],
          },
        },
        {
          id: 8,
          menu_item_id: 510,
          quantity: 1,
          unit_price: 4.5,
          notes: "plus spicy dip",
          menu_item: {
            id: 510,
            name: "Potato Wedges",
            description: "Oven-baked potato wedges.",
            ingredients: ["potato", "paprika", "salt", "spicy dip"],
          },
        },
      ],
      status_history: [
        { id: 1, status: "pending", changed_at: daysAgo(3) },
        { id: 2, status: "cancelled", changed_at: daysAgo(2.9) },
      ],
    },
  ],
  reports: [
    { id: 901, restaurant_id: 201, restaurant: { id: 201, name: "Cedar Grill" }, reported_item_type: "Review", subject: "Abusive review", message: "Customer left a threatening review.", reporter: { name: "Omar Haddad" }, status: "open", created_at: daysAgo(1) },
    { id: 902, restaurant_id: 202, restaurant: { id: 202, name: "Pizza Bloom" }, reported_item_type: "Restaurant", subject: "Wrong business details", message: "Address appears misleading.", reporter: { name: "Maya Hassan" }, status: "reviewing", created_at: daysAgo(5) },
    { id: 903, restaurant_id: 203, restaurant: { id: 203, name: "Saffron Bowl" }, reported_item_type: "Video", subject: "Inappropriate video", message: "Video content does not show food.", reporter: { name: "Nour Khalil" }, status: "resolved", created_at: daysAgo(9) },
  ],
  activity: [
    { id: "act-1", label: "User #1002 updated restaurant settings", created_at: daysAgo(0.05) },
    { id: "act-2", label: "Order #8001 moved to pending review", created_at: daysAgo(0.2) },
    { id: "act-3", label: "Report #901 was opened", created_at: daysAgo(1) },
    { id: "act-4", label: "Restaurant #202 submitted approval documents", created_at: daysAgo(2) },
  ],
};

export function getDefaultAdminSettings() {
  return {
    platformName: "HungerRush",
    supportEmail: "support@hungerrush.local",
    commissionPercentage: 12,
    maintenanceMode: false,
    allowRestaurantRegistration: true,
    allowCustomerRegistration: true,
  };
}

export function loadAdminSettings() {
  try {
    const stored = JSON.parse(localStorage.getItem(ADMIN_SETTINGS_STORAGE_KEY) || "null");
    return { ...getDefaultAdminSettings(), ...(stored || {}) };
  } catch {
    return getDefaultAdminSettings();
  }
}

export function saveAdminSettings(settings) {
  localStorage.setItem(ADMIN_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  return settings;
}

export function createDatabaseStats(source = {}) {
  const stats = source.stats || source || {};

  return {
    users: Number(stats.users || stats.total_users || mockAdminData.stats.users),
    restaurants: Number(stats.restaurants || mockAdminData.stats.restaurants),
    menuItems: Number(stats.menu_items || mockAdminData.stats.menu_items),
    orders: Number(stats.orders || mockAdminData.stats.orders),
    reports: Number(stats.reported_content || stats.open_reports || mockAdminData.stats.reported_content),
  };
}

export function getMockAdminDashboard() {
  return {
    stats: mockAdminData.stats,
    recent_orders: mockAdminData.orders.slice(0, 3),
    recent_reports: mockAdminData.reports.slice(0, 3),
  };
}

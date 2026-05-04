import { useEffect, useMemo, useState } from "react";
import DashboardOverview from "./pages/DashboardOverview.jsx";
import OrdersManagementModal from "./pages/OrdersManagementModal.jsx";
import MenuManagementModal from "./pages/MenuManagementModal.jsx";
import VideoManagement from "./pages/VideoManagement.jsx";
import CreateVideoPost from "./pages/CreateVideoPost.jsx";
import CustomerReviews from "./pages/CustomerReviews.jsx";
import LoyaltyRewards from "./pages/LoyaltyRewards.jsx";
import AnalyticsInsights from "./pages/AnalyticsInsights.jsx";
import RestaurantSettings from "./pages/RestaurantSettings.jsx";
import AdminOverview from "./pages/admin/AdminOverview.jsx";
import AdminUsers from "./pages/admin/AdminUsers.jsx";
import AdminCustomers from "./pages/admin/AdminCustomers.jsx";
import AdminRestaurants from "./pages/admin/AdminRestaurants.jsx";
import AdminNewRestaurants from "./pages/admin/AdminNewRestaurants.jsx";
import AdminMenuItems from "./pages/admin/AdminMenuItems.jsx";
import AdminVideos from "./pages/admin/AdminVideos.jsx";
import AdminOrders from "./pages/admin/AdminOrders.jsx";
import AdminReports from "./pages/admin/AdminReports.jsx";
import AdminDatabase from "./pages/admin/AdminDatabase.jsx";
import AdminSettings from "./pages/admin/AdminSettings.jsx";
import { API_BASE_URL, api } from "./lib/api.js";

const pageMap = {
  dashboard: DashboardOverview,
  orders: OrdersManagementModal,
  menu: MenuManagementModal,
  videos: VideoManagement,
  videoCreate: CreateVideoPost,
  reviews: CustomerReviews,
  loyalty: LoyaltyRewards,
  analytics: AnalyticsInsights,
  settings: RestaurantSettings,
  adminOverview: AdminOverview,
  adminUsers: AdminUsers,
  adminCustomers: AdminCustomers,
  adminRestaurants: AdminRestaurants,
  adminNewRestaurants: AdminNewRestaurants,
  adminMenuItems: AdminMenuItems,
  adminVideos: AdminVideos,
  adminOrders: AdminOrders,
  adminReports: AdminReports,
  adminDatabase: AdminDatabase,
  adminSettings: AdminSettings,
};

const ADMIN_PAGE_KEYS = new Set([
  "adminOverview",
  "adminUsers",
  "adminCustomers",
  "adminRestaurants",
  "adminNewRestaurants",
  "adminMenuItems",
  "adminVideos",
  "adminOrders",
  "adminReports",
  "adminDatabase",
  "adminSettings",
]);

const TOKEN_STORAGE_KEY = "hungerrush_api_token";
const DEFAULT_EMAIL = import.meta.env.VITE_DEMO_EMAIL || "owner@hungerrush.local";
const DEFAULT_PASSWORD = import.meta.env.VITE_DEMO_PASSWORD || "password";
const CUSTOMER_ACCESS_DENIED_MESSAGE = "Access denied. Customer accounts cannot sign in to this dashboard.";

function getUserRole(user) {
  return user?.role?.value || user?.role || "";
}

function LoginScreen({ loading, error, onLogin }) {
  const [email, setEmail] = useState(DEFAULT_EMAIL);
  const [password, setPassword] = useState(DEFAULT_PASSWORD);

  const handleSubmit = async (event) => {
    event.preventDefault();
    await onLogin({ email, password });
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-primary/10 shadow-xl p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Connect Dashboard</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            Sign in to load the right dashboard for your account.
          </p>
          <p className="text-xs text-slate-400 mt-2">
            API Base URL: <span className="font-semibold">{API_BASE_URL}</span>
          </p>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Email
            </label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Password
            </label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>
          {error ? (
            <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 px-3 py-2 rounded-lg">
              {error}
            </p>
          ) : null}
          <button
            className="w-full rounded-lg bg-primary text-white font-semibold py-2.5 hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed"
            type="submit"
            disabled={loading}
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>
        <p className="text-xs text-slate-400 mt-4">
          Demo seeder account: {DEFAULT_EMAIL} / {DEFAULT_PASSWORD}
        </p>
      </div>
    </div>
  );
}

function AccessDeniedScreen({ onNavigate, onLogout }) {
  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-primary/10 bg-white p-8 text-center shadow-xl">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-red-50 text-red-600">
          <span className="material-symbols-outlined">lock</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Access Denied</h1>
        <p className="mt-2 text-sm text-slate-500">
          Admin Panel access is limited to users with the admin role.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90"
            type="button"
            onClick={() => onNavigate?.("dashboard")}
          >
            Back to Dashboard
          </button>
          <button
            className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-200"
            type="button"
            onClick={onLogout}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [activePage, setActivePage] = useState("dashboard");
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY));
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(Boolean(localStorage.getItem(TOKEN_STORAGE_KEY)));
  const [authError, setAuthError] = useState("");

  const userRole = getUserRole(user);
  const isAdmin = userRole === "admin";
  const isAdminPage = ADMIN_PAGE_KEYS.has(activePage);
  const Page = useMemo(
    () => pageMap[activePage] ?? (isAdmin ? AdminOverview : DashboardOverview),
    [activePage, isAdmin]
  );

  const withProfilePhoto = async (authToken, baseUser) => {
    try {
      const settings = await api.getRestaurantSettings(authToken);
      return {
        ...(baseUser || {}),
        profilePhotoUrl: settings?.settings?.profile_photo_url || "",
      };
    } catch {
      return {
        ...(baseUser || {}),
        profilePhotoUrl: baseUser?.profilePhotoUrl || "",
      };
    }
  };

  useEffect(() => {
    if (!token) {
      setIsAuthLoading(false);
      return;
    }

    let isCancelled = false;

    const loadUser = async () => {
      setIsAuthLoading(true);
      setAuthError("");
      try {
        const me = await api.me(token);
        if (isCancelled) {
          return;
        }
        const enrichedUser = await withProfilePhoto(token, me);
        if (isCancelled) {
          return;
        }

        if (getUserRole(enrichedUser) === "customer") {
          localStorage.removeItem(TOKEN_STORAGE_KEY);
          setToken(null);
          setUser(null);
          setAuthError(CUSTOMER_ACCESS_DENIED_MESSAGE);
          return;
        }

        setUser(enrichedUser);
        setActivePage((previous) =>
          getUserRole(enrichedUser) === "admin" && !ADMIN_PAGE_KEYS.has(previous)
            ? "adminOverview"
            : previous
        );
      } catch (error) {
        if (isCancelled) {
          return;
        }
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        setToken(null);
        setUser(null);
        setAuthError(error?.message || "Session expired. Please sign in again.");
      } finally {
        if (!isCancelled) {
          setIsAuthLoading(false);
        }
      }
    };

    loadUser();

    return () => {
      isCancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (!user) return;

    if (isAdmin && !ADMIN_PAGE_KEYS.has(activePage)) {
      setActivePage("adminOverview");
    }
  }, [activePage, isAdmin, user]);

  const handleLogin = async (credentials) => {
    setIsAuthLoading(true);
    setAuthError("");

    try {
      const response = await api.login(credentials);
      const nextToken = response?.token;
      const nextUser = response?.user;

      if (!nextToken) {
        throw new Error("Login succeeded but no token was returned.");
      }

      if (getUserRole(nextUser) === "customer") {
        try {
          await api.logout(nextToken);
        } catch {
          // Ignore logout API errors because local session is not kept.
        }
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        setToken(null);
        setUser(null);
        setAuthError(CUSTOMER_ACCESS_DENIED_MESSAGE);
        return;
      }

      localStorage.setItem(TOKEN_STORAGE_KEY, nextToken);
      setToken(nextToken);
      const enrichedUser = await withProfilePhoto(nextToken, nextUser || null);
      setUser(enrichedUser);
      setActivePage(getUserRole(enrichedUser) === "admin" ? "adminOverview" : "dashboard");
    } catch (error) {
      setAuthError(error?.message || "Unable to sign in.");
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    const currentToken = token;

    setUser(null);
    setToken(null);
    setAuthError("");
    localStorage.removeItem(TOKEN_STORAGE_KEY);

    if (!currentToken) {
      return;
    }

    try {
      await api.logout(currentToken);
    } catch {
      // Ignore logout API errors because local session is already cleared.
    }
  };

  const handleUserProfilePhotoUpdate = (photoUrl) => {
    setUser((previous) => (previous ? { ...previous, profilePhotoUrl: photoUrl || "" } : previous));
  };

  const handleNavigate = (nextPage) => {
    if (ADMIN_PAGE_KEYS.has(nextPage) && !isAdmin) {
      setActivePage("accessDenied");
      return;
    }

    setActivePage(nextPage);
  };

  if (isAuthLoading && !user) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-primary/10 p-6 shadow-lg text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">Connecting to API...</p>
        </div>
      </div>
    );
  }

  if (!token || !user) {
    return <LoginScreen loading={isAuthLoading} error={authError} onLogin={handleLogin} />;
  }

  if ((isAdminPage && !isAdmin) || activePage === "accessDenied") {
    return <AccessDeniedScreen onNavigate={handleNavigate} onLogout={handleLogout} />;
  }

  return (
    <div className="min-h-screen">
      <Page
        onNavigate={handleNavigate}
        token={token}
        user={user}
        onLogout={handleLogout}
        onUserProfilePhotoUpdate={handleUserProfilePhotoUpdate}
      />
    </div>
  );
}

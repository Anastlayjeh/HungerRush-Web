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
};

const TOKEN_STORAGE_KEY = "hungerrush_api_token";
const DEFAULT_EMAIL = import.meta.env.VITE_DEMO_EMAIL || "owner@hungerrush.local";
const DEFAULT_PASSWORD = import.meta.env.VITE_DEMO_PASSWORD || "password";

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
            Sign in with a restaurant owner account to load live API data.
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

export default function App() {
  const [activePage, setActivePage] = useState("dashboard");
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY));
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(Boolean(localStorage.getItem(TOKEN_STORAGE_KEY)));
  const [authError, setAuthError] = useState("");

  const Page = useMemo(() => pageMap[activePage] ?? DashboardOverview, [activePage]);

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
        setUser(enrichedUser);
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

      localStorage.setItem(TOKEN_STORAGE_KEY, nextToken);
      setToken(nextToken);
      const enrichedUser = await withProfilePhoto(nextToken, nextUser || null);
      setUser(enrichedUser);
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

  return (
    <div className="min-h-screen">
      <Page
        onNavigate={setActivePage}
        token={token}
        user={user}
        onLogout={handleLogout}
        onUserProfilePhotoUpdate={handleUserProfilePhotoUpdate}
      />
    </div>
  );
}

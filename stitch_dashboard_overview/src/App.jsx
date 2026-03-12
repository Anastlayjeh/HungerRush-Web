import { useState } from "react";
import DashboardOverview from "./pages/DashboardOverview.jsx";
import OrdersManagementModal from "./pages/OrdersManagementModal.jsx";
import MenuManagementModal from "./pages/MenuManagementModal.jsx";
import VideoManagement from "./pages/VideoManagement.jsx";
import CreateVideoPost from "./pages/CreateVideoPost.jsx";
import CustomerReviews from "./pages/CustomerReviews.jsx";
import LoyaltyRewards from "./pages/LoyaltyRewards.jsx";
import AnalyticsInsights from "./pages/AnalyticsInsights.jsx";

const pageMap = {
  dashboard: DashboardOverview,
  orders: OrdersManagementModal,
  menu: MenuManagementModal,
  videos: VideoManagement,
  videoCreate: CreateVideoPost,
  reviews: CustomerReviews,
  loyalty: LoyaltyRewards,
  analytics: AnalyticsInsights,
};

export default function App() {
  const [activePage, setActivePage] = useState("dashboard");
  const Page = pageMap[activePage] ?? DashboardOverview;

  return (
    <div className="min-h-screen">
      <Page onNavigate={setActivePage} />
    </div>
  );
}

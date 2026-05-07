import { API_BASE_URL, buildApiUrl } from "../config/api.js";

export { API_BASE_URL };

function withQuery(path, params = {}) {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }
    search.set(key, String(value));
  });

  const queryString = search.toString();
  if (!queryString) {
    return path;
  }

  return `${path}${path.includes("?") ? "&" : "?"}${queryString}`;
}

export class ApiError extends Error {
  constructor(message, status = 0, payload = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

function buildErrorMessage(payload) {
  const baseMessage = payload?.message || "Request failed.";
  const errors = payload?.errors;

  if (!errors || typeof errors !== "object") {
    return baseMessage;
  }

  const firstFieldErrors = Object.values(errors).find(
    (value) => Array.isArray(value) && value.length > 0
  );

  if (!firstFieldErrors) {
    return baseMessage;
  }

  return String(firstFieldErrors[0] || baseMessage);
}

async function request(path, options = {}) {
  const { token, body, headers = {}, ...rest } = options;
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  const response = await fetch(buildApiUrl(path), {
    ...rest,
    headers: {
      Accept: "application/json",
      ...(!isFormData && body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body:
      body === undefined
        ? undefined
        : isFormData
          ? body
          : JSON.stringify(body),
  });

  const rawText = await response.text();
  let payload = null;

  if (rawText) {
    try {
      payload = JSON.parse(rawText);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const message = buildErrorMessage(payload);
    throw new ApiError(message, response.status, payload);
  }

  return payload;
}

function unwrapData(payload) {
  return payload?.data ?? null;
}

function unwrapList(payload) {
  return {
    items: Array.isArray(payload?.data) ? payload.data : [],
    meta: payload?.meta || null,
  };
}

function toLegacyRewardShape(offer) {
  if (!offer || typeof offer !== "object") {
    return null;
  }

  const requiredPoints = Number(
    offer.required_points ?? offer.points_required ?? 0
  );
  const isActive = Boolean(
    offer.is_active ?? String(offer.status || "").toLowerCase() === "active"
  );

  return {
    ...offer,
    id: offer.id,
    name: offer.name ?? offer.title ?? "",
    title: offer.title ?? offer.name ?? "",
    description: offer.description ?? "",
    points_required: requiredPoints,
    required_points: requiredPoints,
    status: offer.status ?? (isActive ? "active" : "archived"),
    is_active: isActive,
    reward_type: offer.reward_type ?? "discount",
    usage_count: Number(offer.usage_count ?? 0),
    menu_item: offer.menu_item ?? null,
    menu_item_id: offer.menu_item_id ?? null,
    discount_percentage: offer.discount_percentage ?? null,
    discounted_price: offer.discounted_price ?? null,
  };
}

export const api = {
  async login({ email, phone, password, role, deviceName = "dashboard-web" }) {
    const payload = await request("/v1/auth/login", {
      method: "POST",
      body: {
        email: email || undefined,
        phone: phone || undefined,
        password,
        role: role || undefined,
        device_name: deviceName,
      },
    });

    return unwrapData(payload);
  },

  async me(token) {
    return unwrapData(
      await request("/v1/auth/me", {
        method: "GET",
        token,
      })
    );
  },

  async logout(token) {
    return unwrapData(
      await request("/v1/auth/logout", {
        method: "POST",
        token,
      })
    );
  },

  async getRestaurantProfile(token) {
    return unwrapData(
      await request("/v1/restaurant/profile", {
        method: "GET",
        token,
      })
    );
  },

  async updateRestaurantProfile(token, body) {
    return unwrapData(
      await request("/v1/restaurant/profile", {
        method: "PATCH",
        token,
        body,
      })
    );
  },

  async getRestaurantSettings(token) {
    return unwrapData(
      await request("/v1/restaurant/settings", {
        method: "GET",
        token,
      })
    );
  },

  async updateRestaurantSettings(token, body) {
    return unwrapData(
      await request("/v1/restaurant/settings", {
        method: "PATCH",
        token,
        body,
      })
    );
  },

  async uploadRestaurantProfilePhoto(token, file) {
    const formData = new FormData();
    formData.append("photo", file);

    return unwrapData(
      await request("/v1/restaurant/profile-photo/upload", {
        method: "POST",
        token,
        body: formData,
      })
    );
  },

  async getMenuCategories(token) {
    return unwrapData(
      await request("/v1/restaurant/menu/categories", {
        method: "GET",
        token,
      })
    );
  },

  async createMenuCategory(token, body) {
    return unwrapData(
      await request("/v1/restaurant/menu/categories", {
        method: "POST",
        token,
        body,
      })
    );
  },

  async getMenuItems(token) {
    return unwrapData(
      await request("/v1/restaurant/menu/items", {
        method: "GET",
        token,
      })
    );
  },

  async createMenuItem(token, body) {
    return unwrapData(
      await request("/v1/restaurant/menu/items", {
        method: "POST",
        token,
        body,
      })
    );
  },

  async uploadMenuImages(token, files) {
    const formData = new FormData();
    Array.from(files || []).forEach((file) => {
      formData.append("images[]", file);
    });

    return unwrapData(
      await request("/v1/restaurant/menu/images/upload", {
        method: "POST",
        token,
        body: formData,
      })
    );
  },

  async updateMenuItem(token, menuItemId, body) {
    return unwrapData(
      await request(`/v1/restaurant/menu/items/${menuItemId}`, {
        method: "PATCH",
        token,
        body,
      })
    );
  },

  async updateMenuItemAvailability(token, menuItemId, isAvailable) {
    return unwrapData(
      await request(`/v1/restaurant/menu/items/${menuItemId}/availability`, {
        method: "PATCH",
        token,
        body: { is_available: isAvailable },
      })
    );
  },

  async deleteMenuItem(token, menuItemId) {
    return unwrapData(
      await request(`/v1/restaurant/menu/items/${menuItemId}`, {
        method: "DELETE",
        token,
      })
    );
  },

  async getRestaurantOrders(token) {
    return unwrapData(
      await request("/v1/restaurant/orders", {
        method: "GET",
        token,
      })
    );
  },

  async createQuickOrder(token, body) {
    return unwrapData(
      await request("/v1/restaurant/orders/quick", {
        method: "POST",
        token,
        body,
      })
    );
  },

  async getRestaurantOrder(token, orderId) {
    return unwrapData(
      await request(`/v1/restaurant/orders/${orderId}`, {
        method: "GET",
        token,
      })
    );
  },

  async updateOrderStatus(token, orderId, status) {
    return unwrapData(
      await request(`/v1/restaurant/orders/${orderId}/status`, {
        method: "PATCH",
        token,
        body: { status },
      })
    );
  },

  async getVideos(token, params = {}) {
    const payload = await request(
      withQuery("/v1/restaurant/videos", {
        q: params.search,
        status: params.status,
        page: params.page,
      }),
      {
        method: "GET",
        token,
      }
    );

    return unwrapList(payload);
  },

  async uploadVideoAsset(token, { assetType, file }) {
    const formData = new FormData();
    formData.append("asset_type", assetType);
    formData.append("file", file);

    return unwrapData(
      await request("/v1/restaurant/videos/assets/upload", {
        method: "POST",
        token,
        body: formData,
      })
    );
  },

  async createVideo(token, body) {
    return unwrapData(
      await request("/v1/restaurant/videos", {
        method: "POST",
        token,
        body,
      })
    );
  },

  async updateVideo(token, videoId, body) {
    return unwrapData(
      await request(`/v1/restaurant/videos/${videoId}`, {
        method: "PATCH",
        token,
        body,
      })
    );
  },

  async deleteVideo(token, videoId) {
    return unwrapData(
      await request(`/v1/restaurant/videos/${videoId}`, {
        method: "DELETE",
        token,
      })
    );
  },

  async getReviewSummary(token) {
    return unwrapData(
      await request("/v1/restaurant/reviews/summary", {
        method: "GET",
        token,
      })
    );
  },

  async getReviews(token, params = {}) {
    const payload = await request(
      withQuery("/v1/restaurant/reviews", {
        q: params.search,
        rating: params.rating,
        replied: params.replied,
        page: params.page,
      }),
      {
        method: "GET",
        token,
      }
    );

    return unwrapList(payload);
  },

  async replyToReview(token, reviewId, reply) {
    return unwrapData(
      await request(`/v1/restaurant/reviews/${reviewId}/reply`, {
        method: "PATCH",
        token,
        body: { reply },
      })
    );
  },

  async getLoyaltyOverview(token, params = {}) {
    const data = unwrapData(
      await request(
        withQuery("/v1/restaurant/loyalty/overview", {
          q: params.search,
          status: params.status,
        }),
        {
          method: "GET",
          token,
        }
      )
    );

    if (!data || typeof data !== "object") {
      return data;
    }

    return {
      ...data,
      rewards: Array.isArray(data.rewards)
        ? data.rewards.map(toLegacyRewardShape).filter(Boolean)
        : [],
      offers: Array.isArray(data.offers)
        ? data.offers.map(toLegacyRewardShape).filter(Boolean)
        : [],
    };
  },

  async createLoyaltyReward(token, body) {
    const requiredPoints =
      body?.required_points ??
      body?.points_required ??
      0;
    const isActive =
      body?.is_active !== undefined
        ? Boolean(body.is_active)
        : String(body?.status || "active").toLowerCase() === "active";

    const data = unwrapData(
      await request("/v1/restaurant/loyalty/offers", {
        method: "POST",
        token,
        body: {
          title: String(body?.title ?? body?.name ?? "").trim(),
          description: body?.description ?? "",
          required_points: Number(requiredPoints),
          is_active: isActive,
        },
      })
    );

    return toLegacyRewardShape(data);
  },

  async updateLoyaltyReward(token, rewardId, body) {
    const payload = {};
    if (body?.title !== undefined || body?.name !== undefined) {
      payload.title = String(body?.title ?? body?.name ?? "").trim();
    }
    if (body?.description !== undefined) {
      payload.description = body.description;
    }
    if (
      body?.required_points !== undefined ||
      body?.points_required !== undefined
    ) {
      payload.required_points = Number(
        body?.required_points ?? body?.points_required ?? 0
      );
    }
    if (body?.is_active !== undefined) {
      payload.is_active = Boolean(body.is_active);
    } else if (body?.status !== undefined) {
      payload.is_active = String(body.status).toLowerCase() === "active";
    }

    const data = unwrapData(
      await request(`/v1/restaurant/loyalty/offers/${rewardId}`, {
        method: "PATCH",
        token,
        body: payload,
      })
    );

    return toLegacyRewardShape(data);
  },

  async deleteLoyaltyReward(token, rewardId) {
    return unwrapData(
      await request(`/v1/restaurant/loyalty/offers/${rewardId}`, {
        method: "DELETE",
        token,
      })
    );
  },

  async getAnalytics(token, options = {}) {
    const period =
      typeof options === "string"
        ? options
        : typeof options?.period === "string"
          ? options.period
          : undefined;
    const rangeDays =
      typeof options === "number"
        ? options
        : typeof options?.rangeDays === "number"
          ? options.rangeDays
          : undefined;

    return unwrapData(
      await request(withQuery("/v1/restaurant/analytics", { period, range_days: rangeDays }), {
        method: "GET",
        token,
      })
    );
  },

  async getCustomerRestaurantMenu(token, restaurantId) {
    return unwrapData(
      await request(`/v1/customer/restaurants/${restaurantId}/menu`, {
        method: "GET",
        token,
      })
    );
  },

  async getAdminDashboard(token) {
    return unwrapData(
      await request("/v1/admin/dashboard", {
        method: "GET",
        token,
      })
    );
  },

  async getAdminUsers(token, params = {}) {
    const payload = await request(withQuery("/v1/admin/users", { page: params.page }), {
      method: "GET",
      token,
    });

    return unwrapList(payload);
  },

  async getAdminRestaurants(token, params = {}) {
    const payload = await request(withQuery("/v1/admin/restaurants", { page: params.page }), {
      method: "GET",
      token,
    });

    return unwrapList(payload);
  },

  async getAdminRestaurantMenu(token, restaurantId) {
    return unwrapData(
      await request(`/v1/admin/restaurants/${restaurantId}/menu`, {
        method: "GET",
        token,
      })
    );
  },

  async updateAdminMenuItem(token, menuItemId, body) {
    return unwrapData(
      await request(`/v1/admin/menu-items/${menuItemId}`, {
        method: "PATCH",
        token,
        body,
      })
    );
  },

  async deleteAdminMenuItem(token, menuItemId) {
    return unwrapData(
      await request(`/v1/admin/menu-items/${menuItemId}`, {
        method: "DELETE",
        token,
      })
    );
  },

  async getAdminRestaurantRegistrations(token, params = {}) {
    const payload = await request(
      withQuery("/v1/admin/restaurant-registrations", {
        page: params.page,
        per_page: params.perPage,
        q: params.search,
        status: params.status,
      }),
      {
        method: "GET",
        token,
      }
    );

    return unwrapList(payload);
  },

  async updateAdminRestaurantRegistration(token, registrationId, body) {
    return unwrapData(
      await request(`/v1/admin/restaurant-registrations/${registrationId}`, {
        method: "PATCH",
        token,
        body,
      })
    );
  },

  async getAdminVideos(token, params = {}) {
    const payload = await request(
      withQuery("/v1/admin/videos", {
        page: params.page,
        per_page: params.perPage,
        q: params.search,
        restaurant_id: params.restaurantId,
        status: params.status,
        stream_state: params.streamState,
        created_from: params.createdFrom,
        created_to: params.createdTo,
      }),
      {
        method: "GET",
        token,
      }
    );

    return unwrapList(payload);
  },

  async updateAdminVideo(token, videoId, body) {
    return unwrapData(
      await request(`/v1/admin/videos/${videoId}`, {
        method: "PATCH",
        token,
        body,
      })
    );
  },

  async deleteAdminVideo(token, videoId) {
    return unwrapData(
      await request(`/v1/admin/videos/${videoId}`, {
        method: "DELETE",
        token,
      })
    );
  },

  async getAdminOrders(token, params = {}) {
    const payload = await request(withQuery("/v1/admin/orders", { page: params.page }), {
      method: "GET",
      token,
    });

    return unwrapList(payload);
  },

  async updateAdminOrder(token, orderId, body) {
    return unwrapData(
      await request(`/v1/admin/orders/${orderId}`, {
        method: "PATCH",
        token,
        body,
      })
    );
  },

  async getAdminReports(token, params = {}) {
    const payload = await request(withQuery("/v1/admin/reports", { page: params.page }), {
      method: "GET",
      token,
    });

    return unwrapList(payload);
  },

  async updateAdminReport(token, reportId, body) {
    return unwrapData(
      await request(`/v1/admin/reports/${reportId}`, {
        method: "PATCH",
        token,
        body,
      })
    );
  },
};

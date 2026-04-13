const DEFAULT_API_BASE_URL = "/api";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL;

function buildApiUrl(path) {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedBase = API_BASE_URL.replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${normalizedBase}${normalizedPath}`;
}

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
    const message = payload?.message || "Request failed.";
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

export const api = {
  async login({ email, phone, password, role = "restaurant_owner", deviceName = "dashboard-web" }) {
    const payload = await request("/v1/auth/login", {
      method: "POST",
      body: {
        email: email || undefined,
        phone: phone || undefined,
        password,
        role,
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
    return unwrapData(
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
  },

  async createLoyaltyReward(token, body) {
    return unwrapData(
      await request("/v1/restaurant/loyalty/rewards", {
        method: "POST",
        token,
        body,
      })
    );
  },

  async updateLoyaltyReward(token, rewardId, body) {
    return unwrapData(
      await request(`/v1/restaurant/loyalty/rewards/${rewardId}`, {
        method: "PATCH",
        token,
        body,
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
};

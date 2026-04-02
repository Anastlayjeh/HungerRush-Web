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
  const response = await fetch(buildApiUrl(path), {
    ...rest,
    headers: {
      Accept: "application/json",
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
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

  async updateOrderStatus(token, orderId, status) {
    return unwrapData(
      await request(`/v1/restaurant/orders/${orderId}/status`, {
        method: "PATCH",
        token,
        body: { status },
      })
    );
  },
};

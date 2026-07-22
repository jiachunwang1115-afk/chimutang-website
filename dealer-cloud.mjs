export class DealerApiError extends Error {
  constructor(message, code = "REQUEST_FAILED", status = 0) {
    super(message);
    this.name = "DealerApiError";
    this.code = code;
    this.status = status;
  }
}

export class DealerCloudClient {
  constructor(baseUrl = "/api/dealer") {
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  async request(path, options = {}) {
    const response = await fetch(`${this.baseUrl}${path}`, {
      credentials: "same-origin",
      cache: "no-store",
      ...options,
      headers: {
        ...(options.body ? { "content-type": "application/json" } : {}),
        ...(options.headers || {}),
      },
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new DealerApiError(
        payload?.error?.message || "服务暂时不可用，请稍后重试",
        payload?.error?.code || "REQUEST_FAILED",
        response.status,
      );
    }
    return payload;
  }

  session() {
    return this.request("/auth/session");
  }

  login(username, password) {
    return this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password, client: "web" }),
    });
  }

  changePassword(currentPassword, nextPassword) {
    return this.request("/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, nextPassword }),
    });
  }

  logout() {
    return this.request("/auth/logout", { method: "POST", body: "{}" });
  }

  listQuotes() {
    return this.request("/quotes");
  }

  saveQuote(draft) {
    return this.request(`/quotes/${encodeURIComponent(draft.id)}`, {
      method: "PUT",
      body: JSON.stringify({ draft }),
    });
  }

  deleteQuote(id) {
    return this.request(`/quotes/${encodeURIComponent(id)}`, { method: "DELETE", body: "{}" });
  }

  listUsers() {
    return this.request("/admin/users");
  }

  createUser(input) {
    return this.request("/admin/users", { method: "POST", body: JSON.stringify(input) });
  }

  updateUser(id, input) {
    return this.request(`/admin/users/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(input) });
  }

  listAdminQuotes() {
    return this.request("/admin/quotes");
  }

  getAdminQuote(id) {
    return this.request(`/admin/quotes/${encodeURIComponent(id)}`);
  }
}


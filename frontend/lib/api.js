export const API = {
  base: process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000",

  // ✅ Get Access Token
  getToken() {
    if (typeof window !== "undefined") {
      return localStorage.getItem("access_token");
    }
    return null;
  },

  // ✅ Get Refresh Token
  getRefreshToken() {
    if (typeof window !== "undefined") {
      return localStorage.getItem("refresh_token");
    }
    return null;
  },

  // ✅ Include headers (auto-add Authorization)
  headers() {
    const token = this.getToken();
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  },

  // ✅ Refresh Access Token
  async refreshAccessToken() {
    const refresh = this.getRefreshToken();
    if (!refresh) return false;

    try {
      const res = await fetch(`${this.base}/api/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${refresh}`,
        },
      });

      if (!res.ok) throw new Error("Refresh failed");

      const data = await res.json();
      if (data.access_token) {
        localStorage.setItem("access_token", data.access_token);
        console.log("🔄 Token refreshed successfully");
        return true;
      }
      return false;
    } catch (err) {
      console.error("Token refresh error:", err);
      this.logout();
      return false;
    }
  },

  // ✅ Generic Request Handler (auto refresh on 401)
  async request(method, path, body = null, params = {}) {
    const url = new URL(`${this.base}${path}`);
    Object.keys(params).forEach((key) =>
      url.searchParams.append(key, params[key])
    );

    const options = {
      method,
      headers: this.headers(),
    };

    if (body) options.body = JSON.stringify(body);

    let res = await fetch(url, options);

    // ⚠️ If token expired, refresh and retry once
    if (res.status === 401) {
      const refreshed = await this.refreshAccessToken();
      if (refreshed) {
        options.headers = this.headers(); // update headers
        res = await fetch(url, options);
      }
    }

    if (!res.ok) throw new Error(`${method} ${path} failed: ${res.status}`);
    return res.json();
  },

  // ✅ GET wrapper
  async get(path, params = {}) {
    return this.request("GET", path, null, params);
  },

  // ✅ POST wrapper
  async post(path, body = {}) {
    return this.request("POST", path, body);
  },

  // ✅ PATCH wrapper
  async patch(path, body = {}) {
    return this.request("PATCH", path, body);
  },

  // ✅ DELETE wrapper
  async delete(path) {
    return this.request("DELETE", path);
  },

  // 🔐 Google OAuth: redirect user to Flask backend
  loginWithGoogle() {
    window.location.href = `${this.base}/api/auth/google`;
  },

  // ✅ Store session info (after callback)
  saveSession({ access_token, refresh_token, user }) {
    if (typeof window !== "undefined") {
      localStorage.setItem("access_token", access_token);
      if (refresh_token) localStorage.setItem("refresh_token", refresh_token);
      localStorage.setItem("user", JSON.stringify(user));
    }
  },

  // ✅ Retrieve stored user info
  getUser() {
    if (typeof window !== "undefined") {
      const user = localStorage.getItem("user");
      return user ? JSON.parse(user) : null;
    }
    return null;
  },

  // 🚪 Logout helper
  logout() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");
      window.location.reload();
    }
  },
};

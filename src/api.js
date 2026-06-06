const API_URL = "/api";

export async function api(path, options = {}) {
  const token = localStorage.getItem("ecocircuit_token");
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401 && path !== "/auth/login") {
      localStorage.removeItem("ecocircuit_token");
      localStorage.removeItem("ecocircuit_user");
      window.location.assign("/login");
    }
    throw new Error(body.message || "Request failed.");
  }
  return body;
}

const API_BASE = "/api/v1";

function getToken(): string | null {
  return localStorage.getItem("goozfire_token");
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem("goozfire_token", token);
  else localStorage.removeItem("goozfire_token");
}

export function getApiKey(): string | null {
  return localStorage.getItem("goozfire_api_key");
}

export function setApiKey(key: string | null) {
  if (key) localStorage.setItem("goozfire_api_key", key);
  else localStorage.removeItem("goozfire_api_key");
}

export function isAuthenticated(): boolean {
  return !!(getToken() || getApiKey());
}

export function logout() {
  setToken(null);
  setApiKey(null);
  window.location.href = "/login";
}

async function request(
  path: string,
  options: RequestInit = {}
): Promise<any> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  const token = getToken();
  const apiKey = getApiKey();

  if (apiKey) {
    headers["X-API-Key"] = apiKey;
  } else if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    setToken(null);
    setApiKey(null);
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }

  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    if (!res.ok) throw new Error(text || `HTTP ${res.status}`);
    return text;
  }
}

// Auth
export const auth = {
  login: (email: string, password: string) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  register: (email: string, name: string, password: string) =>
    request("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, name, password }),
    }),
  me: () => request("/auth/me"),
};

// API Keys
export const apiKeys = {
  list: () => request("/auth/api-keys"),
  create: (name: string) =>
    request("/auth/api-keys", {
      method: "POST",
      body: JSON.stringify({ name }),
    }),
  delete: (id: number) =>
    request(`/auth/api-keys/${id}`, { method: "DELETE" }),
};

// Tools
export const tools = {
  search: (query: string, limit = 5) =>
    request("/search", {
      method: "POST",
      body: JSON.stringify({ query, limit }),
    }),
  scrape: (url: string, formats = ["markdown"]) =>
    request("/scrape", {
      method: "POST",
      body: JSON.stringify({ url, formats }),
    }),
  crawl: (url: string, maxPages = 5) =>
    request("/crawl", {
      method: "POST",
      body: JSON.stringify({ url, maxPages: maxPages || 10 }),
    }),
  extract: (urls: string[], prompt: string) =>
    request("/extract", {
      method: "POST",
      body: JSON.stringify({ urls, prompt }),
    }),
  map: (url: string) =>
    request("/map", { method: "POST", body: JSON.stringify({ url }) }),
};

// Usage
export const usage = {
  getStats: (days = 7) => request(`/usage/stats?days=${days}`),
};

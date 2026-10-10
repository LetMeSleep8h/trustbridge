export const API_URL: string = import.meta.env.VITE_API_URL || "https://trustbridge-7dch.onrender.com/api";
const BASE = API_URL;

function getToken(): string | null {
  return localStorage.getItem("trustbridge_token");
}

async function request(path: string, options: RequestInit = {}): Promise<any> {
  const token = getToken();
  const isFormData = options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(!isFormData ? { "Content-Type": "application/json" } : {}),
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const url = `${BASE}${path}`;
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.statusText}`);
  }
  return res.json();
}

// Auth
export function register(data: { firstName: string; lastName: string; email: string; password: string; confirmPassword: string }) {
  return request("/auth/register", { method: "POST", body: JSON.stringify(data) });
}
export function login(data: { email: string; password: string }) {
  return request("/auth/login", { method: "POST", body: JSON.stringify(data) });
}
export function getMe() {
  return request("/auth/me");
}
export function updateProfile(data: Record<string, any>) {
  return request("/auth/profile", { method: "PUT", body: JSON.stringify(data) });
}
export function changePassword(data: { oldPassword: string; newPassword: string; confirmPassword: string }) {
  return request("/auth/change-password", { method: "PUT", body: JSON.stringify(data) });
}
export function setEmailNotifications(enabled: boolean) {
  return request("/auth/notifications", { method: "PUT", body: JSON.stringify({ enabled }) });
}
export function logout() {
  localStorage.removeItem("trustbridge_token");
  return Promise.resolve();
}

// Campaigns
export function getCampaigns(params?: { category?: string; status?: string; q?: string }) {
  const clean: Record<string, string> = {};
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== "") clean[k] = String(v);
    }
  }
  const query = new URLSearchParams(clean).toString();
  return request(`/campaigns${query ? `?${query}` : ""}`);
}
export function getCampaign(id: string) {
  return request(`/campaigns/${id}`);
}
export function createCampaign(data: FormData) {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  // Let the browser set multipart/form-data with the correct boundary
  return request("/campaigns", { method: "POST", body: data, headers });
}
export function donateToCampaign(id: string, data: { xdr: string; amount: number; memo?: string }) {
  return request(`/campaigns/${id}/donate`, { method: "POST", body: JSON.stringify(data) });
}
export function createComment(campaignId: string, text: string) {
  return request(`/campaigns/${campaignId}/comments`, { method: "POST", body: JSON.stringify({ text }) });
}
export function deleteComment(campaignId: string, commentId: string) {
  return request(`/campaigns/${campaignId}/comments/${commentId}`, { method: "DELETE" });
}

// Transactions
export function getMyTransactions(params?: { type?: string; q?: string; page?: number; limit?: number }) {
  const clean: Record<string, string> = {};
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== "") clean[k] = String(v);
    }
  }
  const query = new URLSearchParams(clean).toString();
  return request(`/transactions/me${query ? `?${query}` : ""}`);
}
export function sendTransaction(data: { xdr: string; to: string; amount: number; memo?: string; asset?: string }) {
  return request("/transactions/send", { method: "POST", body: JSON.stringify(data) });
}
export function getBalance(address: string) {
  return request(`/transactions/balance/${address}`);
}

// Wallet
export function connectWallet(data: { address: string; provider: string }) {
  return updateProfile({ walletAddress: data.address, walletProvider: data.provider });
}
export function getBalanceHistory(address: string, days?: number) {
  const params = days ? `?days=${days}` : "";
  return request(`/transactions/balance-history/${address}${params}`);
}
const OAUTH_STATE_KEY = "trustbridge_oauth_state";

/** Ask the API for the GitHub consent URL, remember the anti-CSRF state, and redirect. */
export async function startGithubLogin() {
  const { url, state } = await request("/auth/github/url");
  sessionStorage.setItem(OAUTH_STATE_KEY, state);
  window.location.href = url;
}

/** Returns true only if the state GitHub echoed back matches the one we stored. */
export function consumeGithubState(returned: string | null): boolean {
  const expected = sessionStorage.getItem(OAUTH_STATE_KEY);
  sessionStorage.removeItem(OAUTH_STATE_KEY);
  return !!expected && !!returned && expected === returned;
}

export function githubCallback(code: string) {
  return request("/auth/github/callback", { method: "POST", body: JSON.stringify({ code }) });
}
export function getAdminStats() {
  return request("/admin/stats");
}
export function getAdminCampaigns() {
  return request("/admin/campaigns");
}
export function deactivateCampaign(id: number) {
  return request(`/admin/campaigns/${id}/deactivate`, { method: "POST" });
}
/** Download the signed-in user's transactions as CSV text. */
export async function exportTransactionsCsv(params?: { type?: string; q?: string }): Promise<string> {
  const qs = new URLSearchParams();
  if (params?.type) qs.set("type", params.type);
  if (params?.q) qs.set("q", params.q);
  const query = qs.toString();
  const token = getToken();
  // request() always parses JSON, which fails on CSV, so fetch directly.
  const res = await fetch(`${BASE}/transactions/export/csv${query ? `?${query}` : ""}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Export failed (${res.status})`);
  }
  return res.text();
}

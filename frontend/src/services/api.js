const API_BASE = import.meta.env.VITE_API_URL || "/api";

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;

  let authUser = null;
  try {
    const raw = localStorage.getItem("mediq_auth_user");
    if (raw) authUser = JSON.parse(raw);
  } catch (e) {}

  const headers = {
    "Content-Type": "application/json",
    "x-user-role": authUser?.role || "receptionist",
    "x-user-name": authUser?.name || "Clinic Staff",
    ...(options.headers || {})
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || `Request failed with status ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`API Error on [${options.method || "GET"} ${endpoint}]:`, error);
    throw error;
  }
}

export const api = {
  // Queue & Tokens
  getTokens: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/queue/tokens${query ? `?${query}` : ""}`);
  },

  getTokenById: (id) => request(`/queue/tokens/${id}`),

  getPublicPass: (passToken) => request(`/queue/pass/${passToken}`),

  createToken: (payload) => request("/queue/tokens", {
    method: "POST",
    body: JSON.stringify(payload)
  }),

  callNextPatient: (doctorId) => request("/queue/call-next", {
    method: "POST",
    body: JSON.stringify({ doctorId })
  }),

  startConsultation: (tokenId) => request(`/queue/tokens/${tokenId}/start`, {
    method: "POST"
  }),

  finishConsultation: (tokenId) => request(`/queue/tokens/${tokenId}/finish`, {
    method: "POST"
  }),

  skipPatient: (tokenId, reason) => request(`/queue/tokens/${tokenId}/skip`, {
    method: "POST",
    body: JSON.stringify({ reason })
  }),

  recallPatient: (tokenId) => request(`/queue/tokens/${tokenId}/recall`, {
    method: "POST"
  }),

  getAuditLogs: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/queue/audit-logs${query ? `?${query}` : ""}`);
  },

  resetDemoData: () => request("/queue/reset-demo", { method: "POST" }),

  markNoShow: (tokenId) => request(`/queue/tokens/${tokenId}/no-show`, {
    method: "POST"
  }),

  cancelToken: (tokenId, reason) => request(`/queue/tokens/${tokenId}/cancel`, {
    method: "POST",
    body: JSON.stringify({ reason })
  }),

  updateTokenPriority: (tokenId, priority) => request(`/queue/tokens/${tokenId}/priority`, {
    method: "PATCH",
    body: JSON.stringify({ priority })
  }),

  pauseDoctorQueue: (doctorId, reason) => request(`/queue/doctors/${doctorId}/pause`, {
    method: "POST",
    body: JSON.stringify({ reason })
  }),

  resumeDoctorQueue: (doctorId) => request(`/queue/doctors/${doctorId}/resume`, {
    method: "POST"
  }),

  // Doctors
  getDoctors: () => request("/doctors"),
  getDoctorById: (id) => request(`/doctors/${id}`),
  updateDoctor: (id, data) => request(`/doctors/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data)
  }),
  setDoctorDelay: (id, delayMins, reason) => request(`/doctors/${id}/delay`, {
    method: "POST",
    body: JSON.stringify({ delayMins, reason })
  }),
  setDoctorAvailability: (id, status, reason) => request(`/doctors/${id}/availability`, {
    method: "POST",
    body: JSON.stringify({ status, reason })
  }),
  toggleDoctorPause: (id) => request(`/doctors/${id}/toggle-pause`, {
    method: "POST"
  }),

  // Analytics
  getAnalytics: () => request("/analytics"),

  // Settings
  getSettings: () => request("/settings"),
  updateSettings: (data) => request("/settings", {
    method: "PATCH",
    body: JSON.stringify(data)
  }),
  getDepartments: () => request("/settings/departments"),

  // Health
  checkHealth: () => request("/health")
};

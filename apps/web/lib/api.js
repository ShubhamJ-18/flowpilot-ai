const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
    ...options,
  };

  const response = await fetch(url, config);

  let data;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const errorMsg = data?.error?.message || `Request failed with status ${response.status}`;
    const error = new Error(errorMsg);
    error.status = response.status;
    error.details = data?.error?.details;
    throw error;
  }

  return data;
}

export const api = {
  // Auth
  login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (payload) => request('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  getMe: () => request('/auth/me'),
  forgotPassword: (email) => request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),

  // Workflows
  listWorkflows: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/workflows${q ? `?${q}` : ''}`);
  },
  getWorkflow: (id) => request(`/workflows/${id}`),
  createWorkflow: (payload) => request('/workflows', { method: 'POST', body: JSON.stringify(payload) }),
  updateWorkflow: (id, payload) => request(`/workflows/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteWorkflow: (id) => request(`/workflows/${id}`, { method: 'DELETE' }),
  validateWorkflow: (definition) => request('/workflows/validate', { method: 'POST', body: JSON.stringify({ definition }) }),
  generateWorkflow: (prompt) => request('/workflows/generate', { method: 'POST', body: JSON.stringify({ prompt }) }),
  getVersions: (id) => request(`/workflows/${id}/versions`),

  // Runs
  listRuns: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/runs${q ? `?${q}` : ''}`);
  },
  getRun: (id) => request(`/runs/${id}`),
  triggerRun: (payload) => request('/runs', { method: 'POST', body: JSON.stringify(payload) }),
  cancelRun: (id) => request(`/runs/${id}/cancel`, { method: 'POST' }),
  retryRun: (id) => request(`/runs/${id}/retry`, { method: 'POST' }),

  // Approvals
  listPendingApprovals: () => request('/approvals/pending'),
  approveRun: (id, comment) => request(`/approvals/${id}/approve`, { method: 'POST', body: JSON.stringify({ comment }) }),
  rejectRun: (id, reason) => request(`/approvals/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) }),

  // Integrations
  listIntegrations: () => request('/integrations'),
  createIntegration: (payload) => request('/integrations', { method: 'POST', body: JSON.stringify(payload) }),
  deleteIntegration: (id) => request(`/integrations/${id}`, { method: 'DELETE' }),

  // Analytics
  getDashboard: () => request('/analytics/dashboard'),
};

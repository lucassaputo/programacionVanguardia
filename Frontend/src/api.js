const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

async function request(path, options = {}) {
  const { signal, ...fetchOptions } = options;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...fetchOptions,
    signal,
    headers: {
      'Content-Type': 'application/json',
      ...(fetchOptions.headers || {}),
    },
  });

  const text = await response.text();
  let body = {};
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { message: text || `Error HTTP ${response.status}` };
  }

  if (!response.ok) {
    const error = new Error(body.message || `Error HTTP ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return body;
}

export function registerUser(payload) {
  return request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function loginUser(payload) {
  return request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function analyzeCode({ token, language, code, signal }) {
  return request('/api/audits', {
    method: 'POST',
    signal,
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ language, code }),
  });
}

export function getAuditHistory(token, filters = {}, options = {}) {
  const params = new URLSearchParams();
  if (filters.language) params.set('language', filters.language);
  if (filters.riskLevel) params.set('riskLevel', filters.riskLevel);
  if (Number.isInteger(options.page)) params.set('page', String(options.page));
  if (Number.isInteger(options.size)) params.set('size', String(options.size));
  const query = params.toString();

  return request(`/api/audits${query ? `?${query}` : ''}`, {
    signal: options.signal,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function getAuditDetail({ token, auditId, signal }) {
  return request(`/api/audits/${auditId}`, {
    signal,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function getAuditMetrics(token, options = {}) {
  return request('/api/audits/metrics', {
    signal: options.signal,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
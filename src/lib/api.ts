const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export class ApiError extends Error {
  code: string;
  statusCode: number;
  details?: any;

  constructor(message: string, code = 'UNKNOWN_ERROR', statusCode = 500, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('pos_access_token');
}

export function getStoredRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('pos_refresh_token');
}

export function setStoredTokens(accessToken: string, refreshToken: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('pos_access_token', accessToken);
  localStorage.setItem('pos_refresh_token', refreshToken);
}

export function clearStoredTokens() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('pos_access_token');
  localStorage.removeItem('pos_refresh_token');
  localStorage.removeItem('pos_user_data');
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_URL}${endpoint}`;
  let response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle Token Expiry & Automatic Refresh
  if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
    const refreshToken = getStoredRefreshToken();
    if (refreshToken) {
      try {
        const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });

        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          const newTokens = refreshData.data;
          setStoredTokens(newTokens.accessToken, newTokens.refreshToken);

          // Retry original request with new token
          headers['Authorization'] = `Bearer ${newTokens.accessToken}`;
          response = await fetch(url, {
            ...options,
            headers,
          });
        } else {
          clearStoredTokens();
          if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
            window.location.href = '/login';
          }
        }
      } catch {
        clearStoredTokens();
      }
    }
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = data?.error || {};
    throw new ApiError(
      error.message || data.message || `Request failed with status ${response.status}`,
      error.code || 'HTTP_ERROR',
      response.status,
      error.details
    );
  }

  return data.data !== undefined ? data.data : data;
}

// ── Specific API Services ──
export const api = {
  // Auth
  login: (credentials: { username: string; password: string }) =>
    apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  me: () => apiRequest('/auth/me'),

  // Dashboard KPI
  getDashboardSummary: () => apiRequest('/dashboard/summary'),

  // Products & Categories
  getProducts: (categoryId?: string) =>
    apiRequest(`/products${categoryId ? `?categoryId=${categoryId}` : ''}`),
  createProduct: (payload: any) =>
    apiRequest('/products', { method: 'POST', body: JSON.stringify(payload) }),
  updateProduct: (id: string, payload: any) =>
    apiRequest(`/products/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteProduct: (id: string) =>
    apiRequest(`/products/${id}`, { method: 'DELETE' }),

  getCategories: () => apiRequest('/categories'),
  createCategory: (payload: { name: string }) =>
    apiRequest('/categories', { method: 'POST', body: JSON.stringify(payload) }),

  // Inventory
  getStockMovements: (limit = 50) =>
    apiRequest(`/stock-movements?limit=${limit}`),
  adjustStock: (payload: { productId: string; variantId?: string; quantityDelta: number; reason: string }) =>
    apiRequest('/stock-movements', { method: 'POST', body: JSON.stringify(payload) }),

  // Transactions
  getTransactions: (params?: { status?: string; limit?: number; offset?: number }) => {
    const q = new URLSearchParams();
    if (params?.status) q.append('status', params.status);
    if (params?.limit) q.append('limit', params.limit.toString());
    if (params?.offset) q.append('offset', params.offset.toString());
    return apiRequest(`/transactions?${q.toString()}`);
  },
  getTransaction: (id: string) => apiRequest(`/transactions/${id}`),
  cancelTransaction: (id: string, reason: string) =>
    apiRequest(`/transactions/${id}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) }),

  // Promotions
  getPromotions: () => apiRequest('/promotions'),
  createPromotion: (payload: any) =>
    apiRequest('/promotions', { method: 'POST', body: JSON.stringify(payload) }),
  togglePromotion: (id: string, active: boolean) =>
    apiRequest(`/promotions/${id}`, { method: 'PUT', body: JSON.stringify({ active }) }),

  // Staff & Roles
  getUsers: () => apiRequest('/users'),
  createUser: (payload: any) =>
    apiRequest('/users', { method: 'POST', body: JSON.stringify(payload) }),
  getRoles: () => apiRequest('/roles'),

  // Subscription Entitlement
  getSubscription: () => apiRequest('/subscription'),
  upgradeSubscription: (plan: 'FREE' | 'PAID' | 'PRO') =>
    apiRequest('/subscription/upgrade', { method: 'POST', body: JSON.stringify({ plan }) }),

  // Customers
  getCustomers: () => apiRequest('/customers'),
  createCustomer: (payload: { name: string; phone?: string; email?: string; notes?: string }) =>
    apiRequest('/customers', { method: 'POST', body: JSON.stringify(payload) }),
  updateCustomer: (id: string, payload: Partial<{ name: string; phone: string; email: string; notes: string }>) =>
    apiRequest(`/customers/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteCustomer: (id: string) =>
    apiRequest(`/customers/${id}`, { method: 'DELETE' }),

  // Store Profile & Settings
  getStore: () => apiRequest('/store'),
  updateStore: (payload: any) =>
    apiRequest('/store', { method: 'PATCH', body: JSON.stringify(payload) }),

  // Payment Methods
  getPaymentMethods: () => apiRequest('/payment-methods'),
  updatePaymentMethod: (id: string, payload: { active?: boolean; name?: string; requiresReference?: boolean }) =>
    apiRequest(`/payment-methods/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),

  // Health Heartbeat
  checkHealth: () => apiRequest('/health'),
};

import toast from 'react-hot-toast';
import { showAlertNotice, handleSessionExpired } from './alerts';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

/**
 * Mendapatkan token dari localStorage secara aman di client-side
 */
const getToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('omnipos_token');
  }
  return null;
};

/**
 * Core HTTP Request Wrapper dengan penanganan Bearer Token & parsing response
 */
async function request(endpoint, options = {}) {
  const url = `${BASE_URL.replace(/\/+$/, '')}/${endpoint.replace(/^\/+/, '')}`;

  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...options.headers,
  };

  const token = getToken();
  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  let response;
  try {
    response = await fetch(url, config);
  } catch (networkError) {
    const error = new Error('Gagal terhubung ke server API. Pastikan server backend sedang berjalan.');
    error.status = 0;
    error.networkError = true;
    throw error;
  }

  // Parse JSON response jika ada
  let data = null;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  } else {
    try {
      data = { message: await response.text() };
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const error = new Error(
      (data && data.message) || `Request gagal dengan status ${response.status}`
    );
    error.status = response.status;
    error.data = data;
    error.code = data?.code;

    // Interceptor Global untuk Respon 401 Unauthorized (Sesi habis / Token tidak valid)
    if (response.status === 401 && !endpoint.includes('/auth/login')) {
      handleSessionExpired(data?.message);
    }

    // Interceptor Global untuk Respon 403 Forbidden
    if (response.status === 403 && typeof window !== 'undefined') {
      if (data?.code === 'PERMISSION_DENIED') {
        toast.error(
          data?.message || 'Akses ditolak: Anda tidak memiliki izin untuk tindakan ini.'
        );
      } else if (data?.code === 'PLAN_RESTRICTED') {
        showAlertNotice({
          title: 'Upgrade Paket Diperlukan',
          text:
            data?.message ||
            'Fitur ini memerlukan paket langganan yang lebih tinggi (PLUS / PRO). Silakan upgrade paket toko Anda.',
          icon: 'warning',
          confirmButtonText: 'Tutup',
        });
      }
    }

    throw error;
  }

  return data;
}

export const api = {
  get: (endpoint, options = {}) => request(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options = {}) =>
    request(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),
  put: (endpoint, body, options = {}) =>
    request(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),
  patch: (endpoint, body, options = {}) =>
    request(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),
  delete: (endpoint, options = {}) => request(endpoint, { ...options, method: 'DELETE' }),
};

export default api;

import toast from 'react-hot-toast';
import { showAlertNotice } from './alerts';

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:5000/api';

/**
 * Mendapatkan token dari localStorage secara aman di client-side
 */
const getToken = () => {
  try {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('omnipos_token');
  } catch {
    return null;
  }
};

/**
 * Core HTTP Request Wrapper dengan penanganan Bearer Token, Query Params,
 * AbortController signal passthrough, dan Interceptor 401 / 403.
 *
 * [H-7] signal dari options diteruskan langsung ke fetch — mendukung AbortController
 * [L-2] Dihapus Object.defineProperty normalization yang fragile dan bisa break di beberapa env
 */
async function request(endpoint, options = {}) {
  // Serialisasi options.params jika ada (seperti pada axios)
  let queryString = '';
  if (options.params && typeof options.params === 'object') {
    const searchParams = new URLSearchParams();
    Object.entries(options.params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });
    const qs = searchParams.toString();
    if (qs) {
      queryString = (endpoint.includes('?') ? '&' : '?') + qs;
    }
  }

  const url = `${BASE_URL.replace(/\/+$/, '')}/${endpoint.replace(/^\/+/, '')}${queryString}`;

  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...options.headers,
  };

  const token = getToken();
  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // [H-7] Bersihkan options.params sebelum dikirim ke fetch; signal DIPERTAHANKAN
  const { params: _params, ...restOptions } = options;
  const config = {
    ...restOptions,
    headers,
  };

  let response;
  try {
    response = await fetch(url, config);
  } catch (networkError) {
    // Jika error karena AbortController.abort(), biarkan error menyebar apa adanya
    if (networkError.name === 'AbortError') {
      throw networkError;
    }
    const error = new Error('Gagal terhubung ke server API. Pastikan server backend sedang berjalan.');
    error.status = 0;
    error.networkError = true;
    error.response = {
      status: 0,
      data: { success: false, message: error.message },
    };
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
      const text = await response.text();
      data = text ? { message: text } : null;
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const errorMessage =
      (data && data.message) || `Request gagal dengan status ${response.status}`;
    const error = new Error(errorMessage);
    error.status = response.status;
    error.data = data;
    error.code = data?.code;

    // Axios-like compatibility: error.response.data
    error.response = {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: data || { success: false, message: errorMessage },
    };

    // Interceptor Global untuk Respon 401 Unauthorized / Token Expired
    if (response.status === 401 && typeof window !== 'undefined') {
      try {
        localStorage.removeItem('omnipos_token');
        localStorage.removeItem('omnipos_user');
        localStorage.removeItem('omnipos_tenant');
      } catch {
        // Ignore storage errors
      }

      const currentPath = window.location.pathname;
      if (!currentPath.startsWith('/login') && !currentPath.startsWith('/register')) {
        toast.error('Sesi Anda telah berakhir. Silakan login kembali.');
        setTimeout(() => {
          window.location.href = '/login';
        }, 600);
      }
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

  // [L-2] Response normalisasi: tambah .status HTTP ke data, tanpa Object.defineProperty yang fragile.
  // Semua komponen menggunakan res.success & res.data langsung (sudah konsisten).
  if (data && typeof data === 'object' && !('status' in data)) {
    data.status = response.status;
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

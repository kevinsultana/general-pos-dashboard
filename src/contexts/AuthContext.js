'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '../lib/api';

// [H-3] safeStorage helper: semua akses localStorage dibungkus try/catch
// Mencegah crash di SSR (server-side rendering) dan browser mode private/blocked
const safeStorage = {
  get: (key) => {
    try {
      if (typeof window === 'undefined') return null;
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set: (key, value) => {
    try {
      if (typeof window === 'undefined') return;
      localStorage.setItem(key, value);
    } catch {
      // Storage mungkin penuh atau diblokir (private mode)
    }
  },
  remove: (key) => {
    try {
      if (typeof window === 'undefined') return;
      localStorage.removeItem(key);
    } catch {
      // Ignore
    }
  },
  getJSON: (key) => {
    try {
      if (typeof window === 'undefined') return null;
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
};

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // [M-4] Sync-init user & tenant dari localStorage agar tidak ada flicker
  // Pada SSR, typeof window === 'undefined' — safeStorage.getJSON() mengembalikan null dengan aman
  const [user, setUser] = useState(() => safeStorage.getJSON('omnipos_user'));
  const [tenant, setTenant] = useState(() => safeStorage.getJSON('omnipos_tenant'));
  const [token, setToken] = useState(() => safeStorage.get('omnipos_token'));
  const [activeBranchId, setActiveBranchId] = useState(null);
  const [activeBranch, setActiveBranch] = useState(null);
  const [branches, setBranches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // [M-2] isMountedRef pattern — mencegah state update setelah komponen unmount
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Verifikasi sesi login aktif saat pertama kali aplikasi dimuat
  const checkAuth = useCallback(async () => {
    try {
      const storedToken = safeStorage.get('omnipos_token');
      if (!storedToken) {
        if (isMountedRef.current) setIsLoading(false);
        return;
      }

      if (isMountedRef.current) setToken(storedToken);

      // Panggil endpoint /auth/me untuk memvalidasi token dan mendapatkan state terbaru
      const response = await api.get('/auth/me');
      if (!isMountedRef.current) return;

      if (response && response.success && response.data) {
        setUser(response.data.user);
        setTenant(response.data.tenant);
        const branchList = response.data.branches || [];
        setBranches(branchList);
        const branchId = response.data.activeBranchId || branchList[0]?.id || null;
        setActiveBranchId(branchId);
        const currentActive =
          branchList.find((b) => b.id === branchId) ||
          branchList.find((b) => b.isMain) ||
          branchList[0] ||
          null;
        setActiveBranch(currentActive);

        safeStorage.set('omnipos_user', JSON.stringify(response.data.user));
        safeStorage.set('omnipos_tenant', JSON.stringify(response.data.tenant));
      } else {
        throw new Error('Sesi tidak valid');
      }
    } catch (err) {
      // Jika token expired atau invalid, bersihkan storage
      safeStorage.remove('omnipos_token');
      safeStorage.remove('omnipos_user');
      safeStorage.remove('omnipos_tenant');
      if (isMountedRef.current) {
        setUser(null);
        setTenant(null);
        setToken(null);
        setActiveBranchId(null);
        setActiveBranch(null);
        setBranches([]);
      }
    } finally {
      if (isMountedRef.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  /**
   * Helper Cek Hak Akses Pengguna (Permissions / RBAC)
   * @param {string} permissionKey - contoh: 'users:view', 'pos:access', 'settings:manage'
   */
  const hasPermission = useCallback(
    (permissionKey) => {
      if (!user) return false;
      if (user.isOwner) return true; // Owner memiliki semua akses otomatis

      let permissions = user.role?.permissions || [];
      if (typeof permissions === 'string') {
        try {
          permissions = JSON.parse(permissions);
        } catch {
          permissions = [permissions];
        }
      }

      if (!Array.isArray(permissions)) return false;

      // 1. Wildcard superadmin
      if (permissions.includes('*')) return true;

      // 2. Exact match
      if (permissions.includes(permissionKey)) return true;

      // 3. Domain wildcard (misal: "users:*" untuk "users:view")
      const [domain] = permissionKey.split(':');
      if (domain && permissions.includes(`${domain}:*`)) return true;

      return false;
    },
    [user]
  );

  /**
   * Fungsi Login Pengguna
   * @param {string} storeSlug
   * @param {string} email
   * @param {string} password
   * @param {string} clientType - default "web"
   */
  const login = async (storeSlug, email, password, clientType = 'web') => {
    const response = await api.post('/auth/login', {
      storeSlug,
      email,
      password,
      clientType,
    });

    if (response && response.success && response.data) {
      const { token: receivedToken, user: receivedUser, tenant: receivedTenant } = response.data;
      setToken(receivedToken);
      setUser(receivedUser);
      setTenant(receivedTenant);

      safeStorage.set('omnipos_token', receivedToken);
      safeStorage.set('omnipos_user', JSON.stringify(receivedUser));
      safeStorage.set('omnipos_tenant', JSON.stringify(receivedTenant));
      return response;
    }

    throw new Error(response?.message || 'Login gagal');
  };

  /**
   * Fungsi Registrasi Toko Baru & Owner Pertama
   * @param {object} payload - { storeName, storeSlug, ownerName, email, password }
   */
  const register = async (payload) => {
    const response = await api.post('/auth/register', payload);

    if (response && response.success && response.data) {
      const { token: receivedToken, user: receivedUser, tenant: receivedTenant } = response.data;
      setToken(receivedToken);
      setUser(receivedUser);
      setTenant(receivedTenant);

      safeStorage.set('omnipos_token', receivedToken);
      safeStorage.set('omnipos_user', JSON.stringify(receivedUser));
      safeStorage.set('omnipos_tenant', JSON.stringify(receivedTenant));
      return response;
    }

    throw new Error(response?.message || 'Registrasi gagal');
  };

  /**
   * Fungsi Berpindah Cabang Aktif (Active Branch Switcher)
   * @param {string} branchId
   */
  const switchBranch = async (branchId) => {
    try {
      const response = await api.post('/auth/switch-branch', { branchId });
      if (response && response.success && response.data) {
        const { token: newToken, activeBranch: newActiveBranch } = response.data;
        setToken(newToken);
        setActiveBranchId(newActiveBranch.id);
        setActiveBranch(newActiveBranch);
        safeStorage.set('omnipos_token', newToken);
        await checkAuth();
        return response;
      }
      throw new Error(response?.message || 'Gagal berpindah cabang');
    } catch (err) {
      throw err;
    }
  };

  /**
   * Fungsi Logout
   */
  const logout = () => {
    safeStorage.remove('omnipos_token');
    safeStorage.remove('omnipos_user');
    safeStorage.remove('omnipos_tenant');
    setUser(null);
    setTenant(null);
    setToken(null);
    setActiveBranchId(null);
    setActiveBranch(null);
    setBranches([]);
  };

  const value = {
    user,
    tenant,
    token,
    activeBranchId,
    activeBranch,
    branches,
    isLoading,
    isAuthenticated: !!token && !!user,
    hasPermission,
    login,
    register,
    logout,
    checkAuth,
    switchBranch,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth harus digunakan di dalam komponen yang dibungkus <AuthProvider>');
  }
  return context;
}

export default AuthContext;

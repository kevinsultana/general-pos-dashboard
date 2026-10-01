'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [token, setToken] = useState(null);
  const [activeBranchId, setActiveBranchId] = useState(null);
  const [activeBranch, setActiveBranch] = useState(null);
  const [branches, setBranches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Verifikasi sesi login aktif saat pertama kali aplikasi dimuat
  const checkAuth = useCallback(async () => {
    try {
      const storedToken = localStorage.getItem('omnipos_token');
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      setToken(storedToken);

      // Panggil endpoint /auth/me untuk memvalidasi token dan mendapatkan state terbaru
      const response = await api.get('/auth/me');
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

        localStorage.setItem('omnipos_user', JSON.stringify(response.data.user));
        localStorage.setItem('omnipos_tenant', JSON.stringify(response.data.tenant));
      } else {
        throw new Error('Sesi tidak valid');
      }
    } catch (err) {
      // Jika token expired atau invalid, bersihkan storage
      localStorage.removeItem('omnipos_token');
      localStorage.removeItem('omnipos_user');
      localStorage.removeItem('omnipos_tenant');
      setUser(null);
      setTenant(null);
      setToken(null);
      setActiveBranchId(null);
      setActiveBranch(null);
      setBranches([]);
    } finally {
      setIsLoading(false);
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

      localStorage.setItem('omnipos_token', receivedToken);
      localStorage.setItem('omnipos_user', JSON.stringify(receivedUser));
      localStorage.setItem('omnipos_tenant', JSON.stringify(receivedTenant));
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

      localStorage.setItem('omnipos_token', receivedToken);
      localStorage.setItem('omnipos_user', JSON.stringify(receivedUser));
      localStorage.setItem('omnipos_tenant', JSON.stringify(receivedTenant));
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
        localStorage.setItem('omnipos_token', newToken);
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
    localStorage.removeItem('omnipos_token');
    localStorage.removeItem('omnipos_user');
    localStorage.removeItem('omnipos_tenant');
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

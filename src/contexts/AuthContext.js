'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [token, setToken] = useState(null);
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
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

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
   * Fungsi Logout
   */
  const logout = () => {
    localStorage.removeItem('omnipos_token');
    localStorage.removeItem('omnipos_user');
    localStorage.removeItem('omnipos_tenant');
    setUser(null);
    setTenant(null);
    setToken(null);
  };

  const value = {
    user,
    tenant,
    token,
    isLoading,
    isAuthenticated: !!token && !!user,
    login,
    register,
    logout,
    checkAuth,
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

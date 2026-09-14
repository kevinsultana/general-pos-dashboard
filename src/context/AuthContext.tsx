'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { api, setStoredTokens, clearStoredTokens, getStoredToken } from '../lib/api';
import { User, Store, SubscriptionInfo } from '../types';

interface AuthContextType {
  user: User | null;
  store: Store | null;
  subscription: SubscriptionInfo | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  refreshSubscription: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const loadProfile = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const meData = await api.me();
      setUser(meData.user);
      setStore(meData.store);

      // Also load subscription status
      try {
        const subData = await api.getSubscription();
        setSubscription(subData);
      } catch (err) {
        console.warn('Subscription fetch warning:', err);
      }
    } catch (err) {
      console.error('Session restore failed:', err);
      clearStoredTokens();
      setUser(null);
      setStore(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.login({ username, password });
      setStoredTokens(res.accessToken, res.refreshToken);
      setUser(res.user);
      setStore(res.store);

      // Load subscription
      try {
        const subData = await api.getSubscription();
        setSubscription(subData);
      } catch (_) {}

      router.push('/');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    clearStoredTokens();
    setUser(null);
    setStore(null);
    setSubscription(null);
    router.push('/login');
  };

  const refreshSubscription = async () => {
    try {
      const subData = await api.getSubscription();
      setSubscription(subData);
      if (store) {
        setStore({ ...store, subscriptionPlan: subData.plan, subscriptionStatus: subData.status });
      }
    } catch (err) {
      console.error('Failed to refresh subscription:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        store,
        subscription,
        isLoading,
        login,
        logout,
        refreshSubscription,
        refreshUser: loadProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

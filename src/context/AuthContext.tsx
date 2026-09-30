'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  api,
  setStoredTokens,
  clearStoredTokens,
  getStoredToken,
  getStoredUserData,
  setStoredUserData,
  RegisterStorePayload,
} from '../lib/api';
import { User, Store, SubscriptionInfo } from '../types';

interface AuthContextType {
  user: User | null;
  store: Store | null;
  subscription: SubscriptionInfo | null;
  plan: 'FREE' | 'PAID' | 'PRO';
  isFree: boolean;
  isPaid: boolean;
  isPro: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (payload: RegisterStorePayload) => Promise<void>;
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

  const loadProfile = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      clearStoredTokens();
      setUser(null);
      setStore(null);
      setSubscription(null);
      setIsLoading(false);
      return;
    }

    try {
      const meData = await api.me();
      // Handle both structured { user: ..., store: ... } and flat { id, store, ... }
      const resolvedUser: User | null = meData?.user || (meData?.id ? meData : null);
      const resolvedStore: Store | null = meData?.store || meData?.user?.store || null;

      if (resolvedUser) {
        setUser(resolvedUser);
      }
      if (resolvedStore) {
        setStore(resolvedStore);
      }
      if (resolvedUser && resolvedStore) {
        setStoredUserData(resolvedUser, resolvedStore);
      }

      // Also load subscription status
      try {
        const subData = await api.getSubscription();
        setSubscription(subData);
      } catch (err) {
        console.warn('Subscription fetch warning:', err);
      }
    } catch (err: any) {
      console.error('Session restore failed:', err);
      // ONLY invalidate session if server explicitly returns 401 Unauthorized
      const isAuthError =
        err?.statusCode === 401 ||
        err?.code === 'UNAUTHORIZED' ||
        err?.code === 'INVALID_TOKEN' ||
        err?.code === 'TOKEN_EXPIRED';

      if (isAuthError) {
        clearStoredTokens();
        setUser(null);
        setStore(null);
        setSubscription(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // 1. Immediately hydrate cached user data to prevent flash or false redirect on refresh
    const cached = getStoredUserData();
    const token = getStoredToken();
    if (token && cached) {
      if (cached.user) setUser(cached.user);
      if (cached.store) setStore(cached.store);
    }

    // 2. Fetch authoritative profile from server
    loadProfile();
  }, [loadProfile]);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.login({ username, password });
      setStoredTokens(res.accessToken, res.refreshToken);
      setStoredUserData(res.user, res.store);
      setUser(res.user);
      setStore(res.store);

      // Load subscription
      try {
        const subData = await api.getSubscription();
        setSubscription(subData);
      } catch (_) {}

      router.push('/overview');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: RegisterStorePayload) => {
    setIsLoading(true);
    try {
      const res = await api.registerStore(payload);
      setStoredTokens(res.accessToken, res.refreshToken);
      setStoredUserData(res.user, res.store);
      setUser(res.user);
      setStore(res.store);

      try {
        const subData = await api.getSubscription();
        setSubscription(subData);
      } catch (_) {}

      router.push('/overview');
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

  const plan = (subscription?.plan || store?.subscriptionPlan || user?.tier || 'FREE') as 'FREE' | 'PAID' | 'PRO';
  const isFree = plan === 'FREE';
  const isPaid = plan === 'PAID';
  const isPro = plan === 'PRO';

  return (
    <AuthContext.Provider
      value={{
        user,
        store,
        subscription,
        plan,
        isFree,
        isPaid,
        isPro,
        isLoading,
        login,
        register,
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

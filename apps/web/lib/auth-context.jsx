'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const res = await api.getMe();
      if (res?.data?.user) {
        setUser(res.data.user);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function login(email, password) {
    const res = await api.login({ email, password });
    if (res?.data?.user) {
      setUser(res.data.user);
      router.push('/dashboard');
    }
    return res;
  }

  async function register(name, email, password) {
    const res = await api.register({ name, email, password });
    if (res?.data?.user) {
      setUser(res.data.user);
      router.push('/dashboard');
    }
    return res;
  }

  async function logout() {
    try {
      await api.logout();
    } finally {
      setUser(null);
      router.push('/login');
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        checkAuth,
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

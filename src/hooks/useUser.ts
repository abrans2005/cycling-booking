import { useState, useEffect, useCallback } from 'react';
import type { User } from '@/types';
import { api } from '@/lib/supabase';

const USER_STORAGE_KEY = 'cycling_current_user';

export interface UseUserReturn {
  user: User | null;
  isLoggedIn: boolean;
  loading: boolean;
  showLoginModal: boolean;
  setShowLoginModal: (show: boolean) => void;
  login: (phone: string, nickname?: string) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

export const useUser = (): UseUserReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // 初始化时从本地存储加载
  useEffect(() => {
    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }
    
    try {
      const stored = localStorage.getItem(USER_STORAGE_KEY);
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch {
      console.error('加载用户信息失败');
    } finally {
      setLoading(false);
    }
  }, []);

  // 登录
  const login = useCallback(async (phone: string, nickname?: string) => {
    setLoading(true);
    try {
      // 获取或创建用户
      const userData = await api.getOrCreateUser(phone);
      
      // 如果有提供昵称，更新它
      if (nickname) {
        userData.nickname = nickname;
      }
      
      setUser(userData);
      
      // 保存到本地存储
      if (typeof window !== 'undefined') {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // 退出登录
  const logout = useCallback(() => {
    setUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  }, []);

  // 更新用户信息
  const updateUser = useCallback((updates: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };
      if (typeof window !== 'undefined') {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updated));
      }
      return updated;
    });
  }, []);

  return {
    user,
    isLoggedIn: !!user,
    loading,
    showLoginModal,
    setShowLoginModal,
    login,
    logout,
    updateUser,
  };
};
